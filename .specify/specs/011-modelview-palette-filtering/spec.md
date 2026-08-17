# Feature Specification: Modelview Palette Filtering

**Feature Branch**: `alpha-pre`
**Created**: 2026-08-06
**Status**: Implemented
**Input**: Use named Modelviews as submodel perspectives and restrict the creation palette for each perspective without introducing a separate submodel entity.

## User Scenarios & Testing

### Primary User Story

A modeller switches between named Modelviews in one semantic model and sees only the object and relationship types intended for creation in the selected perspective.

### Acceptance Scenarios

1. **Given** a Modelview has a non-empty `allowedObjectTypeRefs[]`, **When** it becomes active, **Then** the object palette contains only those stable ObjectType references.
2. **Given** object types are filtered, **When** relationship palette entries are built, **Then** entries whose endpoints are unavailable are omitted.
3. **Given** a Modelview has a non-empty `allowedRelshipTypeRefs[]`, **When** it becomes active, **Then** the remaining relationship palette is restricted to those stable RelationshipType references.
4. **Given** either allowlist is missing or empty, **When** the Modelview becomes active, **Then** that dimension of the palette remains unrestricted.
5. **Given** a modeller switches Modelviews, **When** focus changes, **Then** the palette refreshes without deleting or hiding existing semantic model content.

## Requirements

- **FR-001**: Filtering MUST use stable type references and MUST NOT infer semantics from the Modelview name.
- **FR-002**: Missing and empty allowlists MUST remain unrestricted for persisted-data compatibility.
- **FR-003**: Palette filtering MUST constrain creation choices only; existing Modelview content remains renderable.
- **FR-004**: Hydrated palette nodes and links MUST retain primitive ObjectType and RelationshipType references.
- **FR-005**: Remote-universe routes and proxies MUST preserve initial named Modelview metadata supplied by the workspace.

## Verification

- Pure palette-filter tests cover unrestricted, object-filtered, and relationship-filtered behavior.
- TypeScript passes with incremental cache output disabled where required by the test environment.
- Visual verification confirms a shared model opens with named Modelviews and that switching from `Goals Model` to `Business Process Model` changes the palette from `Goal` to `Process`.
