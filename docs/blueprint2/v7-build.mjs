// Builds the v7 To-be (permissions, issue #19) boards and registers them in canvas.json.
// Usage: node v7-build.mjs [--page-name "v7 · ..."] ; heights come from v7-heights.json (made by v7-heights.mjs).
import fs from 'node:fs';
import * as S from './v7-screens.mjs';
const { A, FONT, P, D, mk, addOverlay, bar, chat, picker, approval, settings, elements, turn, PANEL, HEADT, CMD, BTN, ROW } = S;

const PAGE_NAME = process.argv.includes('--page-name') ? process.argv[process.argv.indexOf('--page-name') + 1] : 'v7 · in progress';
const STATUS = process.argv.includes('--final') ? 'current' : 'in-progress';
const boards = []; // {file,title,w,kind,row}
const dedupe = (h) => { const seen = {}; return h.replace(/\bid="([^"]*)"/g, (m, id) => { seen[id] = (seen[id] || 0) + 1; return seen[id] === 1 ? m : `id="${id}-${seen[id]}"`; }); };
const W = (name, html, title, w, kind, row, interactive) => {
  html = dedupe(html).replace(/<div data-superseded-by="v6" data-page="v7"/, '<div data-page="v7"').replace(/ data-was="[a-z-]+"/, '').replace(/<a href="v6-Main.dc.html"[^>]*>Superseded by v6<\/a>/, '').replace(/data-status="superseded"/, `data-status="${STATUS}"`);
  fs.writeFileSync(P + name + '.dc.html', html);
  boards.push({ name, title, w, kind, row, interactive });
};

// ---------- screens ----------
const SW = 1440;
const sc = (name, html, title, row) => W(name, html, title, SW, 'screen', row, true);

// chat modes + picker
sc('v7-chat-agent', chat('Agent', 'Agent mode, Auto-review'), 'Chat: Agent', 1);
sc('v7-chat-picker', picker(), 'Chat: mode picker open', 1);
sc('v7-chat-plan', chat('Plan', 'Plan mode'), 'Chat: Plan', 1);
sc('v7-chat-ask', chat('Ask', 'Ask mode'), 'Chat: Ask', 1);

// settings
const popBox = (selected, disabledEverything, disabledAuto) => {
  const row = (label, sub, href, on, off) => {
    const inner = `<span style="flex:1">${label}${sub ? `<br><span style="font-size:11px;opacity:.7">${sub}</span>` : ''}</span>${on ? '<span class="codicon codicon-check" style="font-size:14px"></span>' : ''}`;
    const st = `display:flex;align-items:center;box-sizing:border-box;padding:6px 8px;border-radius:5px;color:#D2CFE0;text-decoration:none;${FONT};font-size:13px;${on ? 'background:rgba(244,242,251,.08);' : ''}${off ? 'opacity:.45;' : ''}`;
    return href ? `<a href="${href}" aria-label="${label}" style="${st}">${inner}</a>` : `<div style="${st}">${inner}</div>`;
  };
  return `<div style="position:absolute;left:601px;top:${disabledAuto ? 210 : 244}px;width:230px;box-sizing:border-box;z-index:2000000;background:#1A1823;border:1px solid rgba(244,242,251,.16);border-radius:8px;padding:4px;display:flex;flex-direction:column;gap:2px">`
    + row('Allowlist', '', 'v7-set-runmode-allowlist.dc.html', selected === 'Allowlist')
    + (disabledAuto ? row('Auto-review', 'Disabled by your administrator', null, false, true) : row('Auto-review', '', 'v7-set-runmode.dc.html', selected === 'Auto-review'))
    + (disabledEverything ? row('Run Everything', 'Disabled by your administrator', null, false, true) : row('Run Everything', '', 'v7-edge-bypass-dialog.dc.html', selected === 'Run Everything'))
    + '</div>';
};
const closeOpen = (href) => A(href, 'Close the dropdown', 300, 70, 820, 838);
const toChat = A('v7-chat-agent.dc.html', 'Open the chat', 1137, 70, 286, 150);
const trig = (href, label = 'Open the Run Mode dropdown') => A(href, label, 601, 213, 100, 28);
const allowRow = A('v7-set-allowlist.dc.html', 'Open Allowlist Options', 589, 662, 483, 64);

const base = (run, desc, state) => settings(state, { run, desc });
const DEFAULT_MENU = `<div style="position:absolute;left:601px;top:352px;width:250px;box-sizing:border-box;z-index:2000000;background:#1A1823;border:1px solid rgba(244,242,251,.16);border-radius:8px;padding:4px;display:flex;flex-direction:column;gap:2px">` + [['Agent · Auto-review', true, 'Recommended'], ['Agent · Allowlist', false, ''], ['Agent · Run Everything', false, ''], ['Plan', false, ''], ['Ask', false, '']].map(([t, on, sub]) => `<a href="v7-set-runmode.dc.html" aria-label="${t}" style="display:flex;align-items:center;box-sizing:border-box;padding:6px 8px;border-radius:5px;color:#D2CFE0;text-decoration:none;${FONT};font-size:13px;${on ? 'background:rgba(244,242,251,.08);' : ''}"><span style="flex:1">${t}${sub ? ` <span style="font-size:11px;opacity:.6">${sub}</span>` : ''}</span>${on ? '<span class="codicon codicon-check" style="font-size:14px"></span>' : ''}</a>`).join('') + `<div style="padding:6px 8px 4px;color:#D2CFE0;opacity:.65;font-size:11px;border-top:1px solid rgba(244,242,251,.08);margin-top:2px">Applies to new chats. Open chats keep their mode.</div></div>`;
sc('v7-set-runmode', addOverlay(base('Auto-review', null, 'Run Mode: Auto-review'), trig('v7-set-runmode-open.dc.html') + allowRow + toChat), 'Settings: Run Mode', 2);
sc('v7-set-runmode-open', addOverlay(base('Auto-review', null, 'Run Mode dropdown open') , closeOpen('v7-set-runmode.dc.html') + popBox('Auto-review')), 'Settings: Run Mode dropdown', 2);
sc('v7-set-runmode-allowlist', addOverlay(base('Allowlist', 'Claude edits files and shows Keep or Undo. It asks before any command that is not on the Allowlist.', 'Run Mode: Allowlist'), trig('v7-set-runmode-open.dc.html') + allowRow + toChat), 'Settings: Run Mode, Allowlist', 2);
sc('v7-set-runmode-everything', addOverlay(base('Run Everything', 'Claude runs every action without asking. Deny rules still apply; Allowlist rules have no effect.', 'Run Mode: Run Everything'), trig('v7-set-runmode-open-everything.dc.html') + toChat), 'Settings: Run Everything on', 2);
sc('v7-set-runmode-open-everything', addOverlay(base('Run Everything', 'Claude runs every action without asking. Deny rules still apply; Allowlist rules have no effect.', 'Run Mode dropdown open, Run Everything'), closeOpen('v7-set-runmode-everything.dc.html') + popBox('Run Everything')), 'Settings: dropdown, Run Everything on', 2);

// allowlist editor: panel over the lower settings
const rule = (r, src, ro) => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(244,242,251,.08)"><code style="flex:1;font:12px 'Geist Mono',ui-monospace,monospace;color:#C4B5FD">${r}</code><span style="font-size:11px;opacity:.65;width:150px">${src}</span>${ro ? '<span style="width:44px;font-size:12px;opacity:.5">Read only</span>' : `<a href="v7-set-allowlist.dc.html" aria-label="Remove ${r}" style="width:44px;color:#F2777A;text-decoration:none;font-size:12px">Remove</a>`}</div>`;
const allowPanel = `<div style="position:absolute;left:589px;top:662px;width:483px;height:200px;background:#14121C;box-sizing:border-box;z-index:2000000;background:#1A1823;border:1px solid rgba(244,242,251,.12);border-radius:8px;padding:10px 12px;${FONT};color:#D2CFE0;overflow:hidden">
<div style="font-size:13px;font-weight:500;color:#F4F2FB">Allowlist Options</div><div style="opacity:.7;margin:2px 0 4px">Saved in this workspace's .claude/settings.local.json. Auto-review ignores broad rules such as Bash(*).</div>
${rule('Bash(npm test)', 'Workspace, local')}${rule('Bash(git diff *)', 'Workspace, local')}${rule('Read(./docs/**)', 'User file', true)}
<div style="display:flex;gap:6px;margin-top:8px"><div style="flex:1;height:26px;box-sizing:border-box;border:1px solid rgba(244,242,251,.18);border-radius:4px;padding:5px 8px;opacity:.6">Add a rule, for example Bash(git status)</div><a href="v7-set-allowlist.dc.html" aria-label="Add rule" style="width:64px;height:26px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#6D28D9;color:#F4F2FB;text-decoration:none">Add</a></div></div>`;
sc('v7-set-allowlist', addOverlay(base('Auto-review', null, 'Allowlist editor open'), allowPanel + A('v7-set-runmode.dc.html', 'Collapse Allowlist Options', 589, 662, 483, 28) + toChat), 'Settings: Allowlist editor', 2);

// approval card
sc('v7-approval-pending', approval('pending', 'Approval card, waiting'), 'Approval: waiting', 3);
sc('v7-approval-ran', approval('ran', 'Approval card, ran'), 'Approval: ran', 3);
sc('v7-approval-skipped', approval('skipped', 'Approval card, skipped'), 'Approval: skipped', 3);
sc('v7-approval-always', approval('always', 'Approval card, added to allowlist'), 'Approval: always run', 3);

// edge cases
const notice = `<div style="position:absolute;left:943px;top:262px;width:266px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:8px 12px;${FONT}">Auto-review isn't available here, so Allowlist is on. <a href="v7-set-auto-unavailable.dc.html" aria-label="Open Run Mode settings" style="color:#B69CFF;text-decoration:none">Run Mode settings</a></div>`;
sc('v7-edge-auto-unavailable', chat('Agent', 'Auto-review unavailable, notice', notice, 'Allowlist'), 'Edge: Auto unavailable (chat)', 4);
sc('v7-set-auto-unavailable', addOverlay(base('Allowlist', 'Auto-review is unavailable for this model or Claude Code version, so Allowlist is used: edits apply with Keep or Undo and commands ask.', 'Auto-review unavailable'), trig('v7-set-runmode-open.dc.html') + toChat), 'Edge: Auto unavailable (settings)', 4);
const dlg = `<div style="position:absolute;left:0;top:0;width:1440px;height:931px;z-index:2000000;background:rgba(0,0,0,.5)"></div>
<div style="position:absolute;left:490px;top:300px;width:460px;box-sizing:border-box;z-index:2000001;background:#1A1823;border:1px solid rgba(244,242,251,.16);border-radius:10px;padding:18px 20px;${FONT};font-size:13px;color:#D2CFE0;box-shadow:0 12px 40px rgba(0,0,0,.5)">
<div style="font-size:15px;font-weight:500;color:#F4F2FB;margin-bottom:8px">Run Everything skips every approval</div>
<div style="line-height:1.5">Claude will run commands and edit files without asking. Deny rules still apply; Allowlist rules have no effect. Use it only in a sandbox or a project you trust.</div><div style="margin-top:8px;opacity:.65;font-size:12px">OmnIDE asks once. Your answer is kept in OmnIDE settings, not in Claude's.</div>
<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><a href="v7-set-runmode-open.dc.html" aria-label="Cancel" style="height:28px;padding:0 14px;box-sizing:border-box;display:flex;align-items:center;border:1px solid rgba(244,242,251,.18);border-radius:5px;color:#D2CFE0;text-decoration:none">Cancel</a><a href="v7-set-runmode-everything.dc.html" aria-label="Accept and enable Run Everything" style="height:28px;padding:0 14px;box-sizing:border-box;display:flex;align-items:center;border-radius:5px;background:#6D28D9;color:#F4F2FB;text-decoration:none">I accept the risk</a></div></div>`;
sc('v7-edge-bypass-dialog', addOverlay(base('Auto-review', null, 'Run Everything first-time acceptance dialog'), dlg), 'Edge: Run Everything acceptance dialog', 4);
sc('v7-edge-bypass-disabled', addOverlay(base('Auto-review', null, 'Run Everything disabled by admin'), closeOpen('v7-set-runmode.dc.html') + popBox('Auto-review', true)), 'Edge: Run Everything disabled by admin', 4);
// ask refused
{
  let s = mk('v5-ai-14-agent-turn-streaming.dc.html', 'OmnIDE Chat', 'Ask mode, edit refused');
  s = s.replace('Reply with one word: hi', 'Rename TodoList to TaskList in src/todo.ts').replace('Read src/version.ts then reply with', 'Please apply it now').replace('>hi<', ">Ask mode has no edit access.<").replace('>Thinking<', '>Thought 2s<');
  s = s.replace(/(<p[^>]*>)Sonnet 5\.5(<\/p>)/, '$1Ask · Sonnet 5.5$2');
  s = bar(s, 'Ask', 'No edits');
  const c = `<div style="position:absolute;left:937px;top:352px;width:280px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:10px 12px;${FONT}"><div style="font-weight:500;font-size:13px;color:#F2777A">Edit refused</div><div style="margin:6px 0 8px">Ask mode has no edit access. src/todo.ts was not changed. Commands still ask first.</div><a href="v7-chat-agent.dc.html" aria-label="Switch to Agent" style="display:inline-flex;height:26px;padding:0 12px;box-sizing:border-box;align-items:center;border-radius:4px;background:#6D28D9;color:#F4F2FB;text-decoration:none">Switch to Agent</a></div>`;
  sc('v7-edge-ask-refused', addOverlay(s, c + A('v7-set-runmode.dc.html', 'Open OmnIDE Settings', 1272, 6, 22, 22)), 'Edge: Ask refuses an edit', 4);
}

// Allowlist: edits are applied and shown with Keep or Undo
sc('v7-edit-keep-undo', turn('Allowlist: edit applied', { user: 'Rename TodoList to TaskList in src/todo.ts', then: 'Then run the tests', reply: 'Renamed TodoList to TaskList in src/todo.ts.', over: PANEL(160, HEADT('Edited src/todo.ts', '#41CB7E') + `<div style="margin:6px 0 8px;padding:6px 8px;background:#0E0C14;border-radius:5px;font:12px 'Geist Mono',ui-monospace,monospace"><span style="color:#F2777A">- export class TodoList {</span><br><span style="color:#41CB7E">+ export class TaskList {</span></div>` + ROW(BTN('Keep', 'v7-approval-pending.dc.html', 'p'), BTN('Undo', 'v7-chat-agent.dc.html')) + `<div style="opacity:.7;margin-top:6px">Already applied. Commands not on the allowlist still ask.</div>`) }), 'Allowlist: edit with Keep or Undo', 3);

// Auto-review states
const autoBtns = ROW(BTN('Run once', 'v7-approval-ran.dc.html'), BTN('Always Run', 'v7-approval-always.dc.html'));
sc('v7-edge-auto-blocked', turn('Auto-review skipped an action', { reply: 'Auto-review skipped npm test, so I will read the test files instead.', run: 'Auto-review', over: PANEL(190, HEADT('Auto-review skipped 1 action', '#F5B84B') + `<div style="opacity:.8;margin:4px 0 8px">Claude was told and carried on. No card unless Auto-review pauses.</div><div style="opacity:.6;font-size:11px;letter-spacing:.06em;text-transform:uppercase">Recently blocked</div>` + CMD('npm test') + autoBtns + `<div style="opacity:.6;margin-top:6px">1 of 3 in a row before it pauses</div>`) }), 'Edge: Auto skips an action', 4);
sc('v7-edge-auto-paused', turn('Auto-review paused', { reply: 'Waiting for you to decide about npm test.', run: 'Auto-review (paused)', thought: false, over: PANEL(176, HEADT('Auto-review paused', '#F5B84B') + `<div style="opacity:.8;margin:4px 0 0">3 actions in a row were blocked (it also pauses at 20 in total). Claude waits for you.</div>` + CMD('npm test') + ROW(BTN('Run once', 'v7-approval-ran.dc.html'), BTN('Skip', 'v7-approval-skipped.dc.html'), BTN('Always Run', 'v7-approval-always.dc.html'))) }), 'Edge: Auto-review paused', 4);
sc('v7-edge-classifier-error', turn('Auto-review classifier error', { reply: 'Waiting for you to decide about npm test.', run: 'Auto-review', thought: false, over: PANEL(176, HEADT('Auto-review could not check this action', '#F2777A') + `<div style="opacity:.8;margin:4px 0 0">The classifier returned an error. Nothing ran, and Claude Code asks you instead.</div>` + CMD('npm test') + ROW(BTN('Run', 'v7-approval-ran.dc.html', 'p'), BTN('Skip', 'v7-approval-skipped.dc.html'), BTN('Always Run', 'v7-approval-always.dc.html'))) }), 'Edge: classifier error', 4);
sc('v7-edge-auto-rejected', turn('Auto-review turned off mid-session', { reply: 'Continuing; I will ask before commands now.', run: 'Allowlist', over: PANEL(128, HEADT('Auto-review turned off for this chat', '#F5B84B') + `<div style="opacity:.8;margin:4px 0 6px">The server rejected auto mode for this model. This chat now works like Allowlist: edits apply with Keep or Undo and commands ask.</div><a href="v7-set-auto-unavailable.dc.html" aria-label="Open Run Mode settings" style="color:#B69CFF;text-decoration:none">Run Mode settings</a>`) }), 'Edge: server rejects Auto mid-session', 4);
sc('v7-edge-auto-admin', addOverlay(base('Allowlist', 'Auto-review is turned off by your administrator, so Allowlist is used.', 'Auto-review disabled by admin'), closeOpen('v7-set-runmode-allowlist.dc.html') + popBox('Allowlist', false, true)), 'Edge: Auto-review disabled by admin', 4);
sc('v7-edge-runmode-changed', turn('Run Mode changed with a chat open', { reply: 'Working on it.', run: 'Auto-review', thought: false, over: `<a href="v7-chat-agent.dc.html" aria-label="Restart to apply" style="position:absolute;left:1086px;top:193px;height:20px;padding:0 8px;box-sizing:border-box;z-index:2000000;display:flex;align-items:center;border-radius:999px;background:rgba(245,184,75,.16);border:1px solid #F5B84B;color:#F5B84B;text-decoration:none;${FONT}">Restart to apply</a>` + PANEL(128, HEADT('Run Mode is now Allowlist', '#F4F2FB') + `<div style="opacity:.8;margin:4px 0 8px">New chats use it. This chat keeps Auto-review until you restart it.</div>` + ROW(BTN('Restart chat', 'v7-chat-agent.dc.html', 'p'), BTN('Later', 'v7-chat-agent.dc.html')).replace('0 0 64px', '0 0 96px')) }), 'Edge: Run Mode changed, chat open', 4);
sc('v7-set-default-mode', addOverlay(base('Auto-review', null, 'Default mode for new chats'), A('v7-set-runmode.dc.html', 'Close', 300, 70, 820, 838) + DEFAULT_MENU), 'Settings: default mode for new chats', 2);

// ---------- docs ----------
const HEAD = (title) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
a{color:#B69CFF}a:hover{color:#F4F2FB}
table{border-collapse:collapse}
th{text-align:left;font-weight:600;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(244, 242, 251, 0.74);padding:8px 10px;border-bottom:1px solid rgba(244, 242, 251, 0.08)}
td{padding:8px 10px;border-bottom:1px solid rgba(244, 242, 251, 0.08);vertical-align:top}
</style>
<style data-omnide-v4>@font-face{font-family:'Geist';src:url(./fonts/Geist-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}@font-face{font-family:'Geist Mono';src:url(./fonts/GeistMono-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}</style></helmet>
`;
const TAIL = (w, h) => `
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
const DIM = 'rgba(244, 242, 251, 0.74)';
const card = 'background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:8px;padding:14px 16px';
const code = (t) => `<code style="font-family:'Geist Mono',ui-monospace,Consolas,monospace;font-size:12px;color:#C4B5FD">${t}</code>`;
const link = (n, t) => `<a href="${n}.dc.html">${t}</a>`;
const heights = fs.existsSync('v7-heights.json') ? JSON.parse(fs.readFileSync('v7-heights.json', 'utf8')) : {};
function doc({ name, title, label, w = 1240, minH = 600, attrs = '', intro, body, row, kind = 'doc', interactive }) {
  const root = `<div data-page="v7" data-created="${D}" data-updated="${D}" data-status="${STATUS}" ${attrs} style="position:relative;width:${w}px;min-height:${minH}px;box-sizing:border-box;padding:40px 48px;background:#14121B;color:#F4F2FB;font-family:'Geist','Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.5">
<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${DIM}">${label} · v7 · ${D} · updated ${D}</div><h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">${title}</h1><p style="margin:0 0 20px;max-width:1000px;color:${DIM}">${intro}</p>
${body}`;
  const h = heights[name] || minH;
  W(name, HEAD(title) + root + TAIL(w, h), title, w, kind, row, interactive);
}
const cardNote = (kind, head, text) => `<div data-card="${kind}" style="background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:6px;padding:10px 12px;font-size:12px"><div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#B69CFF">${kind.replace('-', ' ')}</div><div style="font-weight:600;margin:2px 0">${head}</div><div style="color:${DIM}">${text}</div></div>`;
const box = (x, y, w, h, text, o = {}) => `<div ${o.attrs || ''} style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;background:${o.bg || '#1A1823'};border:2px solid ${o.border || 'rgba(244, 242, 251, 0.5)'};border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;line-height:1.25">${o.n ? `<b style="position:absolute;left:-9px;top:-9px;width:20px;height:20px;border-radius:50%;background:#B69CFF;color:#14121B;font-size:11px;line-height:20px;text-align:center">${o.n}</b>` : ''}${o.href ? `<a href="${o.href}" style="padding:0 6px;color:#F4F2FB;text-decoration:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${text}</a>` : `<span style="padding:0 8px">${text}</span>`}</div>`;
const red = (id, x, y, text, href) => box(x, y, 128, 52, text, { attrs: `data-node="${id}" data-edge`, bg: 'rgba(242,119,122,.12)', border: '#F2777A', href });

// --- flow ---
{
  const lanes = ['Developer', 'OmnIDE app', 'Claude Code', 'Edge cases and admin'];
  const tops = [150, 310, 470, 630];
  let h = lanes.map((l, i) => `<div data-lane="${l}" style="position:absolute;left:48px;top:${tops[i]}px;width:1264px;height:152px;background:#1A1823;border-radius:6px"><span style="position:absolute;left:12px;top:${i === 3 ? 124 : 12}px;font-size:12px;font-weight:600;color:${DIM}">${l}</span></div>`).join('\n');
  const N = [
    ['open', 1, 0, 140, 'Open a chat: Agent, Auto-review'],
    ['start', 2, 1, 288, 'Start Claude Code with the Run Mode'],
    ['classify', 3, 2, 436, 'Auto skips; Allowlist asks'],
    ['approve', 4, 0, 584, 'Card: Run, Skip or Always Run'],
    ['always', 5, 1, 732, 'Always Run saves an allow rule'],
    ['applied', 6, 2, 880, 'Rule applies from the next call'],
    ['cycle', 7, 0, 1028, 'Shift+Tab: Agent, Plan, Ask'],
  ];
  const pos = {};
  for (const [id, n, lane, x, t] of N) { pos[id] = [x, tops[lane] + 16]; h += '\n' + box(x, tops[lane] + 16, 128, 52, t, { attrs: `data-node="${id}" data-n="${n}"`, n }); }
  const R = [
    ['restart', 'Run Mode changed', 'v7-edge-runmode-changed.dc.html', 'open'],
    ['unavailable', 'Auto unavailable', 'v7-edge-auto-unavailable.dc.html', 'start'],
    ['autooff', 'Server rejects Auto', 'v7-edge-auto-rejected.dc.html', 'start'],
    ['autoadmin', 'Admin blocks Auto', 'v7-edge-auto-admin.dc.html', 'start'],
    ['blocked', 'Auto skips an action', 'v7-edge-auto-blocked.dc.html', 'classify'],
    ['paused', 'Auto paused', 'v7-edge-auto-paused.dc.html', 'classify'],
    ['classerr', 'Classifier error', 'v7-edge-classifier-error.dc.html', 'classify'],
    ['bypass', 'Run Everything dialog', 'v7-edge-bypass-dialog.dc.html', 'approve'],
    ['admin', 'Admin blocks Run Everything', 'v7-edge-bypass-disabled.dc.html', 'always'],
    ['ask', 'Ask refuses an edit', 'v7-edge-ask-refused.dc.html', 'applied'],
  ];
  const order = N.map((n) => n[0]);
  let paths = '';
  for (let i = 0; i < N.length - 1; i++) {
    const a = pos[N[i][0]], b = pos[N[i + 1][0]];
    const x1 = a[0] + 128, y1 = a[1] + 26, x2 = b[0], y2 = b[1] + 26, m = x1 + 4;
    paths += `<path d="M ${x1} ${y1} L ${m} ${y1} L ${m} ${y2} L ${x2 - 4} ${y2}" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#ar)"/>`;
  }
  R.forEach(([id, t, href, from], i) => {
    const x = 60 + 124 * i;
    h += '\n' + box(x, 690, 112, 52, t, { attrs: `data-node="${id}" data-edge`, bg: 'rgba(242,119,122,.12)', border: '#F2777A', href });
    const f = pos[from], bus = 640 + 6 * order.indexOf(from), px = f[0] + 64;
    paths += `<path d="M ${px} ${f[1] + 52} L ${px} ${bus} L ${x + 56} ${bus} L ${x + 56} 686" stroke="#F2777A" stroke-dasharray="4 3" marker-end="url(#arr)"/>`;
  });
  h += `\n<svg role="img" aria-label="Arrows from each step to the next, and red dashed arrows down to the ten edge cases" width="1360" height="820" viewBox="0 0 1360 820" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6;pointer-events:none"><defs><marker id="ar" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker><marker id="arr" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#F2777A"/></marker></defs>${paths}</svg>`;
  h += `\n<div data-legend style="position:absolute;left:48px;top:800px;display:flex;gap:18px;font-size:12px;color:${DIM}"><span><b style="display:inline-block;width:18px;height:2px;background:rgba(244, 242, 251, 0.5);vertical-align:middle"></b> normal path</span><span><b style="display:inline-block;width:18px;height:2px;background:#F2777A;vertical-align:middle"></b> edge case: click to open its screen</span><span><b style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#B69CFF;vertical-align:middle"></b> step number</span></div>`;
  h += `\n<div style="position:absolute;left:48px;top:832px;width:1264px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cardNote('why', 'Two settings, not five modes', 'What Claude does (Agent, Plan, Ask) is picked per chat. How much it asks (Run Mode) is stored in OmnIDE\'s own settings and applies to new chats. Shift+Tab only moves between the first three.')}${cardNote('never-assumed', 'Never assumed', 'Auto-review is the default only where Claude Code offers it. OmnIDE starts each chat with a permission mode and never writes the global ~/.claude/settings.json.')}${cardNote('to-verify', 'To verify', 'How OmnIDE detects that Auto is unavailable before the first message, how a pause or a classifier error reaches the SDK, and that deny rules cover every edit path in Ask. Not seen running yet.')}</div>`;
  doc({ name: 'v7-FlowPermissions', title: 'Permissions flow: from a new chat to Always Run', label: 'Flows', w: 1360, minH: 1060, attrs: 'data-section="flows" data-diagram="flow"', intro: 'A new chat starts in Agent with Auto-review. In Allowlist, edits apply with Keep or Undo and other commands ask; Always Run saves a rule. Red boxes are edge cases: click one.', body: h, row: 5 });
}

// --- state: mode cycle ---
{
  const st = (x, id, t, sub) => `<div data-state-node="${id}" style="position:absolute;left:${x}px;top:30px;width:240px;height:96px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:10px;padding:14px;text-align:center"><div style="font-size:18px;font-weight:600">${t}</div><div style="font-size:12px;color:${DIM};margin-top:4px">${sub}</div></div>`;
  const mx = [['Auto-review', 'auto', 'plan', 'default + deny edits'], ['Allowlist', 'acceptEdits + allow rules', 'plan', 'default + deny edits'], ['Run Everything', 'bypassPermissions', 'plan', 'default + deny edits']];
  const tbl = `<h2 style="font-size:16px;margin:18px 0 6px">Run Everything and Run Mode with the three chat modes</h2><table style="width:100%;font-size:13px"><thead><tr><th>Run Mode</th><th>Agent starts</th><th>Plan starts</th><th>Ask starts</th></tr></thead><tbody>${mx.map((r) => `<tr><td><b>${r[0]}</b></td><td>${code(r[1])}</td><td>${code(r[2])}</td><td>${code(r[3])}</td></tr>`).join('')}</tbody></table><p style="margin:8px 0 0;color:${DIM}">A Run Everything chat is started with ${code('allowDangerouslySkipPermissions')}. That keeps bypassPermissions available, so Agent -> Plan -> Ask -> Agent returns to bypassPermissions, and Plan and Ask never run in bypass. Plan and Ask do not depend on Run Mode. TO VERIFY: that the SDK switches back to bypassPermissions after Plan or Ask.</p>`;
  const body = `<div data-diagram="state" style="position:relative;height:330px;background:#0E0C14;border-radius:8px;margin-bottom:16px">
${st(60, 'agent', 'Agent', 'auto, acceptEdits or bypassPermissions, by Run Mode')}${st(480, 'plan', 'Plan', 'Claude Code: plan')}${st(900, 'ask', 'Ask', 'Claude Code: default + deny on Edit, Write, NotebookEdit')}
<svg role="img" aria-label="Shift+Tab moves Agent to Plan, Plan to Ask, and Ask back to Agent" width="1144" height="330" viewBox="0 0 1144 330" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="sa" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#B69CFF"/></marker></defs><path d="M 300 78 L 476 78" stroke="#B69CFF" marker-end="url(#sa)"/><path d="M 720 78 L 896 78" stroke="#B69CFF" marker-end="url(#sa)"/><path d="M 1020 130 L 1020 230 L 180 230 L 180 134" stroke="#B69CFF" marker-end="url(#sa)"/></svg>
<span style="position:absolute;left:340px;top:52px;font-size:12px;color:${DIM}">Shift+Tab</span><span style="position:absolute;left:760px;top:52px;font-size:12px;color:${DIM}">Shift+Tab</span><span style="position:absolute;left:520px;top:238px;font-size:12px;color:${DIM}">Shift+Tab</span>
<div data-legend style="position:absolute;left:24px;top:290px;display:flex;gap:18px;font-size:12px;color:${DIM}"><span><b style="display:inline-block;width:18px;height:2px;background:#B69CFF;vertical-align:middle"></b> Shift+Tab, one step</span><span>Each chat keeps its own mode; a new chat starts in Agent.</span></div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cardNote('why', 'Three stops, not five', 'Run Everything and Auto are not stops, so a stray Shift+Tab cannot switch off approvals.')}${cardNote('never-assumed', 'Not in the cycle', 'dontAsk is not offered; it is for CI runs only. acceptEdits is used, but only through Allowlist.')}${cardNote('to-verify', 'To verify', 'Whether deny rules on Edit, Write and NotebookEdit keep Ask from editing on every path. See Questions.')}</div>${tbl}
<p style="margin:16px 0 0;color:${DIM}">Screens: ${link('v7-chat-agent', 'Agent')}, ${link('v7-chat-plan', 'Plan')}, ${link('v7-chat-ask', 'Ask')}, ${link('v7-chat-picker', 'picker open')}.</p>`;
  doc({ name: 'v7-ModeCycle', title: 'Mode cycle: Agent, Plan, Ask', label: 'Flows · state', attrs: 'data-section="flows" data-diagram="state"', intro: 'The chat mode picker and the Shift+Tab cycle move through the same three modes. Each is a Claude Code mode or a mode plus rules, listed in the mapping frame.', body, row: 5 });
}

const EP = [
  ['SPAWN claude --permission-mode', 'A chat starts, restarts or its mode changes', 'Claude Code runs in auto, acceptEdits, bypassPermissions, plan or default with deny rules; the SDK permissionMode option'],
  ['WRITE .claude/settings.local.json', 'The user clicks Always Run or edits the allowlist', 'A permissions.allow rule is added or removed in the workspace file only'],
  ['WRITE OmnIDE settings', 'The user sets Run Mode, protections or the default for new chats, or accepts the Run Everything warning', 'Stored in OmnIDE\'s own settings; the global ~/.claude/settings.json is never written'],
  ['READ settings files', 'Settings opens, the allowlist editor opens or a chat starts', 'Rules from user, project, local and managed files, with the file shown; managed keys that disable Auto or Run Everything'],
];
// --- mapping (component) ---
{
  const L = [['Agent + Auto-review', 'auto'], ['Agent + Allowlist', 'acceptEdits + permissions.allow'], ['Agent + Run Everything', 'bypassPermissions'], ['Plan', 'plan'], ['Ask', 'default + deny Edit, Write, NotebookEdit']];
  let g = '';
  L.forEach(([a, b], i) => {
    g += box(20, 20 + i * 70, 300, 52, a, { attrs: `data-component="omnide-${i}"` }) + box(560, 20 + i * 70, 340, 52, b, { attrs: `data-component="claude-${i}"`, border: '#B69CFF' });
  });
  const paths = L.map((_, i) => `<path d="M 322 ${46 + i * 70} L 556 ${46 + i * 70}" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#cm)"/>`).join('');
  const rows = [
    ['Auto-review', '--permission-mode auto', 'A blocked action is skipped with a notice. The card shows only when auto pauses (3 blocks in a row or 20 in total) or an ask rule matches. Auto drops broad allow rules such as Bash(*). Needs user or managed settings, not a project file. Cursor\'s Auto-review is sandboxed and takes natural-language instructions; Claude\'s auto does neither', 'code.claude.com/docs/en/permission-modes'],
    ['Allowlist', '--permission-mode acceptEdits, plus permissions.allow rules', 'Edits are applied and shown with Keep or Undo. Commands outside the allowlist ask. Always Run writes a narrow rule such as Bash(npm test) to the workspace .claude/settings.local.json. This is also the fallback when Auto is unavailable', 'code.claude.com/docs/en/permissions'],
    ['Run Everything', 'bypassPermissions, session started with allowDangerouslySkipPermissions', 'Deny rules still apply, allow rules have no effect. OmnIDE shows its own one-time dialog, because the Agent Host is not a terminal. The acceptance is kept in OmnIDE settings; skipDangerousModePermissionPrompt is never written', 'code.claude.com/docs/en/permission-modes'],
    ['Admin blocks', 'permissions.disableAutoMode, permissions.disableBypassPermissionsMode = "disable"', 'Managed settings win over everything; OmnIDE greys the option and says why', 'code.claude.com/docs/en/permission-modes'],
    ['Plan', 'plan', 'Edits blocked until the plan is approved', 'code.claude.com/docs/en/permission-modes'],
    ['Ask', 'default, plus permissions.deny on Edit, Write and NotebookEdit', 'Shell commands still go through the card. Plan mode is not used (see Decisions). TO VERIFY: that the deny rules stop every edit path', 'code.claude.com/docs/en/permissions'],
    ['Where Run Mode lives', 'OmnIDE\'s own settings; each chat is started with --permission-mode', 'The user\'s global ~/.claude/settings.json is never written. Allow rules go to the workspace .claude/settings.local.json only', 'code.claude.com/docs/en/settings'],
    ['Protection: file deletion (on)', 'permissions.ask rules, for example Bash(rm *)', 'Best effort. find -delete, git clean and similar get around an rm rule', 'code.claude.com/docs/en/permissions'],
    ['Protection: external files (on)', 'permissions.blockWritesOutsideWorkingDirectories', 'Best effort. It refuses the write; it does not ask. There is no browser protection: Claude Code has no browser tool', 'code.claude.com/docs/en/permissions'],
  ];
  const tr = rows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${code(r[1])}</td><td>${r[2]}</td><td><a data-source href="${r[3].startsWith('http') ? r[3] : 'https://' + r[3]}" data-fetched="2026-11-26">${r[3]}</a></td></tr>`).join('');
  const body = `<div data-diagram="component" style="position:relative;width:1144px;height:380px;background:#0E0C14;border-radius:8px;margin-bottom:8px">
<div style="position:absolute;left:20px;top:2px;font-size:11px;color:${DIM};letter-spacing:.06em;text-transform:uppercase"></div>${g}
<svg role="img" aria-label="Each OmnIDE choice points to the Claude Code mode it starts" width="1144" height="380" viewBox="0 0 1144 380" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="cm" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker></defs>${paths}</svg>
<div style="position:absolute;left:930px;top:20px;width:190px;font-size:12px;color:${DIM}">Left: what the user picks in OmnIDE. Right: the mode and rules OmnIDE starts a chat with. dontAsk (CI only) is not offered.</div></div>
<table style="width:100%;font-size:13px"><thead><tr><th>OmnIDE</th><th>Claude Code key or mode</th><th>Where it lands, and what is unverified</th><th>Source (fetched 2026-11-26)</th></tr></thead><tbody>${tr}</tbody></table>
<h2 style="font-size:16px;margin:18px 0 6px">Where OmnIDE talks to Claude Code and its files</h2><table style="width:100%;font-size:13px"><thead><tr><th>Call</th><th>Called when</th><th>Result</th></tr></thead><tbody>${EP.map((e) => `<tr data-endpoint="${e[0]}" data-called-when="${e[1]}"><td>${code(e[0])}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('')}</tbody></table>
<p style="margin:14px 0 0;color:${DIM}">The issue said five modes; the docs list six defaultMode values: default, acceptEdits, plan, auto, dontAsk and bypassPermissions. OmnIDE uses five of them. Cursor's agent docs (fetched 2026-11-26) describe Agent, Plan and Ask; they do not cover the Run, Skip and Always Run buttons, so those buttons are our proposal.</p>`;
  doc({ name: 'v7-Mapping', title: 'Mapping: OmnIDE choice to Claude Code mode and rules', label: 'Architecture · component', attrs: 'data-section="architecture" data-diagram="component"', intro: 'Every OmnIDE permission choice becomes a Claude Code mode or a settings rule, so the CLI and OmnIDE behave the same. Anything not yet seen running is marked TO VERIFY.', body, row: 5 });
}

// --- edge cases ---
{
  const rows = [
    ['Auto is unavailable (older Claude Code, unsupported model or provider)', 'v7-edge-auto-unavailable', 'Chat shows: "Auto-review isn\'t available here, so Allowlist is on." Settings shows the same reason under Run Mode.', 'Falls back to Allowlist (acceptEdits and allow rules); nothing runs unasked. Pick a supported model to switch back.'],
    ['Auto skips an action', 'v7-edge-auto-blocked', 'Notice: "Auto-review skipped 1 action", with a Recently blocked list. Each entry has Run once and Always Run.', 'No card interrupts the user. Claude is told and carries on.'],
    ['Auto pauses (3 blocks in a row or 20 in total)', 'v7-edge-auto-paused', 'Card: "Auto-review paused" with the blocked command and Run once, Skip, Always Run.', 'Answering resumes Auto-review for the chat.'],
    ['The classifier returns an error', 'v7-edge-classifier-error', 'Card: "Auto-review could not check this action". Nothing ran.', 'Claude Code asks the user instead: Run, Skip or Always Run.'],
    ['The server rejects auto mid-session', 'v7-edge-auto-rejected', 'Notice: "Auto-review turned off for this chat", with the reason.', 'The chat continues like Allowlist; a new chat tries Auto-review again.'],
    ['Admin disabled Auto-review', 'v7-edge-auto-admin', 'The dropdown row is greyed with "Disabled by your administrator". Allowlist is used.', 'Ask the admin; permissions.disableAutoMode is set in managed settings.'],
    ['Run Mode changed while chats are open', 'v7-edge-runmode-changed', 'Open chats keep the mode they started with and show a "Restart to apply" chip. New chats use the new mode; the default for new chats is set in <a href="v7-set-default-mode.dc.html">Settings</a>.', 'Restart the chat to apply, or leave it as is.'],
    ['First time Run Everything is chosen', 'v7-edge-bypass-dialog', 'OmnIDE\'s own dialog: "Run Everything skips every approval", with Cancel and "I accept the risk". The acceptance is stored in OmnIDE settings.', 'Cancel keeps the old Run Mode.'],
    ['Admin disabled Run Everything', 'v7-edge-bypass-disabled', 'The dropdown row is greyed with "Disabled by your administrator" and cannot be picked.', 'Ask the admin; permissions.disableBypassPermissionsMode is set in managed settings.'],
    ['Claude tries to edit in Ask mode', 'v7-edge-ask-refused', 'Card: "Edit refused. Ask mode has no edit access." The file is untouched.', 'Switch to Agent from the card, or keep asking. Commands in Ask still go through the card.'],
    ['Claude edits a file in Allowlist', 'v7-edit-keep-undo', 'Edit is applied and shown with Keep and Undo.', 'Undo restores the file. Commands outside the allowlist still ask.'],
    ['Approval card skipped', 'v7-approval-skipped', 'Card reads "Skipped"; Claude is told and can try another way.', 'Ask again, or switch Run Mode.'],
  ];
  const tr = rows.map((r, i) => `<tr data-case="${i + 1}"><td>${i + 1}</td><td>${r[0]}</td><td data-evidence="screen">${link(r[1], r[1])}<br><span style="color:${DIM}">${r[2]}</span></td><td>${r[3]}</td></tr>`).join('');
  doc({ name: 'v7-EdgeCases', title: 'Edge cases, with evidence', label: 'Flows · edge cases', attrs: 'data-section="flows"', intro: 'One row per edge case. Evidence is the screen that shows it and its text. The wording is the proposal; the Claude Code behaviour is from its docs, fetched 2026-11-26, not yet run.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>#</th><th>What happens</th><th>Evidence</th><th>Way out</th></tr></thead><tbody>${tr}</tbody></table>`, row: 5 });
}

// --- scenarios ---
const scen = (name, title, kind, story, steps, row) => {
  const li = steps.map(([f, t, node, ep, d]) => `<li style="margin:0 0 8px"><a href="${f}.dc.html" data-flow="v7-FlowPermissions:${node}" data-endpoint="${ep}">${t}</a><br><span style="color:${DIM}">${d}</span></li>`).join('');
  doc({ name, title, label: `Play · ${kind}`, minH: 480, attrs: `data-section="play" data-scenario="${name.slice(3)}" data-kind="${kind}" data-story="${story}"`, intro: `${story} Click a step to open its screen; each screen links on through its real buttons. <a href="v7-FlowPermissions.dc.html">See the flow</a>.`, body: `<ol style="margin:0;padding-left:22px;max-width:1000px">${li}</ol>`, row, interactive: true });
};
scen('v7-PlayAll', 'Choose Allowlist, approve a command, then always run it', 'happy', 'As a developer who chose Allowlist, I want Claude to apply edits I can undo and ask before running a command, and remember my yes, so that I am not asked twice.', [
  ['v7-chat-agent', 'New chat: Agent', 'open', 'SPAWN claude --permission-mode', 'The chat starts in Agent with Auto-review.'],
  ['v7-chat-picker', 'Open the mode picker', 'cycle', 'SPAWN claude --permission-mode', 'Agent, Plan and Ask; Shift+Tab cycles the same three.'],
  ['v7-set-runmode', 'Settings: Run Mode', 'start', 'READ settings files', 'Auto-review, Allowlist or Run Everything, with the protections below.'],
  ['v7-set-runmode-open', 'Open the Run Mode dropdown', 'start', 'none (UI)', 'Allowlist is the first row.'],
  ['v7-set-runmode-allowlist', 'Choose Allowlist on purpose', 'start', 'WRITE OmnIDE settings', 'Saved in OmnIDE\'s own settings; new chats use it.'],
  ['v7-edit-keep-undo', 'Claude edits a file', 'classify', 'SPAWN claude --permission-mode', 'In Allowlist the edit is applied and shown with Keep or Undo.'],
  ['v7-approval-pending', 'Claude asks to run a command', 'approve', 'permission request', 'npm test is not on the allowlist, so the card shows: Run, Skip or Always Run.'],
  ['v7-approval-always', 'Always Run', 'always', 'WRITE .claude/settings.local.json', 'The narrow rule Bash(npm test) is saved in the workspace.'],
  ['v7-set-allowlist', 'See the rule in Settings', 'applied', 'READ settings files', 'The rule is listed and can be removed.'],
], 6);
scen('v7-PlayAuto', 'Auto-review is unavailable', 'edge', 'As a developer on an older Claude Code, I want a clear fallback when Auto-review is unavailable, so that nothing runs unasked.', [
  ['v7-edge-auto-unavailable', 'Chat shows the notice', 'unavailable', 'SPAWN claude --permission-mode', 'Allowlist is used and a one-line notice says why.'],
  ['v7-set-auto-unavailable', 'Settings shows the reason', 'unavailable', 'READ settings files', 'Run Mode reads Allowlist with the reason under it.'],
  ['v7-edge-auto-admin', 'Or an admin disabled it', 'autoadmin', 'READ settings files', 'The Auto-review row is greyed with the reason.'],
], 6);
scen('v7-PlayAutoStops', 'Auto-review skips, pauses and fails', 'edge', 'As a developer on Auto-review, I want blocked actions to be skipped quietly and a card only when it truly pauses, so that I am not interrupted needlessly.', [
  ['v7-edge-auto-blocked', 'An action is skipped', 'blocked', 'none (UI)', 'A notice and a Recently blocked list; no card.'],
  ['v7-edge-auto-paused', 'Auto-review pauses', 'paused', 'permission request', 'After 3 blocks in a row or 20 in total the card shows.'],
  ['v7-approval-always', 'Always Run from the card', 'always', 'WRITE .claude/settings.local.json', 'Saves Bash(npm test) in the workspace.'],
  ['v7-edge-classifier-error', 'The classifier fails', 'classerr', 'permission request', 'Claude Code asks instead; nothing ran.'],
  ['v7-edge-auto-rejected', 'The server rejects auto mid-session', 'autooff', 'SPAWN claude --permission-mode', 'The chat continues like Allowlist.'],
], 6);
scen('v7-PlayRunMode', 'Change the Run Mode with chats open', 'edge', 'As a developer, I want a Run Mode change to apply to new chats and tell me about open ones, so that no running chat changes under me.', [
  ['v7-set-default-mode', 'Set the default for new chats', 'start', 'WRITE OmnIDE settings', 'New chats start in Agent with this Run Mode.'],
  ['v7-edge-runmode-changed', 'Open chats show Restart to apply', 'restart', 'SPAWN claude --permission-mode', 'The running chat keeps its mode until restarted.'],
], 6);
scen('v7-PlayBypass', 'Turn on Run Everything', 'edge', 'As a developer in a sandbox, I want Run Everything with a clear warning, so that I accept the risk knowingly; an admin may forbid it.', [
  ['v7-set-runmode-open', 'Open the Run Mode dropdown', 'bypass', 'none (UI)', 'Run Everything is the third row.'],
  ['v7-edge-bypass-dialog', 'Accept the warning', 'bypass', 'WRITE OmnIDE settings', 'OmnIDE\'s own dialog, shown once; Cancel keeps the old mode.'],
  ['v7-set-runmode-everything', 'Run Everything is on', 'bypass', 'SPAWN claude --permission-mode', 'New chats start with allowDangerouslySkipPermissions. Deny rules still apply.'],
  ['v7-edge-bypass-disabled', 'Admin has disabled it', 'admin', 'READ settings files', 'The row is greyed and cannot be picked.'],
], 6);
scen('v7-PlayAskRefused', 'Ask refuses an edit', 'error', 'As a developer reading code, I want Ask mode to refuse edits, so that a question never changes a file.', [
  ['v7-chat-ask', 'Switch to Ask', 'cycle', 'SPAWN claude --permission-mode', 'Shift+Tab or the picker. The bar reads No edits.'],
  ['v7-edge-ask-refused', 'Edit refused', 'ask', 'SPAWN claude --permission-mode', 'The file is untouched; Switch to Agent is offered.'],
], 6);

// --- ER: settings data ---
{
  const ent = (x, y, t, f) => `<div data-entity="${t}" style="position:absolute;left:${x}px;top:${y}px;width:300px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:6px"><div style="padding:8px 12px;font-weight:600;border-bottom:1px solid rgba(244, 242, 251, 0.08)">${t}</div>${f.map((r) => `<div style="padding:4px 12px;font-size:12px;color:${DIM}">${r}</div>`).join('')}</div>`;
  const body = `<div style="position:relative;width:1144px;height:420px;background:#0E0C14;border-radius:8px">${ent(20, 20, 'Chat', ['id', 'mode: agent | plan | ask', 'runMode (copy of the setting at start)', 'restartToApply: boolean'])}${ent(420, 20, 'RunModeSetting', ['value: auto | allowlist | bypass', 'default for new chats: Agent + Auto-review', 'stored in OmnIDE settings, never ~/.claude'])}${ent(820, 20, 'AllowRule', ['rule, for example Bash(npm test)', 'file: workspace .claude/settings.local.json', 'added by: Always Run | editor'])}${ent(420, 220, 'Protection', ['kind: file deletion | external files', 'on: boolean, both on by default', 'best effort: ask rules, or a refusal outside the workspace'])}${ent(820, 220, 'ManagedPolicy', ['disableAutoMode', 'disableBypassPermissionsMode', 'read only, wins over everything'])}
<svg role="img" aria-label="A chat uses one run mode setting; the setting is limited by the managed policy; allow rules and protections shape what asks" width="1144" height="420" viewBox="0 0 1144 420" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="er1" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker></defs><path d="M 322 90 L 416 90" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 722 90 L 816 90" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 570 160 L 570 216" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 970 160 L 970 216" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/></svg>
<span style="position:absolute;left:340px;top:68px;font-size:11px;color:${DIM}">1 : 1</span><span style="position:absolute;left:740px;top:68px;font-size:11px;color:${DIM}">1 : 0..*</span></div>
<p style="margin:14px 0 0;color:${DIM}">Run Mode, protections and the default live in OmnIDE's own settings; allow rules live in the workspace file; the managed policy is read only. There is no OmnIDE database. Field names beyond the Claude Code keys are proposals. TO VERIFY: where the per-chat mode is kept.</p>`;
  doc({ name: 'v7-DataModel', title: 'Data model: what the permissions settings hold', label: 'Architecture · ER', attrs: 'data-section="architecture" data-diagram="er"', intro: 'Four records and a managed policy. OmnIDE settings hold the first three; the workspace file holds allow rules.', body, row: 5 });
}
// --- sequence: Always Run ---
{
  const act = (x, t) => `<div style="position:absolute;left:${x}px;top:20px;width:200px;height:40px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:600">${t}</div><div style="position:absolute;left:${x + 100}px;top:60px;width:0;height:420px;border-left:1.5px dashed rgba(244, 242, 251, 0.35)"></div>`;
  const msg = (y, x1, x2, t) => `<svg width="1144" height="500" viewBox="0 0 1144 500" style="position:absolute;left:0;top:0;fill:none;pointer-events:none" aria-hidden="true"><path d="M ${x1} ${y} L ${x2} ${y}" stroke="#B69CFF" stroke-width="1.6" marker-end="url(#sq)"/></svg><span style="position:absolute;left:${Math.min(x1, x2) + 8}px;top:${y - 20}px;font-size:12px">${t}</span>`;
  const body = `<div style="position:relative;width:1144px;height:500px;background:#0E0C14;border-radius:8px"><svg role="img" aria-label="Sequence: Claude Code asks, the card shows, the user clicks Always Run, OmnIDE writes the rule, Claude Code runs the command" width="0" height="0" style="position:absolute"><defs><marker id="sq" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#B69CFF"/></marker></defs></svg>
${act(40, 'Developer')}${act(340, 'OmnIDE app')}${act(640, 'Claude Code')}${act(900, 'Workspace file').replace('left:900px', 'left:900px;width:200px')}
${msg(120, 740, 440, '1. permission request: Bash(npm test)')}${msg(170, 440, 140, '2. card: Run, Skip, Always Run')}${msg(220, 140, 440, '3. Always Run')}${msg(270, 440, 1000, '4. write allow rule to the workspace .claude/settings.local.json')}${msg(320, 440, 740, '5. allow the command')}${msg(380, 740, 740, '6. runs; next matching call does not ask')}</div>
<p style="margin:14px 0 0;color:${DIM}">Steps 1 and 5 use Claude Code's permission prompt. How OmnIDE intercepts it (the SDK permission callback or the CLI prompt) is TO VERIFY.</p>`;
  doc({ name: 'v7-SeqAlways', title: 'Sequence: Always Run', label: 'Architecture · sequence', attrs: 'data-section="architecture" data-diagram="sequence"', intro: 'What happens between the approval card and the saved rule, in order.', body, row: 5 });
}

// --- design tokens: copy of v5 ---
{
  let s = fs.readFileSync(P + 'v5-DesignTokens.dc.html', 'utf8');
  s = s.replace('data-page="v5"', 'data-page="v7"').replace('· v5 ·', '· v7 ·');
  s = s.replace(/data-status="current"/, `data-status="${STATUS}"`);
  W('v7-DesignTokens', s, 'Design tokens', 1240, 'doc', 6, false);
}

// --- decisions ---
{
  const dec = (id, t, ctx, chosen, rejected) => `<article data-decision="${id}" data-status="accepted" style="background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:8px;padding:14px 18px;margin:0 0 12px"><h2 style="margin:0 0 4px;font-size:17px">${t}</h2><p style="margin:0 0 8px;color:${DIM}">${ctx}</p><ul style="margin:0;padding-left:20px"><li data-option data-chosen><b>Chosen:</b> ${chosen}</li>${rejected.map(([a, why]) => `<li data-option data-why-not="${why}"><b>Rejected:</b> ${a}: ${why}</li>`).join('')}</ul></article>`;
  const body = [
    dec('v7-auto-skips', 'Auto-review skips; the card appears only on a pause or an ask rule', 'In auto mode Claude Code does not ask for each action: the classifier lets safe ones run and blocks the rest.', 'A blocked action is skipped with a notice and listed under Recently blocked, each with Run once and Always Run. The card shows only when auto pauses (3 blocks in a row or 20 in total) or an ask rule matches. The example rule is narrow, Bash(npm test); auto drops broad rules such as Bash(*).', [
      ['Show the Run, Skip, Always Run card on every block', 'auto never asks per action, so the card would promise a prompt Claude Code does not send'],
      ['Let Always Run save a broad rule such as Bash(*)', 'auto drops broad allow rules, so the click would do nothing'],
    ]),
    dec('v7-allowlist-acceptedits', 'Allowlist is acceptEdits plus allow rules', 'Cursor-style Allowlist applies edits and shows them for review, and asks for commands.', 'Start Claude Code in acceptEdits with the allow rules: edits are applied and shown with Keep or Undo, commands outside the allowlist ask. The fallback when Auto is unavailable is the same.', [
      ['default mode plus allow rules', 'every edit would ask first, which is not how Allowlist works in Cursor-style review and trains users to click through'],
    ]),
    dec('v7-ask-default-deny', 'Ask is default mode with deny rules on edits', 'Claude Code has no answer-only mode.', 'Start in default mode with deny rules on Edit, Write and NotebookEdit. Shell commands still go through the card. The bar reads No edits.', [
      ['plan mode plus a never-propose-edits rule', 'plan mode auto-approves commands during the plan and ends with a plan-approval prompt, neither of which an answer-only chat should have'],
      ['Ask as Agent with all tools denied', 'Claude could not read files to answer'],
      ['Drop Ask and keep Plan only', 'issue #19 asks for three modes, and a pure question should not produce a plan'],
    ]),
    dec('v7-no-global-write', 'OmnIDE never writes the user\'s global Claude settings', 'The user\'s ~/.claude/settings.json also drives their CLI.', 'Each chat is started with --permission-mode (the SDK permissionMode option) and OmnIDE keeps Run Mode in its own settings. Allow rules from Always Run go to the workspace .claude/settings.local.json. Run Everything chats start with allowDangerouslySkipPermissions.', [
      ['Write permissions.defaultMode to ~/.claude/settings.json', 'it would change how the user\'s terminal Claude behaves without them asking'],
    ]),
    dec('v7-bypass', 'Run Everything gets OmnIDE\'s own one-time dialog', 'Claude Code shows its bypass warning in a terminal; the Agent Host is not one.', 'OmnIDE shows the warning once and stores the acceptance in its own settings. skipDangerousModePermissionPrompt is never written. The option is greyed when managed settings disable it.', [
      ['Write skipDangerousModePermissionPrompt ourselves', 'it hides the one warning that explains the risk and edits a global file'],
      ['Hide the option when disabled', 'the user cannot see why a mode they expect is missing'],
    ]),
    dec('v7-protections', 'Protections are best effort, and there is no browser protection', 'Claude Code rules match command text and paths.', 'File deletion (on) uses ask rules and can be bypassed with find -delete, git clean and the like. External files (on) uses blockWritesOutsideWorkingDirectories, which refuses rather than asks. Both are labelled best effort in Settings. The browser protection is dropped: Claude Code has no browser tool.', [
      ['Promise that deletion always asks', 'rm rules cannot see every way a command deletes a file'],
      ['Keep a Browser protection toggle', 'there is no tool for the rule to match'],
    ]),
    dec('v7-sandbox-toggle', 'No sandbox toggle on Allowlist', 'The issue mentioned an optional sandbox.', 'Dropped for now. Claude Code\'s sandbox is a separate feature and nothing fetched shows how it combines with acceptEdits. It can return as its own change.', [
      ['A sandbox toggle marked TO VERIFY', 'a switch that may do nothing is worse than none'],
    ]),
    dec('v7-cursor-claims', 'Claims about Cursor are limited to what its docs say', 'Cursor\'s agent docs (fetched 2026-11-26) describe Agent, Plan and Ask. They do not cover Run, Skip and Always Run.', 'Say that the buttons are our proposal. Note that Cursor\'s Auto-review is sandboxed and takes natural-language instructions, and Claude\'s auto does neither.', [
      ['Describe the card as copied from Cursor', 'the sources do not show that'],
    ]),
    dec('v7-two-settings', 'Two settings, Mode and Run Mode', 'Claude Code has one list of modes that mixes what Claude does with how much it asks. Cursor\'s docs list Agent, Plan and Ask as modes, and the owner chose this split on 2026-11-26.', 'The chat picker holds Agent, Plan and Ask. Settings holds Run Mode: Auto-review, Allowlist, Run Everything. Together they map onto Claude Code modes.', [
      ['Show Claude Code\'s modes in one picker (default, acceptEdits, plan, auto, bypassPermissions)', 'Shift+Tab would reach bypassPermissions, and users cannot tell "what Claude does" from "how much it asks"'],
      ['Also offer dontAsk', 'it is for non-interactive CI runs and would make a chat silently refuse anything not allowed'],
    ]),
    dec('v7-default', 'New chats start in Agent with Auto-review', 'A default has to be safe and useful without setup.', 'Agent with Auto-review, configurable in Settings. Where Auto is unavailable the chat starts in Allowlist with a notice.', [
      ['Start in Allowlist everywhere', 'asks far more often and teaches users to click Always Run without reading'],
      ['Start in Run Everything', 'turns approvals off before the user chose it'],
    ]),
  ].join('');
  doc({ name: 'v7-Decisions', title: 'Decisions', label: 'Decisions', minH: 900, attrs: 'data-section="decisions"', intro: 'What was chosen, what was turned down and why. Newest first. Issue #19 said five modes; the docs list six values.', body, row: 6 });
}

// --- plan ---
{
  const rows = [
    ['Chat picker and Shift+Tab', 'Agent, Plan, Ask in the composer; per-chat state', 'v7-chat-picker'],
    ['Settings: Run Mode, protections, default mode', 'Dropdown, Allowlist editor, two best-effort protections, default for new chats', 'v7-set-runmode'],
    ['Edits and the inline approval card', 'Keep or Undo on edits; Run, Skip, Always Run for commands and the three after-states', 'v7-approval-pending'],
    ['Auto-review states', 'Skipped action, pause, classifier error, server rejection', 'v7-edge-auto-blocked'],
    ['Mapping to Claude Code', 'Start each chat with the mode; write allow rules to the workspace file only', 'v7-Mapping'],
    ['Edge cases', 'Auto fallback, admin blocks, bypass dialog, Ask refusal, Run Mode change', 'v7-EdgeCases'],
  ].map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${link(r[2], r[2])}</td></tr>`).join('');
  doc({ name: 'v7-Plan', title: 'Plan: what changes, in order', label: 'Plan', minH: 500, attrs: 'data-section="plan"', intro: 'Issue <a href="https://github.com/MehdiMamas/omnide/issues/19">#19</a> holds the plan; no code starts before the owner\'s yes on this page. Out of scope: other agents, a cloud sandbox.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>#</th><th>Step</th><th>What</th><th>Frame</th></tr></thead><tbody>${rows}</tbody></table><p style="margin:14px 0 0;color:${DIM}">Check per step: the built screen is compared with its frame here, and a real Claude Code run shows each mode and rule.</p>`, row: 6 });
}

// --- questions ---
{
  const q = [
    ['How does OmnIDE know Auto is unavailable before the first message? Docs name model, Claude Code version and admin setting; the issue also names plan. TO VERIFY by running it.', 'Claude, by testing'],
    ['How does an auto pause or a classifier error reach OmnIDE through the SDK, so the card can show? TO VERIFY.', 'Claude, by running Claude Code'],
    ['Do deny rules on Edit, Write and NotebookEdit stop every edit in Ask, including shell redirects? TO VERIFY.', 'Owner decides after a test'],
    ['Does the SDK return to bypassPermissions after Plan or Ask in a Run Everything chat? TO VERIFY.', 'Claude, by testing'],
    ['Which commands ship in the default Allowlist (the frames show Bash(npm test) as an example).', 'Owner'],
    ['Always Run writes to the workspace .claude/settings.local.json. Confirm that, not a shared project file, is wanted.', 'Owner'],
    ['Should the sandbox toggle come back as its own change once Claude Code\'s sandbox is checked?', 'Owner'],
  ].map((r, i) => `<li data-question="q${i + 1}" style="margin:0 0 10px">${r[0]} <span style="color:${DIM}">· ${r[1]}</span></li>`).join('');
  doc({ name: 'v7-Questions', title: 'Open questions and risks', label: 'Questions', minH: 520, attrs: 'data-section="questions"', intro: 'Answer by commenting on this frame.', body: `<ol style="margin:0;padding-left:22px;max-width:1080px">${q}</ol>`, row: 6 });
}

// --- history ---
doc({ name: 'v7-History', title: 'History', label: 'History', minH: 400, attrs: 'data-section="history"', intro: 'Every change to this canvas, newest first. Earlier rows are on the v5 page.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>Date</th><th>Page</th><th>Change</th><th>Why</th></tr></thead><tbody><tr data-change data-date="${D}" data-page="v7"><td>${D}</td><td>v7</td><td>Copy of v6 with eight fixes: Auto-review skips and pauses instead of asking on every block; Allowlist is acceptEdits with Keep or Undo; Ask is default with deny rules and reads No edits; OmnIDE never writes the global Claude settings; its own Run Everything dialog; protections are best effort and the browser protection is dropped; eight new state frames; Cursor claims limited to what its docs say. v6 is superseded.</td><td>A fresh review of v6 found eight problems.</td></tr><tr data-change data-date="${D}" data-page="v6"><td>${D}</td><td>v6</td><td>New To-be page for permissions: chat picker and Shift+Tab, Settings Run Mode with Allowlist and protections, the inline approval card, four edge cases, the mapping to Claude Code, decisions and four scenarios. v5 is unchanged.</td><td>Issue #19, chosen by the owner on 2026-11-26.</td></tr></tbody></table>`, row: 6 });

// --- progress ---
doc({ name: 'v7-Progress', title: `v7: ${boards.length + 2} frames built`, label: 'Plan · progress', minH: 300, attrs: 'data-section="plan"', intro: 'Status of this page. v6 is superseded by it; v5 stays the current page for everything else.', body: `<div style="height:8px;border-radius:4px;background:rgba(244, 242, 251, 0.08);margin:0 0 18px"><div data-progress style="width:${STATUS === 'current' ? '100' : '90'}%;height:8px;border-radius:4px;background:#41CB7E"></div></div><div style="${card};margin:0 0 10px"><b>${STATUS === 'current' ? 'Done' : 'In progress'}: the eight fixes to v6</b><br><span style="color:${DIM}">Auto-review states, Allowlist and Ask mapping, settings storage, bypass dialog, protections, eight new state frames and the Cursor wording are built. Open questions are on the Questions frame.</span></div>`, row: 0 });

// --- cover ---
{
  const screens = boards.filter((b) => b.kind === 'screen');
  const li = (b) => `<div style="${card};padding:8px 12px"><a href="${b.name}.dc.html">${b.title}</a></div>`;
  const grid = (arr) => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:0 0 18px">${arr.map(li).join('')}</div>`;
  const docs = boards.filter((b) => b.kind === 'doc' && !b.name.includes('Play'));
  const plays = boards.filter((b) => b.name.includes('Play'));
  const body = `<p style="margin:0 0 12px"><b>Play:</b> start at <a href="v7-chat-agent.dc.html">the chat</a> and click real buttons, or walk a scenario. <b>How to read:</b> frames are boxes; blue text opens one; red marks an edge case; screens hold only the app and explanations sit on the diagram frames. <b>Older versions:</b> <a href="#page-v6">v6 · superseded by this page</a>, <a href="#page-v5">v5 · 2026-11-26</a> (the current product canvas) and <a href="#page-v4">v4 · superseded</a>. <b>Sections:</b> all nine apply; none is N/A. Updated ${D}.</p>
<h2 style="font-size:18px;margin:8px 0 8px">Scenarios</h2>${grid(plays)}
<h2 style="font-size:18px;margin:8px 0 8px">Sitemap: screens</h2>${grid(screens)}
<h2 style="font-size:18px;margin:8px 0 8px">Diagrams and sections</h2>${grid(docs)}`;
  doc({ name: 'v7-Main', title: 'OmnIDE v7: permissions (To-be)', label: 'Start here', w: 1440, minH: 900, attrs: 'data-section="cover" data-profile="change"', intro: 'Permissions on Claude Code in the shape of Cursor\'s Agent, Plan and Ask: modes in the chat, Run Mode and best-effort protections in Settings, and an approval card in the chat. Plan: <a href="https://github.com/MehdiMamas/omnide/issues/19">omnide#19</a>. Status: in progress, waiting for your yes. Sources: Cursor agent docs (they do not cover Run, Skip and Always Run) and Claude Code permission docs, both checked 2026-11-26.', body, row: 0 });
}

// ---------- canvas.json ----------
const cp = P + 'canvas.json';
const c = JSON.parse(fs.readFileSync(cp, 'utf8'));
for (const k of Object.keys(c.boards)) if (c.boards[k].page === 'v7') { delete c.boards[k]; }
c.order = c.order.filter((k) => !k.startsWith('v7-'));
c.pages = [{ id: 'v7', name: PAGE_NAME }, ...c.pages.filter((p) => p.id !== 'v7')];
c.launch = { view: 'canvas', page: 'v7' };
const rows = {};
boards.sort((a, b) => a.row - b.row);
let y = 0;
const rowY = {};
const rowList = [...new Set(boards.map((b) => b.row))];
for (const r of rowList) {
  const inRow = boards.filter((b) => b.row === r);
  let x = 0, mh = 0;
  for (const b of inRow) {
    const h = b.kind === 'screen' ? (heights[b.name] || 960) : (heights[b.name] || 1000);
    c.boards[b.name + '.dc.html'] = { x, y, w: b.w, h, page: 'v7', title: b.title, ...(b.interactive ? { is_interactive: true } : {}) };
    c.order.unshift(b.name + '.dc.html');
    x += b.w + 80; mh = Math.max(mh, h);
  }
  y += mh + 120;
}
fs.writeFileSync(cp, JSON.stringify(c, null, 2) + '\n');
fs.writeFileSync('v7-boards.json', JSON.stringify(boards.map((b) => b.name)));
console.log('boards', boards.length);
