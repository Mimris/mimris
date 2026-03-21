# Spec Kit

This directory is the active specification workspace for Mimris.

## Purpose

Use `.specify/` for active feature and change work:

- `.specify/memory/constitution.md`
  - project-wide engineering principles and quality gates
- `.specify/specs/<feature>/`
  - feature specifications, plans, tasks, and supporting artifacts

## Relationship To `docs/`

- `docs/` remains the home for stable architecture, ADRs, reference material, and legacy specs.
- `docs/_specs/` is currently legacy/reference material for Mimris.
- New active feature work should be captured under `.specify/specs/`.

## Next Steps

1. Replace or refine the constitution as needed.
2. Create the first feature spec under `.specify/specs/`.
3. Migrate active legacy spec work incrementally rather than all at once.
