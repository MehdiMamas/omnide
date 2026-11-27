// Property tests for patch 0015 (chat mode cycle and permission-rule mapping). Run after scripts/patches.sh and `npm ci --prefix scripts`:
// node --test scripts/run-policy.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
	adminFlagsOf,
	alwaysRunRefusal,
	alwaysRunRule,
	agentSdkMode,
	allowSkipPermissions,
	clampMode,
	managedSettingsDir,
	ASK_REFUSED_TOOLS,
	askHookDecision,
	ASK_REFUSAL_MESSAGE,
	askRefusal,
	CHAT_MODES,
	chatModeOf,
	claudeCodeVersionOfSdk,
	mergeRestrictionFirst,
	readAlwaysRunRefusal,
	ALWAYS_RUN_REFUSAL_META,
	nextChatMode,
	permissionRules,
	RUN_MODES,
	sdkModeFor,
	versionAtLeast,
	withAllowRule,
} from "../vscode/src/vs/platform/agentHost/common/claudeRunPolicy.ts";
import { classifyDenial, readBlockedMeta, ruleInputOf } from "../vscode/src/vs/platform/agentHost/common/claudeBlockedNotice.ts";
import { effectiveRunMode, RunModeTracker } from "../vscode/src/vs/platform/agentHost/common/runModeStale.ts";
import { readFileSync } from "node:fs";
import path from "node:path";

const chat = fc.constantFrom(...CHAT_MODES);
const run = fc.constantFrom(...RUN_MODES);
const state = fc.record({ runMode: run, runEverythingAccepted: fc.boolean(), autoAvailable: fc.boolean(), bypassDisabled: fc.boolean() });

test("Shift+Tab visits Agent, Plan, Ask and returns after three presses", () => {
	fc.assert(
		fc.property(chat, (m) => {
			assert.equal(nextChatMode(nextChatMode(nextChatMode(m))), m);
			assert.notEqual(nextChatMode(m), m);
		}),
	);
});

test("Plan and Ask never depend on Run Mode; Ask is the only default mode", () => {
	fc.assert(
		fc.property(state, (s) => {
			assert.equal(sdkModeFor("plan", s), "plan");
			assert.equal(sdkModeFor("ask", s), "default");
			assert.notEqual(agentSdkMode(s), "default");
			assert.notEqual(agentSdkMode(s), "plan");
		}),
	);
});

test("Agent maps to auto, acceptEdits or bypassPermissions; bypass only after the dialog and when no admin disabled it", () => {
	fc.assert(
		fc.property(state, (s) => {
			const mode = agentSdkMode(s);
			assert.ok(["auto", "acceptEdits", "bypassPermissions"].includes(mode));
			if (mode === "bypassPermissions") {
				assert.ok(s.runMode === "runEverything" && s.runEverythingAccepted && !s.bypassDisabled);
			}
			if (mode === "auto") {
				assert.ok(s.runMode === "autoReview" && s.autoAvailable);
			}
			if (s.runMode === "allowlist") {
				assert.equal(mode, "acceptEdits");
			}
		}),
	);
});

test("a stored mode shows as the chat mode that produced it", () => {
	fc.assert(
		fc.property(chat, state, (c, s) => {
			assert.equal(chatModeOf(sdkModeFor(c, s)), c);
		}),
	);
});

const rulesInput = fc.record({
	mode: fc.constantFrom("default", "acceptEdits", "plan", "auto", "bypassPermissions" as const),
	allowlist: fc.array(fc.string()),
	protectFileDeletion: fc.boolean(),
	protectExternalFiles: fc.boolean(),
	externalFilesSupported: fc.boolean(),
});

test("Ask refuses Edit, Write and NotebookEdit at call time, in no other mode, and never through deny rules", () => {
	const tools = fc.constantFrom("Edit", "Write", "NotebookEdit", "Bash", "Read");
	fc.assert(
		fc.property(rulesInput, tools, (i, tool) => {
			const r = permissionRules(i);
			assert.equal("deny" in r, false);
			assert.equal(askRefusal(i.mode, tool) !== undefined, i.mode === "default" && ASK_REFUSED_TOOLS.includes(tool));
			if (i.mode === "default") {
				assert.equal(r.allow.some((a) => ASK_REFUSED_TOOLS.some((t) => a === t || a.startsWith(`${t}(`))), false);
			}
		}),
	);
});

test("any sequence of mode switches ends with the last mode's rules and refusal, nothing of Ask left behind", () => {
	const modes = fc.constantFrom("default", "acceptEdits", "plan", "auto", "bypassPermissions" as const);
	fc.assert(
		fc.property(rulesInput, fc.array(modes, { minLength: 1 }), (base, sequence) => {
			// The live session holds one rules object, replaced whole on a change; the refusal reads the mode of the moment.
			let held = permissionRules({ ...base, mode: sequence[0] });
			let applied = sequence[0];
			for (const mode of sequence) {
				if (mode !== applied) {
					held = permissionRules({ ...base, mode });
					applied = mode;
				}
				assert.deepEqual(held, permissionRules({ ...base, mode }));
				assert.equal(askRefusal(mode, "Edit") !== undefined, mode === "default");
			}
		}),
	);
});

test("protections: deletion asks only when on; external files only when on and supported", () => {
	fc.assert(
		fc.property(rulesInput, (i) => {
			const r = permissionRules(i);
			assert.equal(r.ask.length > 0, i.protectFileDeletion);
			assert.equal(r.blockWritesOutsideWorkingDirectories === true, i.protectExternalFiles && i.externalFilesSupported);
		}),
	);
});

test("allow rules are the trimmed, de-duplicated, non-empty allowlist", () => {
	fc.assert(
		fc.property(rulesInput, (i) => {
			const allow = permissionRules(i).allow;
			if (i.mode === "bypassPermissions") {
				assert.deepEqual(allow, []);
				return;
			}
			assert.equal(new Set(allow).size, allow.length);
			assert.ok(allow.every((r) => r.length > 0 && r === r.trim()));
			for (const r of i.allowlist) {
				if (r.trim()) {
					assert.ok(allow.includes(r.trim()));
				}
			}
		}),
	);
});

const posix = path.posix;
const win = path.win32;

test("Always Run writes a narrow rule: never a bare Bash, and only the approved command", () => {
	fc.assert(
		fc.property(fc.string({ minLength: 1 }), (command) => {
			const rule = alwaysRunRule("Bash", { command }, "/w", posix);
			if (/[*()]/.test(command)) {
				// the grammar has no literal *, and does not say how ( ) are read, so no rule is written and the card says why
				assert.equal(rule, undefined);
				assert.ok(alwaysRunRefusal("Bash", { command }));
			} else {
				assert.equal(rule, `Bash(${command})`);
				assert.equal(alwaysRunRefusal("Bash", { command }), undefined);
			}
		}),
	);
	assert.equal(alwaysRunRule("Bash", {}, "/w", posix), undefined);
	assert.equal(alwaysRunRule("Edit", { file_path: "/w/src/a.ts" }, "/w", posix), "Edit(/src/a.ts)");
	assert.equal(alwaysRunRule("Edit", { file_path: "/w/a*.ts" }, "/w", posix), "Edit(/a\\*.ts)");
	assert.equal(alwaysRunRule("Edit", { file_path: "/tmp/x.txt" }, "/w", posix), "Edit(//tmp/x.txt)");
	assert.equal(alwaysRunRule("WebFetch", { url: "https://example.com/x?y" }, "/w", posix), "WebFetch(domain:example.com)");
	assert.equal(alwaysRunRule("Task", {}, "/w", posix), undefined);
});

// A gitignore-style reading of the rule path, enough to see whether it matches more than the one file: an unescaped * ? [ ] is a wildcard.
const unescaped = (rule: string) => rule.replace(/\\./g, "");

test("a glob path never widens the Edit/Write rule", () => {
	fc.assert(
		fc.property(fc.constantFrom("Edit", "Write", "NotebookEdit"), fc.string({ minLength: 1 }).filter((n) => !n.includes("/") && n !== "." && n !== ".."), (tool, name) => {
			const file = `/w/dir/${name}`;
			const rule = alwaysRunRule(tool, { file_path: file }, "/w", posix);
			assert.ok(rule);
			const body = rule.slice(tool.length + 1, -1);
			assert.ok(!/[*?[\]]/.test(unescaped(body)), body);
			// unescaping gives the file back (trailing spaces are escaped one by one)
			assert.equal(body.replace(/\\(.)/g, "$1"), `/dir/${name}`);
		}),
	);
	assert.equal(alwaysRunRule("Write", { file_path: "/w/[a]?.ts" }, "/w", posix), "Write(/\\[a\\]\\?.ts)");
});

test("Windows-style cwd: relative inside, drive-letter absolute outside, backslashes are separators", () => {
	assert.equal(alwaysRunRule("Edit", { file_path: "C:\\w\\src\\a.ts" }, "C:\\w", win), "Edit(/src/a.ts)");
	assert.equal(alwaysRunRule("Edit", { file_path: "C:\\w\\src\\a*.ts" }, "C:\\w", win), "Edit(/src/a\\*.ts)");
	assert.equal(alwaysRunRule("Edit", { file_path: "C:\\w\\a.ts" }, "C:\\w\\", win), "Edit(/a.ts)");
	assert.equal(alwaysRunRule("Write", { file_path: "D:\\x\\y.txt" }, "C:\\w", win), "Write(//d/x/y.txt)");
	assert.equal(alwaysRunRule("Edit", { file_path: "C:\\wide\\a.ts" }, "C:\\w", win), "Edit(//c/wide/a.ts)");
});

test("withAllowRule adds once, keeps every other key, and refuses non-objects", () => {
	fc.assert(
		fc.property(fc.dictionary(fc.string().filter((k) => k !== "permissions" && k !== "__proto__"), fc.jsonValue()), fc.string({ minLength: 1 }), (extra, rule) => {
			const text = JSON.stringify({ ...extra, permissions: { deny: ["X"], allow: ["A"] } });
			const once = withAllowRule(text, rule);
			const twice = withAllowRule(once, rule);
			assert.equal(once, twice);
			const out = JSON.parse(once);
			assert.deepEqual(out.permissions.deny, ["X"]);
			assert.ok(out.permissions.allow.includes("A") && out.permissions.allow.includes(rule));
			for (const k of Object.keys(extra)) {
				assert.deepEqual(out[k], JSON.parse(JSON.stringify(extra[k])));
			}
		}),
	);
	assert.deepEqual(JSON.parse(withAllowRule(undefined, "R")), { permissions: { allow: ["R"] } });
	assert.throws(() => withAllowRule("[]", "R"));
	assert.throws(() => withAllowRule("{oops", "R"));
});

test("versions: 2.1.304 lacks External files, 2.1.314 and later have it", () => {
	assert.equal(claudeCodeVersionOfSdk("0.3.304"), "2.1.304");
	assert.equal(claudeCodeVersionOfSdk("1.0.0"), undefined);
	assert.equal(versionAtLeast("2.1.304", "2.1.314"), false);
	assert.equal(versionAtLeast("2.1.314", "2.1.314"), true);
	assert.equal(versionAtLeast("2.2.0", "2.1.314"), true);
	assert.equal(versionAtLeast(undefined, "2.1.314"), false);
	fc.assert(
		fc.property(fc.nat(2000), fc.nat(2000), (a, b) => {
			assert.equal(versionAtLeast(`2.1.${a}`, `2.1.${b}`), a >= b);
		}),
	);
});

test("denials: classifier failure, pause at 3 in a row or 20 total, otherwise plain blocked", () => {
	const c = (reasonType: string, text: string, consecutive: number, total: number) => classifyDenial({ tool: "Bash", reasonType, text }, consecutive, total).kind;
	assert.equal(c("classifier", "Auto mode cannot determine the safety of this action", 1, 1), "classifierError");
	assert.equal(c("classifier", "The server returned no safety verdict", 1, 1), "classifierError");
	assert.equal(c("classifier", "too risky", 3, 3), "paused");
	assert.equal(c("classifier", "too risky", 1, 20), "paused");
	assert.equal(c("classifier", "too risky", 2, 2), "blocked");
	assert.equal(c("rule", "denied by rule", 3, 3), "blocked");
});

const editTool = fc.constantFrom("Edit", "Write", "MultiEdit", "NotebookEdit");
const askTool = fc.oneof(fc.constant("Bash"), fc.string().map((t) => `mcp__${t}`));

test("Ask hook denies every edit tool whatever the allow rules say", () => {
	fc.assert(
		fc.property(fc.array(fc.string()), editTool, (allowlist, tool) => {
			permissionRules({ mode: "default", allowlist, protectFileDeletion: true, protectExternalFiles: true, externalFilesSupported: true });
			assert.deepEqual(askHookDecision("default", tool), { permissionDecision: "deny", permissionDecisionReason: ASK_REFUSAL_MESSAGE });
		}),
	);
});

test("Ask hook returns ask for any Bash or MCP tool", () => {
	fc.assert(fc.property(askTool, (tool) => assert.deepEqual(askHookDecision("default", tool), { permissionDecision: "ask" })));
});

test("a switch out of Ask restores normal behaviour: the hook says nothing", () => {
	const modes = fc.constantFrom("default", "acceptEdits", "plan", "auto", "bypassPermissions" as const);
	fc.assert(
		fc.property(fc.array(modes, { minLength: 1 }), fc.oneof(editTool, askTool, fc.constant("Read")), (sequence, tool) => {
			const last = sequence[sequence.length - 1];
			assert.equal(askHookDecision(last, tool) === undefined, last !== "default" || tool === "Read");
		}),
	);
});

const flags = fc.record({ autoDisabled: fc.boolean(), bypassDisabled: fc.boolean() });
const sdkMode = fc.constantFrom("default", "acceptEdits", "plan", "auto", "bypassPermissions" as const);
const policy = (f: { autoDisabled: boolean; bypassDisabled: boolean }) =>
	fc.record({ runMode: run, runEverythingAccepted: fc.boolean() }).map((r) => ({ ...r, autoAvailable: !f.autoDisabled, bypassDisabled: f.bypassDisabled }));

test("with bypass disabled, no admin flags, Run Mode, chat mode or stored mode ever starts or switches into bypass or allowDangerouslySkipPermissions", () => {
	fc.assert(
		fc.property(
			flags.filter((f) => f.bypassDisabled),
			chat,
			sdkMode,
			fc.context(),
			(f, c, stored) => {
				fc.assert(
					fc.property(policy(f), (s) => {
						assert.equal(allowSkipPermissions(s), false);
						assert.notEqual(sdkModeFor(c, s), "bypassPermissions");
						assert.notEqual(clampMode(stored, f), "bypassPermissions");
					}),
				);
			},
		),
	);
});

test("with auto disabled, Agent with Auto-review is acceptEdits and no mode is auto", () => {
	fc.assert(
		fc.property(
			flags.filter((f) => f.autoDisabled),
			chat,
			sdkMode,
			fc.boolean(),
			fc.boolean(),
			(f, c, stored, accepted, bypassDisabled) => {
				const s = { runMode: "autoReview" as const, runEverythingAccepted: accepted, autoAvailable: false, bypassDisabled };
				assert.equal(sdkModeFor("agent", s), "acceptEdits");
				assert.notEqual(sdkModeFor(c, s), "auto");
				assert.notEqual(clampMode(stored, f), "auto");
			},
		),
	);
});

test("clampMode changes only a disabled mode and leaves every other mode alone", () => {
	fc.assert(
		fc.property(flags, sdkMode, (f, m) => {
			const out = clampMode(m, f);
			const disabled = (m === "auto" && f.autoDisabled) || (m === "bypassPermissions" && f.bypassDisabled);
			assert.equal(out, disabled ? "acceptEdits" : m);
		}),
	);
});

test("adminFlagsOf: any managed document with the lock turns the mode off; junk and other values are ignored", () => {
	assert.deepEqual(adminFlagsOf([]), { autoDisabled: false, bypassDisabled: false });
	assert.deepEqual(adminFlagsOf([{ disableAutoMode: "disable" }, { permissions: { disableBypassPermissionsMode: "disable" } }]), { autoDisabled: true, bypassDisabled: true });
	fc.assert(
		fc.property(fc.array(fc.anything()), (docs) => {
			const f = adminFlagsOf([...docs, { disableAutoMode: "enable", permissions: { disableBypassPermissionsMode: true } }]);
			const base = adminFlagsOf(docs);
			assert.deepEqual(f, base);
		}),
	);
});

test("managedSettingsDir: documented system paths, override wins", () => {
	assert.equal(managedSettingsDir("darwin"), "/Library/Application Support/ClaudeCode");
	assert.equal(managedSettingsDir("linux"), "/etc/claude-code");
	assert.equal(managedSettingsDir("win32"), "C:\\Program Files\\ClaudeCode");
	assert.equal(managedSettingsDir("linux", "/tmp/x"), "/tmp/x");
});

test("Run Everything sends no allow rules; Allowlist and Auto-review keep them", () => {
	fc.assert(
		fc.property(fc.array(fc.string({ minLength: 1 })), fc.constantFrom("default", "acceptEdits", "plan", "auto"), (allowlist, mode) => {
			const base = { allowlist, protectFileDeletion: true, protectExternalFiles: false, externalFilesSupported: false };
			assert.deepEqual(permissionRules({ ...base, mode: "bypassPermissions" }).allow, []);
			if (mode === "acceptEdits" || mode === "auto") {
				assert.deepEqual(permissionRules({ ...base, mode }).allow, [...new Set(allowlist.map((r) => r.trim()).filter((r) => r.length > 0))]);
			}
		}),
	);
});

test("the SDK version the External files gate uses is the one OmnIDE pins", () => {
	const pkg = JSON.parse(readFileSync(new URL("../vscode/package.json", import.meta.url), "utf8"));
	const dep = (pkg.dependencies ?? {})["@anthropic-ai/claude-agent-sdk"] ?? (pkg.devDependencies ?? {})["@anthropic-ai/claude-agent-sdk"];
	const source = readFileSync(new URL("../vscode/src/vs/platform/agentHost/common/claudeRunPolicyConfig.ts", import.meta.url), "utf8");
	assert.equal(source.match(/PINNED_CLAUDE_AGENT_SDK_VERSION = '([^']+)'/)?.[1], dep);
	const installed = new URL("../vscode/node_modules/@anthropic-ai/claude-agent-sdk/package.json", import.meta.url);
	try {
		assert.equal(claudeCodeVersionOfSdk(dep), JSON.parse(readFileSync(installed, "utf8")).claudeCodeVersion);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
	}
});

test("a blocked call's input keeps only the strings a rule is made from, and survives the meta", () => {
	fc.assert(
		fc.property(fc.dictionary(fc.string(), fc.anything()), (input) => {
			const kept = ruleInputOf(input);
			for (const [k, v] of Object.entries(kept ?? {})) {
				assert.ok(["command", "file_path", "notebook_path", "url"].includes(k));
				assert.equal(v, input[k]);
			}
			assert.deepEqual(readBlockedMeta({ "omnide.blocked": { kind: "blocked", tool: "Bash", input: kept } })?.input, kept);
		}),
	);
});

test("a Bash command with parentheses gets no Always Run rule and says why", () => {
	for (const command of ["echo (hi)", "(cd a && ls)", "echo $(date)", "f() { :; }"]) {
		assert.equal(alwaysRunRule("Bash", { command }, "/w", posix), undefined);
		assert.match(alwaysRunRefusal("Bash", { command }) ?? "", /\( or \)/);
	}
	assert.equal(alwaysRunRule("Bash", { command: "ls -la" }, "/w", posix), "Bash(ls -la)");
	// the same parentheses in a file path stay literal in Edit rules (documented), so they are not refused
	assert.equal(alwaysRunRule("Edit", { file_path: "/w/Finance (2024)/a.ts" }, "/w", posix), "Edit(/Finance (2024)/a.ts)");
});

test("the refusal reason travels in its own _meta field, not in the title", () => {
	const reason = alwaysRunRefusal("Bash", { command: "rm *.log" });
	assert.ok(reason);
	assert.equal(readAlwaysRunRefusal({ [ALWAYS_RUN_REFUSAL_META]: reason }), reason);
	assert.equal(readAlwaysRunRefusal({ toolKind: "terminal" }), undefined);
	assert.equal(readAlwaysRunRefusal({ [ALWAYS_RUN_REFUSAL_META]: "" }), undefined);
	assert.equal(readAlwaysRunRefusal(undefined), undefined);
});

test("the Agent Merge restriction runs first: its deny wins over Ask's ask, and Ask is not consulted", () => {
	const deny = { permissionDecision: "deny" } as const;
	const ask = askHookDecision("default", "Bash");
	assert.deepEqual(ask, { permissionDecision: "ask" });
	let asked = 0;
	const askHook = () => {
		asked++;
		return ask;
	};
	assert.equal(mergeRestrictionFirst(() => deny, askHook), deny);
	assert.equal(asked, 0);
	assert.equal(mergeRestrictionFirst(() => undefined, askHook), ask);
	assert.equal(asked, 1);
	assert.equal(mergeRestrictionFirst(() => undefined, () => undefined), undefined);
});

test("Restart to apply: only a chat whose Run Mode really differs is stale", () => {
	const a = {};
	const b = {};
	const modes = new RunModeTracker<object>("allowlist");
	modes.start(a);
	modes.change("autoReview", [a, b]);
	assert.equal(modes.isStale(a), true);
	assert.equal(modes.isStale(b), true, "an open chat nobody recorded started under the previous mode");
	// the change is undone (Cancel on the Run Everything dialog): no chip
	modes.change("allowlist", [a, b]);
	assert.equal(modes.isStale(a), false);
	assert.equal(modes.isStale(b), false);
	// a new session in a widget starts under the mode in force now
	modes.change("autoReview", [a, b]);
	modes.start(a);
	assert.equal(modes.isStale(a), false);
	assert.equal(modes.isStale(b), true);
	const fresh = {};
	assert.equal(modes.isStale(fresh), false);
});

test("Restart to apply: any sequence of changes leaves a chat stale exactly when its start mode differs from the last mode", () => {
	const mode = fc.constantFrom("autoReview", "allowlist", "runEverything");
	fc.assert(
		fc.property(mode, fc.array(mode), (first, changes) => {
			const chat = {};
			const modes = new RunModeTracker<object>(first);
			modes.start(chat);
			for (const m of changes) modes.change(m, [chat]);
			assert.equal(modes.isStale(chat), (changes.at(-1) ?? first) !== first);
		}),
	);
});

test("effective Run Mode: unaccepted Run Everything and admin-disabled modes run as Allowlist", () => {
	assert.equal(effectiveRunMode("runEverything", false, []), "allowlist");
	assert.equal(effectiveRunMode("runEverything", true, []), "runEverything");
	assert.equal(effectiveRunMode("autoReview", true, ["autoReview"]), "allowlist");
	assert.equal(effectiveRunMode("runEverything", true, ["runEverything"]), "allowlist");
	assert.equal(effectiveRunMode("autoReview", false, []), "autoReview");
});
