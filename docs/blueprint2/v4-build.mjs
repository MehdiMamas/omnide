// node v4-build.mjs : copies the kept v3 boards into a new canvas as page v4 and finishes the OmnIDE brand:
// stock codicons instead of Cursor's glyphs, OmnIDE mark for app icon/watermark/agent glyph, OmnIDE chrome,
// no locks (OmnIDE is free), Cursor-only screens dropped (listed on v4-NotInOmnide).
import fs from "fs";
import path from "path";
import { mapIcons, brandCss, missing, STOCK } from "./tools/icons.mjs";
const SRC = "C:/Users/Mehdi/Projects/omnide/docs/blueprint/project/";
const OUT = "C:/Users/Mehdi/Projects/omnide/docs/blueprint2/project/";
const CODICONS = process.env.CODICONS; // folder holding @vscode/codicons@0.0.36 package/
export const DATE = "2026-11-26";

export const DROP = [
  "PlayLimit", "ai-34-tab-ghost-text-completion", "ai-36-debug-mode-composer", "ai-37-debug-mode-streaming", "ai-38-debug-mode-answer",
  "btn-browser-and-network-run-diagnostic", "btn-browser-and-network-show", "btn-code-intelligence-edit", "btn-code-intelligence-view-included-files",
  "dd-beta-update-access", "dd-browser-and-network-browser-mode", "dd-browser-and-network-http-compatibility-mode", "dd-general-privacy-mode",
  "dd-source-control-review-provider", "dd-voice-1x", "dd-voice-ara", "dd-voice-auto-detect", "dd-voice-system-default",
  "ide-31-settings-plan-usage", "ide-33-settings-cloud-agents", "ide-37-settings-browser-network", "ide-39-settings-indexing", "ide-40-settings-beta",
  "set-beta-1", "set-browser-and-network-1", "set-cloud-agents-1", "set-code-intelligence-1", "set-code-intelligence-2", "set-plan-and-usage-limit",
  "set-voice-1", "set-voice-2",
];
// where links into a dropped or renamed board go now
const REDIRECT = { "set-plan-and-usage-1": "set-claude-1", "ide-31-settings-plan-usage": "set-claude-1", "set-plan-and-usage-limit": "set-claude-1" };
const NAV_DROP = ["Cloud Agents", "Voice", "Browser &amp; Network", "Code Intelligence", "Beta"];
const NAV_H = 25; // settings nav cell pitch in px (measured: 270, 295, 320 ...)
const LOCKED = { "Gemini CLI": "Sonnet 5.5 (1M context)", Codex: "Opus Plan", "Registry agent": "Custom model ID", "GitHub Copilot": "Opus 5 (1M context)" };
const MARK12 = '<span class="omn-mark" aria-hidden="true" style="--icon-size:12px"></span>';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const target = (n) => (n in REDIRECT ? REDIRECT[n] : DROP.includes(n) ? "NotInOmnide" : n);

function nav(html) {
  if (!html.includes("cursor-settings-sidebar-cells")) return html;
  const re = /<a href="[^"]*" aria-label="Settings: ([^"]*)" style="position:absolute;left:(\d+)px;top:(\d+)px[^"]*"[^>]*><\/a>\n?/g;
  const gone = [...html.matchAll(re)].filter((m) => NAV_DROP.includes(m[1])).map((m) => [+m[2], +m[3]]);
  html = html.replace(re, (m, label, left, top) => {
    if (NAV_DROP.includes(label)) return "";
    const up = gone.filter(([l, t]) => l === +left && t < +top).length * NAV_H;
    return up ? m.replace(`top:${top}px`, `top:${+top - up}px`) : m;
  });
  for (const l of NAV_DROP) html = html.replace(new RegExp(`<div class="cursor-settings-sidebar-cell cursor-settings-sidebar-nav-cell"[^>]*>(?:(?!<div|</div>)[\\s\\S])*?title="${esc(l)}"(?:(?!<div|</div>)[\\s\\S])*?</div>`, "g"), "");
  return html;
}

function unlock(html) {
  html = html.replace(/<style data-omnide-locked>[\s\S]*?<\/style>/g, "");
  html = html.replace(/<div class="omn-banner" data-locked="true"[^>]*>[\s\S]*?<\/div>/g, "");
  for (const [a, b] of Object.entries(LOCKED)) {
    html = html.split(`<span class="omn-locked">${a}</span>`).join(b);
    html = html.split(`${a} (Upcoming in v0.2)`).join(b);
  }
  html = html.replace(/<span class="omn-locked">([^<]*)<\/span>/g, "$1");
  html = html.replace(/<span class="omn-lock"[^>]*>(?:<i [^>]*><\/i>)?[^<]*<\/span>/g, "");
  return html.replace(/ ?\(Upcoming in v0\.2\)/g, "");
}

function chrome(html) {
  // title bar: Cursor's Usage/upgrade chip -> Claude Code connection chip
  html = html.replace(/<div class="upgrade-pro-button" aria-label="Usage"><span class="upgrade-pro-button-text">Usage<\/span><\/div>/g,
    `<div class="titlebar-text-link omn-claude-chip" aria-label="Claude Code connected">${MARK12}<span>Claude Code</span></div>`);
  // status bar: Cursor Tab completion -> Claude Code session status
  html = html.replace(/<div class="statusbar-item right first-visible-item" id="Cursor Tab" aria-label="Tab completion" custom-hover="true"><a class="statusbar-item-label copilot-plus-plus-status-on" role="button" tabindex="-1" aria-label="Tab completion">Tab completion<\/a>/g,
    `<div class="statusbar-item right first-visible-item" id="omnide.claude" aria-label="Claude Code status" custom-hover="true"><a class="statusbar-item-label" role="button" tabindex="-1" aria-label="Claude Code: Sonnet 5.5, Manual mode, 12% of context used">${MARK12}<span style="margin-left:4px">Claude Code · Sonnet 5.5 · Manual · 12%</span></a>`);
  html = html.replace(/Temporarily disable Tab completion suggestions for a specified duration\. You can unsnooze at any time\./g, "Pause Claude Code background tasks for a while. Resume at any time.");
  html = html.replace(/Tab completion/g, "Claude Code status");
  // agent sidebar: Cursor Automations -> Claude Code sessions (list and resume)
  html = html.replace(/agent-sidebar-automations-icon" data-icon-name="robot" style="--cursor-icon-content: &quot;&#x[0-9a-f]+;&quot;;/g,
    `agent-sidebar-sessions-icon" data-icon-name="history" style="--cursor-icon-content: &quot;&#x${STOCK.history};&quot;;`);
  html = html.replace(/<span class="agent-sidebar-cell-text">Automations<\/span>/g, '<span class="agent-sidebar-cell-text">Sessions</span>');
  html = html.replace(/Search Automations/g, "Search sessions");
  // welcome: plan line -> free and open source, Claude connection link
  html = html.replace(/<div class="text-xs text-description-foreground font-light">Claude Code<\/div>(<div class="flex flex-row gap-1\.5 items-center text-description-foreground"><span class="w-0\.5 h-0\.5 rounded-full bg-description-foreground inline-block"><\/span><span class="text-xs text-text-link-foreground font-light hover:underline cursor-pointer opacity-80">)Usage<\/span>/g,
    '<div class="text-xs text-description-foreground font-light">Free and open source</div>$1Claude connected</span>');
  // settings sidebar: Cursor cube on the usage link -> OmnIDE mark
  html = html.replace(/<svg aria-hidden="true" class="cursor-settings-upgrade-cta-icon"[\s\S]*?<\/svg>/g, MARK12);
  // status bar (v3 left a locked Tab item): Claude Code session status
  html = html.replace(/<a class="statusbar-item-label[^"]*" role="button" tabindex="-1" aria-label="Claude Code status">[\s\S]*?<\/a>/g,
    `<a class="statusbar-item-label" role="button" tabindex="-1" aria-label="Claude Code: Sonnet 5.5, Manual mode, 12% of context used">${MARK12}<span style="margin-left:4px">Claude Code · Sonnet 5.5 · Manual · 12%</span></a>`);
  // General settings: Cursor Privacy Mode -> OmnIDE telemetry (none)
  html = html.replace(/<i [^>]*data-icon-name="lock"[^>]*><\/i>(Privacy Mode)/g, "$1");
  html = html.replace(/Your code data will not be trained on or used to improve the product\. Code may be stored to provide features such as Background Agent\./g,
    "OmnIDE collects no telemetry. Your code goes only to Claude, through your own Claude Code sign-in.");
  html = html.replace(/No training\. Code may be stored for Background Agent and other features\./g, "Off. OmnIDE sends nothing home.");
  html = html.replace(/Privacy Mode/g, "Telemetry");
  // Settings > Claude usage button opens claude.ai, no upgrade arrow
  html = html.replace(/data-icon-name="arrow-circle-up"/g, 'data-icon-name="link-external"').replace(/>Usage<\/button>/g, ">Open claude.ai</button>");
  html = html.replace(/Automations/g, "Sessions");
  // onboarding: Cursor's cube (labelled "OmnIDE logo" in v3) -> OmnIDE mark in the accent
  html = html.replace(/<svg viewBox="0 0 466\.73 532\.09"[\s\S]*?<\/svg>/g,
    '<span class="omn-mark" role="img" aria-label="OmnIDE logo" style="--icon-size:28px;color:var(--cursor-blue-foreground,#B69CFF)"></span>');
  // Cursor doc links -> Claude Code permissions docs and Open VSX (checked 200 on 2026-11-26)
  html = html.replace(/https:\/\/cursor\.com\/docs\/agent\/security\/run-modes/g, "https://code.claude.com/docs/en/permissions");
  html = html.replace(/https:\/\/www\.cursor\.com\/how-to-install-extension/g, "https://open-vsx.org/");
  html = html.replace(/Upcoming in v0\.2/g, "Roadmap v0.2");
  return html;
}

export function convert(html, file) {
  // links: drop empty overlays into dropped boards, retarget the rest
  html = html.replace(/<a href="v3-([A-Za-z0-9_-]+)\.dc\.html"[^>]*style="position:absolute[^"]*"[^>]*><\/a>\n?/g, (m, n) => (target(n) === "NotInOmnide" ? "" : m));
  html = nav(html);
  html = html.replace(/\bv3-([A-Za-z0-9_-]+)/g, (m, n) => "v4-" + target(n));
  html = html.replace(/data-page="v3"/, 'data-page="v4"');
  html = html.replace(/(<div data-page="v4"[^>]*?)data-created="[^"]*" data-updated="[^"]*"/, `$1data-created="${DATE}" data-updated="${DATE}"`);
  html = html.replace(/<style data-omnide-v3>/g, "<style data-omnide-v4>");
  html = mapIcons(unlock(chrome(html)));
  return html;
}

function patchCss(s) {
  // strip Cursor's own icon fonts (codicon build and cursor-icons), use stock codicons for both families
  s = s.replace(/@font-face \{ font-display: block; font-family: (?:codicon|cursor-icons); src: url\("data:[^"]*"\)[^}]*\}/g, "");
  const rules = Object.entries(STOCK).map(([n, c]) => `.codicon-${n}:before{content:"\\${c}"}`).join("");
  return s + brandCss() + `@font-face{font-family:cursor-icons;font-display:block;src:url("../fonts/codicon.ttf") format("truetype")}` + rules + "\n";
}

if (process.argv[1].endsWith("v4-build.mjs")) {
  if (!CODICONS) throw new Error("set CODICONS to the @vscode/codicons package folder");
  for (const d of ["css", "fonts"]) fs.mkdirSync(OUT + d, { recursive: true });
  for (const f of fs.readdirSync(SRC + "css")) {
    const s = fs.readFileSync(SRC + "css/" + f, "utf8");
    fs.writeFileSync(OUT + "css/" + f, /^vendor-/.test(f) ? patchCss(s) : s);
  }
  for (const f of fs.readdirSync(SRC + "fonts")) fs.copyFileSync(SRC + "fonts/" + f, OUT + "fonts/" + f);
  fs.copyFileSync(path.join(CODICONS, "dist/codicon.ttf"), OUT + "fonts/codicon.ttf");
  fs.copyFileSync(path.join(CODICONS, "LICENSE"), OUT + "fonts/codicon-LICENSE.txt");
  for (const f of fs.readdirSync(SRC).filter((f) => /\.(puml|iuml)$/.test(f))) fs.copyFileSync(SRC + f, OUT + f);

  const cv = JSON.parse(fs.readFileSync(SRC + "canvas.json", "utf8"));
  const boards = {}, order = [];
  for (const k of cv.order.filter((k) => cv.boards[k].page === "v3")) {
    const n = k.replace(/^v3-/, "").replace(/\.dc\.html$/, "");
    if (DROP.includes(n)) continue;
    const nk = `v4-${target(n)}.dc.html`;
    fs.writeFileSync(OUT + nk, convert(fs.readFileSync(SRC + k, "utf8"), k));
    boards[nk] = { ...cv.boards[k], page: "v4" };
    order.push(nk);
  }
  const out = { ...cv, pages: [{ id: "v4", name: "v4 · in progress" }], boards, order };
  fs.writeFileSync(OUT + "canvas.json", JSON.stringify(out, null, 1));
  console.log("v4 boards", order.length, "missing icons:", [...missing].join(" ") || "none");
}
