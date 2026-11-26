// Builds the v6 To-be (permissions, issue #19) boards and registers them in canvas.json.
// Usage: node v6-build.mjs [--page-name "v6 · ..."] ; heights come from v6-heights.json (made by v6-heights.mjs).
import fs from 'node:fs';
import * as S from './v6-screens.mjs';
const { A, FONT, P, D, mk, addOverlay, bar, chat, picker, approval, settings, elements } = S;

const PAGE_NAME = process.argv.includes('--page-name') ? process.argv[process.argv.indexOf('--page-name') + 1] : 'v6 · To-be · permissions · in progress';
const STATUS = process.argv.includes('--final') ? 'current' : 'in-progress';
const boards = []; // {file,title,w,kind,row}
const dedupe = (h) => { const seen = {}; return h.replace(/\bid="([^"]*)"/g, (m, id) => { seen[id] = (seen[id] || 0) + 1; return seen[id] === 1 ? m : `id="${id}-${seen[id]}"`; }); };
const W = (name, html, title, w, kind, row, interactive) => {
  html = dedupe(html).replace(/<div data-superseded-by="v6" data-page="v6"/, '<div data-page="v6"').replace(/ data-was="[a-z-]+"/, '').replace(/<a href="v6-Main.dc.html"[^>]*>Superseded by v6<\/a>/, '').replace(/data-status="superseded"/, `data-status="${STATUS}"`);
  fs.writeFileSync(P + name + '.dc.html', html);
  boards.push({ name, title, w, kind, row, interactive });
};

// ---------- screens ----------
const SW = 1440;
const sc = (name, html, title, row) => W(name, html, title, SW, 'screen', row, true);

// chat modes + picker
sc('v6-chat-agent', chat('Agent', 'Agent mode, Auto-review'), 'Chat: Agent', 1);
sc('v6-chat-picker', picker(), 'Chat: mode picker open', 1);
sc('v6-chat-plan', chat('Plan', 'Plan mode'), 'Chat: Plan', 1);
sc('v6-chat-ask', chat('Ask', 'Ask mode'), 'Chat: Ask', 1);

// settings
const popBox = (selected, disabledEverything) => {
  const row = (label, sub, href, on, off) => {
    const inner = `<span style="flex:1">${label}${sub ? `<br><span style="font-size:11px;opacity:.7">${sub}</span>` : ''}</span>${on ? '<span class="codicon codicon-check" style="font-size:14px"></span>' : ''}`;
    const st = `display:flex;align-items:center;box-sizing:border-box;padding:6px 8px;border-radius:5px;color:#D2CFE0;text-decoration:none;${FONT};font-size:13px;${on ? 'background:rgba(244,242,251,.08);' : ''}${off ? 'opacity:.45;' : ''}`;
    return href ? `<a href="${href}" aria-label="${label}" style="${st}">${inner}</a>` : `<div style="${st}">${inner}</div>`;
  };
  return `<div style="position:absolute;left:601px;top:244px;width:230px;box-sizing:border-box;z-index:2000000;background:#1A1823;border:1px solid rgba(244,242,251,.16);border-radius:8px;padding:4px;display:flex;flex-direction:column;gap:2px">`
    + row('Allowlist', '', 'v6-set-runmode-allowlist.dc.html', selected === 'Allowlist')
    + row('Auto-review', '', 'v6-set-runmode.dc.html', selected === 'Auto-review')
    + (disabledEverything ? row('Run Everything', 'Disabled by your administrator', null, false, true) : row('Run Everything', '', 'v6-edge-bypass-dialog.dc.html', selected === 'Run Everything'))
    + '</div>';
};
const closeOpen = (href) => A(href, 'Close the dropdown', 300, 70, 820, 838);
const toChat = A('v6-chat-agent.dc.html', 'Open the chat', 1137, 70, 286, 150);
const trig = (href, label = 'Open the Run Mode dropdown') => A(href, label, 601, 213, 100, 28);
const allowRow = A('v6-set-allowlist.dc.html', 'Open Allowlist Options', 589, 738, 483, 70);

const base = (run, desc, state) => settings(state, { run, desc });
sc('v6-set-runmode', addOverlay(base('Auto-review', null, 'Run Mode: Auto-review'), trig('v6-set-runmode-open.dc.html') + allowRow + toChat), 'Settings: Run Mode', 2);
sc('v6-set-runmode-open', addOverlay(base('Auto-review', null, 'Run Mode dropdown open') , closeOpen('v6-set-runmode.dc.html') + popBox('Auto-review')), 'Settings: Run Mode dropdown', 2);
sc('v6-set-runmode-allowlist', addOverlay(base('Allowlist', 'Claude asks before each action unless it matches an Allowlist rule.', 'Run Mode: Allowlist'), trig('v6-set-runmode-open.dc.html') + allowRow + toChat), 'Settings: Run Mode, Allowlist', 2);
sc('v6-set-runmode-everything', addOverlay(base('Run Everything', 'Claude runs every action without asking. Deny rules still apply; Allowlist rules have no effect.', 'Run Mode: Run Everything'), trig('v6-set-runmode-open-everything.dc.html') + toChat), 'Settings: Run Everything on', 2);
sc('v6-set-runmode-open-everything', addOverlay(base('Run Everything', 'Claude runs every action without asking. Deny rules still apply; Allowlist rules have no effect.', 'Run Mode dropdown open, Run Everything'), closeOpen('v6-set-runmode-everything.dc.html') + popBox('Run Everything')), 'Settings: dropdown, Run Everything on', 2);

// allowlist editor: panel over the lower settings
const rule = (r, src) => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(244,242,251,.08)"><code style="flex:1;font:12px 'Geist Mono',ui-monospace,monospace;color:#C4B5FD">${r}</code><span style="font-size:11px;opacity:.65;width:150px">${src}</span><a href="v6-set-allowlist.dc.html" aria-label="Remove ${r}" style="color:#F2777A;text-decoration:none;font-size:12px">Remove</a></div>`;
const allowPanel = `<div style="position:absolute;left:589px;top:726px;width:483px;height:182px;box-sizing:border-box;z-index:2000000;background:#1A1823;border:1px solid rgba(244,242,251,.12);border-radius:8px;padding:10px 12px;${FONT};color:#D2CFE0;overflow:hidden">
<div style="font-size:13px;font-weight:500;color:#F4F2FB">Allowlist Options</div><div style="opacity:.7;margin:2px 0 4px">Rules in Claude Code's settings files, so the CLI behaves the same.</div>
${rule('Bash(npm run test *)', 'Project, shared')}${rule('Bash(node -e *)', 'Project, local')}${rule('Read(./docs/**)', 'User')}
<div style="display:flex;gap:6px;margin-top:8px"><div style="flex:1;height:26px;box-sizing:border-box;border:1px solid rgba(244,242,251,.18);border-radius:4px;padding:5px 8px;opacity:.6">Add a rule, for example Bash(git status)</div><a href="v6-set-allowlist.dc.html" aria-label="Add rule" style="width:64px;height:26px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#6D28D9;color:#F4F2FB;text-decoration:none">Add</a></div></div>`;
sc('v6-set-allowlist', addOverlay(base('Auto-review', null, 'Allowlist editor open'), allowPanel + A('v6-set-runmode.dc.html', 'Collapse Allowlist Options', 589, 726, 483, 28) + toChat), 'Settings: Allowlist editor', 2);

// approval card
sc('v6-approval-pending', approval('pending', 'Approval card, waiting'), 'Approval: waiting', 3);
sc('v6-approval-ran', approval('ran', 'Approval card, ran'), 'Approval: ran', 3);
sc('v6-approval-skipped', approval('skipped', 'Approval card, skipped'), 'Approval: skipped', 3);
sc('v6-approval-always', approval('always', 'Approval card, added to allowlist'), 'Approval: always run', 3);

// edge cases
const notice = `<div style="position:absolute;left:943px;top:262px;width:266px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:8px 12px;${FONT}">Auto-review isn't available here, so Allowlist is on. <a href="v6-set-auto-unavailable.dc.html" aria-label="Open Run Mode settings" style="color:#B69CFF;text-decoration:none">Run Mode settings</a></div>`;
sc('v6-edge-auto-unavailable', chat('Agent', 'Auto-review unavailable, notice', notice, 'Allowlist'), 'Edge: Auto unavailable (chat)', 4);
sc('v6-set-auto-unavailable', addOverlay(base('Allowlist', 'Auto-review is unavailable for this model or Claude Code version, so Allowlist is used.', 'Auto-review unavailable'), trig('v6-set-runmode-open.dc.html') + toChat), 'Edge: Auto unavailable (settings)', 4);
const dlg = `<div style="position:absolute;left:0;top:0;width:1440px;height:931px;z-index:2000000;background:rgba(0,0,0,.5)"></div>
<div style="position:absolute;left:490px;top:300px;width:460px;box-sizing:border-box;z-index:2000001;background:#1A1823;border:1px solid rgba(244,242,251,.16);border-radius:10px;padding:18px 20px;${FONT};font-size:13px;color:#D2CFE0;box-shadow:0 12px 40px rgba(0,0,0,.5)">
<div style="font-size:15px;font-weight:500;color:#F4F2FB;margin-bottom:8px">Run Everything skips every approval</div>
<div style="line-height:1.5">Claude will run commands and edit files without asking. Deny rules still apply; Allowlist rules have no effect. Use it only in a sandbox or a project you trust.</div>
<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><a href="v6-set-runmode-open.dc.html" aria-label="Cancel" style="height:28px;padding:0 14px;box-sizing:border-box;display:flex;align-items:center;border:1px solid rgba(244,242,251,.18);border-radius:5px;color:#D2CFE0;text-decoration:none">Cancel</a><a href="v6-set-runmode-everything.dc.html" aria-label="Accept and enable Run Everything" style="height:28px;padding:0 14px;box-sizing:border-box;display:flex;align-items:center;border-radius:5px;background:#6D28D9;color:#F4F2FB;text-decoration:none">I accept the risk</a></div></div>`;
sc('v6-edge-bypass-dialog', addOverlay(base('Auto-review', null, 'Run Everything first-time acceptance dialog'), dlg), 'Edge: Run Everything acceptance dialog', 4);
sc('v6-edge-bypass-disabled', addOverlay(base('Auto-review', null, 'Run Everything disabled by admin'), closeOpen('v6-set-runmode.dc.html') + popBox('Auto-review', true)), 'Edge: Run Everything disabled by admin', 4);
// ask refused
{
  let s = mk('v5-ai-14-agent-turn-streaming.dc.html', 'OmnIDE Chat', 'Ask mode, edit refused');
  s = s.replace('Reply with one word: hi', 'Rename TodoList to TaskList in src/todo.ts').replace('Read src/version.ts then reply with', 'Please apply it now').replace('>hi<', ">Ask mode can't change files.<").replace('>Thinking<', '>Thought 2s<');
  s = s.replace(/(<p[^>]*>)Sonnet 5\.5(<\/p>)/, '$1Ask · Sonnet 5.5$2');
  s = bar(s, 'Ask', 'read-only');
  const c = `<div style="position:absolute;left:937px;top:352px;width:280px;box-sizing:border-box;z-index:2000000;background:#1A1823;color:#D2CFE0;border:1px solid rgba(244,242,251,.14);border-radius:8px;padding:10px 12px;${FONT}"><div style="font-weight:500;font-size:13px;color:#F2777A">Edit refused</div><div style="margin:6px 0 8px">Ask mode answers only. src/todo.ts was not changed.</div><a href="v6-chat-agent.dc.html" aria-label="Switch to Agent" style="display:inline-flex;height:26px;padding:0 12px;box-sizing:border-box;align-items:center;border-radius:4px;background:#6D28D9;color:#F4F2FB;text-decoration:none">Switch to Agent</a></div>`;
  sc('v6-edge-ask-refused', addOverlay(s, c + A('v6-set-runmode.dc.html', 'Open OmnIDE Settings', 1272, 6, 22, 22)), 'Edge: Ask refuses an edit', 4);
}

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
const heights = fs.existsSync('v6-heights.json') ? JSON.parse(fs.readFileSync('v6-heights.json', 'utf8')) : {};
function doc({ name, title, label, w = 1240, minH = 600, attrs = '', intro, body, row, kind = 'doc', interactive }) {
  const root = `<div data-page="v6" data-created="${D}" data-updated="${D}" data-status="${STATUS}" ${attrs} style="position:relative;width:${w}px;min-height:${minH}px;box-sizing:border-box;padding:40px 48px;background:#14121B;color:#F4F2FB;font-family:'Geist','Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.5">
<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${DIM}">${label} · v6 · ${D} · updated ${D}</div><h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">${title}</h1><p style="margin:0 0 20px;max-width:1000px;color:${DIM}">${intro}</p>
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
  let h = lanes.map((l, i) => `<div data-lane="${l}" style="position:absolute;left:48px;top:${tops[i]}px;width:1264px;height:152px;background:#1A1823;border-radius:6px"><span style="position:absolute;left:12px;top:12px;font-size:12px;font-weight:600;color:${DIM}">${l}</span></div>`).join('\n');
  const N = [
    ['open', 1, 0, 140, 'Open a chat: Agent, Auto-review'],
    ['start', 2, 1, 288, 'Start Claude Code in auto mode'],
    ['classify', 3, 2, 436, 'Classifier reviews each action'],
    ['approve', 4, 0, 584, 'Card: Run, Skip or Always Run'],
    ['always', 5, 1, 732, 'Always Run saves an allow rule'],
    ['applied', 6, 2, 880, 'Rule applies from the next call'],
    ['cycle', 7, 0, 1028, 'Shift+Tab: Agent, Plan, Ask'],
  ];
  const pos = {};
  for (const [id, n, lane, x, t] of N) { pos[id] = [x, tops[lane] + 16]; h += '\n' + box(x, tops[lane] + 16, 128, 52, t, { attrs: `data-node="${id}" data-n="${n}"`, n }); }
  const R = [
    ['unavailable', 288, 'Auto unavailable: Allowlist and a notice', 'v6-edge-auto-unavailable.dc.html', 'start'],
    ['bypass', 584, 'Run Everything: bypass dialog', 'v6-edge-bypass-dialog.dc.html', 'approve'],
    ['admin', 732, 'Admin blocks Run Everything', 'v6-edge-bypass-disabled.dc.html', 'always'],
    ['ask', 880, 'Ask: edit refused', 'v6-edge-ask-refused.dc.html', 'applied'],
  ];
  let paths = '';
  for (let i = 0; i < N.length - 1; i++) {
    const a = pos[N[i][0]], b = pos[N[i + 1][0]];
    const x1 = a[0] + 128, y1 = a[1] + 26, x2 = b[0], y2 = b[1] + 26, m = x1 + 4;
    paths += `<path d="M ${x1} ${y1} L ${m} ${y1} L ${m} ${y2} L ${x2 - 4} ${y2}" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#ar)"/>`;
  }
  for (const [id, x, t, href, from] of R) {
    h += '\n' + red(id, x, 650, t, href);
    const f = pos[from];
    paths += `<path d="M ${f[0] + 64} ${f[1] + 52} L ${x + 64} 648" stroke="#F2777A" stroke-dasharray="4 3" marker-end="url(#arr)"/>`;
  }
  h += `\n<svg role="img" aria-label="Arrows from each step to the next, and red dashed arrows down to the four edge cases" width="1360" height="820" viewBox="0 0 1360 820" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6;pointer-events:none"><defs><marker id="ar" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker><marker id="arr" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#F2777A"/></marker></defs>${paths}</svg>`;
  h += `\n<div data-legend style="position:absolute;left:48px;top:800px;display:flex;gap:18px;font-size:12px;color:${DIM}"><span><b style="display:inline-block;width:18px;height:2px;background:rgba(244, 242, 251, 0.5);vertical-align:middle"></b> normal path</span><span><b style="display:inline-block;width:18px;height:2px;background:#F2777A;vertical-align:middle"></b> edge case: click to open its screen</span><span><b style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#B69CFF;vertical-align:middle"></b> step number</span></div>`;
  h += `\n<div style="position:absolute;left:48px;top:832px;width:1264px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cardNote('why', 'Two settings, not five modes', 'What Claude does (Agent, Plan, Ask) is picked per chat. How much it asks (Run Mode) is picked once in Settings. Shift+Tab only moves between the first three, so it can never reach Run Everything.')}${cardNote('never-assumed', 'Never assumed', 'Auto-review is the default only where Claude Code offers it; nothing here changes what Claude Code decides, OmnIDE only picks the mode and writes the rules Claude Code reads.')}${cardNote('to-verify', 'To verify', 'How OmnIDE detects that Auto is unavailable before the first message, and the exact bypass dialog wording, need a run against the real Claude Code. Not seen running yet.')}</div>`;
  doc({ name: 'v6-FlowPermissions', title: 'Permissions flow: from a new chat to Always Run', label: 'Flows', w: 1360, minH: 1060, attrs: 'data-section="flows" data-diagram="flow"', intro: 'A new chat starts in Agent with Auto-review. Always Run saves a rule. Red boxes are edge cases: click one.', body: h, row: 5 });
}

// --- state: mode cycle ---
{
  const st = (x, id, t, sub) => `<div data-state-node="${id}" style="position:absolute;left:${x}px;top:30px;width:240px;height:96px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:10px;padding:14px;text-align:center"><div style="font-size:18px;font-weight:600">${t}</div><div style="font-size:12px;color:${DIM};margin-top:4px">${sub}</div></div>`;
  const body = `<div data-diagram="state" style="position:relative;height:330px;background:#0E0C14;border-radius:8px;margin-bottom:16px">
${st(60, 'agent', 'Agent', 'Claude Code: auto, default or bypassPermissions, by Run Mode')}${st(480, 'plan', 'Plan', 'Claude Code: plan')}${st(900, 'ask', 'Ask', 'Claude Code: plan + never propose edits')}
<svg role="img" aria-label="Shift+Tab moves Agent to Plan, Plan to Ask, and Ask back to Agent" width="1144" height="330" viewBox="0 0 1144 330" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="sa" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#B69CFF"/></marker></defs><path d="M 300 78 L 476 78" stroke="#B69CFF" marker-end="url(#sa)"/><path d="M 720 78 L 896 78" stroke="#B69CFF" marker-end="url(#sa)"/><path d="M 1020 130 L 1020 230 L 180 230 L 180 134" stroke="#B69CFF" marker-end="url(#sa)"/></svg>
<span style="position:absolute;left:340px;top:52px;font-size:12px;color:${DIM}">Shift+Tab</span><span style="position:absolute;left:760px;top:52px;font-size:12px;color:${DIM}">Shift+Tab</span><span style="position:absolute;left:520px;top:238px;font-size:12px;color:${DIM}">Shift+Tab</span>
<div data-legend style="position:absolute;left:24px;top:290px;display:flex;gap:18px;font-size:12px;color:${DIM}"><span><b style="display:inline-block;width:18px;height:2px;background:#B69CFF;vertical-align:middle"></b> Shift+Tab, one step</span><span>Each chat keeps its own mode; a new chat starts in Agent.</span></div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cardNote('why', 'Three stops, not five', 'Run Everything and Auto are not stops, so a stray Shift+Tab cannot switch off approvals.')}${cardNote('never-assumed', 'Not in the cycle', 'acceptEdits and dontAsk are not offered. dontAsk is for CI runs only.')}${cardNote('to-verify', 'To verify', 'Whether OmnIDE can keep Ask read-only with a rule alone. See Questions.')}</div>
<p style="margin:16px 0 0;color:${DIM}">Screens: ${link('v6-chat-agent', 'Agent')}, ${link('v6-chat-plan', 'Plan')}, ${link('v6-chat-ask', 'Ask')}, ${link('v6-chat-picker', 'picker open')}.</p>`;
  doc({ name: 'v6-ModeCycle', title: 'Mode cycle: Agent, Plan, Ask', label: 'Flows · state', attrs: 'data-section="flows" data-diagram="state"', intro: 'The chat mode picker and the Shift+Tab cycle move through the same three modes. Each is a Claude Code mode, listed in the mapping frame.', body, row: 5 });
}

const EP = [
  ['SPAWN claude --permission-mode', 'A chat starts or its mode changes', 'Claude Code runs in default, plan, auto or bypassPermissions'],
  ['WRITE .claude/settings.local.json', 'The user clicks Always Run', 'A permissions.allow rule is added'],
  ['WRITE ~/.claude/settings.json', 'The user sets Run Mode, protections or accepts the Run Everything warning', 'permissions.defaultMode, ask rules or skipDangerousModePermissionPrompt'],
  ['READ settings files', 'Settings opens or the allowlist editor opens', 'Rules from user, project, local and managed files, with the file shown'],
];
// --- mapping (component) ---
{
  const L = [['Agent + Auto-review', 'auto'], ['Agent + Allowlist', 'default + permissions.allow'], ['Agent + Run Everything', 'bypassPermissions'], ['Plan', 'plan'], ['Ask', 'plan + a never-propose-edits rule']];
  let g = '';
  L.forEach(([a, b], i) => {
    g += box(20, 20 + i * 70, 300, 52, a, { attrs: `data-component="omnide-${i}"` }) + box(560, 20 + i * 70, 340, 52, b, { attrs: `data-component="claude-${i}"`, border: '#B69CFF' });
  });
  const paths = L.map((_, i) => `<path d="M 322 ${46 + i * 70} L 556 ${46 + i * 70}" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#cm)"/>`).join('');
  const rows = [
    ['Auto-review', 'permissions.defaultMode = auto, or --permission-mode auto', 'User or managed settings only; a project file cannot set it', 'code.claude.com/docs/en/permission-modes'],
    ['Allowlist', 'default mode with permissions.allow rules', 'Always Run writes a rule such as Bash(node -e *) to .claude/settings.local.json', 'code.claude.com/docs/en/permissions'],
    ['Run Everything', 'bypassPermissions', 'Deny rules still apply, allow rules have no effect. First start shows a warning; accepting writes skipDangerousModePermissionPrompt to ~/.claude/settings.json', 'code.claude.com/docs/en/permission-modes'],
    ['Admin blocks', 'permissions.disableAutoMode, permissions.disableBypassPermissionsMode = "disable"', 'Managed settings win over everything; OmnIDE greys the option', 'code.claude.com/docs/en/permission-modes'],
    ['Plan', 'plan', 'Edits blocked until the plan is approved', 'code.claude.com/docs/en/permission-modes'],
    ['Ask', 'plan, plus a rule', 'Claude Code has no answer-only mode. TO VERIFY: how the rule is enforced', 'code.claude.com/docs/en/permission-modes'],
    ['Protection: file deletion', 'permissions.ask rules', 'TO VERIFY: patterns, for example Bash(rm *)', 'code.claude.com/docs/en/permissions'],
    ['Protection: external files', 'permissions.ask rules, or permissions.blockWritesOutsideWorkingDirectories and blockReadsOutsideWorkingDirectories', 'TO VERIFY: which of the two OmnIDE writes', 'code.claude.com/docs/en/permissions'],
    ['Protection: browser', 'permissions.ask rule for the browser tool', 'TO VERIFY: the tool name', 'not found yet'],
  ];
  const tr = rows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${code(r[1])}</td><td>${r[2]}</td><td><a data-source href="${r[3].startsWith('http') ? r[3] : 'https://' + r[3]}" data-fetched="2026-11-26">${r[3]}</a></td></tr>`).join('');
  const body = `<div data-diagram="component" style="position:relative;width:1144px;height:380px;background:#0E0C14;border-radius:8px;margin-bottom:8px">
<div style="position:absolute;left:20px;top:2px;font-size:11px;color:${DIM};letter-spacing:.06em;text-transform:uppercase"></div>${g}
<svg role="img" aria-label="Each OmnIDE choice points to the Claude Code mode it starts" width="1144" height="380" viewBox="0 0 1144 380" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="cm" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker></defs>${paths}</svg>
<div style="position:absolute;left:930px;top:20px;width:190px;font-size:12px;color:${DIM}">Left: what the user picks in OmnIDE. Right: what OmnIDE starts or writes in Claude Code. dontAsk (CI only) is not offered.</div></div>
<table style="width:100%;font-size:13px"><thead><tr><th>OmnIDE</th><th>Claude Code key or mode</th><th>Where it lands, and what is unverified</th><th>Source (fetched 2026-11-26)</th></tr></thead><tbody>${tr}</tbody></table>
<h2 style="font-size:16px;margin:18px 0 6px">Where OmnIDE talks to Claude Code and its files</h2><table style="width:100%;font-size:13px"><thead><tr><th>Call</th><th>Called when</th><th>Result</th></tr></thead><tbody>${EP.map((e) => `<tr data-endpoint="${e[0]}" data-called-when="${e[1]}"><td>${code(e[0])}</td><td>${e[1]}</td><td>${e[2]}</td></tr>`).join('')}</tbody></table>
<p style="margin:14px 0 0;color:${DIM}">The issue says five modes; the docs list six defaultMode values: default, acceptEdits, plan, auto, dontAsk and bypassPermissions. OmnIDE uses default, plan, auto and bypassPermissions.</p>`;
  doc({ name: 'v6-Mapping', title: 'Mapping: OmnIDE choice to Claude Code mode and rules', label: 'Architecture · component', attrs: 'data-section="architecture" data-diagram="component"', intro: 'Every OmnIDE permission choice becomes a Claude Code mode or a settings rule, so the CLI and OmnIDE behave the same. Anything not yet seen running is marked TO VERIFY.', body, row: 5 });
}

// --- edge cases ---
{
  const rows = [
    ['Auto is unavailable (older Claude Code, unsupported model or provider, admin disabled)', 'v6-edge-auto-unavailable', 'Chat shows: "Auto-review isn\'t available here, so Allowlist is on." Settings shows the same reason under Run Mode.', 'Falls back to Allowlist; nothing runs unasked. Pick a supported model to switch back.'],
    ['First time Run Everything is chosen', 'v6-edge-bypass-dialog', 'Dialog: "Run Everything skips every approval", with Cancel and "I accept the risk". Claude Code writes skipDangerousModePermissionPrompt on accept (docs, 2026-11-26).', 'Cancel keeps the old Run Mode.'],
    ['Admin disabled Run Everything', 'v6-edge-bypass-disabled', 'The dropdown row is greyed with "Disabled by your administrator" and cannot be picked.', 'Ask the admin; permissions.disableBypassPermissionsMode is set in managed settings.'],
    ['Claude tries to edit in Ask mode', 'v6-edge-ask-refused', 'Card: "Edit refused. Ask mode answers only." The file is untouched.', 'Switch to Agent from the card, or keep asking.'],
    ['Approval card skipped', 'v6-approval-skipped', 'Card reads "Skipped"; Claude is told and can try another way.', 'Ask again, or switch Run Mode.'],
  ];
  const tr = rows.map((r, i) => `<tr data-case="${i + 1}"><td>${i + 1}</td><td>${r[0]}</td><td data-evidence="screen">${link(r[1], r[1])}<br><span style="color:${DIM}">${r[2]}</span></td><td>${r[3]}</td></tr>`).join('');
  doc({ name: 'v6-EdgeCases', title: 'Edge cases, with evidence', label: 'Flows · edge cases', attrs: 'data-section="flows"', intro: 'One row per edge case. Evidence is the screen that shows it and its text. The wording is the proposal; the Claude Code behaviour is from its docs, fetched 2026-11-26, not yet run.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>#</th><th>What happens</th><th>Evidence</th><th>Way out</th></tr></thead><tbody>${tr}</tbody></table>`, row: 5 });
}

// --- scenarios ---
const scen = (name, title, kind, story, steps, row) => {
  const li = steps.map(([f, t, node, ep, d]) => `<li style="margin:0 0 8px"><a href="${f}.dc.html" data-flow="v6-FlowPermissions:${node}" data-endpoint="${ep}">${t}</a><br><span style="color:${DIM}">${d}</span></li>`).join('');
  doc({ name, title, label: `Play · ${kind}`, minH: 480, attrs: `data-section="play" data-scenario="${name.slice(3)}" data-kind="${kind}" data-story="${story}"`, intro: `${story} Click a step to open its screen; each screen links on through its real buttons. <a href="v6-FlowPermissions.dc.html">See the flow</a>.`, body: `<ol style="margin:0;padding-left:22px;max-width:1000px">${li}</ol>`, row, interactive: true });
};
scen('v6-PlayAll', 'Approve a command, then always run it', 'happy', 'As a developer, I want Claude to ask before running a command and remember my yes, so that I am not asked twice.', [
  ['v6-chat-agent', 'New chat: Agent', 'open', 'SPAWN claude --permission-mode', 'The chat starts in Agent with Auto-review.'],
  ['v6-chat-picker', 'Open the mode picker', 'cycle', 'SPAWN claude --permission-mode', 'Agent, Plan and Ask; Shift+Tab cycles the same three.'],
  ['v6-set-runmode', 'Settings: Run Mode', 'start', 'WRITE ~/.claude/settings.json', 'Auto-review, Allowlist or Run Everything, with the protections below.'],
  ['v6-set-runmode-allowlist', 'Choose Allowlist', 'start', 'WRITE ~/.claude/settings.json', 'Claude asks unless a rule matches.'],
  ['v6-set-runmode', 'Claude Code classifies the action', 'classify', 'SPAWN claude --permission-mode', 'In Auto-review a classifier decides; in Allowlist the rules do. Settings shows which.'],
  ['v6-approval-pending', 'Claude asks to run a command', 'approve', 'permission request', 'Run, Skip or Always Run.'],
  ['v6-approval-always', 'Always Run', 'always', 'WRITE .claude/settings.local.json', 'The rule Bash(node -e *) is saved.'],
  ['v6-set-allowlist', 'See the rule in Settings', 'applied', 'READ settings files', 'The rule is listed and can be removed.'],
], 6);
scen('v6-PlayAuto', 'Auto-review is unavailable', 'edge', 'As a developer on an older Claude Code, I want a clear fallback when Auto-review is unavailable, so that nothing runs unasked.', [
  ['v6-edge-auto-unavailable', 'Chat shows the notice', 'unavailable', 'SPAWN claude --permission-mode', 'Allowlist is used and a one-line notice says why.'],
  ['v6-set-auto-unavailable', 'Settings shows the reason', 'unavailable', 'READ settings files', 'Run Mode reads Allowlist with the reason under it.'],
], 6);
scen('v6-PlayBypass', 'Turn on Run Everything', 'edge', 'As a developer in a sandbox, I want Run Everything with Claude Code\'s own warning, so that I accept the risk knowingly; an admin may forbid it.', [
  ['v6-set-runmode-open', 'Open the Run Mode dropdown', 'bypass', 'none (UI)', 'Run Everything is the third row.'],
  ['v6-edge-bypass-dialog', 'Accept the warning', 'bypass', 'WRITE ~/.claude/settings.json', 'Shown the first time; Cancel keeps the old mode.'],
  ['v6-set-runmode-everything', 'Run Everything is on', 'bypass', 'WRITE ~/.claude/settings.json', 'Deny rules still apply.'],
  ['v6-edge-bypass-disabled', 'Admin has disabled it', 'admin', 'READ settings files', 'The row is greyed and cannot be picked.'],
], 6);
scen('v6-PlayAskRefused', 'Ask refuses an edit', 'error', 'As a developer reading code, I want Ask mode to refuse edits, so that a question never changes a file.', [
  ['v6-chat-ask', 'Switch to Ask', 'cycle', 'SPAWN claude --permission-mode', 'Shift+Tab or the picker.'],
  ['v6-edge-ask-refused', 'Edit refused', 'ask', 'SPAWN claude --permission-mode', 'The file is untouched; Switch to Agent is offered.'],
], 6);

// --- ER: settings data ---
{
  const ent = (x, y, t, f) => `<div data-entity="${t}" style="position:absolute;left:${x}px;top:${y}px;width:300px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:6px"><div style="padding:8px 12px;font-weight:600;border-bottom:1px solid rgba(244, 242, 251, 0.08)">${t}</div>${f.map((r) => `<div style="padding:4px 12px;font-size:12px;color:${DIM}">${r}</div>`).join('')}</div>`;
  const body = `<div style="position:relative;width:1144px;height:420px;background:#0E0C14;border-radius:8px">${ent(20, 20, 'Chat', ['id', 'mode: agent | plan | ask', 'runMode (copy of the setting at start)'])}${ent(420, 20, 'RunModeSetting', ['value: auto | allowlist | bypass', 'defaultMode for new chats: Agent + Auto-review', 'source file: ~/.claude/settings.json'])}${ent(820, 20, 'AllowRule', ['rule, for example Bash(node -e *)', 'file: .claude/settings.local.json', 'added by: Always Run | editor'])}${ent(420, 220, 'Protection', ['kind: file deletion | external files | browser', 'on: boolean, on always asks', 'written as permissions.ask rules'])}${ent(820, 220, 'ManagedPolicy', ['disableAutoMode', 'disableBypassPermissionsMode', 'read only, wins over everything'])}
<svg role="img" aria-label="A chat uses one run mode setting; the setting is limited by the managed policy; allow rules and protections shape what asks" width="1144" height="420" viewBox="0 0 1144 420" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6"><defs><marker id="er1" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(244, 242, 251, 0.5)"/></marker></defs><path d="M 322 90 L 416 90" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 722 90 L 816 90" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 570 160 L 570 216" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/><path d="M 970 160 L 970 216" stroke="rgba(244, 242, 251, 0.5)" marker-end="url(#er1)"/></svg>
<span style="position:absolute;left:340px;top:68px;font-size:11px;color:${DIM}">1 : 1</span><span style="position:absolute;left:740px;top:68px;font-size:11px;color:${DIM}">1 : 0..*</span></div>
<p style="margin:14px 0 0;color:${DIM}">These are settings records OmnIDE reads and writes in Claude Code's own files; there is no OmnIDE database. Field names beyond the Claude Code keys are proposals. TO VERIFY: where the per-chat mode is kept.</p>`;
  doc({ name: 'v6-DataModel', title: 'Data model: what the permissions settings hold', label: 'Architecture · ER', attrs: 'data-section="architecture" data-diagram="er"', intro: 'Four records and a managed policy, all stored in Claude Code settings files. OmnIDE adds no new store.', body, row: 5 });
}
// --- sequence: Always Run ---
{
  const act = (x, t) => `<div style="position:absolute;left:${x}px;top:20px;width:200px;height:40px;box-sizing:border-box;background:#1A1823;border:2px solid #B69CFF;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:600">${t}</div><div style="position:absolute;left:${x + 100}px;top:60px;width:0;height:420px;border-left:1.5px dashed rgba(244, 242, 251, 0.35)"></div>`;
  const msg = (y, x1, x2, t) => `<svg width="1144" height="500" viewBox="0 0 1144 500" style="position:absolute;left:0;top:0;fill:none;pointer-events:none" aria-hidden="true"><path d="M ${x1} ${y} L ${x2} ${y}" stroke="#B69CFF" stroke-width="1.6" marker-end="url(#sq)"/></svg><span style="position:absolute;left:${Math.min(x1, x2) + 8}px;top:${y - 20}px;font-size:12px">${t}</span>`;
  const body = `<div style="position:relative;width:1144px;height:500px;background:#0E0C14;border-radius:8px"><svg role="img" aria-label="Sequence: Claude Code asks, the card shows, the user clicks Always Run, OmnIDE writes the rule, Claude Code runs the command" width="0" height="0" style="position:absolute"><defs><marker id="sq" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="#B69CFF"/></marker></defs></svg>
${act(40, 'Developer')}${act(340, 'OmnIDE app')}${act(640, 'Claude Code')}${act(900, 'Settings file').replace('left:900px', 'left:900px;width:200px')}
${msg(120, 740, 440, '1. permission request: Bash(node -e ...)')}${msg(170, 440, 140, '2. card: Run, Skip, Always Run')}${msg(220, 140, 440, '3. Always Run')}${msg(270, 440, 1000, '4. write allow rule to .claude/settings.local.json')}${msg(320, 440, 740, '5. allow the command')}${msg(380, 740, 740, '6. runs; next matching call does not ask')}</div>
<p style="margin:14px 0 0;color:${DIM}">Steps 1 and 5 use Claude Code's permission prompt. How OmnIDE intercepts it (the SDK permission callback or the CLI prompt) is TO VERIFY.</p>`;
  doc({ name: 'v6-SeqAlways', title: 'Sequence: Always Run', label: 'Architecture · sequence', attrs: 'data-section="architecture" data-diagram="sequence"', intro: 'What happens between the approval card and the saved rule, in order.', body, row: 5 });
}

// --- design tokens: copy of v5 ---
{
  let s = fs.readFileSync(P + 'v5-DesignTokens.dc.html', 'utf8');
  s = s.replace('data-page="v5"', 'data-page="v6"').replace('· v5 ·', '· v6 ·');
  s = s.replace(/data-status="current"/, `data-status="${STATUS}"`);
  W('v6-DesignTokens', s, 'Design tokens', 1240, 'doc', 6, false);
}

// --- decisions ---
{
  const dec = (id, t, ctx, chosen, rejected) => `<article data-decision="${id}" data-status="accepted" style="background:#1A1823;border:1px solid rgba(244, 242, 251, 0.08);border-radius:8px;padding:14px 18px;margin:0 0 12px"><h2 style="margin:0 0 4px;font-size:17px">${t}</h2><p style="margin:0 0 8px;color:${DIM}">${ctx}</p><ul style="margin:0;padding-left:20px"><li data-option data-chosen><b>Chosen:</b> ${chosen}</li>${rejected.map(([a, why]) => `<li data-option data-why-not="${why}"><b>Rejected:</b> ${a}: ${why}</li>`).join('')}</ul></article>`;
  const body = [
    dec('v6-two-settings', 'Two settings, Mode and Run Mode', 'Claude Code has one list of modes that mixes what Claude does with how much it asks. Cursor splits them, and the owner chose that on 2026-11-26.', 'The chat picker holds Agent, Plan and Ask. Settings holds Run Mode: Auto-review, Allowlist, Run Everything. Together they map onto Claude Code modes.', [
      ['Show Claude Code\'s modes in one picker (default, acceptEdits, plan, auto, bypassPermissions)', 'Shift+Tab would reach bypassPermissions, and users cannot tell "what Claude does" from "how much it asks"'],
      ['Also offer dontAsk', 'it is for non-interactive CI runs and would make a chat silently refuse anything not allowed'],
    ]),
    dec('v6-default', 'New chats start in Agent with Auto-review', 'A default has to be safe and useful without setup.', 'Agent with Auto-review, configurable in Settings. Where Auto is unavailable the chat starts in Allowlist with a notice.', [
      ['Start in Allowlist everywhere', 'asks far more often and teaches users to click Always Run without reading'],
      ['Start in Run Everything', 'turns approvals off before the user chose it'],
    ]),
    dec('v6-ask', 'Ask is Plan plus a rule', 'Claude Code has no answer-only mode.', 'Ask starts Claude Code in plan mode with a rule that it never proposes edits; an edit that still happens is refused.', [
      ['Drop Ask and keep Plan only', 'the issue asks for Cursor\'s three modes, and a pure question should not produce a plan'],
      ['Ask as Agent with all tools denied', 'Claude could not read files to answer'],
    ]),
    dec('v6-bypass', 'Keep Claude Code\'s bypass dialog and the admin block', 'Run Everything removes every approval.', 'Show the warning Claude Code shows, once, and grey the option when managed settings disable it.', [
      ['Write skipDangerousModePermissionPrompt ourselves', 'it hides the one warning that explains the risk'],
      ['Hide the option when disabled', 'the user cannot see why a mode they expect is missing'],
    ]),
  ].join('');
  doc({ name: 'v6-Decisions', title: 'Decisions', label: 'Decisions', minH: 900, attrs: 'data-section="decisions"', intro: 'What was chosen, what was turned down and why. Newest first. The five-modes wording is from issue #19; the docs list six values.', body, row: 6 });
}

// --- plan ---
{
  const rows = [
    ['Chat picker and Shift+Tab', 'Agent, Plan, Ask in the composer; per-chat state', 'v6-chat-picker'],
    ['Settings: Run Mode, protections, default mode', 'Dropdown, Allowlist editor, three toggles, default for new chats', 'v6-set-runmode'],
    ['Inline approval card', 'Run, Skip, Always Run and the three after-states', 'v6-approval-pending'],
    ['Mapping to Claude Code', 'Start session with the mode; write rules to settings files', 'v6-Mapping'],
    ['Edge cases', 'Auto fallback, bypass dialog and admin block, Ask refusal', 'v6-EdgeCases'],
  ].map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${link(r[2], r[2])}</td></tr>`).join('');
  doc({ name: 'v6-Plan', title: 'Plan: what changes, in order', label: 'Plan', minH: 500, attrs: 'data-section="plan"', intro: 'Issue <a href="https://github.com/MehdiMamas/omnide/issues/19">#19</a> holds the plan; no code starts before the owner\'s yes on this page. Out of scope: other agents, a cloud sandbox.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>#</th><th>Step</th><th>What</th><th>Frame</th></tr></thead><tbody>${rows}</tbody></table><p style="margin:14px 0 0;color:${DIM}">Check per step: the built screen is compared with its frame here, and a real Claude Code run shows each mode and rule.</p>`, row: 6 });
}

// --- questions ---
{
  const q = [
    ['How does OmnIDE know Auto is unavailable before the first message? Docs name model, Claude Code version and admin setting; the issue also names plan. TO VERIFY by running it.', 'Claude, by testing'],
    ['Exact wording of Claude Code\'s bypass dialog; the frame uses a proposal. TO VERIFY.', 'Claude, by running Claude Code'],
    ['How Ask stays read-only: a rule, a prompt line or both. TO VERIFY.', 'Owner decides after a test'],
    ['Browser tool name for the browser protection rule. Not found in the docs yet.', 'Claude'],
    ['Which commands ship in the default Allowlist (the frame shows npm run test as an example).', 'Owner'],
    ['Always Run writes to .claude/settings.local.json (project local). Confirm that, not the user file, is wanted.', 'Owner'],
  ].map((r, i) => `<li data-question="q${i + 1}" style="margin:0 0 10px">${r[0]} <span style="color:${DIM}">· ${r[1]}</span></li>`).join('');
  doc({ name: 'v6-Questions', title: 'Open questions and risks', label: 'Questions', minH: 520, attrs: 'data-section="questions"', intro: 'Answer by commenting on this frame.', body: `<ol style="margin:0;padding-left:22px;max-width:1080px">${q}</ol>`, row: 6 });
}

// --- history ---
doc({ name: 'v6-History', title: 'History', label: 'History', minH: 400, attrs: 'data-section="history"', intro: 'Every change to this canvas, newest first. Earlier rows are on the v5 page.', body: `<table style="width:100%;font-size:13px"><thead><tr><th>Date</th><th>Page</th><th>Change</th><th>Why</th></tr></thead><tbody><tr data-change data-date="${D}" data-page="v6"><td>${D}</td><td>v6</td><td>New To-be page for permissions: chat picker and Shift+Tab, Settings Run Mode with Allowlist and protections, the inline approval card, four edge cases, the mapping to Claude Code, decisions and four scenarios. v5 is unchanged.</td><td>Issue #19, chosen by the owner on 2026-11-26.</td></tr></tbody></table>`, row: 6 });

// --- progress ---
doc({ name: 'v6-Progress', title: `v6: ${boards.length + 2} frames built`, label: 'Plan · progress', minH: 300, attrs: 'data-section="plan"', intro: 'Status of this page. v5 stays the current page for everything else.', body: `<div style="height:8px;border-radius:4px;background:rgba(244, 242, 251, 0.08);margin:0 0 18px"><div data-progress style="width:${STATUS === 'current' ? '100' : '90'}%;height:8px;border-radius:4px;background:#41CB7E"></div></div><div style="${card};margin:0 0 10px"><b>${STATUS === 'current' ? 'Done' : 'In progress'}: every frame of issue #19</b><br><span style="color:${DIM}">Picker, Settings, approval card, edge cases, mapping, decisions and scenarios are built. Open questions are on the Questions frame.</span></div>`, row: 0 });

// --- cover ---
{
  const grp = (t, kind) => boards.filter((b) => b.kind === kind && !t || false);
  const screens = boards.filter((b) => b.kind === 'screen');
  const li = (b) => `<div style="${card};padding:8px 12px"><a href="${b.name}.dc.html">${b.title}</a></div>`;
  const grid = (arr) => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:0 0 18px">${arr.map(li).join('')}</div>`;
  const docs = boards.filter((b) => b.kind === 'doc' && !b.name.includes('Play'));
  const plays = boards.filter((b) => b.name.includes('Play'));
  const body = `<p style="margin:0 0 12px"><b>Play:</b> start at <a href="v6-chat-agent.dc.html">the chat</a> and click real buttons, or walk a scenario. <b>How to read:</b> frames are boxes; blue text opens one; red marks an edge case; screens hold only the app and explanations sit on the diagram frames. <b>Older versions:</b> <a href="#page-v5">v5 · 2026-11-26</a> (the current product canvas) and <a href="#page-v4">v4 · superseded</a>. <b>Sections:</b> all nine apply; none is N/A. Updated ${D}.</p>
<h2 style="font-size:18px;margin:8px 0 8px">Scenarios</h2>${grid(plays)}
<h2 style="font-size:18px;margin:8px 0 8px">Sitemap: screens</h2>${grid(screens)}
<h2 style="font-size:18px;margin:8px 0 8px">Diagrams and sections</h2>${grid(docs)}`;
  doc({ name: 'v6-Main', title: 'OmnIDE v6: permissions (To-be)', label: 'Start here', w: 1440, minH: 900, attrs: 'data-section="cover" data-profile="change"', intro: 'Cursor-style permissions on Claude Code: Agent, Plan and Ask in the chat, Run Mode and protections in Settings, and an approval card in the chat. Plan: <a href="https://github.com/MehdiMamas/omnide/issues/19">omnide#19</a>. Status: in progress, waiting for your yes. Source: Cursor docs and Claude Code permission-modes docs, both checked 2026-11-26.', body, row: 0 });
}

// ---------- canvas.json ----------
const cp = P + 'canvas.json';
const c = JSON.parse(fs.readFileSync(cp, 'utf8'));
for (const k of Object.keys(c.boards)) if (c.boards[k].page === 'v6') { delete c.boards[k]; }
c.order = c.order.filter((k) => !k.startsWith('v6-'));
c.pages = [{ id: 'v6', name: PAGE_NAME }, ...c.pages.filter((p) => p.id !== 'v6')];
c.launch = { view: 'canvas', page: 'v6' };
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
    c.boards[b.name + '.dc.html'] = { x, y, w: b.w, h, page: 'v6', title: b.title, ...(b.interactive ? { is_interactive: true } : {}) };
    c.order.unshift(b.name + '.dc.html');
    x += b.w + 80; mh = Math.max(mh, h);
  }
  y += mh + 120;
}
fs.writeFileSync(cp, JSON.stringify(c, null, 2) + '\n');
fs.writeFileSync('v6-boards.json', JSON.stringify(boards.map((b) => b.name)));
console.log('boards', boards.length);
