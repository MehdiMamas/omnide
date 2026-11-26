import fs from 'node:fs';
const P='project/';
let n=0,h=0;
for(const f of fs.readdirSync(P)){
  if(!/^v[45]-.*\.dc\.html$/.test(f))continue;
  let s=fs.readFileSync(P+f,'utf8'),o=s;
  s=s.replace(/ data-section="(deploy|screens)"/,()=>{h++;return ''});
  if(f.startsWith('v5-')&&!s.includes('data-superseded-by="v6"')){
    s=s.replace(/<div data-page="v5"([^>]*?) data-status="([a-z-]+)"([^>]*)>/,(m,a,st,b)=>`<div data-superseded-by="v6" data-page="v5"${a} data-status="superseded" data-was="${st}"${b}><a href="v6-Main.dc.html" style="position:absolute;right:8px;top:8px;z-index:99999;padding:3px 8px;border-radius:4px;background:#1A1823;border:1px solid rgba(244, 242, 251, 0.5);color:#B69CFF;font:600 11px/1.4 'Geist',system-ui,sans-serif;text-decoration:none">Superseded by v6</a>`);
  }
  if(s!==o){fs.writeFileSync(P+f,s);n++}
}
console.log('changed',n,'hints',h);
