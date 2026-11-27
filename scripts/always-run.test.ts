// Tests for the host-side Always Run file writer (patch 0034). Run after scripts/patches.sh and `npm ci --prefix scripts`:
// node --test scripts/always-run.test.ts
import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import fc from "fast-check";
import { updateJsonFile } from "../vscode/src/vs/platform/agentHost/node/claude/claudeAlwaysRun.ts";
import { withAllowRule } from "../vscode/src/vs/platform/agentHost/common/claudeRunPolicy.ts";

const dir = () => mkdtemp(path.join(tmpdir(), "omnide-always-run-"));
const add = (file: string, rule: string) => updateJsonFile(file, (text) => withAllowRule(text, rule));
const allowOf = async (file: string): Promise<string[]> => JSON.parse(await readFile(file, "utf8")).permissions.allow;

test("ENOENT is an empty file: the file and its directory are created", async () => {
	const file = path.join(await dir(), ".claude", "settings.local.json");
	await add(file, "Bash(ls)");
	assert.deepEqual(await allowOf(file), ["Bash(ls)"]);
});

test("any other read error fails and leaves the path alone", async (t) => {
	const root = await dir();
	// EISDIR: the settings file is a directory
	const asDir = path.join(root, "settings.local.json");
	await mkdir(asDir);
	await assert.rejects(add(asDir, "Bash(ls)"), { code: "EISDIR" });
	assert.deepEqual(await readdir(asDir), []);
	assert.deepEqual((await readdir(root)).sort(), ["settings.local.json"], "no temp file is left behind");
	// EACCES: an unreadable file keeps its text
	if (process.platform === "win32" || process.getuid?.() === 0) {
		t.diagnostic("EACCES case skipped: file modes are not enforced here");
		return;
	}
	const locked = path.join(root, "locked.json");
	await writeFile(locked, '{"permissions":{"allow":["Keep"]}}');
	await chmod(locked, 0o000);
	await assert.rejects(add(locked, "Bash(ls)"), { code: "EACCES" });
	await chmod(locked, 0o600);
	assert.deepEqual(await allowOf(locked), ["Keep"]);
});

test("malformed JSON fails and the file is untouched", async () => {
	const file = path.join(await dir(), "settings.local.json");
	await writeFile(file, "{oops");
	await assert.rejects(add(file, "Bash(ls)"));
	assert.equal(await readFile(file, "utf8"), "{oops");
});

test("a failed write does not block the next one", async () => {
	const file = path.join(await dir(), "settings.local.json");
	const bad = updateJsonFile(file, () => {
		throw new Error("boom");
	});
	const good = add(file, "B");
	await assert.rejects(bad, /boom/);
	await good;
	assert.deepEqual(await allowOf(file), ["B"]);
});

test("concurrent writes to one file keep every rule", async () => {
	await fc.assert(
		fc.asyncProperty(fc.uniqueArray(fc.string({ minLength: 1, maxLength: 12 }), { minLength: 2, maxLength: 8 }), async (rules) => {
			const file = path.join(await dir(), ".claude", "settings.local.json");
			await Promise.all(rules.map((r) => add(file, r)));
			assert.deepEqual((await allowOf(file)).sort(), [...rules].sort());
			assert.deepEqual(await readdir(path.dirname(file)), ["settings.local.json"], "no temp files remain");
		}),
		{ numRuns: 25 },
	);
});
