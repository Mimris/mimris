# Mimris Constitution Draft

This draft is intended to become `.specify/memory/constitution.md` when GitHub Spec Kit is initialized in this repository.

## Core Principles

### I. Persisted Model Compatibility First

Changes must preserve compatibility with persisted metamodel, model, modelview, objectview, and relationshipview data unless the change explicitly includes migration notes and validation steps.

### II. Diagram Behavior Must Be Verified Visually

For changes affecting GoJS rendering, routing, layout, ports, groups, labels, selection, resizing, or drag/drop semantics, code review alone is insufficient. Visual verification is required because many regressions are geometric and state-dependent.

### III. Incremental Modeling Changes Over Broad Rewrites

Prefer narrow, testable adjustments over sweeping rewrites in modelling, diagram, and persistence code. Existing behavior should be preserved unless a spec explicitly defines the intended change.

### IV. Metamodel/Model/UI Consistency

Behavioral changes must remain coherent across:

- persisted data structures
- metamodel/typeview definitions
- GoJS templates and runtime behavior
- editing workflows in the UI

No layer should be changed in isolation if that would produce inconsistent modeling behavior.

### V. Legacy Specs Are Reference, Not the Active Workflow

Legacy material in `docs/_specs/` remains valuable as reference, but new active feature work should move into GitHub Spec Kit once initialized in this repo.

## Non-Negotiable Requirements

- Backward compatibility
  - Persisted model files must not be silently broken.
  - If compatibility cannot be preserved, the spec must include migration guidance.

- Visual validation
  - Diagram/UI behavior changes require visual verification.
  - For routing and ICOM/port behavior, screenshots or explicit manual checks are expected.

- Controlled scope
  - Avoid unrelated refactors while changing diagram behavior.
  - Keep patches narrow and explain coupling when multiple files must change together.

- Documentation coupling
  - Changes to modeling behavior should update the relevant reference/spec material in the same change set.

- Single source of truth for active specs
  - Once spec-kit is initialized, new active feature specs belong in `.specify/specs/`, not `docs/_specs/`.

## Documentation Policy

- `AGENTS.md`
  - Repo execution guidance for coding agents
- `.specify/memory/constitution.md`
  - Project-wide engineering law
- `.specify/specs/`
  - Active feature/change specs
- `docs/`
  - Stable architecture, reference docs, ADRs, and legacy specs

## Change Workflow Expectations

For feature work:

1. Capture intent in a spec
2. Validate against the constitution
3. Plan implementation with explicit compatibility and verification notes
4. Implement incrementally
5. Verify behavior, including visual checks where relevant
6. Update supporting docs if behavior changed

## Mimris-Specific Guidance

- Group and relationship behavior is highly stateful and should be changed carefully.
- ICOM and port geometry should be tuned locally before broader routing changes are attempted.
- Orthogonal and other routing defaults should be treated as user-visible behavior, not merely implementation detail.
- Diagram interaction semantics such as drag/drop, containment, resize, and expansion should not be altered without checking persisted and runtime consequences.

## Initial Versioning Note

Suggested metadata when this file is promoted into `.specify/memory/constitution.md`:

- Version: `1.0.0`
- Ratified: set on adoption date
- Last Amended: set on adoption date
