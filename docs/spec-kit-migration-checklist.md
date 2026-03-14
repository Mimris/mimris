# Spec-Kit Migration Checklist

This checklist aligns `ai-dashboard-app`, `ai-mimris-workspace`, and `mimris` around GitHub Spec Kit without forcing a bulk migration of all legacy documentation.

## Target End State

All three repositories should converge on this model:

- `AGENTS.md` for repo execution guidance
- `.specify/` for constitution and active feature specs
- `docs/` for stable architecture, ADRs, and reference docs
- `ai/` only in repositories that genuinely use AI-specific roles, workflows, or prompting assets

## Common Rules

- Do not maintain two live feature-spec systems in the same repo.
- Do not bulk-convert all legacy specs at once.
- Route all new active feature work into `.specify/specs/` after spec-kit is adopted.
- Keep architecture and ADR material in `docs/`.
- Keep AI-only prompts and workflows in `ai/`.

## Repo 1: `ai-dashboard-app`

Current state:

- Has `.specify/`
- Also has a parallel `spec/` folder

Checklist:

- [ ] Confirm `.specify/` is the canonical active-spec workflow
- [ ] Inventory files under `spec/`
- [ ] Classify each `spec/` file as one of:
  - constitution material
  - stable reference doc
  - active feature spec
  - obsolete
- [ ] Move project-wide rules into `.specify/memory/constitution.md`
- [ ] Move stable reference content into `docs/`
- [ ] Recreate any still-active feature work under `.specify/specs/`
- [ ] Archive or remove the standalone `spec/` folder once it no longer holds canonical content
- [ ] Add a short note to `AGENTS.md` or README clarifying the new source of truth

Success criteria:

- `.specify/` is the only active feature-spec system
- `spec/` is either gone or clearly archival

## Repo 2: `ai-mimris-workspace`

Current state:

- No `.specify/`
- Rich spec content under `docs/`
- Has a well-structured `ai/` folder

Checklist:

- [ ] Initialize `.specify/`
- [ ] Create `.specify/memory/constitution.md`
- [ ] Keep `ai/` as an AI workflow layer
- [ ] Update `ai/agents/spec-agent.md` so active specs are produced in `.specify/specs/`, not directly in `docs/`
- [ ] Keep architecture, ADRs, and durable reference material in `docs/`
- [ ] Identify 1-2 active areas to pilot in spec-kit
  - recommended: workspace spec flow, model integration, or navigation panel changes
- [ ] Add a brief governance note in `AGENTS.md` or README
- [ ] Leave existing `docs/*-spec.md` files in place until each area is actively revised

Success criteria:

- Active spec workflow runs through `.specify/`
- `ai/` remains AI-only
- `docs/` remains stable reference, not the default place for new active feature specs

## Repo 3: `mimris`

Current state:

- No `.specify/`
- Legacy specs under `docs/_specs/`
- No `ai/` folder

Checklist:

- [ ] Initialize `.specify/`
- [ ] Create `.specify/memory/constitution.md`
- [ ] Keep `docs/_specs/` as legacy/reference for now
- [ ] Stop creating new active feature specs in `docs/_specs/`
- [ ] Route all new feature work into `.specify/specs/`
- [ ] Migrate repo-wide engineering rules from legacy specs into the constitution
- [ ] Add governance pointers to `AGENTS.md`
- [ ] Pilot the first Mimris feature spec in spec-kit
  - recommended: IDEF0/ICOM rendering and routing

Success criteria:

- `docs/_specs/` is legacy only
- new work goes through `.specify/`

## Recommended Rollout Order

1. Normalize `ai-dashboard-app`
2. Introduce spec-kit in `ai-mimris-workspace`
3. Introduce spec-kit in `mimris`
4. Migrate old material incrementally as touched

## First Pilot Specs

Suggested first spec-kit feature in each repo:

- `ai-dashboard-app`: one currently active product/UI feature
- `ai-mimris-workspace`: workspace spec workflow or model integration work
- `mimris`: IDEF0/ICOM layout and routing behavior

## Governance Follow-Up

Once all three repos have `.specify/`:

- align constitution section headings
- align `AGENTS.md` wording around spec usage
- align spec naming conventions under `.specify/specs/`
- keep repo-specific differences only where they are genuinely needed
