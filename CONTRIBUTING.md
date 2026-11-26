# Contributing to Omnide

Thanks for helping. A few rules keep the project healthy.

## How work is planned
- Every change starts as an issue. Big ones link to the [roadmap](../../issues?q=label%3Aroadmap).
- Comment on an issue before you start, so two people don't build the same thing.
- Ideas and questions go to [Discussions](../../discussions).

## Ground rules
1. **Clean room.** Never copy code, icons, images, text or assets from proprietary editors (including Cursor). Build from public behaviour and your own work. PRs that copy will be closed.
2. **Patches stay small.** Changes to Code - OSS live in `patches/` and should be as small as possible. Prefer a built-in extension over a core patch.
3. **No credential handling.** Omnide must never ask for, store, proxy or log a user's AI provider login or tokens. Agents run as their own official programs.
4. **Close means stop.** Anything you spawn must be tied to the window's process tree and end when it closes.
5. **No telemetry** unless it is opt-in and documented.

## Pull requests
- One topic per PR, linked to its issue (`Closes #123`).
- CI must pass. Describe how you tested it.
- By contributing you agree your work is released under the [MIT license](LICENSE).

## Code of conduct
This project follows our [Code of Conduct](CODE_OF_CONDUCT.md).
