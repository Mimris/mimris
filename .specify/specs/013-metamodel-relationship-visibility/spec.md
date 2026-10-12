# Feature Specification: Metamodel Relationship Visibility

**Feature Branch**: `alpha`
**Created**: 2026-10-02
**Status**: Implemented; full application visual acceptance pending
**Input**: Show relationship types alongside object types when opening the current model's Metamodel view.

## User Scenarios & Testing

### Primary User Story

A modeller clicks **Metamodel** for the current model and sees named relationship types connecting their source and target object types.

### Acceptance Scenarios

1. **Given** a metamodel has a non-deleted relationship type with both endpoint types visible, **When** the Metamodel view builds its links, **Then** the relationship connects the corresponding object-type nodes.
2. **Given** relationship type-view data contains undefined, empty, or stale `from` and `to` values, **When** that styling is applied, **Then** the link retains the resolved diagram node keys.
3. **Given** a relationship type has styling and a name, **When** its endpoints are restored, **Then** its styling and name remain available for rendering.

## Requirements

- **FR-001**: Relationship type links MUST use the keys of their resolved source and target object-type nodes.
- **FR-002**: Copying type-view data MUST NOT leave a relationship type link disconnected or pointing at stale node keys.
- **FR-003**: The fix MUST preserve existing relationship styling, labels, and endpoint resolution behavior.
- **FR-004**: Persisted model and metamodel formats MUST remain compatible; no migration is required.

## Implementation

`goRelshipTypeLink.loadLinkContent()` restores `from` and `to` from the resolved nodes after copying type-view data. The change does not broaden which relationship types are included in the view.

## Verification

- Three regression cases exercise undefined, empty, and stale type-view endpoints against the production link class and a GoJS diagram; they confirm connectivity and retained styling.
- `npm test`: all 60 tests pass, including the new regression cases.
- A standalone GoJS browser fixture was visually inspected: two object-type nodes are connected by a labeled relationship arrow. This checks rendering in isolation, rather than the complete Mimris workflow.
- Pending manual acceptance: open a representative saved model, click **Metamodel**, and confirm its relationship types, names, and arrows appear between the expected object types.
