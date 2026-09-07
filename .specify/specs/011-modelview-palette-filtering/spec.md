# Feature Specification: Modelview Palette Filtering

**Feature Branch**: `alpha-pre`
**Created**: 2026-08-06
**Updated**: 2026-09-07
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

## CORE Palette Eligibility

- CORE palette construction excludes Generic and Label creation entries. Other metamodels retain their existing eligibility rules.
- Palette construction MUST preserve the declared abstract flag on EntityType instead of mutating it to concrete. Abstract EntityType entries remain absent from the final palette.
- These restrictions affect creation choices only; persisted types and existing model content are not deleted or migrated.

## Verification

- Pure palette-filter tests cover unrestricted, object-filtered, and relationship-filtered behavior.
- TypeScript passes with incremental cache output disabled where required by the test environment.
- Visual verification confirms a shared model opens with named Modelviews and that switching from `Goals Model` to `Business Process Model` changes the palette from `Goal` to `Process`.

### September 2026 follow-up

- Automated suite: 57 tests passed.
- TypeScript and production build: passed.
- Visual CORE palette verification remains pending: browser access to the local app returned ERR_BLOCKED_BY_CLIENT.

### Clean deployment follow-up

Declare the existing rehype-slug, classnames and camelcase imports as direct dependencies, remove an unused bcrypt import, and track the TypeScript configuration so clean builds use the same settings as local validation. The first remote build exposed an undeclared dependency; verification of the corrected remote build is pending.
