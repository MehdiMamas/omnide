// Regenerates the "Values" appendix board from the repo files, so literal values are never hand-copied.
// Run: node docs/blueprint2/v5-values.mjs   (from the repo root; idempotent)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const proj = path.join(here, 'project');
const FILE = 'v5-ref-Values.dc.html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const overrides = JSON.parse(rd('product.overrides.json'));
const fonts = rd('patches/0006-brand-fonts.patch').split('\n')
  .filter((l) => l.startsWith('+') && /font-family:|--monaco-monospace-font/.test(l) && !l.includes('@font-face'))
  .map((l) => l.slice(1).match(/^(.+?)\s*\{\s*(.+?);?\s*\}\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]);
const themes = ['dark', 'light'].map((n) => JSON.parse(rd(`src/omnide/theme/omnide-${n}.json`)));
const keys = Object.keys(themes[0].colors);

const th = (cs) => '<thead><tr>' + cs.map((c, i) => `<th${i === 0 ? ' style="width:300px"' : ''}>${c}</th>`).join('') + '</tr></thead>';
const mono = "font-family:'Geist Mono',ui-monospace,Consolas,monospace;font-size:12px";
const code = (s) => `<code style="${mono};overflow-wrap:anywhere">${esc(s)}</code>`;
const sw = (c) => `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(244, 242, 251, 0.3);background:${esc(c)};vertical-align:-2px;margin-right:6px"></span>`;
const h2 = (t) => `<h2 style="margin:22px 0 8px;font-size:18px;font-weight:600">${t}</h2>`;

const body =
  `<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(244, 242, 251, 0.74)">Appendix · values · v5 · 2026-11-26 · updated 2026-11-26</div>` +
  `<h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">Values: product, fonts, colours</h1>` +
  `<p style="margin:0 0 6px;max-width:1080px;color:rgba(244, 242, 251, 0.74)">Written by docs/blueprint2/v5-values.mjs from the repo files. Never edited by hand: run <code style="${mono}">node docs/blueprint2/v5-values.mjs</code> after any of the three files changes.</p>` +
  h2(`product.overrides.json (${Object.keys(overrides).length} keys)`) +
  `<table style="width:100%;font-size:13px">${th(['Key', 'Value'])}<tbody>` +
  Object.entries(overrides).map(([k, v]) => `<tr><td>${code(k)}</td><td>${code(JSON.stringify(v))}</td></tr>`).join('') + '</tbody></table>' +
  h2('Font stacks (patches/0006-brand-fonts.patch)') +
  `<table style="width:100%;font-size:13px">${th(['Selector', 'Declaration'])}<tbody>` +
  fonts.map(([s, d]) => `<tr><td>${code(s)}</td><td>${code(d)}</td></tr>`).join('') + '</tbody></table>' +
  h2('Theme colours (src/omnide/theme/omnide-dark.json and omnide-light.json)') +
  `<table style="width:100%;font-size:13px">${th(['Colour key', themes[0].name, themes[1].name])}<tbody>` +
  keys.map((k) => `<tr><td>${code(k)}</td>` + themes.map((t) => `<td>${sw(t.colors[k])}${code(t.colors[k])}</td>`).join('') + '</tr>').join('') + '</tbody></table>' +
  `<p style="margin:14px 0 0;font-size:11px;color:rgba(244, 242, 251, 0.74)">Source: product.overrides.json; patches/0006-brand-fonts.patch; src/omnide/theme/omnide-dark.json and omnide-light.json, read at generation time</p>`;

const tpl = fs.readFileSync(path.join(proj, 'v5-ref-Roadmap.dc.html'), 'utf8');
const a = tpl.indexOf('<div style="font-size:11px;letter-spacing');
const b = tpl.indexOf('</div>\n</x-dc>');
let html = (tpl.slice(0, a) + body + tpl.slice(b)).replace('<title>Roadmap order</title>', '<title>Values</title>');

// board height = scrollHeight + 30, measured in headless Chrome (falls back to the old height)
const canvasPath = path.join(proj, 'canvas.json');
const canvas = JSON.parse(fs.readFileSync(canvasPath, 'utf8'));
let h = canvas.boards[FILE]?.h ?? 2000;
try {
  const tmp = path.join(proj, '.measure-values.html');
  fs.writeFileSync(tmp, html.replace('min-height:700px', 'min-height:0').replace('</body>', '<script>addEventListener("load",()=>{document.title="H"+document.body.scrollHeight})</script></body>'));
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1240,900', '--virtual-time-budget=3000', '--dump-dom', 'file://' + tmp], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  fs.unlinkSync(tmp);
  const m = dom.match(/<title>H(\d+)<\/title>/);
  if (m) h = +m[1] + 30;
} catch { /* keep h */ }
html = html.replace(/"height":\d+/, `"height":${h}`);
fs.writeFileSync(path.join(proj, FILE), html);

// register in canvas.json (first free slot on the reference rows) and link from the cover
if (!canvas.boards[FILE]) {
  const free = (x, y) => !Object.values(canvas.boards).some((q) => x < q.x + q.w && x + 1240 > q.x && y < q.y + q.h && y + h > q.y);
  let pos;
  for (let y = 56900; !pos; y += 3000) for (let x = 5200; x <= 13000 && !pos; x += 1300) if (free(x, y)) pos = [x, y];
  canvas.boards[FILE] = { x: pos[0], y: pos[1], w: 1240, h, page: 'v5', title: 'Values', is_interactive: false };
  canvas.order.push(FILE);
} else canvas.boards[FILE].h = h;
fs.writeFileSync(canvasPath, JSON.stringify(canvas, null, 2).replace(/[\u0080-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) + '\n');

const mainPath = path.join(proj, 'v5-Main.dc.html');
let main = fs.readFileSync(mainPath, 'utf8');
if (!main.includes(FILE)) {
  const anchor = '<a href="v5-ref-Scope.dc.html">Reference: Scope: what this canvas owns</a></div>';
  if (!main.includes(anchor)) throw new Error('cover anchor missing');
  const card = '<div style="background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:8px;padding:14px 16px;padding:8px 12px">';
  main = main.replace(anchor, anchor + card + `<a href="${FILE}">Reference: Values (generated from the repo files)</a></div>`);
  fs.writeFileSync(mainPath, main);
}
console.log(FILE, 'h =', h, 'overrides', Object.keys(overrides).length, 'fonts', fonts.length, 'colours', keys.length);
