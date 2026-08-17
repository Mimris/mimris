# Feature Specification: Universe Topology And Shared Focus

**Feature Branch**: `006-universe-topology-and-focus`  
**Created**: 2026-04-07  
**Status**: In Progress  
**Input**: User description: "Restructure the canonical universe shape so the top level is worldDefinition, worldModel, operationalModel, and a universe-level focus that can be set and sent across apps."

## User Scenarios & Testing

### Primary User Story
A modeller working across Mimris and Mimris AI Workspace wants one shared universe structure and one universe-level focus contract so both apps can open, save, and send the same project context without ambiguity.

### Acceptance Scenarios
1. **Given** a canonical universe snapshot is loaded, **When** either app reads the top-level shape, **Then** it finds `worldDefinition`, `worldModel`, `operationalModel`, and `focus` as first-class top-level sections.
2. **Given** Mimris opens a shared universe snapshot, **When** it reads the world-model portion, **Then** it resolves the active modelling state from `world.worldModel.metis`.
3. **Given** Mimris AI Workspace opens the same shared universe snapshot, **When** it reads runtime data, **Then** it resolves operational state from `operationalModel` while using the same top-level `focus` object for navigation context.
4. **Given** a link or handoff needs to send the current context, **When** the source app builds that reference, **Then** it can address one universe-level `focus` object instead of app-specific flat focus fields.
5. **Given** a legacy snapshot still uses flat top-level `metis`, `executionModel`, and flat `focus*` keys, **When** it is loaded during the transition period, **Then** the app normalizes it into the new canonical topology without data loss.
6. **Given** one app saves a universe snapshot after editing only the fields it understands, **When** the save is persisted, **Then** unrelated top-level sections and unknown fields are preserved.
7. **Given** all three canonical metis sources are present, **When** Mimris opens the universe, **Then** the default active selection is `world.worldModel.metis`.
8. **Given** the user opens shared modelling data from another universe, **When** Mimris resolves it for editing, **Then** it keeps active local modelling state at `world.worldModel.metis` and treats shared-model selection as separate-universe sourcing.
9. **Given** the user opens `/model` with explicit remote-universe, share, server-project, or GitHub query parameters, **When** the page hydrates on the client, **Then** Mimris does not briefly render the local template or stale Redux model before the requested snapshot finishes loading.
10. **Given** both canonical `universe` state and legacy `ph*` compatibility fields are present during migration, **When** app-level React components read modelling props, **Then** they read through a shared compatibility selector that prefers canonical `universe` values and falls back to legacy values only when needed.
11. **Given** a write path replaces complete `phData` during the transition period, **When** it dispatches the update, **Then** it uses a shared universe dispatch helper or shared-universe action rather than constructing raw legacy load actions at the call site.

### Edge Cases
- What happens when only world-model data exists and no operational data is present?
- What happens when legacy focus fields conflict with nested focus sections during normalization?
- What happens when one app understands only part of the canonical snapshot?
- What happens when canonical `universe` values and mirrored legacy `ph*` values temporarily disagree during migration?
- What happens when GoJS or AKMM code still needs to pass legacy-shaped props while Redux writes move to shared-universe actions?

## Requirements

### Functional Requirements
- **FR-001**: The canonical shared universe snapshot MUST use top-level `worldDefinition`, `worldModel`, `operationalModel`, and `focus`.
- **FR-002**: `focus` MUST be a universe-level object rather than a field nested only inside `worldModel` or `operationalModel`.
- **FR-003**: `worldModel` MUST contain `metis`.
- **FR-003A**: Mimris MUST use `world.worldModel.metis` as the active canonical modelling source.
- **FR-003B**: Mimris MUST default to `world.worldModel.metis` when present.
- **FR-003C**: If `world.worldModel.metis` is absent, Mimris MUST fall back to legacy top-level `metis` for compatibility ingestion only.
- **FR-003D**: Mimris MUST treat shared model variants as separate-universe sources rather than `foundationModels` branches in the active runtime snapshot.
- **FR-004**: `focus.project` MUST carry shared project/source context used by both apps.
- **FR-005**: `focus.worldModel` MUST carry model, modelview, object, objectview, relship, and related world-model focus references.
- **FR-006**: `focus.operational` MUST carry process, task, work-item, artifact, role, and related operational focus references.
- **FR-007**: `focus.document` MUST carry document-focused context.
- **FR-008**: The system MUST load legacy flat focus fields by normalizing them into the new universe-level `focus` object.
- **FR-009**: The system MUST load legacy top-level `metis` and `executionModel` fields by normalizing them into `worldModel` and `operationalModel`.
- **FR-009A**: Legacy top-level `metis` MUST remain a compatibility fallback only and MUST NOT be the preferred default when canonical scoped metis sources are present.
- **FR-009B**: When `/model` is opened with explicit load parameters, Mimris MUST hold the modelling surface in a loading state until the requested snapshot is resolved instead of first rendering the local template or previously loaded Redux model.
- **FR-009C**: Compatibility fallback status for legacy top-level `metis` MUST remain non-blocking and MUST NOT surface as a persistent legacy banner in the mini-model route.
- **FR-010**: Save operations MUST preserve top-level sections and unknown fields not owned by the current app so cross-app round trips do not delete data.
- **FR-011**: Shared links and inter-app handoff MUST be able to address the universe through one canonical `focus` contract.
- **FR-012**: App-level readers MUST use a compatibility adapter that returns legacy-shaped `phData`, `phFocus`, `phUser`, `phSource`, and `phList` from canonical `universe` state first.
- **FR-013**: Complete `phData` replacement writes SHOULD go through shared-universe action creators or shared dispatch helpers instead of raw `LOAD_TOSTORE_PHDATA` action objects at migrated call sites.
- **FR-014**: Legacy dispatch mapping MUST remain available during the transition so unmigrated AKMM/GoJS call sites continue to function.

### Key Entities
- **Universe Snapshot**: The canonical persisted object shared between Mimris and Mimris AI Workspace.
- **World Definition**: The descriptive and governing context for the universe, including domain and public-site metadata.
- **World Model**: The modelling-state section that contains `metis` and related modelling content.
- **Operational Model**: The execution and process-oriented section for runtime work, tasks, artifacts, and related operational content.
- **Universe Focus**: The shared navigation/context object that spans project, world-model, operational, and document focus.
- **Compatibility Props**: Legacy-shaped props derived from canonical universe state for components that still expect `phData`, `phFocus`, `phUser`, `phSource`, or `phList`.
- **Shared Dispatch Helper**: A migration helper that lets legacy-shaped write paths dispatch explicit shared-universe actions without repeating raw legacy action objects.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on shared data contract and cross-app interoperability
- [x] Written for non-technical stakeholders and developers reviewing architecture
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and unambiguous
- [x] Scope is bounded to canonical universe topology and focus contract
- [x] Dependencies and assumptions identified
