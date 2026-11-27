// Property tests for patch 0015 (chat mode cycle and permission-rule mapping). Run after scripts/patches.sh and `npm ci --prefix scripts`:
// node --test scripts/run-policy.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
	alwaysRunRule,
	agentSdkMode,
	ASK_REFUSED_TOOLS,
	askHookDecision,
	ASK_REFUSAL_MESSAGE,
	askRefusal,
	CHAT_MODES,
	chatModeOf,
	claudeCodeVersionOfSdk,
	nextChatMode,
	permissionRules,
	RUN_MODES,
	sdkModeFor,
	versionAtLeast,
	withAllowRule,
} from "../vscode/src/vs/platform/agentHost/common/claudeRunPolicy.ts";
import { classifyDenial } from "../vscode/src/vs/platform/agentHost/common/claudeBlockedNotice.ts";

const chat = fc.constantFrom(...CHAT_MODES);
const run = fc.constantFrom(...RUN_MODES);
const state = fc.record({ runMode: run, runEverythingAccepted: fc.boolean(), autoAvailable: fc.boolean(), bypassDisabled: fc.boolean() });

test("Shift+Tab visits Agent, Plan, Ask and returns after three presses; back undoes forward", () => {
	fc.assert(
		fc.property(chat, (m) => {
			assert.equal(nextChatMode(nextChatMode(nextChatMode(m))), m);
			assert.equal(nextChatMode(nextChatMode(m), true), m);
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

test("Always Run writes a narrow rule: never a bare Bash, and only the approved command", () => {
	fc.assert(
		fc.property(fc.string({ minLength: 1 }), (command) => {
			const rule = alwaysRunRule("Bash", { command }, "/w");
			assert.ok(rule?.startsWith("Bash(") && rule.endsWith(")") && rule !== "Bash" && rule !== "Bash(*)");
			// every metacharacter of the command is escaped, so the rule cannot widen
			assert.ok(!/(^|[^\\])\*/.test(rule.slice(5, -1).replace(/\\\\/g, "")));
		}),
	);
	assert.equal(alwaysRunRule("Bash", {}, "/w"), undefined);
	assert.equal(alwaysRunRule("Edit", { file_path: "/w/src/a.ts" }, "/w"), "Edit(/src/a.ts)");
	assert.equal(alwaysRunRule("WebFetch", { url: "https://example.com/x?y" }, "/w"), "WebFetch(domain:example.com)");
	assert.equal(alwaysRunRule("Task", {}, "/w"), undefined);
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
