// Self-check for patch 0012's pure hash logic. Run after scripts/patches.sh: node --test scripts/sdk-integrity.test.ts
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkSdkSha256, sha256OfFile } from "../vscode/src/vs/platform/agentHost/node/agentSdkIntegrity.ts";

const hex = (b: Buffer) => createHash("sha256").update(b).digest("hex");

test("sha256OfFile equals crypto sha256 for random files", async () => {
	const dir = mkdtempSync(join(tmpdir(), "sdkint-"));
	try {
		for (let i = 0; i < 20; i++) {
			const bytes = randomBytes(Math.floor(Math.random() * 300_000));
			const f = join(dir, `f${i}`);
			writeFileSync(f, bytes);
			assert.equal(await sha256OfFile(f), hex(bytes));
		}
	} finally {
		rmSync(dir, { recursive: true });
	}
});

test("a matching pin is accepted, any other digest is refused", () => {
	for (let i = 0; i < 200; i++) {
		const good = hex(randomBytes(16));
		const other = hex(randomBytes(16));
		assert.equal(checkSdkSha256({ "darwin-arm64": good }, "darwin-arm64", good.toUpperCase()), undefined);
		assert.match(checkSdkSha256({ "darwin-arm64": good }, "darwin-arm64", other) ?? "", /mismatch/);
	}
});

test("a pin map without the target is refused, no map means no pinning", () => {
	assert.match(checkSdkSha256({ "linux-x64": "ab" }, "darwin-arm64", "ab") ?? "", /no sha256 is pinned/);
	assert.equal(checkSdkSha256(undefined, "darwin-arm64", "ab"), undefined);
});
