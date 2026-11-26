// Prints visible-text matches of Cursor-era words in v3 screen boards. Usage: node check-brand.mjs [--all] [dir]
import fs from "fs";
const dir = process.argv.find((a, i) => i > 1 && !a.startsWith("--")) || "project";
const PAT = [/cursor/i, /grok/i, /composer \d/i, /gpt-|gemini/i];
const SKIP = /^v3-omni-(Case|Changes)/; // case study and changes frames may name them
const ALLOW = /Gemini CLI|Codex|GitHub Copilot|text cursor|Add Cursor|Cursor (Above|Below|Style|Blinking|Smooth|Width|Surrounding|Position|Animation|Line|Up|Down|Left|Right)|Multi-?cursor|Move Cursor|Undo Last Cursor|Editor Cursor|cursor position|around your cursor|where my cursor|multiple cursors|Multi Cursor|editor\.cursor|"cursor[A-Z]\w*"/i;
const visible = (h) => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, (m) => (m.match(/<text[^>]*>[^<]*/g) || []).join(" "))
  .replace(/<[^>]*>/g, "\u0001").split("\u0001").map((x) => x.trim()).filter(Boolean);
let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => /^v3-.*\.dc\.html$/.test(f) && !SKIP.test(f))) {
  const html = fs.readFileSync(dir + "/" + f, "utf8");
  const attrs = [...html.matchAll(/\b(?:alt|title|aria-label|placeholder|data-title)="([^"]*)"/g)].map((m) => m[1]);
  for (const t of [...visible(html), ...attrs]) for (const re of PAT) if (re.test(t) && !ALLOW.test(t)) { n++; console.log(f + ": " + t.slice(0, 140)); break; }
}
console.log("unexpected hits: " + n);
process.exit(n ? 1 : 0);
