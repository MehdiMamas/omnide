// helpers for the v7 build (balanced-tag scan over serialized app DOM)
export const VOID = new Set(['br','img','input','hr','meta','link','path','circle','rect','line','stop','use','source']);
const TAGG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
// every element as {s,e,name,open}: single pass with a stack
export function elements(s) {
  const out = []; const st = []; TAGG.lastIndex = 0; let m;
  while ((m = TAGG.exec(s))) {
    const [all, close, name, rest] = m;
    if (!close && (VOID.has(name) || rest.endsWith('/'))) { out.push({ s: m.index, e: m.index + all.length, name, open: all }); continue; }
    if (!close) st.push({ s: m.index, name, open: all, oe: m.index + all.length });
    else { for (let i = st.length - 1; i >= 0; i--) if (st[i].name === name) { const o = st.splice(i)[0]; out.push({ s: o.s, e: m.index + all.length, name, open: o.open }); break; } }
  }
  return out;
}
// smallest element (by name) containing index `idx` and also containing index `idx2`
export function enclosing(s, idx, idx2, name = 'div') {
  const els = elements(s).filter(x => x.name === name && x.s < idx && x.e > Math.max(idx, idx2 ?? idx));
  els.sort((a, b) => (a.e - a.s) - (b.e - b.s)); return els[0];
}
export const once = (s, a, b, what) => {
  const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${what || a.slice(0, 40)}: expected 1 match, got ${n}`);
  return s.replace(a, () => b);
};
