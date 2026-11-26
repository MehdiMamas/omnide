// Text-only rewrite: Cursor/Grok wording to OmnIDE/Claude wording. Touches text nodes and a few attributes, never classes, css vars or the css `cursor:` property.
const LOCK = '<span class="omn-lock"><i class="codicon codicon-lock"></i> Upcoming in v0.2</span>';
const locked = (n) => `<span class="omn-locked">${n}</span>${LOCK}`;
// [regex, replacement|fn, htmlOk]: htmlOk rules may emit markup, so they only run on text nodes
const R = [
  [/Mark Agent commits as co-authored by Cursor/g, "Add a Co-Authored-By trailer to Agent commits"],
  [/Mark pull requests as made with Cursor/g, "Mark pull requests as made with OmnIDE"],
  [/OmnIDE, Grok Bot, Grok, and X in one plan, with more coding usage\./g, "Usage, limits and billing are managed on claude.ai."],
  [/Premium gives you more Agent usage, plus Grok Bot, Grok, and X\./g, "Your Claude plan sets how much you can use. Manage it on claude.ai."],
  [/Meet Grok Bot/g, "Claude Code subagents"],
  [/AI teammates you can give real work to/g, "Delegate work to specialised Claude agents kept in .claude/agents"],
  [/Get Grok Bot/g, "Open .claude/agents"],
  [/GROK_PLUGIN_ROOT/g, "CLAUDE_PLUGIN_ROOT"],
  [/OmnIDE and Grok Bot/g, "OmnIDE"],
  [/Grok Bot/g, "Claude"],
  [/Upgrade to Premium/g, "Open usage on claude.ai"],
  [/^Upgrade$/g, "Usage"],
  [/Free Plan/g, "Claude Code"],
  [/Plan &amp; Usage/g, "Claude"],
  [/Included Usage/g, "Claude usage"],
  [/user@example\.com/g, "you@example.com"],
  [/Google Gemini SDKs/g, "Google SDKs"],
  [/cursor-public/g, "claude-plugins-official"],
  [/cursor:\/\//g, "omnide://"],
  [/\.cursor\/mcp\.json/g, ".mcp.json"],
  [/\.cursor\/hooks\.json/g, ".claude/settings.json"],
  [/\.cursorignore/g, ".omnideignore"],
  [/\.cursor(?![-\w])|\.cursor(?=plugins)/g, ".claude"],
  [/cursor_version/g, "omnide_version"],
  [/"3.32.4"/g, "\"0.1.0\""],
  [/@grok\//g, "@anthropic-ai/"],
  [/Gemini-only/g, "Google-only"],
  [/grok-[\w.-]+/g, "claude-sonnet-5-5"],
  [/\bcursor\/(?=[,)\s"]|$)/g, "claude/"],
  [/Origin \(cursor\.com\/codebase\)/g, "OmnIDE"],
  [/(?:api[234]?|repo42|authenticator)\.cursor\.sh/g, "api.anthropic.com"],
  [/marketplace\.cursorapi\.com/g, "open-vsx.org"],
  [/downloads\.cursor\.com/g, "github.com"],
  [/cursor-cdn\.com/g, "github.io"],
  [/anysphere\.cursor-/g, "omnide."],
  [/theme-cursor/g, "theme-omnide"],
  [/cursor\.ndjsonIngest/g, "omnide.ndjsonIngest"],
  [/acceptCursorTabSuggestion/g, "omnide.tab.accept"],
  [/activeCursorHasCommentingRange/g, "activeEditorHasCommentingRange"],
  [/cursor-agent-(host|exec|worker)/g, "omnide-agent-$1"],
  [/\bcursor-(?=[a-z])/g, "omnide-"],
  [/Cursor 3\.32\.4/g, "the reference IDE"],
  [/Cursor cloud/g, "Cloud agents"],
  [/Cursor Default/g, "Default (Claude Code)"],
  [/Open Local Links in Cursor Browser/g, "Open Local Links in OmnIDE Browser"],
  [/Cursor Explorer/g, "OmnIDE Explorer"],
  // models (order matters)
  [/Claude Opus 5\.5/g, "Opus 5.5 (1M context)"],
  [/Claude Opus 5(?![.\d])/g, "Opus 5"],
  [/Claude Opus 4\.8/g, "Opus 4.8"],
  [/Claude Sonnet 5\.5/g, "Sonnet 5.5"],
  [/Claude Fable 5\.2/g, "Fable 5.2"],
  [/Grok 4\.6/g, "Default (Claude Code)"],
  [/Composer 2\.5/g, "Opus 5.5"],
  [/GPT-5\.6 Sol/g, "Haiku 5.5"],
  [/Gemini 4 Neon/g, () => locked("Gemini CLI"), true],
  [/Gemini 4 Carbon/g, () => locked("Codex"), true],
  [/Gemini 4 Hydrogen/g, () => locked("GitHub Copilot"), true],
  [/Muse Wonder/g, () => locked("Registry agent"), true],
  [/\bGrok\b/g, "Claude"],
  // generic product name last, skipping editor-cursor phrases
  [/(?<!Add |Multi |Multi-|Move |Last |Editor |Undo |Surrounding )\bCursor\b(?! (Above|Below|Style|Blinking|Smooth|Width|Surrounding|Position|Animation|Line|Up|Down|Left|Right|Modifier|Default))/g, "OmnIDE"],
  [/\bv2-([a-z0-9-]+)/g, "v3-$1"],
];
const ATTR = /(\b(?:title|aria-label|placeholder|alt|data-title|data-tooltip|data-screen)=")([^"]*)"/g;
const PLAIN = { "Gemini 4 Neon": "Gemini CLI (locked, upcoming in v0.2)", "Gemini 4 Carbon": "Codex (locked, upcoming in v0.2)", "Gemini 4 Hydrogen": "GitHub Copilot (locked, upcoming in v0.2)", "Muse Wonder": "Registry agent (locked, upcoming in v0.2)" };
const apply = (s, attr) => { if (attr) s = s.replace(/Gemini 4 (Neon|Carbon|Hydrogen)|Muse Wonder/g, (m) => PLAIN[m]); for (const [re, to, ok] of R) if (!(attr && ok)) s = s.replace(re, to); return s; };
export const rewriteText = (html) => {
  let raw = 0, out = "";
  for (const part of html.split(/(<!--[\s\S]*?-->|<[^>]+>)/)) {
    if (part[0] === "<") {
      if (/^<(style|script)\b/i.test(part)) raw++;
      else if (/^<\/(style|script)\b/i.test(part)) raw--;
      out += part.startsWith("<!--") ? part : part.replace(ATTR, (m, a, v) => a + apply(v, true) + '"');
    } else out += raw ? part : apply(part, false);
  }
  return out;
};

// ---- structural edits (screens only) ----
const LOCKED = [
  [/^(set-cloud-agents-1|ide-33-settings-cloud-agents)$/, "Cloud and background agents"],
  [/^(set-voice-[12]|dd-voice-.*)$/, "Voice input"],
  [/^(set-code-intelligence-[12]|ide-39-settings-indexing|btn-code-intelligence-.*)$/, "Code intelligence and indexing"],
  [/^(set-browser-and-network-1|ide-37-settings-browser-network|btn-browser-and-network-.*|dd-browser-and-network-.*)$/, "Browser tool"],
  [/^(ai-34-tab-ghost-text-completion)$/, "Tab completion (ghost text)"],
  [/^(ai-3[678]-debug-mode-.*)$/, "Debug mode"],
  [/^(dd-source-control-review-provider)$/, "Review providers"],
];
const bannerCss = '<style data-omnide-locked>[data-component="glass-settings-tab"]>:not(header){opacity:.5;pointer-events:none}.omn-banner{position:absolute;z-index:9999;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid #3A3649;background:#221F2C;color:#F4F2FB;font:500 12px/16px Geist,system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.4)}.omn-banner i{color:#C4B5FD}</style>';
const banner = (what) => `<div class="omn-banner" data-locked="true" role="status"><i class="codicon codicon-lock"></i>${what} is locked in v0.1<span class="omn-lock" style="margin-left:4px">Upcoming in v0.2</span></div>`;

const field = (label, value, extra = "") => `<div style="display:flex;justify-content:space-between;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--vscode-widget-border,#3A3649)"><div><div style="font-weight:500">${label}</div>${extra ? `<div style="font-size:12px;opacity:.7;margin-top:2px">${extra}</div>` : ""}</div><div style="text-align:right">${value}</div></div>`;
const btn = (t, primary) => `<button type="button" style="font:inherit;font-size:13px;padding:6px 14px;border-radius:6px;cursor:pointer;margin-left:8px;${primary ? "background:#6D28D9;color:#fff;border:1px solid #6D28D9" : "background:transparent;color:inherit;border:1px solid var(--vscode-widget-border,#3A3649)"}">${t}</button>`;
const chip = (t, tone) => `<span style="display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:12px;border:1px solid currentColor;color:${tone}"><i class="codicon codicon-${tone === "#41CB7E" ? "check" : "circle-filled"}"></i>${t}</span>`;
export const CLAUDE_STATES = {
  "signed-in": () => field("Connection", chip("Connected", "#41CB7E"), "Claude subscription through Claude Code's own sign-in") +
    field("Account", "you@example.com", "Sample data; shown from Claude Code, never stored by OmnIDE") +
    field("Default model", "Default (Claude Code)", "Per-chat choice lives in the model picker") +
    field("Claude Code", "2.1.0 (sample)", "Found on PATH") + field("Adapter", "claude-agent-acp 0.112.0", "Started by OmnIDE for each session") +
    `<div style="padding:16px 0">${btn("Open usage on claude.ai", true)}${btn("Sign out")}</div>`,
  "not-installed": () => field("Claude Code", chip("Not found", "#FF6A69"), "OmnIDE needs Claude Code on your machine. Nothing is sent to an OmnIDE server.") +
    field("Adapter", "claude-agent-acp 0.112.0", "Bundled; waits for Claude Code") +
    `<div style="padding:16px 0">${btn("Install Claude Code", true)}${btn("Check again")}</div><div style="font-size:12px;opacity:.7">Install runs the official installer in the integrated terminal and asks first.</div>`,
  "signed-out": () => field("Connection", chip("Not signed in", "#E2B33F"), "Choose how OmnIDE reaches Claude") +
    field("Claude Code", "2.1.0 (sample)", "Found on PATH") +
    `<div style="padding:16px 0">${btn("Sign in with Claude", true)}${btn("Use an Anthropic API key")}</div><div style="font-size:12px;opacity:.7">API keys are kept in VS Code SecretStorage (OS keychain). Subscription sign-in is handled by Claude Code in your browser.</div>`,
  error: () => field("Connection", chip("Error", "#FF6A69"), "Claude Code answered with an error") +
    `<pre style="margin:12px 0;padding:12px;border-radius:6px;background:rgba(255,106,105,.08);border:1px solid rgba(255,106,105,.4);font:12px/18px 'Geist Mono',monospace;white-space:pre-wrap">Authentication failed (401): your session has expired.\nRun "Sign in again" or use an API key.</pre>` +
    `<div style="padding:8px 0">${btn("Retry", true)}${btn("Sign in again")}${btn("Copy diagnostics")}</div>`,
};
export const claudePane = (state) => `<section style="padding:0 0 24px"><div style="max-width:720px">${CLAUDE_STATES[state]()}</div></section>`;
const swapSection = (html, state) => { const m = html.indexOf('data-component="glass-settings-tab"'); const s = html.indexOf("<section", m), e = html.indexOf("</section>", s) + 10; return m < 0 || s < 0 ? html : html.slice(0, s) + claudePane(state) + html.slice(e); };
const PANES = { "set-plan-and-usage-1": "signed-in", "set-plan-and-usage-limit": "signed-in", "ide-31-settings-plan-usage": "signed-in", "omni-claude-not-installed": "not-installed", "omni-claude-signed-out": "signed-out", "omni-claude-error": "error" };
export const screenEdits = (html, { file, screen }) => {
  if (!screen) return html;
  const id = file.replace(/^v[23]-/, "").replace(/\.dc\.html$/, "");
  if (PANES[id]) html = swapSection(html, PANES[id]);
  html = html.replace(/(<span title="(Cloud Agents|Voice|Code Intelligence|Browser &amp; Network)">\2<\/span>)/g, '$1<span class="omn-lock" style="margin-left:6px"><i class="codicon codicon-lock"></i> v0.2</span>');
  for (const [re, what] of LOCKED) if (re.test(id)) {
    html = html.replace("</helmet>", bannerCss + "</helmet>").replace(/(<div data-page="v3"[^>]*>)/, "$1" + banner(what));
    break;
  }
  return html;
};
