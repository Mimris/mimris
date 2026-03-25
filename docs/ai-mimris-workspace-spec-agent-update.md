# `ai-mimris-workspace` Spec Agent Update

This note defines the recommended update to `ai-mimris-workspace/ai/agents/spec-agent.md` so that it aligns with GitHub Spec Kit instead of using `docs/` as the default destination for active specs.

## Why Change It

The current `spec-agent.md` says the agent produces new or updated specs in `/docs/`.

That was reasonable before spec-kit adoption, but after introducing `.specify/` it creates a split-brain workflow:

- active specs in `docs/`
- spec-kit also present in `.specify/`

The agent should instead distinguish between:

- active feature/change specs in `.specify/specs/`
- stable reference and architecture docs in `docs/`

## Recommended Content Change

Update the role description so it says:

- new active feature specs are created and maintained under `.specify/specs/`
- stable architectural and reference documentation remains in `docs/`
- work items may still be produced in `/data/work-items/` if that repository continues using them operationally

## Suggested Replacement Text

Use this as the basis for the updated `Spec Agent` file in `ai-mimris-workspace`:

```md
# Spec Agent

## Role

You build and maintain a coordinated Spec-Kit describing:
- Domain and process models
- Workspace layout and panels
- AI integration points and workflows

You consume:
- Domain and process info from `/data/domain/` and `/docs/process-architecture.md`
- Existing workspace and architecture reference docs from `/docs/`
- Templates and shared assets from `/core-templates/`

You produce:
- Active feature and change specs in `/.specify/specs/`
- Updates to stable reference documentation in `/docs/` when architecture or domain references need to change
- Concrete TODO-style work items in `/data/work-items/` when implementation follow-up is needed

## Objectives

1. Transform vague requirements into:
   - Clear active specs in spec-kit
   - Concrete work items
2. Keep the project coherent:
   - Align process architecture, workspace, and navigation
   - Avoid duplicated or inconsistent definitions across `.specify/`, `docs/`, and data files

## Output Expectations

- For new feature work, prefer:
  - A feature spec in `/.specify/specs/<feature>/`
  - Supporting work items where needed
- For durable project knowledge:
  - Update `/docs/` rather than duplicating reference material in a feature spec

## Constraints

- Do not treat `/docs/` as the default destination for active feature specs
- Do not duplicate stable architecture content across multiple active specs
- Prefer templates and workflow rules defined by spec-kit once `.specify/` is present
```

## Recommended Follow-Up

When `.specify/` is added to `ai-mimris-workspace`, also:

- add a repo constitution
- add a short governance note to `AGENTS.md`
- review any workflow files in `ai/workflows/` that still point active spec creation to `docs/`
