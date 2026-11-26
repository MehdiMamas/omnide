import { page, card, grid, h2, p, table, node, arrow, note, diagram, sequence, sources, legend, mono, live, locked, pill, K, MUTED, LINE } from "./lib.mjs";

const ACP = "https://agentclientprotocol.com/protocol";
const SRC = [
  [`${ACP}/overview`, "ACP overview"], [`${ACP}/initialization`, "initialization"], [`${ACP}/session-setup`, "session setup"],
  [`${ACP}/prompt-turn`, "prompt turn"], [`${ACP}/tool-calls`, "tool calls"], [`${ACP}/file-system`, "file system"], [`${ACP}/terminals`, "terminals"],
  ["https://github.com/agentclientprotocol/claude-agent-acp", "claude-agent-acp"],
  ["https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json", "ACP registry"],
  ["https://code.claude.com/docs/en/checkpointing.md", "Claude Code checkpointing"],
];
const out = [];

// 1 component
{
  const b = [
    node("workbench", 24, 40, 190, 92, "Workbench", "Agent panel, composer, review, history (Code OSS UI)"),
    node("ext", 270, 40, 220, 92, "omnide.agent", "Built-in extension. ACP client over stdio JSON-RPC", { acc: true }),
    node("adapter", 546, 40, 200, 92, "claude-agent-acp", "Pinned adapter, npm @agentclientprotocol/claude-agent-acp 0.112.0"),
    node("sdk", 802, 40, 170, 92, "Claude Code SDK", "@anthropic-ai/claude-agent-sdk 0.3.331"),
    node("api", 1000, 40, 130, 92, "Anthropic API", "Subscription or API key"),
    node("cfg", 546, 220, 200, 78, "Claude Code files", "~/.claude/settings.json, .mcp.json, .claude/*, CLAUDE.md"),
    node("ckpt", 270, 220, 220, 78, "Checkpoint store", "Shadow git repo, one snapshot before each turn"),
    node("flags", 24, 220, 190, 78, "Agent registry", "Entries and capability flags drive the locked badges"),
    node("other", 546, 350, 200, 62, "Other agents (v0.2)", "Gemini CLI, Codex, Copilot", { locked: true }),
    arrow("Workbench to omnide.agent: commands and view state", 214, 86, 270, 86),
    arrow("omnide.agent to claude-agent-acp: JSON-RPC over stdin and stdout", 490, 86, 546, 86, { text: "stdio" , ty: 76}),
    arrow("claude-agent-acp to Claude Code SDK: in-process call", 746, 86, 802, 86),
    arrow("Claude Code SDK to Anthropic API: HTTPS", 972, 86, 1000, 86),
    arrow("omnide.agent to checkpoint store: snapshot before each turn", 380, 132, 380, 220),
    arrow("claude-agent-acp to Claude Code files: reads settings, MCP, skills", 646, 132, 646, 220),
    arrow("omnide.agent to agent registry: reads entries and flags", 300, 132, 170, 220, { dash: true }),
    arrow("agent registry to other agents: locked until the flag flips in v0.2", 170, 298, 546, 380, { dash: true, dim: true }),
  ];
  out.push(page("v3-agent-Component", {
    section: "architecture", kicker: "Agent design · component", title: "Agent: how the pieces connect", h: 760,
    attrs: 'data-diagram="component"',
    intro: `The Agent panel is not code inside the editor core. It is the built-in extension ${"omnide.agent"}, an ACP client. It starts the pinned adapter as a child process and speaks JSON-RPC over its stdin and stdout. The adapter drives Claude Code through the official SDK. Nothing talks to Anthropic except Claude Code itself.`,
    body: diagram(440, b) + legend(["solid arrow: runs in v0.1", "dashed: reads config or reserved for v0.2", "dashed box: locked"]) +
      grid(3, [
        card("Why an adapter and not the CLI", "ACP gives one protocol for any agent, so v0.2 adds Gemini CLI or Codex with a registry entry and no UI change. The adapter is maintained by the ACP project, so protocol updates keep arriving."),
        card("Why the extension is built in", "It ships inside the app, signed with it, and Open VSX is not needed to get the agent. It uses the same extension API as any extension, so a fork never patches the core for it."),
        card("Auth", "Sign-in is Claude Code's own: the adapter offers terminal auth methods (claude-ai-login, claude-login, console-login). An Anthropic API key is stored in VS Code SecretStorage. OmnIDE has no account."),
      ]) + sources(SRC),
  }));
}

// 2 sequence
{
  const parts = [["ui", "Workbench", "Agent panel"], ["acp", "omnide.agent", "ACP client"], ["ad", "claude-agent-acp", "adapter"], ["cc", "Claude Code", "SDK and API"]];
  const m = [
    ["ui", "acp", "user sends a prompt"], ["acp", "acp", "snapshot the workspace (checkpoint)"],
    ["acp", "ad", "initialize (first time): protocol version, capabilities"], ["ad", "acp", "capabilities, auth methods", { dash: true }],
    ["acp", "ad", "session/new: cwd, mcpServers from .mcp.json"], ["ad", "acp", "sessionId, modes, models", { dash: true }],
    ["acp", "ad", "session/prompt: sessionId, content blocks"], ["ad", "cc", "run the turn"],
    ["ad", "acp", "session/update: agent_message_chunk, plan", { dash: true }], ["acp", "ui", "stream text into the panel", { dash: true }],
    ["ad", "acp", "session/update: tool_call (pending, kind, locations)", { dash: true }],
    ["ad", "acp", "session/request_permission: allow_once, allow_always, reject_once, reject_always"], ["acp", "ui", "show the approval card"],
    ["ui", "acp", "user picks an option"], ["acp", "ad", "outcome: selected optionId", { dash: true }],
    ["ad", "acp", "fs/read_text_file or fs/write_text_file (editor buffers)"], ["acp", "ad", "file content or ok", { dash: true }],
    ["ad", "acp", "terminal/create, terminal/output, terminal/wait_for_exit"],
    ["ad", "acp", "session/update: tool_call_update (completed or failed)", { dash: true }],
    ["ad", "acp", "stopReason: end_turn (or max_tokens, refusal, cancelled)", { dash: true }], ["acp", "ui", "finish the turn, show changed files", { dash: true }],
    ["acp", "ad", "session/cancel (user pressed Stop)", { bad: true }],
  ];
  out.push(page("v3-agent-Sequence", {
    section: "architecture", kicker: "Agent design · sequence", title: "Agent: one prompt turn, message by message", h: 1260,
    attrs: 'data-diagram="sequence"',
    intro: `Method and notification names are the real ACP ones. The client answers the adapter's file and terminal requests from the editor, so unsaved buffers are seen and edits show as diffs. Cancel is a notification the client sends at any point in the turn; the turn then ends with stopReason cancelled.`,
    body: sequence(parts, m, { gap: 42, top: 92 }) + legend(["solid: request or notification", "dashed: response or update", "red: user cancel"]) + sources(SRC.slice(0, 7)),
  }));
}

// 3 states
{
  const S = [
    ["missing", 30, 30, "Not installed", "No Claude Code found. Install button.", { edge: true }],
    ["signedout", 300, 30, "Signed out", "Adapter offers auth methods"],
    ["starting", 570, 30, "Starting", "Spawn adapter, initialize, session/new"],
    ["idle", 840, 30, "Idle", "Ready for a prompt", { acc: true }],
    ["running", 840, 190, "Running", "Streaming message chunks and tool calls", { acc: true }],
    ["asking", 570, 190, "Waiting for approval", "session/request_permission open"],
    ["cancelling", 300, 190, "Cancelling", "session/cancel sent, wait for stopReason"],
    ["loading", 30, 190, "Loading history", "session/load replays updates"],
    ["error", 570, 340, "Error", "Adapter crashed, auth failed, or rate limit", { edge: true }],
    ["closed", 840, 340, "Closed", "Window closed, adapter process stopped"],
  ];
  const b = S.map(([id, x, y, l, s, o]) => node(id, x, y, 230, 80, l, s, o)).concat([
    arrow("Not installed to Signed out: install finished", 260, 70, 300, 70),
    arrow("Signed out to Starting: sign-in done", 530, 70, 570, 70),
    arrow("Starting to Idle: session ready", 800, 70, 840, 70),
    arrow("Idle to Running: prompt sent", 955, 110, 955, 190),
    arrow("Running to Waiting for approval: permission requested", 840, 230, 800, 230),
    arrow("Waiting for approval to Running: option chosen", 800, 250, 840, 250, { dash: true }),
    arrow("Running to Idle: end_turn", 990, 190, 990, 110, { dash: true }),
    arrow("Running to Cancelling: user presses Stop", 955, 270, 530, 300, { bad: true }),
    arrow("Cancelling to Idle: cancelled", 415, 190, 840, 90, { dash: true }),
    arrow("Idle to Loading history: open an old chat", 840, 80, 260, 190),
    arrow("Loading history to Idle: replay done", 145, 190, 840, 60, { dash: true, dim: true }),
    arrow("Running to Error: adapter exits or API error", 900, 270, 700, 340, { bad: true }),
    arrow("Error to Starting: retry", 640, 340, 640, 110, { dash: true }),
    arrow("Idle to Closed: window closed", 1000, 110, 1000, 340, { dash: true, dim: true }),
  ]);
  out.push(page("v3-agent-States", {
    section: "flows", kicker: "Agent design · state machine", title: "Agent session: states and what moves it", h: 760,
    attrs: 'data-diagram="state"',
    intro: "One session per chat tab. The panel shows the state in its own words: the composer is disabled while Not installed or Signed out, Stop replaces Send while Running or Waiting for approval, and every Error offers Retry and Copy diagnostics. Closing the window stops the adapter (issue #5).",
    body: diagram(470, b) + legend(["red: failure or missing", "dashed: return path"]) + sources(SRC.slice(0, 4)),
  }));
}

// 4 mapping
{
  const R = [
    ["Agent / Ask / Plan modes", "session/set_mode, session/update current_mode_update. Adapter modes: default, acceptEdits, plan", "modes.ts", live],
    ["Model picker and effort", "session/set_config_option (model, effort). Names: Default (Claude Code), Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2; effort low to max", "models.ts", live],
    ["Approvals (Allow, Allow always, Reject)", "session/request_permission with options allow_once, allow_always, reject_once, reject_always", "permissions.ts", live],
    ["Changed files and review", "tool_call with kind edit and diff content; fs/write_text_file applied to a review buffer", "review.ts", live],
    ["Checkpoints and restore", "OmnIDE only. Shadow git snapshot before each session/prompt; restore resets files, then the conversation. Claude Code keeps its own in ~/.claude/file-history", "checkpoints.ts", live],
    ["Chat history", "session/load replays history as session/update; list from ~/.claude/projects/&lt;project&gt;/&lt;session&gt;.jsonl", "history.ts", live],
    ["Stop", "session/cancel, then stopReason cancelled", "session.ts", live],
    ["Terminal output in a tool card", "terminal/create, output, wait_for_exit, release, kill", "terminals.ts", live],
    ["MCP servers", ".mcp.json and ~/.claude.json, passed as mcpServers in session/new", "mcp.ts", live],
    ["Skills, Commands, Subagents, Rules, Hooks", "Files Claude Code reads: .claude/skills, .claude/commands, .claude/agents, CLAUDE.md, hooks in settings.json. The Settings screens edit those files", "customize/*.ts", live],
    ["Plugins and marketplace", "claude plugin commands and .claude-plugin/marketplace.json; plugin id plugin@marketplace", "plugins.ts", live],
    ["Settings > Claude (sign-in, version)", "initialize authMethods, authenticate; API key in SecretStorage; adapter and CLI versions from the process", "account.ts", live],
    ["Other agents (Gemini CLI, Codex, Copilot)", "Same ACP client, a registry entry per agent, capability flags", "registry.ts", locked],
    ["Cloud and background agents", "Not defined by ACP. Needs a remote runner", "-", locked],
    ["Tab completion, voice, browser tool, debug mode, indexing, review providers", "Not part of the Claude Code adapter; OmnIDE features for v0.2", "-", locked],
  ];
  out.push(page("v3-agent-Mapping", {
    section: "architecture", kicker: "Agent design · features to mechanisms", title: "Every Agent feature and what makes it work", h: 1250,
    intro: `Each row is a UI feature, the ACP method or Claude Code mechanism behind it, and the module in extensions/omnide-agent/src. Locked rows are greyed in the app with a lock and "Upcoming in v0.2"; they are not clickable.`,
    body: table(["Feature", "Mechanism", "Module", "State"], R.map(([a, b, c, d]) => [`<b>${a}</b>`, b, mono(c), d])) + sources([...SRC.slice(3), ["https://code.claude.com/docs/en/mcp.md", "MCP"], ["https://code.claude.com/docs/en/sessions.md", "sessions"], ["https://code.claude.com/docs/en/permission-modes.md", "permission modes"], ["https://code.claude.com/docs/en/plugins/marketplace-reference.md", "marketplaces"]]),
  }));
}

// 5 registry / adapter interface (class diagram)
{
  const b = [
    node("iface", 380, 20, 380, 150, "&laquo;interface&raquo; AgentAdapter", "id, name, command, args, env<br>capabilities: Capabilities<br>locked: boolean<br>spawn(): ChildProcess", { acc: true }),
    node("caps", 830, 20, 290, 150, "Capabilities (flags)", "modes, models, checkpoints, history, mcp, plugins, images, terminals. Read from initialize, with a manifest default"),
    node("claude", 20, 250, 300, 118, "ClaudeAdapter (v0.1)", "command: node, claude-agent-acp pinned in the app. locked: false"),
    node("geminicli", 360, 250, 220, 118, "Gemini CLI adapter (v0.2)", "registry id for Gemini CLI. locked: true", { locked: true }),
    node("codex", 600, 250, 220, 118, "CodexAdapter (v0.2)", "registry id codex-acp. locked: true", { locked: true }),
    node("copilot", 840, 250, 280, 118, "CopilotAdapter (v0.2)", "registry id github-copilot-cli. locked: true", { locked: true }),
    node("reg", 20, 20, 300, 150, "Registry", "agents.json bundled in the app; refreshed weekly from the ACP registry (issue #6)"),
    arrow("ClaudeAdapter implements AgentAdapter", 170, 250, 400, 170),
    arrow("Gemini CLI adapter implements AgentAdapter", 470, 250, 520, 170, { dash: true, dim: true }),
    arrow("CodexAdapter implements AgentAdapter", 710, 250, 620, 170, { dash: true, dim: true }),
    arrow("CopilotAdapter implements AgentAdapter", 980, 250, 700, 170, { dash: true, dim: true }),
    arrow("AgentAdapter has Capabilities, one to one", 760, 95, 830, 95, { text: "1", ty: 85 }),
    arrow("Registry lists AgentAdapter, one to many", 320, 95, 380, 95, { text: "1..*", ty: 85 }),
  ];
  out.push(page("v3-agent-Registry", {
    section: "architecture", kicker: "Agent design · adapter interface", title: "Adding an agent in v0.2 is a registry entry, not a UI change", h: 900,
    attrs: 'data-diagram="class"',
    intro: "The Agent panel talks only to AgentAdapter. Everything it shows (mode list, model list, locked badges, the agent picker) comes from the adapter's capabilities and its locked flag. In v0.1 only Claude Code has locked false; the others are listed, greyed, with a lock and the badge Upcoming in v0.2.",
    body: diagram(400, b) + legend(["dashed: reserved for v0.2", "1, 1..*: multiplicity"]) +
      h2("To add one agent in v0.2") + table(["Step", "Change", "Check"], [
        ["1", "Add an entry to agents.json: id, name, command, args, env", "The entry validates against the registry schema in CI"],
        ["2", "Set locked to false", "The picker shows it, no lock, clickable"],
        ["3", "Map any capability the agent lacks (the UI hides what a capability flag says is missing)", "Composer shows no model picker when models is false"],
        ["4", "Add a sign-in method if the agent needs one", "Settings > Agents lists it"],
      ]) + sources([SRC[8], SRC[7], SRC[1]]),
  }));
}
export default out;
