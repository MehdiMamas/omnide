import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { page, card, grid, h2, p, table, mono, pill, live, locked, K, MUTED, LINE, LINE2, TODAY, DIR, node, arrow, diagram, legend } from "./lib.mjs";
import { MARKS, mark } from "./logo.mjs";

const T = JSON.parse(readFileSync(new URL("../tokens.json", import.meta.url), "utf8"));
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// [name, lightValue, darkValue, on, use, reason]
const D = (n) => T.dark[`--omnide-${n}`][0], L = (n) => T.light[`--omnide-${n}`][0], A = (n) => T.accent[`--omnide-${n}`][0];
const ROWS = [
  ["--omnide-bg-0", L("bg-0"), D("bg-0"), "--omnide-fg-1", "ui", "Title bar and activity bar, the deepest layer; white in light."],
  ["--omnide-bg-1", L("bg-1"), D("bg-1"), "--omnide-fg-1", "ui", "Editor and chat canvas: the surface the user reads longest."],
  ["--omnide-bg-2", L("bg-2"), D("bg-2"), "--omnide-fg-1", "ui", "Side bar, panel and cards, one step up from the canvas."],
  ["--omnide-bg-3", L("bg-3"), D("bg-3"), "--omnide-fg-1", "ui", "Raised surfaces: inputs and menus."],
  ["--omnide-bg-4", L("bg-4"), D("bg-4"), "--omnide-fg-1", "ui", "Hover and selected rows."],
  ["--omnide-fg-1", L("fg-1"), D("fg-1"), "--omnide-bg-2", "text", "Headings and primary text."],
  ["--omnide-fg-2", L("fg-2"), D("fg-2"), "--omnide-bg-2", "text", "Body text."],
  ["--omnide-fg-3", L("fg-3"), D("fg-3"), "--omnide-bg-2", "text", "Secondary text."],
  ["--omnide-fg-4", L("fg-4"), D("fg-4"), "--omnide-bg-2", "text", "Muted text: captions and placeholders. The lightest text allowed; it still reaches 4.5:1."],
  ["--omnide-on-accent", "#FFFFFF", "#FFFFFF", "--omnide-accent-fill", "text", "Text and icons on a filled accent button."],
  ["--omnide-accent-fill", A("accent-fill"), A("accent-fill"), "--omnide-on-accent", "text", "Primary button fill. White text reaches 7.1:1."],
  ["--omnide-accent-hover", A("accent-hover"), A("accent-hover"), "--omnide-on-accent", "text", "Button hover; also the link colour on light."],
  ["--omnide-accent-pressed", A("accent-pressed"), A("accent-pressed"), "--omnide-on-accent", "text", "Button pressed."],
  ["--omnide-accent", A("accent"), A("accent"), "--omnide-bg-2", "ui", "Focus ring, active indicators and icons. 3:1 or more on every surface."],
  ["--omnide-link", A("accent-hover"), A("link"), "--omnide-bg-2", "text", "Links and info text: deep purple on light, soft lavender on dark."],
  ["--omnide-badge", A("accent-pressed"), A("badge"), "--omnide-bg-2", "text", "Badge and tag text, and link hover on dark."],
  ["--omnide-ok", "#0B7A3E", "#41CB7E", "--omnide-bg-2", "text", "Success: Live badge, passed checks. Always with a word, never colour alone."],
  ["--omnide-danger", "#B3261E", "#F2777A", "--omnide-bg-2", "text", "Failure branch, error text. Always with a word or icon."],
];
const fails = [];
for (const [n, lv, dv, on, use, ] of ROWS) {
  const need = use === "text" ? 4.5 : 3, o = ROWS.find((r) => r[0] === on);
  const a = cr(lv, o[1]), b = cr(dv, o[2]);
  if (a < need || b < need) fails.push(`${n} light ${a.toFixed(2)} dark ${b.toFixed(2)} need ${need}`);
}
if (fails.length) console.log("CONTRAST FAILS:\n" + fails.join("\n"));
const sw = (c) => `<span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${c};border:1px solid ${LINE2};vertical-align:middle"></span>`;
const ratio = (r) => `${cr(r[2], ROWS.find((x) => x[0] === r[3])[2]).toFixed(1)} / ${cr(r[1], ROWS.find((x) => x[0] === r[3])[1]).toFixed(1)}`;

const out = [];
out.push(page("v3-DesignTokens", {
  section: "design", kicker: "Design · tokens", title: "Design tokens (OmnIDE Dark and OmnIDE Light)", h: 1200,
  attrs: 'data-palette-source="src/omnide/theme/omnide-dark.json"',
  intro: "Each token is shown dark / light with its contrast against the surface it sits on (text 4.5:1, UI parts 3:1). The same values are written to the VS Code colour themes in src/omnide/theme, and to the CSS variables every screen on this canvas uses.",
  body: `<p style="color:${MUTED};margin:0 0 12px">Palette source: <span data-palette-source="src/omnide/theme/omnide-dark.json">src/omnide/theme/omnide-dark.json</span> (light variant: src/omnide/theme/omnide-light.json)</p>` +
    table(["Swatch", "Token", "Dark / light value", "Contrast dark / light", "Why"], ROWS.map((r) => [
      `${sw(r[2])} ${sw(r[1])}`, mono(r[0]), `${r[2]} / ${r[1]}`, `${ratio(r)} on ${r[3].replace("--omnide-", "")}`, r[5],
    ]), { rowAttrs: (r, i) => { const q = ROWS[i]; return `data-token="${q[0]}" data-value="${q[1]}" data-dark-value="${q[2]}" data-on="${q[3]}" data-use="${q[4]}" data-reason="${q[5]}"`; } }) +
    `<p style="color:${MUTED};margin-top:14px;font-size:12px">Borders use the foreground at 8% and 20% opacity, so they follow the theme. Disabled text uses the foreground at 40% and is exempt from contrast by WCAG 1.4.3.</p>`,
}));

// design spec
const scale = [["Title", "28/36", "600", "Page and welcome titles"], ["Heading", "18/26", "600", "Section titles in Settings and panels"], ["Body", "13/20", "400", "Chat, lists, forms (VS Code default size)"], ["Small", "12/16", "400", "Captions, badges, status bar"], ["Code", "13/20 Geist Mono", "400", "Editor, terminal, diffs, tool output"]];
out.push(page("v3-DesignSpec", {
  section: "design", kicker: "Design · spec", title: "OmnIDE design spec", h: 1700,
  intro: "OmnIDE keeps the VS Code layout and flows, so every habit carries over. Only the brand layer changes: mark, name, colour, type and the badges that say what is not in v0.1. Tokens and contrast are on the Design tokens frame.",
  body: grid(3, [
    card("Direction", "Calm and technical: purple-tinted dark neutrals, one purple accent, generous contrast. Three words: focused, quiet, precise. The accent is used for the one thing to do next (primary button, focus ring, active indicator), never for decoration."),
    card("Why purple", "It is the owner's default accent, it is not the colour of Anthropic or Microsoft, and it reaches 7.1:1 with white text on the button fill, so the brand is safe on contrast."),
    card("Why Geist", "A neutral UI sans and a matching mono, both under the SIL Open Font License, bundled as woff2 so there is no network request and nothing to license. Codicons stay for all icons."),
  ]) +
    h2("Type scale (Geist for UI, Geist Mono for editor and terminal)") + table(["Step", "Size / line", "Weight", "Used for"], scale) +
    h2("Spacing and shape") + table(["Token", "Value", "Used for"], [["Grid", "4 px", "Every gap is a multiple of 4"], ["Gaps", "4, 8, 12, 16, 24", "Inside rows, between cards, between sections"], ["Radius", "4 px controls, 8 px cards and menus, 12 px dialogs", "Corners"], ["Row height", "22 px list rows, 28 px buttons and inputs, 35 px tabs", "Same as VS Code, so density is unchanged"], ["Focus", "2 px ring in the accent token, 2 px offset", "Every interactive element"]]) +
    h2("Motion") + table(["Motion", "Time and easing", "Reduced motion"], [["Hover and press", "100 ms ease-out", "Same, colour only"], ["Menus and popovers", "120 ms fade and 4 px rise", "Fade only"], ["Panel open and close", "180 ms ease-in-out", "Instant"], ["Streaming text", "No animation, text appends", "Same"], ["Spinner", "Rotates 900 ms linear", "Static dots"]]) +
    h2("Logo: construction and clear space") + `<div style="display:flex;gap:24px;align-items:center;margin:0 0 10px"><div style="background:${K.bg2};border:1px solid ${LINE};border-radius:8px;padding:18px">${mark(128, false)}</div><div style="color:${MUTED};max-width:760px">A ring on a 32 unit grid: centre 16, radius 13, stroke 3.2 (10% of the width). Inside, a prompt chevron: points 12.5 10.8, 18.8 16, 12.5 21.2, stroke 3, round caps. Clear space is one ring stroke times four (12.8 units) on every side. Smallest size 16 px; below that use the ring alone. One colour: ${mono("--omnide-link")} on dark, ${mono("--omnide-accent-hover")} on light, white on the filled app icon. Wordmark: Omn in 400, IDE in 700, never split or spaced.</div></div>` +
    h2("Locked badge (component spec)") + `<div style="display:flex;gap:28px;align-items:flex-start;margin:0 0 10px"><div style="background:${K.bg2};border:1px solid ${LINE};border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:330px"><div style="display:flex;align-items:center;gap:8px;color:${K.fg4}">🔒 Voice <span style="margin-left:auto;padding:1px 8px;border-radius:10px;border:1px solid ${LINE2};font-size:11px">Upcoming in v0.2</span></div><div style="display:flex;align-items:center;gap:8px;color:${K.fg1}">Agent mode <span style="margin-left:auto;padding:1px 8px;border-radius:10px;border:1px solid ${K.ok};color:${K.ok};font-size:11px">Live in v0.1</span></div></div><div style="color:${MUTED};max-width:700px">A locked item keeps its place, label and screen, at 50% opacity, with a lock codicon before the label and the pill Upcoming in v0.2 on the right. It takes no focus and no click (aria-disabled true) and its tooltip says what arrives and when. A locked screen shows the same pill as a banner at the top of the pane and dims the controls below it. The state comes from the adapter flag locked, never from a hard-coded list in the UI. Pill: 11 px, 1 px border in the foreground at 20%, radius 10 px.</div></div>`,
}));

// brand: three logo variants
const sizes = [16, 32, 128];
const tile = (v, light) => `<div style="background:${light ? "#FFFFFF" : K.bg2};border:1px solid ${LINE};border-radius:8px;padding:14px;display:flex;gap:16px;align-items:flex-end">${sizes.map((s) => `<div style="text-align:center;font-size:11px;color:${light ? "#5F5977" : MUTED}">${mark(s, light, v)}<br>${s}px</div>`).join("")}</div>`;
const VAR = { A: ["A. Ring and prompt chevron", "Chosen", "A ring (omni: all around) holding the chevron of a prompt. Reads as a code prompt and as an O at 16 px."], B: ["B. Ring and caret", "Rejected", "A ring with a vertical text caret. Clear at large sizes but looks like the letter O with an I: reads as 'OI' at 16 px."], C: ["C. Open ring and chevron", "Rejected", "An open ring with the chevron in the gap. Distinctive, but the gap closes up and the ring looks broken at 16 px."] };
const icon = (s) => `<svg role="img" aria-label="OmnIDE app icon" width="${s}" height="${s}" viewBox="0 0 64 64" style="display:inline-block"><rect width="64" height="64" rx="14" fill="${K.fill}"/><g transform="translate(12 12) scale(1.25)">${MARKS.A("#FFFFFF")}</g></svg>`;
out.push(page("v3-omni-Brand", {
  section: "design", kicker: "Design · brand", title: "OmnIDE: name, logo and where it appears", h: 1500,
  intro: "OmnIDE is spelled with a capital IDE so it reads Omn-I-D-E. Lowercase omnide stays for the repo, the command, the data folder and the URL scheme. Three marks were drawn; variant A is used everywhere.",
  body: ["A", "B", "C"].map((v) => `<div data-logo="${v}" style="display:grid;grid-template-columns:230px 1fr 1fr;gap:14px;align-items:center;margin:0 0 12px"><div><b>${VAR[v][0]}</b><br>${pill(VAR[v][1], VAR[v][1] === "Chosen" ? K.ok : K.fg4)}<br><span style="color:${MUTED};font-size:12px">${VAR[v][2]}</span></div>${tile(v, false)}${tile(v, true)}</div>`).join("") +
    h2("Where the chosen mark appears") + `<div style="display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap"><div>${icon(128)}<br><span style="font-size:11px;color:${MUTED}">App icon, 128 px: the mark in white on the accent fill, 14 px corner radius at 64</span></div><div>${icon(32)}<br><span style="font-size:11px;color:${MUTED}">Dock and taskbar, 32 px</span></div><div>${icon(16)}<br><span style="font-size:11px;color:${MUTED}">Favicon and tab, 16 px</span></div><div style="background:${K.bg0};border:1px solid ${LINE};border-radius:8px;padding:10px 16px;display:flex;gap:10px;align-items:center">${mark(16, false)}<span style="font-size:12px">OmnIDE</span><span style="color:${MUTED};font-size:12px">Title bar (menu bar)</span></div><div style="background:${K.bg2};border:1px solid ${LINE};border-radius:8px;padding:10px 16px;display:flex;gap:10px;align-items:center">${mark(48, false)}<div><b>Welcome to OmnIDE</b><br><span style="color:${MUTED};font-size:12px">Welcome, onboarding and About</span></div></div></div>` +
    h2("Name and trademark") + table(["Item", "Decision"], [["Name", "OmnIDE; short form omnide; bundle id dev.omnide.app (no domain is owned, so the id is a reservation, not a URL)"], ["Trademark", "A web search found no mark for OmnIDE or Omnide on 2026-11-26. It was not verified on the USPTO site, which returned nothing even for a control word. A formal search is open before any public release."], ["Colour", "Accent family from the Design tokens frame; the mark is one colour"], ["Fonts", "Geist and Geist Mono, SIL Open Font License, bundled as woff2"]]),
}));
export default out;
