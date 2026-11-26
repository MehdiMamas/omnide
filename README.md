# Omnide

**One editor. Any AI you already pay for. Or none at all. Free forever.**

Omnide is an open-source code editor built on [Code - OSS](https://github.com/microsoft/vscode) (the MIT-licensed core of VS Code). It aims for the polished, AI-first feel of today's best AI editors, without locking you into one model, one company or one more subscription.

> Status: early. Nothing to download yet. The plan lives in [issues](../../issues) and the [roadmap](../../issues?q=label%3Aroadmap).

## Mission

- **Bring your own subscription.** Sign in to the agents you already use (Claude Code, Codex, Gemini CLI, GitHub Copilot, OpenCode and any other [ACP](https://agentclientprotocol.com) agent) with your own account. Omnide never resells tokens and never charges per request.
- **AI is optional.** With no agent signed in, Omnide is a fast, complete editor.
- **Your keys stay yours.** Omnide never asks for, stores or relays your AI provider's login. Each agent runs as its own official program on your machine.
- **Close it and everything stops.** Every process Omnide starts (agents, terminals, language servers) belongs to the window and ends with it. No background services.
- **Open, forever.** MIT licensed, built in public, extensions from [Open VSX](https://open-vsx.org).

## How it is built

Omnide follows the [VSCodium](https://github.com/VSCodium/vscodium) model: we pin an upstream Code - OSS release, keep our changes as a small series of patches, and build releases on GitHub Actions for Windows, macOS and Linux. Features ship as built-in extensions where possible, so upstream updates stay easy.

| Piece | Where |
|---|---|
| Upstream version | [`upstream.json`](upstream.json) |
| Our changes | `patches/` (coming in the base-build issue) |
| Features | built-in extensions under `extensions/` |

## Contributing

Everything is planned in the open. Pick an issue labelled [`good first issue`](../../issues?q=label%3A%22good+first+issue%22), or open a Discussion with an idea. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support the project

Omnide is free. Donations will open through GitHub Sponsors.

## Not affiliated

Omnide is an independent project. It is not affiliated with or endorsed by Microsoft, Anysphere (Cursor), Anthropic, OpenAI, Google or GitHub. Product names belong to their owners. We do not copy any proprietary code, icons or assets.

## License

[MIT](LICENSE)
