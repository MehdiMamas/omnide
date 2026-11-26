// v5 build: copy v4 boards to v5-*, apply only the issue #10 table rows. Run: node v5-build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = path.join(HERE, 'project');
const rd = (f) => fs.readFileSync(path.join(P, f), 'utf8');

// ---------- balanced-tag helpers ----------
const VOID = new Set(['br','img','input','hr','meta','link','path','circle','rect','line','stop','use','source']);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/y;
const TAGG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
function span(s, start) {
  TAG.lastIndex = start; const m0 = TAG.exec(s); const name = m0[2]; let depth = 0;
  TAGG.lastIndex = start; let m;
  while ((m = TAGG.exec(s))) {
    if (m[2] !== name) continue;
    if (m[3].endsWith('/')) { if (depth === 0) return m.index + m[0].length; continue; }
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  throw new Error('unbalanced');
}
function children(s, start, end) {
  TAG.lastIndex = start; let i = TAG.exec(s)[0].length + start; const close = s.lastIndexOf('</', end); const out = [];
  while (i < close) {
    TAGG.lastIndex = i; const m = TAGG.exec(s); if (!m || m.index >= close) break;
    if (m[1] || VOID.has(m[2]) || m[3].endsWith('/')) { i = m.index + m[0].length; continue; }
    const e = span(s, m.index); out.push([m.index, e]); i = e;
  }
  return out;
}
const openStart = (s, idx) => s.lastIndexOf('<', idx);
function once(s, a, b, what) {
  const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${what}: expected 1 match, got ${n}`);
  return s.replace(a, () => b);
}

// ---------- title-bar chip (the Claude label) ----------
const CHIP_KEEP = new Set(['ide-01-onboarding-login','ob-01-welcome','light-21-ob-01','omni-claude-missing','st-01-signed-out-composer']);
function dropChip(s) {
  const i = s.indexOf('class="titlebar-text-link omn-claude-chip"'); if (i < 0) return s;
  const d = openStart(s, i); const li = s.lastIndexOf('<li class="action-item"', d);
  const e = span(s, li); s = s.slice(0, li) + s.slice(e);
  // overlay link that sat over the chip
  s = s.replace(/<a [^>]*aria-label="Open Claude usage on claude\.ai"[^>]*style="position:absolute;left:\d+px;top:[0-3]px;[^"]*"[^>]*><\/a>/g, '');
  return s;
}


// ---------- header label ("Claude connected" / "Connect Claude" under the OmnIDE logo), issue #10 decision ----------
// Kept only on the signed-out boards. Palette rows, settings rows and buttons named "Connect Claude" are content, not the label.
const LABEL_KEEP = new Set([...CHIP_KEEP, 'omni-claude-signed-out', 'omni-claude-not-installed', 'omni-claude-api-key', 'omni-claude-error']);
const LABEL_CONNECTED = /<div class="flex flex-row gap-1\.5 items-center text-description-foreground"><span class="w-0\.5 h-0\.5 rounded-full bg-description-foreground inline-block"><\/span><span class="text-xs text-text-link-foreground font-light hover:underline cursor-pointer opacity-80">Claude connected<\/span><\/div>/g;
const LABEL_CONNECT = /<div class="text-xs text-text-link-foreground font-light hover:underline cursor-pointer opacity-80 text-description-foreground translate-x-\[34px\]">Connect Claude<\/div>/g;
const LABEL_OVERLAY = /<a href="v[45]-omni-claude-signed-out\.dc\.html" aria-label="Open Connect Claude" style="position:absolute;left:8\d\d+px;top:(279|339)px;[^"]*"[^>]*><\/a>\s?/g;
function dropLabel(s) { return s.replace(LABEL_CONNECTED, '').replace(LABEL_CONNECT, '').replace(LABEL_OVERLAY, ''); }

// ---------- model picker popover ----------
const ACC = '#6d28d9';
const chk = '<span style="width:16px;display:inline-flex;justify-content:center"><i class="codicon codicon-check" style="font-size:14px"></i></span>';
const sp = '<span style="width:16px"></span>';
const item = (t, on, extra = '') => `<div role="menuitemradio" aria-checked="${on}" style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;font-size:13px;line-height:18px;${on ? 'background:color-mix(in srgb,currentColor 9%,transparent)' : ''}">${on ? chk : sp}<span style="flex:1">${t}</span>${extra}</div>`;
const tog = (t, on) => `<div role="switch" aria-checked="${on}" style="display:flex;align-items:center;gap:6px;padding:5px 8px;font-size:13px;line-height:18px"><span style="flex:1;padding-left:22px">${t}</span><span style="width:28px;height:16px;border-radius:8px;background:${on ? ACC : 'color-mix(in srgb,currentColor 25%,transparent)'};position:relative;display:inline-block"><span style="position:absolute;top:2px;left:${on ? 14 : 2}px;width:12px;height:12px;border-radius:6px;background:#fff"></span></span></div>`;
const hr = '<div role="separator" style="height:1px;margin:4px 0;background:color-mix(in srgb,currentColor 14%,transparent)"></div>';
const lab = (t) => `<div style="padding:4px 8px 2px 30px;font-size:11px;line-height:16px;opacity:.7">${t}</div>`;
const effort = (v) => `<div role="radiogroup" aria-label="Effort" style="display:flex;gap:4px;padding:2px 8px 4px 30px">${['Low','Medium','High','Max'].map((t) => `<span role="radio" aria-checked="${t === v}" style="flex:1;text-align:center;padding:3px 0;border-radius:6px;font-size:12px;line-height:16px;${t === v ? `background:${ACC};color:#fff` : 'background:color-mix(in srgb,currentColor 9%,transparent)'}">${t}</span>`).join('')}</div>`;
const pickerBody = `<div data-component="popover-body" role="menu" aria-label="Model" style="display:flex;flex-direction:column;width:240px">${item('Opus 5.5', false)}${item('Sonnet 5.5', true)}${item('Haiku 5.5', false)}${item('Fable 5.2', false)}${hr}${lab('Effort')}${effort('High')}${hr}${tog('Fast mode', false)}${tog('1M context', false)}</div>`;
function pickerPopover(s, { y, side }) {
  const t = s.search(/<h2 [^>]*data-component="popover-title"/); const bd = s.lastIndexOf('<div data-component="popover-body"', t);
  const e = span(s, bd); s = s.slice(0, bd) + pickerBody + s.slice(e);
  // popup padding stays 12px (existing); keep it tight like a menu
  s = s.replace(/(data-component="popover-popup" data-surface-name="locked-model-picker")/, '$1');
  if (y != null) s = s.replace(/transform: translate\((\d+)px, \d+px\);/, (m, x) => `transform: translate(${x}px, ${y}px);`);
  if (side) s = s.replace('data-side="top"', `data-side="${side}"`);
  return s;
}

const edits = {};
edits['ai-02-model-popover'] = (s) => {
  s = once(s, 'ui-fo6hhr">Default</p>', 'ui-fo6hhr">Sonnet 5.5</p>', 'ai-02 label');
  return pickerPopover(s, { y: 221, side: 'bottom' });
};
edits['chat-model-menu'] = (s) => {
  s = once(s, 'ui-fo6hhr">Default</p>', 'ui-fo6hhr">Sonnet 5.5</p>', 'menu label');
  return pickerPopover(s, { y: 213, side: 'bottom' });
};
edits['light-09-model-picker'] = (s) => pickerPopover(s, { y: 731 + 116 - 262, side: 'top' });


// ---------- Settings > Models pane ----------
const OFFSW = (() => { const f = rd('v4-btn-agents-allowlist-options.dc.html'); const m = /<span data-unchecked="" role="switch"[^>]*aria-checked="false"/.exec(f); return f.slice(m.index, span(f, m.index)); })();
const m1 = rd('v4-set-models-1.dc.html');
const HAIKU = (() => { const i = m1.indexOf('>Haiku 5.5</p>'); const st = m1.lastIndexOf('<div data-settings-model-item=""', i); return m1.slice(st, span(m1, st)); })();
const SELECT_BTN = (() => { const f = m1; const i = f.indexOf('aria-label="Coordinator effort" data-ui-focus-ring'); const st = f.lastIndexOf('<button', i); const e = span(f, st); const hid = f.indexOf('<input', e); return { html: f.slice(st, e), hid: f.slice(hid, f.indexOf('>', hid) + 1) }; })();
let uid = 0;
function uniq(h) { uid++; return h.replace(/base-ui-_r_([a-z0-9]+)_/g, (m, a) => `base-ui-_r_${a}x${uid}_`); }
function toggleRow(title, on) {
  let h = HAIKU.replace('>Haiku 5.5</p>', `>${title}</p>`).replace('aria-label="Haiku 5.5 enabled"', `aria-label="${title} enabled"`);
  if (!on) {
    const i = h.indexOf('<span data-checked="" role="switch"'); const e = span(h, i);
    h = h.slice(0, i) + OFFSW.replace('aria-checked="false"', `aria-checked="false" aria-label="${title} enabled"`) + h.slice(e);
    h = h.replace(' checked=""', '');
  }
  return uniq(h);
}
function selectRow(title, value) {
  let h = HAIKU.replace('>Haiku 5.5</p>', `>${title}</p>`);
  const c = h.indexOf('data-component="settings-row-control"'); const cs = h.lastIndexOf('<div', c); const ce = span(h, cs);
  const btn = SELECT_BTN.html.replace(/aria-label="Coordinator effort"/, `aria-label="${title}"`).replace('<span>Low</span>', `<span>${value}</span>`);
  const ctl = h.slice(cs, h.indexOf('>', cs) + 1) + `<div class="glass-78zum5 glass-6s0dn4 glass-167g77z glass-1ldx8e">${btn}${SELECT_BTN.hid.replace('value="low"', `value="${value.toLowerCase()}"`)}</div></div>`;
  h = h.slice(0, cs) + ctl + h.slice(ce);
  return uniq(h);
}
function modelsPane(s) {
  const k = s.indexOf('cursor-settings-pane-content-inner'); const ps = openStart(s, k); const pe = span(s, ps);
  let ch = children(s, ps, pe); while (ch.length === 1) ch = children(s, ch[0][0], ch[0][1]); const w = ch[1];
  if (s.indexOf('aria-label="Task Models"', w[0]) < 0) throw new Error('no Task Models');
  const fs0 = s.indexOf('<fieldset', w[0]); const fsOpen = s.slice(fs0, s.indexOf('>', fs0) + 1);
  const sec = s.lastIndexOf('<section', fs0);
  const secHead = s.slice(sec, fs0);
  const rows = [toggleRow('Opus 5.5', true), toggleRow('Sonnet 5.5', true), toggleRow('Haiku 5.5', true), toggleRow('Fable 5.2', true), selectRow('Default model', 'Sonnet 5.5'), selectRow('Default effort', 'High'), toggleRow('Fast mode', false), toggleRow('1M context', false)].join('');
  const wOpen = s.slice(w[0], s.indexOf('>', w[0]) + 1);
  return s.slice(0, w[0]) + wOpen + secHead + fsOpen + rows + '</fieldset></div></div></section></div>' + s.slice(w[1]);
}
for (const n of ['ide-34-settings-models', 'set-models-1', 'set-models-2', 'dd-models-default', 'dd-models-coordinator-effort']) edits[n] = (s) => modelsPane(s);

function dropdown(s, marker, items, sel, w, bx, by) {
  const i = s.indexOf(marker); if (i < 0) throw new Error('dropdown marker ' + marker);
  let pos = s.lastIndexOf('-positioner"', i + marker.length); pos = openStart(s, s.lastIndexOf('<div', pos)); const pe = span(s, pos);
  const ch = children(s, pos, pe); const pop = ch.find((c) => s.startsWith('<div', c[0]));
  const list = items.map((t) => `<div role="option" aria-selected="${t === sel}" style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;font-size:13px;line-height:18px;${t === sel ? 'background:color-mix(in srgb,currentColor 9%,transparent)' : ''}">${t === sel ? chk : sp}<span style="flex:1">${t}</span></div>`).join('');
  const box = `<div role="listbox" data-component="select-popup" style="width:${w}px;padding:4px;border-radius:12px;background:rgb(26,24,35);color:rgb(244,242,251);font:13px/18px Geist,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)">${list}</div>`;
  let out = s.slice(0, pop[0]) + box + s.slice(pop[1]);
  const ps = out.slice(pos, out.indexOf('>', pos) + 1).replace(/transform: translate\([^)]*\)/, `transform: translate(${bx - w}px, ${by}px)`);
  return out.slice(0, pos) + ps + out.slice(out.indexOf('>', pos) + 1);
}
edits['dd-models-default'] = (s) => dropdown(modelsPane(s), 'data-component="search-menu-positioner"', ['Opus 5.5', 'Sonnet 5.5', 'Haiku 5.5', 'Fable 5.2'], 'Sonnet 5.5', 180, 1058, 401);
edits['dd-models-coordinator-effort'] = (s) => dropdown(modelsPane(s), '>Medium<', ['Low', 'Medium', 'High', 'Max'], 'High', 120, 1058, 453);

// ---------- auth boards ----------
const T = (a, b, w) => (s) => once(s, a, b, w);
const chain = (...f) => (s) => f.reduce((x, g) => g(x), s);
edits['set-claude-1'] = chain(
  T("Claude subscription through Claude Code's own sign-in", 'Your own Claude Code sign-in; OmnIDE never sees your credentials', 'sc1a'),
  T('Found on PATH', 'Your installed claude, run through CLAUDE_CODE_EXECUTABLE', 'sc1b'),
  T('>Default (Claude Code)<', '>Sonnet 5.5<', 'sc1c'),
);
edits['omni-claude-signed-out'] = chain(
  T('Choose how OmnIDE reaches Claude', 'Your own Claude Code sign-in', 'so1'),
  T('Subscription sign-in is handled by Claude Code in your browser.', 'Sign-in runs in your own Claude (claude /login in a terminal OmnIDE opens); OmnIDE never sees or stores those credentials. An API key is optional, for users without a plan.', 'so5'),
  T('Found on PATH', 'Your installed claude, run through CLAUDE_CODE_EXECUTABLE', 'so2'),
  T('>Sign in with Claude<', '>Sign in in a terminal (claude /login)<', 'so3'),
  T('Use an Anthropic API key', 'Use an API key instead (optional)', 'so4'),
);
edits['agent-Component'] = chain(
  T('Pinned adapter, npm @agentclientprotocol/claude-agent-acp 0.112.0', 'Pinned adapter, npm @agentclientprotocol/claude-agent-acp 0.112.0, started with CLAUDE_CODE_EXECUTABLE set to the user&#x27;s own installed claude', 'ac1'),
  T("Sign-in is Claude Code's own: the adapter offers terminal auth methods (claude-ai-login, claude-login, console-login). An Anthropic API key is stored in VS Code SecretStorage. OmnIDE has no account.", "Sign-in is Claude's own: OmnIDE opens a terminal running claude /login. OmnIDE never sees or stores Claude credentials and has no account. No CLI is bundled; it runs the user's installed claude. An API key is optional, for users without a plan, and is kept in VS Code SecretStorage.", 'ac2'),
);
edits['agent-Mapping'] = chain(
  T('initialize authMethods, authenticate; API key in SecretStorage; adapter and CLI versions from the process', 'terminal opened by OmnIDE running claude /login (Claude holds the credentials, OmnIDE never sees them); optional API key in SecretStorage; adapter and installed claude versions from the process', 'am1'),
  T('Names: Default (Claude Code), Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2', 'Names: Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2', 'am2'),
);
edits['agent-Registry'] = T('command: node, claude-agent-acp pinned in the app. roadmap: false', 'command: node, claude-agent-acp pinned in the app, with CLAUDE_CODE_EXECUTABLE set to the user&#x27;s installed claude (no bundled CLI). roadmap: false', 'ar1');

// ---------- main ----------
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--labels') {
  // in place on the current v5 boards (keeps later edits); idempotent
  let n = 0;
  for (const f of fs.readdirSync(P).filter((f) => /^v5-.*\.dc\.html$/.test(f))) {
    if (LABEL_KEEP.has(f.replace(/^v5-/, '').replace(/\.dc\.html$/, ''))) continue;
    const s = rd(f), t = dropLabel(s);
    if (s !== t) { fs.writeFileSync(path.join(P, f), t); n++; }
  }
  console.log('labels removed on', n, 'boards');
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const canvas = JSON.parse(rd('canvas.json'));
  const stems = canvas.order.filter((k) => k.startsWith('v4-')).map((k) => k.replace(/^v4-/, '').replace(/\.dc\.html$/, ''));
  const applied = {};
  for (const stem of stems) {
    let s = rd(`v4-${stem}.dc.html`);
    // v5-finish.mjs marks v4 superseded; undo that so the v5 copy is of the original v4 board
    s = s.replace(/<a href="v5-Main\.dc\.html" style="position:absolute;right:8px;top:8px;z-index:99999[^>]*>Superseded by v5<\/a>/, '').replace('<div data-superseded-by="v5" data-page="v4"', '<div data-page="v4"').replace(/data-status="superseded" data-was="([a-z-]+)"/, 'data-status="$1"');
    const log = [];
    if (!CHIP_KEEP.has(stem) && s.includes('omn-claude-chip')) { const b = s; s = dropChip(s); if (b !== s) log.push('chip'); }
    if (!LABEL_KEEP.has(stem)) { const b = s; s = dropLabel(s); if (b !== s) log.push('label'); }
    if (edits[stem]) { s = edits[stem](s); log.push('row'); }
    s = s.replace(/\bv4-/g, 'v5-');
    s = s.replace(/data-page="v4"/g, 'data-page="v5"');
    fs.writeFileSync(path.join(P, `v5-${stem}.dc.html`), s);
    applied[stem] = log;
  }
  fs.writeFileSync(path.join(HERE, 'v5-applied.json'), JSON.stringify(applied, null, 1));
  console.log('boards', stems.length, 'chip', Object.values(applied).filter((l) => l.includes('chip')).length, 'rows', Object.values(applied).filter((l) => l.includes('row')).length);
}
