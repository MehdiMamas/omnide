// Doc-frame helpers: one function per piece, same look as the v2 doc boards (OmnIDE dark tokens only).
import { writeFileSync } from "node:fs";
export const DIR = new URL("../project/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const TODAY = "2026-11-26";
export const K = {
  bg0: "#0E0C14", bg1: "#14121B", bg2: "#1A1823", bg3: "#221F2C", bg4: "#2C2938",
  fg1: "#F4F2FB", fg2: "#D2CFE0", fg3: "#AEA9C2", fg4: "#8E89A3",
  acc: "#7C3AED", bright: "#8B5CF6", link: "#B69CFF", badge: "#C4B5FD", fill: "#6D28D9",
  ok: "#41CB7E", bad: "#F2777A", warn: "#E5B454",
};
export const MUTED = "rgba(244, 242, 251, 0.74)", LINE = "rgba(244, 242, 251, 0.08)", LINE2 = "rgba(244, 242, 251, 0.2)";
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONT = "'Geist','Segoe UI',system-ui,sans-serif", MONO = "'Geist Mono',ui-monospace,Consolas,monospace";
export const mono = (s) => `<code style="font-family:${MONO};font-size:12px;color:${K.badge}">${esc(s)}</code>`;
export const card = (title, text, extra = "") =>
  `<div style="background:${K.bg2};border:1px solid ${LINE};border-radius:8px;padding:14px 16px;margin:0 0 10px;${extra}"><b>${title}</b><br><span style="color:${MUTED}">${text}</span></div>`;
export const grid = (n, items, gap = 10) => `<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:${gap}px;margin:0 0 16px">${items.join("")}</div>`;
export const h2 = (t) => `<h2 style="margin:26px 0 10px;font-size:18px;font-weight:600">${t}</h2>`;
export const p = (t) => `<p style="margin:0 0 12px;max-width:1080px;color:${MUTED}">${t}</p>`;
export const src = (url, label) => `<a data-source href="${url}" data-fetched="${TODAY}">${esc(label || url)}</a>`;
export const sources = (list) => `<p style="margin:14px 0 0;font-size:12px;color:${MUTED}">Sources, fetched ${TODAY}: ${list.map(([u, l]) => src(u, l)).join(" · ")}</p>`;
export function table(heads, rows, { rowAttrs = () => "", w = "100%" } = {}) {
  return `<table style="width:${w};font-size:13px"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r, i) => `<tr ${rowAttrs(r, i)}>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
export const pill = (t, c = K.badge) => `<span style="display:inline-block;padding:1px 8px;border-radius:10px;border:1px solid ${c};color:${c};font-size:11px;white-space:nowrap">${t}</span>`;
export const live = pill("Live in v0.1", K.ok);
export const locked = `<span style="display:inline-block;padding:1px 8px;border-radius:10px;border:1px solid ${LINE2};color:${K.fg4};font-size:11px;white-space:nowrap">🔒 Upcoming in v0.2</span>`;

export function page(file, { section, kicker, title, intro = "", body = "", h = 800, w = 1240, attrs = "", ttl }) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(ttl || title.replace(/<[^>]+>/g, ""))}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
a{color:${K.link}}a:hover{color:${K.fg1}}
table{border-collapse:collapse}
th{text-align:left;font-weight:600;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};padding:8px 10px;border-bottom:1px solid ${LINE}}
td{padding:8px 10px;border-bottom:1px solid ${LINE};vertical-align:top}
</style>
<style data-omnide-v3>@font-face{font-family:'Geist';src:url(./fonts/Geist-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}@font-face{font-family:'Geist Mono';src:url(./fonts/GeistMono-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}</style></helmet>
<div data-page="v3" data-created="${TODAY}" data-updated="${TODAY}" data-status="current" data-section="${section}" ${attrs} style="position:relative;width:${w}px;min-height:${h}px;box-sizing:border-box;padding:40px 48px;background:${K.bg1};color:${K.fg1};font-family:${FONT};font-size:14px;line-height:1.5">
<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">${kicker} · v3 · ${TODAY} · updated ${TODAY}</div><h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">${title}</h1>${intro ? p(intro) : ""}${body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
  writeFileSync(DIR + file + ".dc.html", html);
  return { file: file + ".dc.html", w, h };
}

// ---- diagrams: absolutely placed nodes + one svg per arrow ----
let mid = 0;
export function diagram(h, parts) {
  return `<div style="position:relative;height:${h}px;margin:8px 0 0;background:${K.bg0};border:1px solid ${LINE};border-radius:8px;overflow:hidden">${parts.join("")}</div>`;
}
export const node = (id, x, y, w, h, label, sub = "", o = {}) => {
  const c = o.edge ? K.bad : o.locked ? K.fg4 : o.acc ? K.link : K.fg2;
  const fill = o.acc ? K.bg3 : K.bg2;
  return `<div data-node="${id}" ${o.edge ? "data-edge" : ""} style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;padding:8px 10px;background:${fill};border:1px ${o.locked ? "dashed" : "solid"} ${o.edge ? K.bad : o.acc ? K.acc : LINE2};border-radius:8px;color:${c};font-size:12px;line-height:1.35;overflow:hidden"><span style="display:block;font-weight:600;font-size:13px;color:${o.edge ? K.bad : o.locked ? K.fg4 : K.fg1}">${label}</span>${sub ? `<span style="display:block;color:${o.edge ? K.bad : MUTED}">${sub}</span>` : ""}</div>`;
};
export function arrow(label, x1, y1, x2, y2, o = {}) {
  const id = `m${++mid}`, col = o.bad ? K.bad : o.dim ? K.fg4 : K.link;
  const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2 - 5;
  const cap = o.text ?? "";
  return `<svg role="img" aria-label="${esc(label)}" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none"><defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${col}"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.5" ${o.dash ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#${id})"/>${cap ? `<text x="${o.tx ?? lx}" y="${o.ty ?? ly}" text-anchor="${o.anchor || "middle"}" font-size="11" fill="${col}" font-family="${FONT}">${esc(cap)}</text>` : ""}</svg>`;
}
export const note = (x, y, w, text) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;font-size:11px;color:${MUTED}">${text}</div>`;
export const legend = (items) => `<p style="margin:10px 0 0;font-size:12px;color:${MUTED}">Legend: ${items.join(" · ")}</p>`;

// sequence diagram: lifelines + numbered messages [from,to,text,{bad,dash}]
export function sequence(parts, msgs, { w = 1144, top = 70, gap = 34, noteCol = true } = {}) {
  const n = parts.length, colw = w / n, xs = parts.map((_, i) => Math.round(colw * i + colw / 2));
  const H = top + msgs.length * gap + 30;
  const out = [];
  parts.forEach(([id, label, sub], i) => {
    out.push(node(id, xs[i] - 78, 10, 156, 46, label, sub, { acc: i === 1 }));
    out.push(`<svg role="img" aria-label="Lifeline of ${esc(label)}" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><line x1="${xs[i]}" y1="58" x2="${xs[i]}" y2="${H - 14}" stroke="${K.fg4}" stroke-width="1" stroke-dasharray="3 4"/></svg>`);
  });
  const idx = Object.fromEntries(parts.map((q, i) => [q[0], i]));
  msgs.forEach(([a, b, t, o = {}], k) => {
    const y = top + k * gap, x1 = xs[idx[a]], x2 = xs[idx[b]];
    if (a === b) {
      out.push(`<svg role="img" aria-label="${esc(`${parts[idx[a]][1]} to itself: ${t}`)}" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none"><path d="M${x1} ${y - 8}h26v14h-26" fill="none" stroke="${K.link}" stroke-width="1.5"/><text x="${x1 + 32}" y="${y + 1}" font-size="11" fill="${K.fg2}" font-family="${FONT}">${k + 1}. ${esc(t)}</text></svg>`);
    } else {
      const lo = Math.min(x1, x2);
      out.push(arrow(`${parts[idx[a]][1]} to ${parts[idx[b]][1]}: ${t}`, x1, y, x2, y, { bad: o.bad, dash: o.dash, text: `${k + 1}. ${t}`, tx: lo + 8, ty: y - 6, anchor: "start" }));
    }
  });
  return diagram(H, out);
}
