// Runs after v5-build.mjs. Adds the v5 Architecture frame, updates cover/progress/history/inventory,
// marks v4 superseded and rewrites canvas.json. Usage: node v5-finish.mjs [in-progress|done]
import fs from 'node:fs';
const MODE = process.argv[2] || 'in-progress';
const P = new URL('./project/', import.meta.url).pathname;
const rd = f => fs.readFileSync(P + f, 'utf8');
const wr = (f, s) => fs.writeFileSync(P + f, s);
const once = (s, a, b, what) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${what}: ${n} matches`); return s.replace(a, () => b); };
const DATE = '2026-11-26';
const INK = '#F4F2FB', MUTED = 'rgba(244, 242, 251, 0.74)', LINE = 'rgba(244, 242, 251, 0.5)', SURF = '#1A1823', ACC = '#B69CFF', ERR = '#F2777A', HAIR = 'rgba(244, 242, 251, 0.08)';

// ---------- 1. Architecture frame (fork, upstream, telemetry) ----------
const lanes = [
  { n: 'Upstreams', top: 150, h: 130 }, { n: 'Renovate and CI', top: 290, h: 130 },
  { n: 'OmnIDE build', top: 430, h: 130 }, { n: 'Running app', top: 570, h: 210 }];
const W = 170, H = 60;
const nodes = [
  { id: 'vscode', n: 1, x: 170, y: 186, t: 'microsoft/vscode release tag, now 1.148.0' },
  { id: 'vscodium', n: 2, x: 370, y: 186, t: 'VSCodium release tag, patch source only' },
  { id: 'pins', n: 3, x: 570, y: 186, t: 'upstream.json pins both versions' },
  { id: 'renovate', n: 4, x: 170, y: 326, t: 'Renovate (regex manager on upstream.json) opens one PR per new release' },
  { id: 'applyci', n: 5, x: 370, y: 326, t: 'CI applies our patches to the new tag' },
  { id: 'checks', n: 6, x: 570, y: 326, t: 'Apply, build and smoke tests pass?', diamond: 1 },
  { id: 'merge', n: 7, x: 970, y: 326, t: 'Merge: fork rebased on the new release tag' },
  { id: 'cired', x: 770, y: 326, t: 'Patch no longer applies: PR fails, nothing merges red', edge: 1 },
  { id: 'core', n: 8, x: 170, w: 160, y: 466, t: 'Direct fork with core patches only where an extension cannot reach' },
  { id: 'patches', n: 9, x: 355, w: 160, y: 466, t: 'Borrowed VSCodium patches: telemetry off, Open VSX in product.json' },
  { id: 'ext', n: 10, x: 540, w: 160, y: 466, t: 'OmnIDE code as a built-in extension, client of VS Code&#x27;s Agent Host' },
  { id: 'gulp', n: 11, x: 725, w: 160, y: 466, t: 'Code-OSS gulp: vscode-darwin-arm64-min, win32-x64, linux-x64' },
  { id: 'sign', n: 12, x: 910, w: 160, y: 466, t: 'Own Apple signing and notarization' },
  { id: 'release', n: 13, x: 1095, y: 466, t: 'Release on OmnIDE GitHub Releases (updates come from here)', w: 200 },
  { id: 'noms', n: 14, x: 170, y: 606, t: 'No data to Microsoft: no MS endpoints, no MS telemetry extensions' },
  { id: 'sender', n: 15, x: 370, y: 606, t: 'OmnIDE sender in the telemetry layer: crashes, errors, performance' },
  { id: 'kind', n: 16, x: 570, y: 606, t: 'Which build?', diamond: 1 },
  { id: 'devtest', n: 17, x: 770, y: 606, t: 'Dev and test builds: sender on' },
  { id: 'public', n: 18, x: 770, y: 696, t: 'Public builds: opt-in on first run, toggle in Settings > Privacy' },
  { id: 'sentry', n: 19, x: 970, y: 606, t: 'Sentry via @sentry/electron (no IP, no bodies)' },
  { id: 'declined', x: 970, y: 696, t: 'User says no: nothing is sent', edge: 1 },
];
const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
const nw = n => n.w || W;
const laneOf = n => lanes.findIndex(l => n.y >= l.top && n.y < l.top + l.h);
const cx = n => n.x + nw(n) / 2, cy = n => n.y + H / 2;
const nodeHtml = n => {
  const base = `position:absolute;left:${n.x}px;top:${n.y}px;width:${nw(n)}px;height:${H}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;line-height:1.25;color:${INK}`;
  const badge = n.n ? `<b style="position:absolute;left:-9px;top:-9px;width:20px;height:20px;border-radius:50%;background:${ACC};color:#14121B;font-size:11px;line-height:20px;text-align:center">${n.n}</b>` : '';
  const attrs = `data-node="${n.id}"${n.n ? ` data-n="${n.n}"` : ''}${n.edge ? ' data-edge' : ''}`;
  if (n.diamond) return `<div ${attrs} style="${base}"><svg aria-hidden="true" width="${nw(n)}" height="${H}" style="position:absolute;left:0;top:0"><polygon points="${nw(n) / 2},1 ${nw(n) - 1},${H / 2} ${nw(n) / 2},${H - 1} 1,${H / 2}" fill="${SURF}" stroke="${LINE}" stroke-width="2"/></svg>${badge}<span style="position:relative;padding:0 30px">${n.t}</span></div>`;
  const box = n.edge ? `background:rgba(242,119,122,.12);border:2px solid ${ERR}` : `background:${SURF};border:2px solid ${LINE}`;
  return `<div ${attrs} style="${base};${box};border-radius:6px">${badge}<span style="padding:0 8px">${n.t}</span></div>`;
};
const path = (a, b) => {
  const A = byId[a], B = byId[b];
  let d;
  if (laneOf(A) === laneOf(B)) {
    const [ax, ay] = [A.x + nw(A), cy(A)], [bx, by] = [B.x, cy(B)];
    const mx = (ax + bx) / 2;
    d = `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`;
  } else {
    const sy = A.y + H, ey = B.y, my = sy + 20;
    d = `M ${cx(A)} ${sy} L ${cx(A)} ${my} L ${cx(B)} ${my} L ${cx(B)} ${ey}`;
  }
  const red = B.edge;
  return `<path d="${d}" stroke="${red ? ERR : LINE}"${red ? ' stroke-dasharray="4 3"' : ''} marker-end="url(#${red ? 'arr' : 'ar'})"/>`;
};
const edges = [['pins'], ['vscodium', 'pins'], ['pins', 'renovate'], ['renovate', 'applyci'], ['applyci', 'checks'], ['checks', 'cired'], ['checks', 'merge'],
  ['merge', 'core'], ['core', 'patches'], ['patches', 'ext'], ['ext', 'gulp'], ['gulp', 'sign'], ['sign', 'release'], ['release', 'noms'],
  ['noms', 'sender'], ['sender', 'kind'], ['kind', 'devtest'], ['kind', 'public'], ['devtest', 'sentry'], ['public', 'sentry'], ['public', 'declined']].filter(e => e.length === 2);
// cired sits between checks and merge on the same row, so the yes-arrow to merge must skip over it: route it above the red node
const archOver = (a, b) => { const A = byId[a], B = byId[b]; const y = A.y - 14; return `<path d="M ${cx(A)} ${A.y} L ${cx(A)} ${y} L ${cx(B)} ${y} L ${cx(B)} ${B.y}" stroke="${LINE}" marker-end="url(#ar)"/>`; };
const arch13 = `<path d="M ${cx(byId.vscode)} ${byId.vscode.y} L ${cx(byId.vscode)} 168 L ${cx(byId.pins)} 168 L ${cx(byId.pins)} ${byId.pins.y}" stroke="${LINE}" marker-end="url(#ar)"/>`;
const svgPaths = [arch13, ...edges.filter(e => !(e[0] === 'checks' && e[1] === 'merge')).map(e => path(...e)), archOver('checks', 'merge')].join('');
const lab = (x, y, t, c = MUTED) => `<span style="position:absolute;left:${x}px;top:${y}px;font-size:10px;color:${c}">${t}</span>`;
const labels = lab(745, 336, 'no', ERR) + lab(655, 296, 'yes') + lab(742, 588, 'dev, test') + lab(722, 712, 'public') + lab(930, 676, 'declines', ERR);
const card = (k, kicker, title, body) => `<div data-card="${k}" style="background:${SURF};border:1px solid ${HAIR};border-radius:6px;padding:10px 12px;font-size:12px"><div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${ACC}">${kicker}</div><div style="font-weight:600;margin:2px 0">${title}</div><div style="color:${MUTED}">${body}</div></div>`;
const cards = [
  card('why', 'why', 'Why a direct fork, not VSCodium', 'VSCodium&#x27;s last release is 1.143 (28 Oct) while VS Code is at 1.148 (25 Nov), and VSCodium had 2 commits last month. OmnIDE forks microsoft/vscode at a release tag, rebases per upstream release, and borrows only VSCodium&#x27;s telemetry-off and Open VSX patches.'),
  card('packaging', 'build', 'Packaging', 'Code-OSS gulp packaging (vscode-darwin-arm64-min, win32-x64, linux-x64) plus our own Apple signing and notarization. OmnIDE code ships as a built-in extension; core patches only where an extension cannot reach: title bar, layout, brand.'),
  card('never-assumed', 'never assumed', 'What Microsoft receives', 'Nothing. No Microsoft endpoints in product.json, experiments and natural-language search off, extensions from Open VSX, updates from OmnIDE&#x27;s own GitHub Releases, no Microsoft telemetry built-in extensions.'),
  card('telemetry', 'telemetry', 'OmnIDE&#x27;s own sender', 'Crashes, errors and performance go to Sentry through @sentry/electron; dataCollection omits IP and request bodies. On in dev and test builds. Opt-in on public builds, through the first-run screen and a Settings &gt; Privacy toggle.'),
  card('upstream', 'upstream', 'Keeping up with upstream', 'Both upstreams are pinned in upstream.json: microsoft/vscode at 1.148.0 and VSCodium at a tag. Renovate (free on GitHub) opens one PR per new release. CI on that PR applies our patches, builds and runs smoke tests; a patch that no longer applies fails the PR and nothing merges red. Goes in with build milestone 1.'),
  card('agent-host', 'agent', 'Agent runtime: VS Code&#x27;s Agent Host', 'OmnIDE reuses upstream VS Code&#x27;s built-in Agent Host (src/vs/platform/agentHost, MIT, shipping in 1.148.0) and its Claude harness (node/claude, on @anthropic-ai/claude-agent-sdk), not claude-agent-acp or ACP. The SDK points at the user&#x27;s own installed claude (pathToClaudeCodeExecutable), is fetched on demand into sdk-cache and is not bundled. Microsoft&#x27;s Copilot proxy auth path (claudeProxyAuth) is off. Other agents on the v0.2 roadmap are the Agent Host&#x27;s other harnesses, roadmap only.'),
  card('to-design', 'to design', 'Screens not drawn yet', 'No matching v4 board exists, so these are listed, not invented: the first-run telemetry choice and the Settings &gt; Privacy toggle. The Privacy row in the Settings inventory still reads &quot;collects no telemetry&quot; until that screen is designed.'),
  card('to-verify', 'to verify', 'To verify', 'That the pinned @sentry/electron version honours dataCollection as described; that the sender can sit in the telemetry layer without Microsoft code paths; that the Renovate regex matches both upstreams&#x27; tag formats. Not yet run.'),
].join('');
const arch = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Fork, upstream and telemetry</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
a{color:#B69CFF}a:hover{color:#F4F2FB}
</style>
<style data-omnide-v4>@font-face{font-family:'Geist';src:url(./fonts/Geist-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}@font-face{font-family:'Geist Mono';src:url(./fonts/GeistMono-Variable.woff2) format('woff2');font-weight:100 900;font-display:swap}</style></helmet>
<div data-page="v5" data-created="${DATE}" data-updated="${DATE}" data-status="current" data-section="architecture" data-diagram="flow" style="position:relative;width:1360px;min-height:1300px;box-sizing:border-box;padding:40px 48px;background:#14121B;color:${INK};font-family:'Geist','Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.5">
<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Architecture · fork, upstream and telemetry · v5 · ${DATE} · updated ${DATE}</div><h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">How OmnIDE is built, kept current and what it sends</h1><p style="margin:0 0 20px;max-width:1080px;color:${MUTED}">A direct fork of microsoft/vscode, kept current by Renovate and CI. Red marks failure and opt-out. Plan: <a href="https://github.com/MehdiMamas/omnide/issues/10">omnide#10</a>.</p>
${lanes.map(l => `<div data-lane="${l.n}" style="position:absolute;left:48px;top:${l.top}px;width:1264px;height:${l.h}px;background:${SURF};border-radius:6px"><span style="position:absolute;left:12px;top:12px;width:100px;font-size:12px;font-weight:600;color:${MUTED}">${l.n}</span></div>`).join('\n')}
${nodes.map(nodeHtml).join('\n')}
<svg role="img" aria-label="Arrows: upstream.json pins both upstreams, Renovate opens a PR, CI applies patches and builds; on success the fork is rebased and built, signed and released; the running app sends crashes to Sentry on dev and test builds or after opt-in on public builds" width="1360" height="800" viewBox="0 0 1360 800" style="position:absolute;left:0;top:0;fill:none;stroke-width:1.6;pointer-events:none"><defs><marker id="ar" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="${LINE}"/></marker><marker id="arr" orient="auto" markerWidth="6" markerHeight="6" refX="3" refY="3"><path d="M0 0 L6 3 L0 6 Z" fill="${ERR}"/></marker></defs>${svgPaths}</svg>
${labels}
<div data-legend style="position:absolute;left:48px;top:796px;display:flex;gap:18px;font-size:12px;color:${MUTED}"><span><b style="display:inline-block;width:18px;height:2px;background:${LINE};vertical-align:middle"></b> normal path</span><span><b style="display:inline-block;width:18px;height:2px;background:${ERR};vertical-align:middle"></b> failure or opt-out</span><span><b style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${ACC};vertical-align:middle"></b> step number</span></div>
<div style="position:absolute;left:48px;top:828px;width:1264px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cards}</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1360,"height":1300}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
wr('v5-ArchFork.dc.html', arch);


// ---------- 1b. Agent Host (replaces ACP / claude-agent-acp on the agent boards) ----------
{
  const AH = 'https://github.com/microsoft/vscode/tree/1.148.0/src/vs/platform/agentHost';
  const R = (s, a, b, what) => { if (!s.includes(a)) throw new Error(`agenthost ${what}: not found: ${a.slice(0, 60)}`); return s.split(a).join(b); };
  const sources = s => s.replace(/(Sources, fetched 2026-11-26: )(.*?)(<\/p>)/s, (m, a, body, c) => {
    const parts = body.split(' · ').filter(x => !/agentclientprotocol/.test(x));
    const mine = [`<a data-source href="${AH}" data-fetched="${DATE}">Agent Host (agentHost, 1.148.0)</a>`, `<a data-source href="${AH}/node/claude" data-fetched="${DATE}">Claude harness (node/claude)</a>`];
    return a + [...mine, ...parts].join(' · ') + c;
  });
  const edit = (f, fn) => { let s = rd(f); s = fn(s); wr(f, s); };
  edit('v5-agent-Component.dc.html', s => {
    s = R(s, 'Built-in extension. ACP client over stdio JSON-RPC', 'Built-in extension. Client of the Agent Host (Agent Host Protocol)', 'c1');
    s = R(s, 'Pinned adapter, npm @agentclientprotocol/claude-agent-acp 0.112.0, started with CLAUDE_CODE_EXECUTABLE set to the user&#x27;s own installed claude', 'Claude harness, MIT, 1.148.0. Own claude; claudeProxyAuth off', 'c2');
    s = R(s, '>claude-agent-acp<', '>Agent Host<', 'c3');
    s = R(s, '@anthropic-ai/claude-agent-sdk 0.3.331', '@anthropic-ai/claude-agent-sdk, fetched on demand into sdk-cache (not bundled)', 'c4');
    s = R(s, 'claude-agent-acp to', 'Agent Host to', 'c5'); s = R(s, 'omnide.agent to claude-agent-acp', 'omnide.agent to Agent Host', 'c6'); s = R(s, '>stdio<', '>AH Protocol<', 'c7');
    s = R(s, 'It is the built-in extension omnide.agent, an ACP client. It starts the pinned adapter as a child process and speaks JSON-RPC over its stdin and stdout. The adapter drives Claude Code through the official SDK.', 'It is the built-in extension omnide.agent, a client of VS Code&#x27;s own Agent Host (src/vs/platform/agentHost, MIT, shipping in 1.148.0). The Agent Host runs its Claude harness (node/claude), which drives the user&#x27;s own installed claude through @anthropic-ai/claude-agent-sdk (pathToClaudeCodeExecutable). The SDK is fetched on demand into sdk-cache, not bundled, and Microsoft&#x27;s Copilot proxy auth path (claudeProxyAuth) is turned off.', 'c8');
    s = R(s, 'Why an adapter and not the CLI', 'Why the Agent Host and not our own adapter', 'c9');
    s = R(s, 'ACP gives one protocol for any agent, so v0.2 adds Gemini CLI or Codex with a registry entry and no UI change. The adapter is maintained by the ACP project, so protocol updates keep arriving.', 'The Agent Host ships in VS Code, so protocol and Claude harness updates arrive with each upstream rebase. Other agents on the v0.2 roadmap (Codex and others) are the Agent Host&#x27;s other harnesses, shown only as roadmap, with no UI change.', 'c10');
    return sources(s);
  });
  edit('v5-agent-Mapping.dc.html', s => {
    s = R(s, 'the ACP method or Claude Code mechanism', 'the Agent Host Protocol message or Claude Code mechanism', 'm1');
    s = R(s, 'Not defined by ACP. Needs a remote runner', 'Not part of the Agent Host&#x27;s Claude harness. Needs a remote runner', 'm2');
    s = R(s, 'Not part of the Claude Code adapter; OmnIDE features for v0.2', 'Not part of the Claude harness; OmnIDE features for v0.2', 'm3');
    s = R(s, 'Same ACP client, a registry entry per agent, capability flags', 'The Agent Host&#x27;s other harnesses (Codex and others), one per agent, capability flags', 'm4');
    s = R(s, 'Adapter modes:', 'Harness modes (message names TO VERIFY against the Agent Host Protocol):', 'm5');
    s = R(s, 'adapter and installed claude versions', 'harness and installed claude versions', 'm6');
    return sources(s);
  });
  edit('v5-agent-Sequence.dc.html', s => {
    s = R(s, '>ACP client<', '>Agent Host client<', 's1'); s = R(s, '>claude-agent-acp<', '>Agent Host<', 's2'); s = R(s, '>adapter<', '>Claude harness<', 's3');
    s = R(s, 'claude-agent-acp', 'Agent Host', 's4');
    s = R(s, "Method and notification names are the real ACP ones. The client answers the adapter's file and terminal requests", "Message names below are carried over from the earlier ACP design: TO VERIFY against the Agent Host Protocol (src/vs/platform/agentHost) before build. The client answers the harness's file and terminal requests", 's5');
    return sources(s);
  });
  edit('v5-agent-Registry.dc.html', s => {
    s = R(s, 'command: node, claude-agent-acp pinned in the app, with CLAUDE_CODE_EXECUTABLE set to the user&#x27;s installed claude (no bundled CLI). roadmap: false', 'Agent Host Claude harness (node/claude); SDK fetched on demand into sdk-cache, pathToClaudeCodeExecutable = the user&#x27;s installed claude (no bundled CLI), claudeProxyAuth off. roadmap: false', 'r1');
    s = R(s, 'agents.json bundled in the app; refreshed weekly from the ACP registry (issue #6)', 'Harness list comes from the Agent Host; roadmap flags are ours (issue #6)', 'r2');
    s = R(s, 'registry id codex-acp. roadmap: true', 'Agent Host Codex harness. roadmap: true', 'r3');
    s = R(s, 'registry id for Gemini CLI. roadmap: true', 'Gemini CLI harness (TO VERIFY it exists in the Agent Host). roadmap: true', 'r4');
    s = R(s, 'registry id github-copilot-cli. roadmap: true', 'Copilot harness (TO VERIFY). roadmap: true', 'r5');
    s = R(s, 'Adding an agent in v0.2 is a registry entry, not a UI change', 'Adding an agent in v0.2 is enabling another Agent Host harness, not a UI change', 'r6');
    s = R(s, 'The entry validates against the registry schema in CI', 'Each harness entry is checked in CI', 'r7');
    s = R(s, 'claude-agent-acp', 'Agent Host', 'r8');
    return sources(s);
  });
  edit('v5-agent-States.dc.html', s => {
    s = R(s, 'Closing the window stops the adapter (issue #5).', 'Closing the window stops the Agent Host session (issue #5).', 't1');
    s = R(s, 'Adapter crashed, auth failed, or rate limit', 'Agent Host or harness crashed, auth failed, or rate limit', 't2');
    s = R(s, 'Adapter offers auth methods', 'Harness offers auth methods', 't3');
    s = R(s, 'Spawn adapter, initialize, session/new', 'Start a harness session through the Agent Host', 't4');
    s = R(s, 'Window closed, adapter process stopped', 'Window closed, Agent Host session stopped', 't5');
    s = R(s, 'adapter exits or API error', 'harness exits or API error', 't6');
    return sources(s);
  });
}

// ---------- 2. Settings inventory: Models rows ----------
{
  let s = rd('v5-SettingsInventory.dc.html');
  const hdr = s.indexOf('<b style="font-size:16px">Models</b>');
  const hs = s.lastIndexOf('<tr>', hdr), he = s.indexOf('</tr>', hdr) + 5;
  const vs = s.lastIndexOf('<tr>', s.indexOf('<b style="font-size:16px">Voice</b>'));
  const m = s.slice(he, vs).match(/<tr>.*?<\/tr>/)[0];
  const row = (name, desc, ctl) => `<tr><td style="color:${MUTED}"></td><td><b>${name}</b></td><td style="color:${MUTED}">${desc}</td><td>${ctl}</td></tr>`;
  const sw = (t, on) => `${t} (${on}) <span style="color:${MUTED}">· switch</span><br>${on} (${on}) <span style="color:${MUTED}">· input</span>`;
  const dd = (v, opts) => `${v} <span style="color:${MUTED}">· ${opts.map(o => o === v ? `<b>${o}</b>` : o).join(' / ')}</span>`;
  const rows = [
    ...['Opus 5.5', 'Sonnet 5.5', 'Haiku 5.5', 'Fable 5.2'].map(n => row(n, 'Show this model in the model picker', sw(`${n} enabled`, 'on'))),
    row('Default model', 'Model new chats start with', dd('Sonnet 5.5', ['Opus 5.5', 'Sonnet 5.5', 'Haiku 5.5', 'Fable 5.2'])),
    row('Default effort', 'Effort new chats start with', dd('High', ['Low', 'Medium', 'High', 'Max'])),
    row('Fast mode', 'Faster output on models that support it', sw('Fast mode', 'off')),
    row('1M context', 'Use the 1M-token context window on models that support it', sw('1M context', 'off')),
  ].join('');
  s = s.slice(0, he) + rows + s.slice(vs);
  s = s.replace(/(<b style="font-size:16px">Models<\/b> <span[^>]*>· frames )/, '$1');
  wr('v5-SettingsInventory.dc.html', s);
  if (!m) throw new Error('inventory models rows not found');
}

// ---------- 3. Cover ----------
{
  let s = rd('v5-Main.dc.html');
  s = once(s, 'Start here · v4 · 2026-11-26 · updated 2026-11-26', `Start here · v5 · ${DATE} · updated ${DATE}`, 'cover eyebrow');
  s = once(s, '>OmnIDE v4</h1>', '>OmnIDE v5</h1>', 'cover h1');
  s = once(s, 'data-status="current"', 'data-status="current"', 'status');
  const tile = (h, t) => `<div style="background:${SURF};border:1px solid ${HAIR};border-radius:8px;padding:14px 16px;padding:8px 12px"><a href="${h}">${t}</a></div>`;
  const newV5 = `<h2 style="font-size:18px;margin:0 0 8px">New in v5</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:0 0 18px">${tile('v5-ArchFork.dc.html', 'Fork, upstream and telemetry')}${tile('v5-Progress.dc.html', 'v5 progress')}${tile('v5-ai-02-model-popover.dc.html', 'Model picker')}${tile('v5-ide-34-settings-models.dc.html', 'Settings, Models')}${tile('v5-set-claude-1.dc.html', 'Settings, Claude (own claude CLI)')}${tile('v5-agent-Component.dc.html', 'Agent components')}</div><p style="margin:0 0 18px"><b>Older versions:</b> <a href="v4-Main.dc.html">v4 · 2026-11-26 (superseded)</a>, <a href="https://claude.ai/artifact/WiGEA1B5MBTHWFvSeaJy82">v1 to v3 archive</a>.</p>`;
  s = once(s, '<h2 style="font-size:18px;margin:0 0 8px">New in v4</h2>', newV5 + '<h2 style="font-size:18px;margin:0 0 8px">New in v4</h2>', 'cover new');
  wr('v5-Main.dc.html', s);
}

// ---------- 4. Progress ----------
{
  const done = MODE === 'done';
  const items = [
    ['Copy of v4 as v5', 'All 280 boards copied; only the 13 table rows and the title-bar label differ', 1],
    ['Title-bar label removed', 'On every screen except ide-01, ob-01, light-21, omni-claude-missing and st-01', 1],
    ['Model picker', 'Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2, effort, Fast mode and 1M context on ai-02, chat-model-menu and light-09', 1],
    ['Settings, Models', 'One row per model, Default model, Default effort, Fast mode, 1M context; inventory updated', 1],
    ['Claude sign-in boards', 'Own claude CLI through claude-agent-acp; sign-in in claude /login; API key optional', 1],
    ['Fork, upstream and telemetry frame', 'Fork and packaging, VSCodium patches, Sentry sender, Renovate on upstream.json', 1],
    ['Cover, history and canvas', 'v5 first, v4 marked superseded', 1],
    ['Gate and diff check', 'blueprint-check.mjs and the v4 to v5 diff script', done ? 1 : 0],
    ['Published', done ? 'Same artifact' : 'Publishing in batches', done ? 1 : 0],
  ];
  const n = items.filter(i => i[2]).length;
  const card = (t, d, ok) => `<div style="background:${SURF};border:1px solid ${HAIR};border-radius:8px;padding:14px 16px;margin:0 0 10px;"><b>${ok ? 'Done' : 'To do'}: ${t}</b><br><span style="color:${MUTED}">${d}</span></div>`;
  let s = rd('v5-Progress.dc.html');
  const a = s.indexOf('<div style="font-size:11px'), b = s.indexOf('</div>\n</x-dc>');
  const body = `<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Plan · progress · v5 · ${DATE} · updated ${DATE}</div><h1 style="margin:6px 0 8px;font-size:30px;font-weight:600">v5: ${n} of ${items.length} done</h1><p style="margin:0 0 14px;max-width:1080px;color:${MUTED}">Status of this page, kept current as it is built. v4 stays as the superseded version page.</p><div style="height:8px;border-radius:4px;background:${HAIR};margin:0 0 18px"><div data-progress style="width:${(100 * n / items.length).toFixed(1)}%;height:8px;border-radius:4px;background:#41CB7E"></div></div>${items.map(i => card(...i)).join('')}${card('Owner review', 'Waiting for your yes on the Decisions page', 0)}<div style="background:${SURF};border:1px solid ${HAIR};border-radius:8px;padding:14px 16px;margin:0 0 10px;"><b>Blockers</b><br><span style="color:${MUTED}">${done ? 'None.' : 'The artifact holds at most 511 files per version; v5 adds 281 boards on top of v4, so a same-URL publish may be refused.'} Open questions are on the <a href="v5-Questions.dc.html">Questions</a> frame.</span></div>`;
  s = s.slice(0, a) + body + '\n' + s.slice(b);
  wr('v5-Progress.dc.html', s);
}

// ---------- 5. History ----------
{
  let s = rd('v5-History.dc.html');
  const row = `<tr data-change data-date="${DATE}" data-page="v5"><td>${DATE}</td><td>v5</td><td>v5 built as a copy of v4. Title-bar Claude label removed except on five screens; model picker is a real list (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2, effort, Fast mode, 1M context); Settings &gt; Models reduced to one row per model plus Default model, Default effort, Fast mode and 1M context; sign-in boards now use the user&#x27;s own claude CLI (claude /login, API key optional); new frame <a href="v5-ArchFork.dc.html">Fork, upstream and telemetry</a>. v4 is kept and marked superseded.</td><td>Owner review comments on omnide#10.</td></tr>`;
  s = once(s, '<tbody>', '<tbody>' + row, 'history tbody');
  wr('v5-History.dc.html', s);
}

// ---------- 6. v4 superseded ----------
for (const f of fs.readdirSync(P).filter(f => /^v4-.*\.dc\.html$/.test(f))) {
  let s = rd(f);
  if (s.includes('data-superseded-by')) continue;
  const i = s.indexOf('<div data-page="v4"');
  if (i < 0) throw new Error('no root ' + f);
  const e = s.indexOf('>', i);
  let tag = s.slice(i, e + 1).replace(/data-status="([a-z-]+)"/, 'data-status="superseded" data-was="$1"').replace('<div data-page="v4"', '<div data-superseded-by="v5" data-page="v4"');
  if (!tag.includes('data-status="superseded"')) throw new Error('status ' + f);
  const banner = `<a href="v5-Main.dc.html" style="position:absolute;right:8px;top:8px;z-index:99999;padding:3px 8px;border-radius:4px;background:#1A1823;border:1px solid rgba(244, 242, 251, 0.5);color:#B69CFF;font:600 11px/1.4 'Geist',system-ui,sans-serif;text-decoration:none">Superseded by v5</a>`;
  s = s.slice(0, i) + tag + banner + s.slice(e + 1);
  wr(f, s);
}

// ---------- 7. canvas.json ----------
{
  const c = JSON.parse(rd('canvas.json'));
  const pageName = MODE === 'done' ? `v5 · ${DATE}` : 'v5 · in progress';
  c.pages = [{ id: 'v5', name: pageName }, ...c.pages.filter(p => p.id !== 'v5').map(p => ({ id: p.id, name: `${p.name.replace(/ \(?superseded\)?$/, '')} · superseded` }))];
  c.pages = c.pages.map(p => p.id === 'v4' ? { id: 'v4', name: 'v4 · 2026-11-26 · superseded' } : p);
  c.launch = { view: 'canvas', page: 'v5' };
  const old = c.boards, nb = {}, order = [];
  const v4 = Object.keys(old).filter(k => k.startsWith('v4-'));
  const maxX = Math.max(...Object.values(old).map(b => b.x + b.w));
  const SHIFT = 0;
  // v5 first, same layout as v4 so the two pages line up; v4 boards stay where they were on their own page
  for (const k of v4) {
    const k5 = k.replace(/^v4-/, 'v5-');
    nb[k5] = { ...old[k], page: 'v5' }; order.push(k5);
  }
  const fork = 'v5-ArchFork.dc.html';
  nb[fork] = { x: old['v4-Architecture.dc.html'].x, y: 1000, w: 1360, h: 1300, page: 'v5', title: 'Fork, upstream and telemetry' };
  order.push(fork);
  nb['v5-Progress.dc.html'].h = 1000;
  for (const k of v4) { nb[k] = old[k]; order.push(k); }
  c.boards = nb; c.order = order;
  for (const k of Object.keys(nb)) if (!fs.existsSync(P + k)) throw new Error('missing board ' + k);
  wr('canvas.json', JSON.stringify(c, null, 2) + '\n');
}
console.log('finish ok', MODE);
