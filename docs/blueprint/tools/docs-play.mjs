import { page, K, MUTED, esc } from "./lib.mjs";
const S = (b, n) => `v3-agent-States:${n}`;
function play(file, kind, title, story, steps, h = 560) {
  const li = steps.map(([href, label, node, text]) => `<li style="margin:0 0 8px"><a href="${href}" data-flow="${S(0, node)}">${esc(label)}</a><br><span style="color:${MUTED}">${esc(text)}</span></li>`).join("");
  return page(file, {
    section: "play", kicker: `Play · ${kind}`, title, h, attrs: `data-scenario="${file.replace("v3-", "")}" data-kind="${kind}" data-story="${esc(story)}"`,
    intro: `${story} Click a step to open its screen. <a href="v3-agent-States.dc.html">See the session states</a>.`,
    body: `<ol style="margin:0;padding-left:22px;max-width:1000px">${li}</ol>`,
  });
}
export default [
  play("v3-PlayClaudeSession", "happy", "Claude session, start to close", "As a developer, I want to sign in and run a prompt with Claude Code, so that I can work with it inside OmnIDE.", [
    ["v3-omni-claude-signed-out.dc.html", "Signed out", "signedout", "Settings > Claude shows Sign in; the choice is a Claude subscription or an API key."],
    ["v3-set-plan-and-usage-1.dc.html", "Signed in", "starting", "The adapter starts and the session is created."],
    ["v3-ai-01-agent-mode-picker.dc.html", "Ready, pick a mode", "idle", "The composer waits for a prompt in Agent, Plan or Ask mode."],
    ["v3-chat-run1-3.dc.html", "Prompt running", "running", "Text and tool cards stream in; Stop is available."],
    ["v3-omni-permission-ask.dc.html", "Asked to edit", "asking", "The turn pauses until you choose Allow or Deny."],
    ["v3-ai-48-stop-generation.dc.html", "Stop the turn", "cancelling", "Stop sends session/cancel; the turn ends as cancelled."],
    ["v3-chat-history.dc.html", "Reopen an old chat", "loading", "session/load replays the history of an earlier chat."],
    ["v3-chat-kept.dc.html", "Finish and close", "closed", "The adapter and its child processes are stopped."],
  ], 760),
  play("v3-PlayClaudeSetupEdge", "edge", "Claude Code missing", "As a developer without Claude Code installed, I want clear next steps, so that I can get set up without leaving OmnIDE.", [
    ["v3-omni-claude-missing.dc.html", "Claude Code not found", "missing", "The agent pane explains the problem and offers Install."],
    ["v3-omni-claude-not-installed.dc.html", "Settings > Claude, not installed", "missing", "The Claude settings page shows the same state with the install action."],
  ]),
  play("v3-PlayClaudeError", "error", "Agent stops with an error", "As a developer, I want to see what went wrong when the adapter fails, so that I can retry or sign in again.", [
    ["v3-omni-claude-error.dc.html", "Error state", "error", "The adapter exited or the request failed; the pane shows the message and Retry."],
    ["v3-set-plan-and-usage-1.dc.html", "After Retry", "starting", "A new session starts and the pane is ready again."],
  ]),
];
