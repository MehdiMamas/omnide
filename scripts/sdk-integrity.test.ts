// Self-check for patch 0012's pure hash logic. Run after scripts/patches.sh and `npm ci --prefix scripts`:
// node --test scripts/sdk-integrity.test.ts
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import fc from "fast-check";
import { checkSdkSha256, sha256OfFile } from "../vscode/src/vs/platform/agentHost/node/agentSdkIntegrity.ts";

const hex = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const T = "darwin-arm64";

test("sha256OfFile equals crypto sha256 for any bytes", async () => {
	const dir = mkdtempSync(join(tmpdir(), "sdkint-"));
	try {
		await fc.assert(
			fc.asyncProperty(fc.uint8Array({ maxLength: 4096 }), async (bytes) => {
				const f = join(dir, "f");
				writeFileSync(f, bytes);
				assert.equal(await sha256OfFile(f), hex(bytes));
			}),
			{ numRuns: 50 },
		);
	} finally {
		rmSync(dir, { recursive: true });
	}
});

test("any mismatching bytes are refused, identical bytes accepted in any case", () => {
	fc.assert(
		fc.property(fc.uint8Array(), fc.uint8Array(), (pinnedBytes, gotBytes) => {
			const pin = { [T]: hex(pinnedBytes) };
			const err = checkSdkSha256(pin, T, hex(gotBytes));
			if (Buffer.compare(pinnedBytes, gotBytes) === 0) {
				assert.equal(err, undefined);
				assert.equal(checkSdkSha256({ [T]: hex(pinnedBytes).toUpperCase() }, T, hex(gotBytes)), undefined);
			} else {
				assert.match(err ?? "", /mismatch/);
			}
		}),
	);
});

test("no pin map is refused", () => {
	assert.match(checkSdkSha256(undefined, T, "ab") ?? "", /no sha256 map is pinned/);
});

test("an empty-string pin is refused, even for an empty digest", () => {
	assert.match(checkSdkSha256({ [T]: "" }, T, "ab") ?? "", /no sha256 is pinned/);
	assert.match(checkSdkSha256({ [T]: "" }, T, "") ?? "", /no sha256 is pinned/);
});

test("an unknown target is refused whatever the digest", () => {
	fc.assert(
		fc.property(fc.string({ minLength: 1 }), fc.string(), (target, digest) => {
			fc.pre(target !== "linux-x64");
			assert.match(checkSdkSha256({ "linux-x64": digest }, target, digest) ?? "", /no sha256 is pinned/);
		}),
	);
});
