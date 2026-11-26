// v7 To-be screens: copy-and-patch of v5 boards (permissions, issue #19). Run via v7-build.mjs
import fs from 'node:fs';
import { elements, once } from './v7-lib.mjs';
const P = new URL('./project/', import.meta.url).pathname;
const D = '2026-11-26';
const rd = (f) => fs.readFileSync(P + f, 'utf8');
const A = (href, label, l, t, w, h, extra = '') => `<a href="${href}" aria-label="${label}" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;z-index:2147483647;display:block;${extra}"></a>`;
const FONT = "font:12px/1.4 'Geist','Segoe UI',system-ui,sans-serif";

function strip(s) { // v5 overlay anchors out
  return s.replace(/<a href="v5-[^"]*"[^>]*style="position:absolute[^>]*><\/a>\s*/g, '');
}
function root(s, screen, state) {
  return s.replace(/<div (?:data-superseded-by="v6" )?data-page="v5" data-screen="[^"]*" data-state="[^"]*" data-created="[^"]*" data-updated="[^"]*" data-status="[^"]*"(?: data-was="[^"]*")?([^>]*)>(?:<a href="v6-Main\.dc\.html"[^>]*>Superseded by v6<\/a>)?/,
    `<div data-page="v7" data-screen="${screen}" data-state="${state}" data-created="${D}" data-updated="${D}" data-status="in-progress"$1>`);
}
function addOverlay(s, html) { // before the root's closing tag
  const k = s.lastIndexOf('</div>', s.lastIndexOf('</x-dc>'));
  return s.slice(0, k) + html + '\n' + s.slice(k);
}
function bar(s, mode, run) {
  s = s.replaceAll('Sonnet 5.5 · Manual · 12%', `Sonnet 5.5 · ${mode} · ${run} · 12%`);
  return s.replaceAll('Sonnet 5.5, Manual mode', `Sonnet 5.5, ${mode} mode, ${run}`);
}
const mk = (b, screen, state) => root(strip(rd(b)), screen, state);

// ---- chat frames (base: v5-ai-01-agent-mode-picker, popup removed) ----
const NEXT = { Agent: ['Plan', 'v7-chat-plan.dc.html'], Plan: ['Ask', 'v7-chat-ask.dc.html'], Ask: ['Agent', 'v7-chat-agent.dc.html'] };
const PH = { Agent: 'Ask Claude, / for commands, @ for context', Plan: 'Describe what to plan, / for commands, @ for context', Ask: 'Ask about your code, / for commands, @ for context' };
function pill(mode) {
  const [n, href] = NEXT[mode];
  return `<a href="${href}" aria-label="Shift+Tab: switch to ${n}" style="position:absolute;left:1082px;top:230px;width:128px;height:24px;box-sizing:border-box;z-index:2147483647;display:flex;align-items:center;justify-content:center;gap:4px;border-radius:999px;border:1px solid rgba(244,242,251,.12);background:#14121B;color:#8E89A3;text-decoration:none;${FONT}">Try ${n} <span style="border:1px solid rgba(244,242,251,.2);border-radius:3px;padding:0 3px;font-size:10px">⇧ Tab</span></a>`;
}
const AI01 = 'v5-ai-01-agent-mode-picker.dc.html';
function popupPortal(s) {
  const pi = s.indexOf('role="menu"');
  return elements(s).filter((x) => x.name === 'div' && x.s < pi && x.e > pi).sort((x, y) => (y.e - y.s) - (x.e - x.s))
    .find((x) => x.e - x.s < 40000 && x.e - x.s > 3000 && !x.open.includes('data-page') && !x.open.includes('role="application"'));
}
function bareChat(screen, state) {
  let s = mk(AI01, screen, state);
  const pop = elements(s).filter((x) => x.name === 'div' && x.open.includes('role="menu"'))[0];
  // the popover wrapper is the div that directly holds the role=menu div
  const wrap = elements(s).filter((x) => x.name === 'div' && x.s < pop.s && x.e > pop.e).sort((a, b) => (a.e - a.s) - (b.e - b.s))[0];
  return { s, pop, wrap };
}
function chat(mode, state, extra = '', run = 'Auto-review') {
  let { s, wrap } = bareChat('OmnIDE Chat', state);
  s = s.slice(0, wrap.s) + s.slice(wrap.e);
  s = s.replace(/(<p[^>]*>)Sonnet 5\.5(<\/p>)/, `$1${mode} · Sonnet 5.5$2`);
  s = s.replaceAll(PH.Agent, PH[mode]);
  s = bar(s, mode, mode === 'Agent' ? run : mode === 'Ask' ? 'No edits' : 'read-only');
  return addOverlay(s, A('v7-chat-picker.dc.html', 'Open mode picker', 955, 193, 44, 20) + A('v7-set-runmode.dc.html', 'Open OmnIDE Settings', 1272, 6, 22, 22) + pill(mode) + extra);
}
function picker() {
  let { s, pop } = bareChat('OmnIDE Chat', 'mode picker open');
  const items = elements(s).filter((x) => x.name === 'div' && /^<div id="composer-mode-/.test(x.open) && x.s > pop.s && x.e < pop.e);
  const T = (i) => s.slice(items[i].s, items[i].e);
  const sel = T(0), uns = T(1);
  const mkItem = (tpl, id, icon, label, desc) => tpl.replace(/composer-mode-[a-z]+/, id).replace(/codicon-[a-z-]+ undefined/, `codicon-${icon} undefined`).replace(/(monaco-highlighted-label[^>]*>)[^<]*/, `$1${label}`).replace(/(opacity:\.6[^>]*>)[^<]*/, `$1${desc}`);
  const html = mkItem(sel, 'composer-mode-agent', 'rocket', 'Agent', 'Edits and runs tools; Run Mode sets approvals')
    + mkItem(uns, 'composer-mode-plan', 'checklist', 'Plan', 'Read-only; proposes a plan first')
    + mkItem(uns, 'composer-mode-ask', 'comment-discussion', 'Ask', 'Answers only; edits are denied');
  s = s.slice(0, items[0].s) + html + s.slice(items[items.length - 1].e);
  s = bar(s, 'Agent', 'Auto-review');
  return addOverlay(s, A('v7-chat-agent.dc.html', 'Pick Agent', 951, 219, 244, 37) + A('v7-chat-plan.dc.html', 'Pick Plan', 951, 258, 244, 37) + A('v7-chat-ask.dc.html', 'Pick Ask', 951, 297, 244, 37) + A('v7-chat-agent.dc.html', 'Close the picker', 300, 33, 620, 860));
}

// ---- inline approval card (base: v5-ai-14 streaming chat) ----
function card(state) {
  const base = `position:absolute;left:937px;top:352px;width:280px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:10px 12px;${FONT};`;
  const code = `<div style="margin:6px 0 8px;padding:6px 8px;background:#0E0C14;border-radius:5px;font:12px 'Geist Mono',ui-monospace,monospace;color:#F4F2FB;word-break:break-all">npm test</div>`;
  const head = (t, c = '#F4F2FB') => `<div style="font-weight:500;font-size:13px;color:${c}">${t}</div>`;
  const btn = (label, href, kind) => `<a href="${href}" aria-label="${label}" style="flex:${kind === 'p' ? '0 0 64px' : '1'};height:26px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:4px;text-decoration:none;${FONT};${kind === 'p' ? 'background:#6D28D9;color:#F4F2FB' : 'border:1px solid rgba(244,242,251,.18);color:#D2CFE0'}">${label}</a>`;
  if (state === 'pending') return `<div style="${base}height:112px">${head('Run this command?')}${code}<div style="display:flex;gap:6px">${btn('Run', 'v7-approval-ran.dc.html', 'p')}${btn('Skip', 'v7-approval-skipped.dc.html')}${btn('Always Run', 'v7-approval-always.dc.html')}</div></div>`;
  if (state === 'ran') return `<div style="${base}height:112px">${head('Ran', '#41CB7E')}${code}<div style="opacity:.8">Exit 0, 12 tests passed. Asked this time only.</div></div>`;
  if (state === 'skipped') return `<div style="${base}height:128px">${head('Skipped', '#D2CFE0')}${code}<div style="opacity:.8">Claude was told you skipped it and can try another way.</div></div>`;
  return `<div style="${base}height:150px">${head('Ran and added to the allowlist', '#41CB7E')}${code}<div style="opacity:.8">Saved as <span style="font:12px 'Geist Mono',monospace;color:#C4B5FD">Bash(npm test)</span> in this workspace's .claude/settings.local.json.</div><a href="v7-set-allowlist.dc.html" aria-label="Manage allowlist" style="display:inline-block;margin-top:6px;color:#B69CFF;text-decoration:none">Manage in Settings</a></div>`;
}
// a streaming-turn chat with an overlay panel; the base of every approval and Auto-review state frame
function turn(title, { user = 'Run the tests and fix any failure', then = 'Then summarise what changed', reply = 'On it. I will run the tests.', run = 'Allowlist', mode = 'Agent', thought = true, over = '' } = {}) {
  let s = mk('v5-ai-14-agent-turn-streaming.dc.html', 'OmnIDE Chat', title);
  s = s.replace('Reply with one word: hi', user).replace('Read src/version.ts then reply with', then);
  s = s.replace('>hi<', `>${reply}<`);
  if (thought) s = s.replace('>Thinking<', '>Thought 3s<');
  s = bar(s, mode, run);
  return addOverlay(s, over + A('v7-set-runmode.dc.html', 'Open OmnIDE Settings', 1272, 6, 22, 22));
}
function approval(state, title) {
  return turn(title, { thought: state !== 'pending', over: card(state) });
}
const PANEL = (h, inner, l = 934, w = 286) => `<div style="position:absolute;left:${l}px;top:352px;width:${w}px;height:${h}px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:10px 12px;${FONT}">${inner}</div>`;
const HEADT = (t, c = '#F4F2FB') => `<div style="font-weight:500;font-size:13px;color:${c}">${t}</div>`;
const CMD = (t) => `<div style="margin:6px 0 8px;padding:6px 8px;background:#0E0C14;border-radius:5px;font:12px 'Geist Mono',ui-monospace,monospace;color:#F4F2FB;word-break:break-all">${t}</div>`;
const BTN = (label, href, kind) => `<a href="${href}" aria-label="${label}" style="flex:${kind === 'p' ? '0 0 64px' : '1'};height:26px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:4px;text-decoration:none;${FONT};${kind === 'p' ? 'background:#6D28D9;color:#F4F2FB' : 'border:1px solid rgba(244,242,251,.18);color:#D2CFE0'}">${label}</a>`;
const ROW = (...b) => `<div style="display:flex;gap:6px">${b.join('')}</div>`;

// ---- settings (base: v5-dd-agents-auto-review) ----
const SET = 'v5-dd-agents-auto-review.dc.html';
function rowAround(s, text, needle) { // smallest div holding the label and the needle after it
  const a = s.indexOf(text); const b = s.indexOf(needle, a);
  const c = elements(s).filter((x) => x.name === 'div' && x.s < a && x.e > b).sort((x, y) => (x.e - x.s) - (y.e - y.s))[0];
  return c;
}
function settings(state, { run = 'Auto-review', desc, popover = false, extraRows = true, optionPatch } = {}) {
  let s = mk(SET, 'OmnIDE Settings · Agents', state);
  // drop popover portal when closed
  const pi = s.indexOf('>Run Everything<');
  const portal = elements(s).filter((x) => x.name === 'div' && x.s < pi && x.e > pi && x.open.includes('data-base-ui-portal')).sort((x, y) => (x.e - x.s) - (y.e - y.s))[0];
  if (!popover) s = s.slice(0, portal.s) + s.slice(portal.e);
  s = s.replace(/>Auto-Review</g, `>${run}<`).replace('>Auto-review<', `>${run}<`);
  if (popover) { s = s.replace(/>Auto-Review</, '>Auto-review<'); }
  s = s.replace("A classifier will run for each action and decide whether it's safe to execute this command. Allowlists are still respected.", desc || "A classifier reviews each action. A blocked action is skipped with a notice; the card only appears if Auto-review pauses.");
  s = s.replace('Prevent Agent from creating or modifying files outside of the workspace automatically', 'Refuses writes outside the workspace (it does not ask). Best effort.');
  s = s.replace('Prevent Agent from deleting files automatically', 'Asks before rm, rmdir and git rm. Best effort: find -delete or git clean can get around it.');
  s = s.replace('You can configure Bash, MCP, Fetch and Read allow rules for Auto mode. Auto works well without them.', 'Commands that run without asking. Always Run adds to this list, saved in this workspace\'s .claude/settings.local.json.');
  { // File deletion is on by default, like External files: copy the switch that is on
    const sw = (txt) => { const r = rowAround(s, txt, 'settings-row-control'); return elements(s).find((x) => x.name === 'span' && x.s > r.s && x.e < r.e && x.open.includes('role="switch"')); };
    const del = sw('File-Deletion Protection'), ext = sw('External-File Protection');
    const attr = (h, a) => h.match(new RegExp(a + '="([^"]*)"'))[1];
    let on = s.slice(ext.s, ext.e);
    for (const a of ['id', 'aria-labelledby', 'aria-describedby']) on = on.replace(new RegExp('(\\s' + a + ')="[^"]*"'), `$1="${attr(s.slice(del.s, del.e), a)}"`);
    s = s.slice(0, del.s) + on + s.slice(del.e);
  }
  if (extraRows) {
    const ra = rowAround(s, 'Read Access', 'settings-row-control');
    let dflt = s.slice(ra.s, ra.e).replace('Read Access', 'Default mode for new chats').replace('Control whether agents can read files outside the workspace without approval', 'New chats start in Agent with this Run Mode. Changing it applies to new chats only').replace('>System<', '>Agent · Auto-review<');
    const ra2 = rowAround(s, 'Read Access', 'settings-row-control');
    s = s.slice(0, ra2.s) + dflt + s.slice(ra2.s);
  }
  { const a = s.indexOf('Wait for MCP Authentication'), b = s.indexOf('Execution and Approvals');
    const w = elements(s).filter((x) => x.name === 'div' && x.s < a && x.e > b).sort((x, y) => (x.e - x.s) - (y.e - y.s))[0];
    const o = w.open; s = s.slice(0, w.s) + (o.includes('style="') ? o.replace('style="', 'style="position:relative;top:-255px;') : o.replace(/>$/, ' style="position:relative;top:-255px">')) + s.slice(w.s + o.length); }
  if (optionPatch) s = optionPatch(s);
  s = bar(s, 'Agent', run);
  return s;
}
const OPEN_ANCH = A('v7-set-runmode-open.dc.html', 'Open Run Mode dropdown', 580, 0, 0, 0); // replaced below with measured coordinates
function rmAnchors(s, kind) {
  // trigger sits in the Run Mode row; coordinates read from the render (see v7-build.mjs measure notes)
  return s;
}
export { turn, PANEL, HEADT, CMD, BTN, ROW, picker, card, A, FONT, rd, P, D, mk, strip, root, addOverlay, bar, chat, approval, settings, rowAround, elements, once };
export const NOTICE = (txt, href) => `<div style="position:absolute;left:1141px;top:262px;width:278px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:8px 12px;${FONT}">${txt}${href ? ` <a href="${href}" style="color:#B69CFF;text-decoration:none">Run Mode settings</a>` : ''}</div>`;
