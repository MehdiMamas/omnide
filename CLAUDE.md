# OmnIDE code rules

A lint error is a fact; a line here is a request. Fix a flaw as high up this list as it goes: make the wrong code impossible (API, folders) → lint and types → tests → a rule here → human review. (Lauren Tan's constraint approach, as adopted in claude-sync-data#1996.)

- Upstream Code OSS is fetched into `vscode/` and never hand-edited. Every change to it is a patch in `patches/`, one concern per patch.
- OmnIDE's own code passes `npx @biomejs/biome@2.6.9 ci` (config in `biome.json`) and strict TypeScript: no `any`, no `@ts-ignore`.
- A mistake Claude made twice becomes a Biome rule whose message says how to fix it, never a new line here.
- Comments: a comment that justifies a workaround or hack is deleted and the cause fixed. A one-line why the code can't show stays.
- Tricky logic (mode cycle, permission grants, patch order, update version check) gets property tests with fast-check, not only examples.
- Every PR shows the built app working: a screenshot or log from a real run, not only a green build.
- Monthly weeding: a sweep removes workarounds and dead code that slipped in, before they become the house style.
