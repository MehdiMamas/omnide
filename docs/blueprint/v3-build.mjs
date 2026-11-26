// node v3-build.mjs : copies the v2 boards to v3 and applies the OmnIDE brand (colours, Geist, logo, Claude wording).
import fs from "fs";
import { mapColors } from "./tools/colors.mjs";
import { mapFonts, FACE, SANS, MONO } from "./tools/fonts.mjs";
import { logo } from "./tools/logo.mjs";
import { CSS } from "./tools/css-build.mjs";
import { rewriteText, screenEdits } from "./tools/text.mjs";
const D = "C:/Users/Mehdi/Projects/omnide/docs/blueprint/project/";
export const DATE = "2026-11-26";
const OVR = (light) => `<style data-omnide-v3>${FACE}.cap-html.cap-html{--vscode-font-family:${SANS};--vscode-editor-font-family:${MONO};--cursor-font-family:${SANS};--cursor-font-family-sans:${SANS};--cursor-font-family-mono:${MONO};--monaco-monospace-font:${MONO};` +
  (light
    ? `--vscode-button-background:#6D28D9;--vscode-button-hoverBackground:#5B21B6;--vscode-extensionButton-background:#6D28D9;--vscode-extensionButton-hoverBackground:#5B21B6;--vscode-textLink-foreground:#5B21B6;--vscode-textLink-activeForeground:#4C1D95;--vscode-focusBorder:#7C3AED;--vscode-button-foreground:#FFFFFF;--cursor-blue:#5B21B6;--cursor-blue-fill:#6D28D9;--cursor-blue-fill-hover:#5B21B6;--cursor-blue-fill-pressed:#4C1D95;--cursor-blue-foreground:#5B21B6;`
    : `--vscode-button-background:#6D28D9;--vscode-button-hoverBackground:#5B21B6;--vscode-extensionButton-background:#6D28D9;--vscode-extensionButton-hoverBackground:#5B21B6;--vscode-textLink-foreground:#B69CFF;--vscode-textLink-activeForeground:#C4B5FD;--vscode-focusBorder:#7C3AED;--vscode-button-foreground:#FFFFFF;--vscode-activityBarBadge-background:#C4B5FD;--vscode-activityBarBadge-foreground:#1A1030;--cursor-blue:#B69CFF;--cursor-blue-fill:#6D28D9;--cursor-blue-fill-hover:#5B21B6;--cursor-blue-fill-pressed:#4C1D95;--cursor-blue-foreground:#B69CFF;`) + `}.omn-lock{display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:1px 7px;border-radius:999px;border:1px solid ${light ? "#C5BFD8" : "#3A3649"};background:${light ? "#F0EDF7" : "#221F2C"};color:${light ? "#433E58" : "#D2CFE0"};font-size:10px;line-height:14px;letter-spacing:.02em;white-space:nowrap}.omn-locked{opacity:.55;pointer-events:none}</style>\n`;
const CSSMAP = Object.fromEntries(Object.entries(CSS).map(([id, [n]]) => [id, "./css/" + n + ".css"]));
export function convert(html, file) {
  const light = /^v2-light-/.test(file), screen = /class="cap-html/.test(html);
  html = html.replace(/<style data-omnide-purple>[\s\S]*?<\/style>\n?/g, "");
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => CSSMAP[id] || (() => { throw new Error("blob " + id); })());
  html = html.replace(/v2-([A-Za-z0-9_-]+\.dc\.html)/g, "v3-$1").replace(/data-page="v2"/, 'data-page="v3"');
  html = html.replace(/<svg role="img" aria-label="OmnIDE logo"[\s\S]*?<\/svg>/g, "\u0002LOGO\u0002");
  html = mapFonts(mapColors(html, screen ? (light ? "light" : "dark") : "dark"));
  html = rewriteText(html, { file, screen, light });
  html = html.replace(/\u0002LOGO\u0002/g, () => logo(light));
  if (screen) html = html.replace("</helmet>", OVR(light) + "</helmet>");
  else html = html.replace("</helmet>", `<style data-omnide-v3>${FACE}</style></helmet>`);
  html = html.replace(/(<div data-page="v3"[^>]*?)data-created="[^"]*" data-updated="[^"]*"/, `$1data-created="${DATE}" data-updated="${DATE}"`);
  return screenEdits(html, { file, screen, light });
}
if (process.argv[1].endsWith("v3-build.mjs")) {
  const cv = JSON.parse(fs.readFileSync(D + "canvas.json", "utf8"));
  const names = Object.keys(cv.boards).filter((k) => cv.boards[k].page === "v2");
  let n = 0;
  for (const k of names) {
    const out = convert(fs.readFileSync(D + k, "utf8"), k);
    fs.writeFileSync(D + k.replace(/^v2-/, "v3-"), out); n++;
  }
  const src = fs.readFileSync(D + "v2-set-plan-and-usage-1.dc.html", "utf8");
  for (const [id, name] of [["not-installed", "Claude Code not installed"], ["signed-out", "signed out"], ["error", "error"]]) {
    const f = `v2-omni-claude-${id}.dc.html`;
    let o = convert(src, f).replace(/v3-set-plan-and-usage-1 · [^<"]*/g, `v3-omni-claude-${id} · OmnIDE Settings · Claude (${name})`).replace(/data-state="scroll 1"/, `data-state="${name}"`);
    fs.writeFileSync(D + f.replace("v2-", "v3-"), o); n++;
  }
  console.log("v3 boards written", n);
}
