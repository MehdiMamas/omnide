// Property tests for patch 0015 (chat mode cycle and permission-rule mapping). Run after scripts/patches.sh and `npm ci --prefix scripts`:
// node --test scripts/run-policy.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
	alwaysRunRule,
	agentSdkMode,
	ASK_DENY_RULES,
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

test("Edit, Write and NotebookEdit are denied exactly in Ask (default) and never allow-listed away", () => {
	fc.assert(
		fc.property(rulesInput, (i) => {
			const r = permissionRules(i);
			assert.deepEqual(r.deny, i.mode === "default" ? [...ASK_DENY_RULES] : []);
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
