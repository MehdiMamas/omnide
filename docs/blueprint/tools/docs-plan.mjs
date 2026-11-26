import { page, card, grid, h2, p, table, mono, pill, live, locked, K, MUTED, LINE, node, arrow, diagram, legend, sources } from "./lib.mjs";
const out = [];
const GH = "https://github.com/MehdiMamas/omnide/issues/";
const iss = (n) => `<a href="${GH}${n}">#${n}</a>`;

// Plan
const FILES = [
  ["product.json", "Create (patch)", "nameShort, nameLong OmnIDE, applicationName omnide, dataFolderName .omnide, urlProtocol omnide, extensionsGallery to Open VSX, updateUrl to the GitHub Pages latest.json, no telemetry or crash reporter", iss(1)],
  ["patches/*.patch and upstream.json", "Create", "Patch series on Code OSS 1.148.0: branding strings, remove telemetry, remove the Microsoft marketplace, disable the built-in chat. One patch per change, applied in order", iss(1)],
  ["resources/{win32,darwin,linux}/ and src/omnide/brand/", "Create", "App icons from the chosen mark (.ico, .icns, .png, 16 px favicon), welcome and About artwork", iss(1)],
  ["src/omnide/theme/omnide-dark.json, omnide-light.json", "Create", "VS Code colour themes from the Design tokens frame, plus extensions/theme-omnide/package.json", iss(1)],
  ["src/omnide/fonts/", "Create", "Geist and Geist Mono woff2 and the OFL text, wired through the workbench font-face CSS", iss(1)],
  ["extensions/omnide-agent/ (package.json, src/acp/client.ts, session.ts, permissions.ts, checkpoints.ts, history.ts, modes.ts, models.ts, mcp.ts, registry.ts, account.ts, customize/*.ts)", "Create", "Built-in extension: the ACP client, session state machine, approvals, checkpoints, history, Settings > Claude. Adapter spawned from the app bundle, pinned to @agentclientprotocol/claude-agent-acp 0.112.0", iss(2) + " " + iss(3)],
  ["extensions/omnide-agent/webview/ and media/", "Create", "Agent panel, composer, tool cards, review view, locked badges; the AI-first layout (Agent pane on the side, chat as the main area)", iss(4)],
  ["extensions/omnide-agent/agents.json", "Create", "Registry bundle: Claude Code unlocked, Gemini CLI, Codex and GitHub Copilot locked for v0.2", iss(2)],
  ["scripts/build.sh, prepare_vscode.sh, patches.sh", "Create", "Fetch Code OSS at the pinned tag, apply patches, build for Windows, macOS and Linux", iss(1)],
  [".github/workflows/build.yml, release.yml", "Create", "Matrix build on GitHub Actions; macOS builds signed and notarised; draft release with sha256 sums", iss(1)],
  [".github/workflows/pages.yml and docs/updates/latest.json", "Create", "Publishes latest.json (version, url, sha256) to GitHub Pages for the update check", iss(1)],
  [".github/workflows/watch.yml", "Create", "Weekly: new Code OSS tag, new adapter version, new ACP registry entries; opens an issue, never auto-merges", iss(6)],
  ["Process lifetime in session.ts", "Create", "Closing the window stops the adapter and every child process it started", iss(5)],
];
const STEPS = [
  ["1", "Rebrand and base build: product.json, patches, icons, themes, fonts", "App starts as OmnIDE with the new icon, no telemetry request in the network log, extensions from Open VSX"],
  ["2", "Agent extension skeleton: spawn the adapter, initialize, session/new", "A scripted prompt streams text into the panel"],
  ["3", "Tools and approvals: tool cards, request_permission, fs and terminal methods", "An edit asks, Allow applies the diff, Reject leaves files untouched"],
  ["4", "Modes, models, checkpoints, history, review, Stop", "Restore returns files and chat to before the turn; an old chat reopens with session/load"],
  ["5", "Settings > Claude, Install and sign-in states, API key in SecretStorage", "Each of the four states renders and the action works"],
  ["6", "Locked features: badges, locked pane banners, registry flags", "Nothing locked is clickable; flipping a flag in a test unlocks the item"],
  ["7", "Customize screens write the real Claude Code files (MCP, skills, rules, hooks, subagents, commands, plugins)", "Claude Code reads what the screen wrote"],
  ["8", "Release: sign and notarise macOS, latest.json, update check, weekly watchers", "A tagged build installs, then updates itself from the next release"],
];
out.push(page("v3-Plan", {
  section: "plan", kicker: "Plan", title: "Plan: what is created or changed, in order", h: 2100,
  intro: `Issue ${iss(10)} holds this plan; no code starts before the owner's yes on this canvas. Paths are in the repo MehdiMamas/omnide. Base: Code OSS 1.148.0 with a patch series, the model VSCodium uses.`,
  body: h2("Files and folders") + table(["Path", "Change", "What", "Issue"], FILES.map((r) => [mono(r[0]), r[1], r[2], r[3]])) +
    h2("Steps, each with its check") + table(["Step", "Do", "Check before the next step"], STEPS) +
    h2("Out of scope for v0.1") + grid(3, [
      card("Locked, shown in the app", `Other agents, cloud and background agents ${iss(8)}, tab completion ${iss(7)}, voice, browser tool, debug mode, indexing, review providers. Each has its screen with the locked banner.`),
      card("Not planned", "An OmnIDE account, billing, a custom domain, a Microsoft marketplace listing, telemetry of any kind."),
      card("Open", "Formal trademark search; macOS signing needs the owner's Apple developer account (Q1 on the Questions frame)."),
    ]),
}));

// Changes
const CH = [
  ["Name and logo", "Cursor wordmark and mark", "OmnIDE name; ring and prompt chevron mark; app icon, favicon, About and welcome", "Brand frame"],
  ["Colours", "Cursor's own dark and light themes and accent", "Purple-tinted neutrals with a purple accent, light theme to match; every pair checked for contrast", "Design tokens"],
  ["Fonts", "System UI font", "Geist and Geist Mono, bundled", "Design spec"],
  ["Agent", "Cursor's agent with its own models (Composer, Grok, GPT, Gemini)", "Claude Code through ACP: Default (Claude Code), Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2", "Agent design frames"],
  ["Account", "A Cursor account with plans, usage and billing", "No account. Settings > Claude: Claude subscription sign-in or an Anthropic API key, email, default model, versions, Open usage on claude.ai, Sign out", "Settings > Claude frames"],
  ["Customize", "Rules, hooks, MCP, skills in Cursor's folders", "The same screens write Claude Code's real files: CLAUDE.md, settings.json hooks, .mcp.json, .claude/skills, agents, commands", "Agent mapping"],
  ["Cloud, voice, browser tool, completion, debug mode, indexing, review bot", "Live features", "Kept as screens, greyed with a lock and Upcoming in v0.2", "Locked badge spec"],
  ["Other agents", "Not offered", "Gemini CLI, Codex and GitHub Copilot listed from the ACP registry, locked for v0.2", "Registry frame"],
  ["Updates and release", "Cursor servers and installers", "GitHub Releases plus latest.json on GitHub Pages; signed and notarised on macOS; no domain", "Deploy frame"],
  ["Base and licence", "Closed source on a VS Code fork", "Open source (MIT) on Code OSS; telemetry removed", "Case studies"],
];
out.push(page("v3-omni-Changes", {
  section: "plan", kicker: "Changes", title: "What differs from the reference IDE, by area", h: 900,
  intro: "The layout, flows and screens are kept so the product feels familiar. This table lists what OmnIDE changes and where on the canvas to see it.",
  body: table(["Area", "Reference IDE (Cursor 3.32.4)", "OmnIDE v0.1", "See"], CH),
}));

// Progress
out.push(page("v3-Progress", {
  section: "plan", kicker: "Plan · progress", title: "v3: built, checked, waiting for your yes", h: 620,
  intro: "Status of this page, kept current as it is built.",
  body: `<div style="height:8px;border-radius:4px;background:${LINE};margin:0 0 18px"><div data-progress style="width:100%;height:8px;border-radius:4px;background:${K.ok}"></div></div>` +
    card("Screens", "292 boards carried over and rebuilt: OmnIDE name and mark, purple tokens, Geist, Claude models, Settings > Claude in four states, locked features greyed with Upcoming in v0.2.") +
    card("New frames", "Agent design (component, sequence, states, mapping, registry), Plan, Design spec, Design tokens, Brand with three logos, Changes, Claude Code in v0.1 versus v0.2.") +
    card("Left open", "Owner review of this page; trademark search; Apple developer account for signing. Details on the Questions frame."),
}));

// History
out.push(page("v3-History", {
  section: "history", kicker: "History", title: "History", h: 640,
  intro: "Every change to this canvas, newest first.",
  body: table(["Date", "Page", "Change", "Why"], [
    ["2026-11-26", "v3", "v3 built: new OmnIDE mark, Geist, purple design tokens, Claude models and Claude Code wording, Settings > Claude, locked v0.2 features, Agent design, plan, design spec.", "The owner rejected v2 as a rebranded copy with the reference IDE's branding still on it."],
    ["2026-11-26", "v2", "v2 built as a copy of the As-is canvas with a purple accent. Superseded by v3.", "The owner rejected the v1 scratch design."],
    ["2026-11-26", "v1", "v1 created: 48 boards. Superseded.", "First design pass from the research."],
  ], { rowAttrs: (r) => `data-change data-date="${r[0]}" data-page="${r[1]}"` }),
}));

// ArchLayers rewritten: what OmnIDE adds on top of Code OSS
{
  const b = [
    node("os", 24, 330, 1090, 70, "Code OSS 1.148.0 (MIT)", "Workbench, editor, terminal, extension host, Open VSX client. Taken unchanged except the patch series"),
    node("patch", 24, 220, 520, 80, "OmnIDE patches", "product.json, branding strings, telemetry removed, marketplace switched to Open VSX, update URL"),
    node("brand", 580, 220, 534, 80, "OmnIDE assets", "Mark and icons, Geist and Geist Mono, omnide-dark and omnide-light themes"),
    node("agent", 24, 100, 520, 90, "omnide.agent (built-in extension)", "ACP client, Agent panel, approvals, checkpoints, history, Settings > Claude", { acc: true }),
    node("ext", 580, 100, 534, 90, "Other built-in extensions", "Language features and themes from Code OSS; user extensions from Open VSX"),
    node("cc", 24, 10, 520, 60, "claude-agent-acp and Claude Code", "Child process, one per window"),
    arrow("omnide.agent runs on the Code OSS extension host", 280, 190, 280, 330),
    arrow("Patches modify Code OSS", 280, 300, 280, 330),
    arrow("Assets are bundled into the workbench", 840, 300, 840, 330),
    arrow("omnide.agent spawns the adapter", 280, 100, 280, 70),
  ];
  out.push(page("v3-ArchLayers", {
    section: "architecture", kicker: "Architecture · layers", title: "Layers: OmnIDE on top of Code OSS", h: 760,
    attrs: 'data-diagram="component"',
    intro: "Everything OmnIDE owns is above the base: a patch series, brand assets, and one built-in extension. Upstream updates arrive by changing the pinned tag; the weekly watcher opens an issue when a new one is out.",
    body: diagram(420, b) + legend(["purple: the one extension that carries the agent"]),
  }));
}
export default out;
