import fs from 'node:fs';
const P = 'project/';
let n = 0;
for (const f of fs.readdirSync(P)) {
  if (!/^v6-.*\.dc\.html$/.test(f)) continue;
  let s = fs.readFileSync(P + f, 'utf8'); const o = s;
  if (/<div data-superseded-by="v6"/.test(s)) {
    s = s.replace(/<div data-superseded-by="v6"([^>]*?) data-status="current"([^>]*)>/, (m, a, b) => `<div data-superseded-by="v7"${a} data-status="superseded" data-was="current"${b}><a href="v7-Main.dc.html" style="position:absolute;right:8px;top:8px;z-index:99999;padding:3px 8px;border-radius:4px;background:#1A1823;border:1px solid rgba(244, 242, 251, 0.5);color:#B69CFF;font:600 11px/1.4 'Geist',system-ui,sans-serif;text-decoration:none">Superseded by v7</a>`);
  } else if (!s.includes('data-superseded-by="v7"')) {
    s = s.replace(/<div data-page="(v[56])"([^>]*?) data-status="([a-z-]+)"([^>]*)>/, (m, pg, a, st, b) => `<div data-superseded-by="v7" data-page="${pg}"${a} data-status="superseded" data-was="${st}"${b}><a href="v7-Main.dc.html" style="position:absolute;right:8px;top:8px;z-index:99999;padding:3px 8px;border-radius:4px;background:#1A1823;border:1px solid rgba(244, 242, 251, 0.5);color:#B69CFF;font:600 11px/1.4 'Geist',system-ui,sans-serif;text-decoration:none">Superseded by v7</a>`);
  }
  if (s !== o) { fs.writeFileSync(P + f, s); n++; }
}
console.log('changed', n);
