# Spec Governance

This document defines how specifications, agent instructions, stable documentation, and AI workflow assets should be separated in this repository and aligned across related repositories.

## Four Layers

Use these four layers with distinct responsibilities:

- `AGENTS.md`
  - Repo-specific execution guidance for coding agents
  - Commands, local conventions, safety rules, and workflow instructions
- `.specify/`
  - Active change-management system using GitHub Spec Kit
  - Constitution, feature specs, plans, tasks, and supporting research
- `docs/`
  - Stable human-readable project knowledge
  - Architecture, ADRs, reference docs, onboarding, and legacy specs
- `ai/`
  - AI-only assets
  - Agent role cards, prompting guidance, orchestration workflows, and evaluation recipes

## Routing Rules

Use the following decision rules when placing content:

- If it tells an agent how to work in the repo, put it in `AGENTS.md`.
- If it defines project-wide non-negotiable rules for all changes, put it in `.specify/memory/constitution.md`.
- If it defines one active feature or change, put it in `.specify/specs/<feature>/`.
- If it is stable reference knowledge that should remain useful after a feature is delivered, put it in `docs/`.
- If it exists mainly to direct AI behavior or multi-agent orchestration, put it in `ai/`.

## Repository Standard

Recommended common structure across aligned repositories:

```text
AGENTS.md
.specify/
  memory/
    constitution.md
  specs/
    001-some-feature/
      spec.md
      plan.md
      tasks.md
      research.md
docs/
  architecture-overview.md
  adr-*.md
  spec-index.md
```

Optional only where needed:

```text
ai/
  agents/
  guidelines/
  workflows/
```

## Migration Policy

This repository currently contains legacy specs under `docs/_specs/`.

Migration rules:

- Do not bulk-convert all legacy specs at once.
- Use spec-kit for all new active feature work after initialization.
- Keep `docs/_specs/` as reference material until each area is touched.
- When a legacy spec is actively changed, prefer migrating the active work into `.specify/specs/`.
- Move project-wide engineering rules out of legacy specs and into the spec-kit constitution.

## What Belongs Where

### `AGENTS.md`

Put here:

- setup, build, test, and lint commands
- coding conventions
- local file/path guidance
- repo-specific cautions
- instructions on how this repo uses spec-kit and docs

Do not put here:

- complete feature specifications
- long-lived architecture docs
- duplicated constitution material

### `.specify/`

Put here:

- constitution
- active feature specs
- implementation plans
- tasks, research, and contract artifacts

Do not put here:

- prompt libraries
- ADR archives
- broad historical reference docs

### `docs/`

Put here:

- architecture overviews
- ADRs
- durable domain and data reference material
- onboarding and maintenance docs
- legacy specs awaiting migration

Do not put here:

- new active feature specs once spec-kit is adopted
- implementation task trackers for current feature work

### `ai/`

Put here:

- agent personas
- prompting guidelines
- orchestration workflows
- evaluation procedures

Do not put here:

- canonical project requirements
- active feature specifications
- permanent architecture truth

## Alignment Across Related Repositories

Recommended alignment for the related repositories discussed:

- `ai-dashboard-app`
  - Keep `.specify/`
  - Phase out or archive the separate `spec/` folder
  - Keep stable reference docs in `docs/`
- `ai-mimris-workspace`
  - Add `.specify/`
  - Keep `ai/` because it already contains valid AI workflow assets
  - Update AI spec-agent instructions so active specs are created in `.specify/specs/`, not directly in `docs/`
- `mimris`
  - Add `.specify/`
  - Keep `docs/_specs/` temporarily as legacy/reference material
  - Route new feature work into spec-kit once initialized

## Adoption Sequence

Recommended order:

1. Normalize `ai-dashboard-app` as the structural reference repo for spec-kit usage.
2. Introduce `.specify/` into `ai-mimris-workspace` while keeping its `ai/` folder.
3. Introduce `.specify/` into `mimris` and stop extending legacy spec files for new work.
4. Migrate legacy specs gradually, only when those areas are actively touched.
