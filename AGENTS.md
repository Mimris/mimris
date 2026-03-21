# AGENTS.md

## Purpose

This file defines how coding agents should work in this repository.

Use these layers consistently:

- `AGENTS.md`: repo execution guidance for agents
- `.specify/`: active feature specifications, plans, and tasks
- `docs/`: stable architecture, reference, and legacy documentation
- `ai/`: AI-specific prompts, agent roles, and workflows if introduced later

## Working Rules

- Prefer `.specify/specs/` for new feature work once spec-kit is adopted in this repo.
- Treat `docs/_specs/` as legacy/reference material until it is migrated.
- Do not create a second live spec system alongside spec-kit.
- Keep architecture overviews, ADRs, and durable reference material in `docs/`.
- Keep agent behavior instructions here, not in feature specs.

## Repo Conventions

- Runtime: Next.js with TypeScript and Redux.
- Diagram behavior changes should be verified visually, not only by reading code.
- Preserve compatibility with persisted model and metamodel data unless a change explicitly includes migration notes.
- Prefer incremental changes over broad rewrites in modelling and diagram code.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Tests: `npm test`

## Documentation Policy

- Add new stable reference docs under `docs/`.
- Add project-wide engineering rules to `.specify/memory/constitution.md` after spec-kit is initialized.
- Add feature-specific specs under `.specify/specs/<feature>/`.
- When a legacy spec in `docs/_specs/` is touched for active work, prefer migrating that work into spec-kit rather than extending the legacy file further.
