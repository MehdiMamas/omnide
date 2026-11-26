// Swaps Cursor's own icon glyphs for stock VS Code codicons (CC-BY-4.0) and the OmnIDE mark.
import fs from "fs";
export const STOCK = JSON.parse(fs.readFileSync(new URL("./codicon-stock.json", import.meta.url), "utf8"));
const MARK = "omn-mark"; // drawn by CSS mask, see brandCss
// Cursor-only codicon classes -> stock name ("" = OmnIDE mark)
export const CLASS = {
  "ellipsis-two": "ellipsis", "cloud-two": "cloud", "add-two": "add", "history-two": "history", "arrow-up-two": "arrow-up",
  "folder-two": "folder", "clone-two": "copy", "x-two": "close", "check-two": "check", "warning-two": "warning",
  "panel-left": "layout-sidebar-left", "panel-left-off": "layout-sidebar-left-off", "panel-layout-icon": "layout-sidebar-left",
  "panel-layout-icon-off": "layout-sidebar-left-off", "panel-right": "layout-sidebar-right", "panel-close": "close",
  restore: "discard", todos: "checklist", bugbot: "checklist", circles: "circle-large", chat: "comment-discussion",
  paperclip: "file-add", expander: "chevron-down", "check-circled": "pass", infinity: "",
};
// cursor-icons font names -> stock name ("" = OmnIDE mark)
export const NAME = {
  agent: "", cube: "", "arrow-right-up": "link-external", "magnifying-glass": "search", waveform: "mic",
  "chevron-down-small": "chevron-down", sliders: "settings", split: "split-horizontal", "list-bullets": "list-unordered",
  "speaker-waves": "unmute", "chat-bubble-plus-center": "add", minus: "dash", "seal-check": "verified", lightning: "zap",
  "funnel-simple": "filter", "logo-mcp": "plug", "question-circle": "question", spinner: "loading",
  "file-arrow-right-up": "go-to-file", "list-todo": "checklist", more: "ellipsis", plus: "add", x: "close", lock: "lock",
};
const ALIAS = { zap: "symbol-event", "circle-large": "circle-large-outline", "layout-sidebar-left-off": "layout-sidebar-left-off", "file-add": "new-file" };
const cp = (n) => STOCK[n] || STOCK[ALIAS[n]] || null;
export const missing = new Set();
export function mapIcons(html) {
  html = html.replace(/(\bclass="[^"]*?)\bcodicon-([a-z0-9-]+)/g, (m, pre, n) => {
    if (!(n in CLASS)) return m;
    const to = CLASS[n];
    return to ? `${pre}codicon-${to}` : `${pre}${MARK}`;
  });
  // any <i> tag with class cursor-icon: swap its name and glyph, keep the other attributes
  html = html.replace(/<i [^>]*cursor-icon[^>]*>/g, (tag) => {
    const n = (tag.match(/data-icon-name="([^"]+)"/) || [])[1];
    if (!n || !/--cursor-icon-content: &quot;&#x[0-9a-f]+;&quot;;/i.test(tag)) return tag;
    const to = n in NAME ? NAME[n] : n;
    if (to === "") return tag.replace(/class="/, `class="${MARK} `).replace(/data-icon-name="[^"]+"/, 'data-icon-name="omnide"').replace(/--cursor-icon-content: &quot;&#x[0-9a-f]+;&quot;;/i, "--cursor-icon-content: &quot;&quot;;");
    const c = cp(to);
    if (!c) { missing.add(n); return tag; }
    return tag.replace(/data-icon-name="[^"]+"/, `data-icon-name="${to}"`).replace(/--cursor-icon-content: &quot;&#x[0-9a-f]+;&quot;;/i, `--cursor-icon-content: &quot;&#x${c};&quot;;`);
  });
  return html;
}
const svg = (ac) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='13' fill='none' stroke='${ac}' stroke-width='3.2'/><path d='M12.5 10.8 18.8 16l-6.3 5.2' fill='none' stroke='${ac}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
export const markUri = (ac = "black") => `url("data:image/svg+xml,${encodeURIComponent(svg(ac))}")`;
// appended to vendor-a.css: stock codicon font, cursor-icon rendered with it, OmnIDE mark for app icon, watermark and agent glyph
export const brandCss = () => `
/* OmnIDE v4 brand: stock codicons (CC-BY-4.0, github.com/microsoft/vscode-codicons) and the OmnIDE mark */
@font-face{font-family:"codicon";font-display:block;src:url("../fonts/codicon.ttf") format("truetype")}
.cursor-icon,.cursor-icon::before{font-family:codicon!important}
.${MARK}{display:inline-block;width:var(--icon-size,16px);height:var(--icon-size,16px);min-width:14px;min-height:14px;background:currentColor;-webkit-mask:${markUri()} center/contain no-repeat;mask:${markUri()} center/contain no-repeat;vertical-align:middle}
.${MARK}::before{content:""!important}
.window-appicon:not(.codicon){background-image:${markUri("#B69CFF")}!important;background-size:18px!important;background-repeat:no-repeat!important;background-position:center!important}
.letterpress::before{content:""!important;display:block;width:min(50vw,50vh,100px);height:min(50vw,50vh,100px);background:currentColor;-webkit-mask:${markUri()} center/contain no-repeat;mask:${markUri()} center/contain no-repeat}
`;
