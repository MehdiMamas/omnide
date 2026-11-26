// Post-pass: doc fixes, Main cover patch, v2 supersede, canvas.json for v3.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const P = new URL("../project/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const rd = (f) => readFileSync(P + f, "utf8"), wr = (f, s) => writeFileSync(P + f, s);
const built = JSON.parse(readFileSync(new URL("./docs-built.json", import.meta.url), "utf8"));
const builtSet = new Set(built.map((b) => b.file));
const files = readdirSync(P);
// 1 generic doc fixes (docs from v2 still carry v2 headers and the old font stack)
for (const f of files.filter((x) => /^v3-.*\.dc\.html$/.test(x))) {
  let s = rd(f), o = s;
  s = s.replace(/data-flow="v2-/g, 'data-flow="v3-');
  s = s.replace(/#ff7f7a1f/gi, "rgba(242,119,122,.12)").replace(/#ff7f7a/gi, "#F2777A");
  s = s.replace(/'Segoe WPC','Segoe UI',system-ui,sans-serif/g, "'Geist','Segoe UI',system-ui,sans-serif");
  s = s.replace(/(the )?the reference IDE/g, "the reference IDE");
  if (!builtSet.has(f)) {
    s = s.replace(/( · )v2( · 2026-11-26 · updated)/, "$1v3$2").replace(/(Start here · )v2/, "$1v3");
  }
  if (s !== o) wr(f, s);
}
// 2 Main cover
{
  let s = rd("v3-Main.dc.html");
  const L = (f, t) => `<a href="v3-${f}.dc.html">${t}</a>`;
  const card = (t, items) => `<div style="background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:8px;padding:10px 14px"><div style="font-weight:600;margin:0 0 4px">${t}</div><div style="font-size:12px;line-height:1.6">${items.join(" · ")}</div></div>`;
  const fresh = `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 18px">` + [
    card("Agent design", [L("agent-Component", "components"), L("agent-Sequence", "one prompt turn"), L("agent-States", "session states"), L("agent-Mapping", "features to mechanisms"), L("agent-Registry", "adding an agent")]),
    card("Design", [L("DesignSpec", "design spec"), L("DesignTokens", "tokens"), L("omni-Brand", "brand and logo"), L("omni-Changes", "what changed")]),
    card("Settings > Claude", [L("set-plan-and-usage-1", "signed in"), L("omni-claude-not-installed", "not installed"), L("omni-claude-signed-out", "signed out"), L("omni-claude-error", "error")]),
    card("Play", [L("PlayClaudeSession", "session"), L("PlayClaudeSetupEdge", "Claude missing"), L("PlayClaudeError", "agent error")]),
    card("Locked, Upcoming in v0.2", [L("set-voice-1", "voice"), L("omni-agent-picker", "other agents"), L("Plan", "plan and scope")]),
  ].join("") + `</div>`;
  s = s.replace(/OmnIDE v2<\/h1>/, "OmnIDE v3</h1>");
  s = s.replace(/(<\/h1><p[^>]*>)[\s\S]*?(<\/p>)/, `$1OmnIDE is an open-source IDE on Code OSS where Claude Code is the agent, spoken to over the Agent Client Protocol. This page keeps the familiar layout and flows and adds OmnIDE's own mark, purple design tokens and Geist type, Claude models and wording, Settings &gt; Claude, and the Agent design. Features that need more than Claude Code are shown locked as Upcoming in v0.2. Status: in progress, waiting for your yes. Plan: <a href="https://github.com/MehdiMamas/omnide/issues/10">omnide#10</a>. Cloud agents, voice, the browser tool, tab completion, debug mode, indexing and review providers are locked; OmnIDE has no account of its own.$2`);
  s = s.replace(/<b>Older version:<\/b>[\s\S]*?\.<\/p>/, `<b>Older versions:</b> <a href="v2-Main.dc.html">v2 (superseded)</a> · <a href="v1-Cover.dc.html">v1 (superseded)</a>.</p>`);
  s = s.replace(/New for OmnIDE<\/h2>/, `New in v3</h2>${fresh}<h2 style="font-size:18px;margin:8px 0 8px">Also new for OmnIDE</h2>`);
  s = s.replace(/>CaseCursor<\/a>/g, ">CaseReference</a>").replace(/v3-omni-CaseReference/g, "v3-omni-CaseCursor").replace("Sitemap: new in v2", "Sitemap: screens by area").replace("Sitemap: carried over from v1", "Sitemap: more screens");
  s = s.replace(/CaseReference<\/a>/, "CaseReference</a>");
  if (!s.includes("v3-PlayClaudeSession")) s = s.replace(/(<h2[^>]*>Also new for OmnIDE)/, `<p style="font-size:13px;margin:0 0 14px"><b>Play, Claude:</b> ${L("PlayClaudeSession","session start to close")} · ${L("PlayClaudeSetupEdge","Claude Code missing")} · ${L("PlayClaudeError","agent error")}</p>$1`);
  wr("v3-Main.dc.html", s);
}
// 3 supersede every v2 board
for (const f of files.filter((x) => /^v2-.*\.dc\.html$/.test(x))) {
  let s = rd(f);
  if (s.includes('data-superseded-by="v3"')) continue;
  const m = s.match(/<div data-page="[^"]*"[^>]*>/);
  if (!m) { console.log("no root", f); continue; }
  let tag = m[0];
  tag = /data-status="[^"]*"/.test(tag) ? tag.replace(/data-status="[^"]*"/, 'data-status="superseded" data-superseded-by="v3"') : tag.replace(/^<div /, '<div data-status="superseded" data-superseded-by="v3" ');
  const banner = `<a href="v3-Main.dc.html" style="position:absolute;top:8px;right:8px;z-index:99999;padding:3px 10px;border-radius:10px;background:#6D28D9;color:#FFFFFF;font:600 11px/1.4 system-ui,sans-serif;text-decoration:none">Superseded, see v3</a>`;
  s = s.replace(m[0], tag + banner);
  wr(f, s);
}
// 4 canvas.json
const c = JSON.parse(rd("canvas.json"));
for (const k of Object.keys(c.boards)) if (k.startsWith("v3-")) { delete c.boards[k]; }
c.order = c.order.filter((k) => !k.startsWith("v3-"));
const v3 = files.filter((x) => /^v3-.*\.dc\.html$/.test(x)).sort();
let nx = 0, ny = 0; const maxY = Math.max(...Object.values(c.boards).filter((b) => b.page === "v2").map((b) => b.y + b.h)) + 300;
const add = [];
for (const f of v3) {
  const old = c.boards[f.replace(/^v3-/, "v2-")];
  const bi = built.find((b) => b.file === f);
  let e;
  if (old) { e = { ...old, page: "v3" }; if (bi) { e.w = bi.w; e.h = bi.h; } }
  else {
    const w = bi ? bi.w : 1440, h = bi ? bi.h : 900;
    if (nx + w > 9000) { nx = 0; ny += 1700; }
    e = { x: nx, y: maxY + ny, w, h, title: f.replace(/^v3-|\.dc\.html$/g, ""), page: "v3", is_interactive: /^v3-(omni-claude-|Play)/.test(f) };
    nx += w + 100;
  }
  add.push([f, e]);
}
const nb = {}; for (const [f, e] of add) nb[f] = e; Object.assign(nb, c.boards); c.boards = nb;
c.order = [...add.map((a) => a[0]), ...c.order];
c.pages = [{ id: "v3", name: "v3 · 2026-11-26" }, ...c.pages.filter((p) => p.id !== "v3").map((p) => (p.id === "v2" ? { id: "v2", name: "v2 · 2026-11-26 · superseded" } : p))];
c.launch = { view: "canvas", page: "v3" };
wr("canvas.json", JSON.stringify(c, null, 1));
console.log("v3 boards", add.length, "new", add.filter((a) => !c.boards[a[0].replace("v3-", "v2-")]).length);
