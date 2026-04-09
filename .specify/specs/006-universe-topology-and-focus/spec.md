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
2. **Given** Mimris opens a shared universe snapshot, **When** it reads the world-model portion, **Then** it resolves the active modelling state from one of these canonical locations in order: `world.worldModel.metis`, `originWorld.foundationModels.typeDefinition.metis`, `originWorld.foundationModels.templateDefinition.metis`.
3. **Given** Mimris AI Workspace opens the same shared universe snapshot, **When** it reads runtime data, **Then** it resolves operational state from `operationalModel` while using the same top-level `focus` object for navigation context.
4. **Given** a link or handoff needs to send the current context, **When** the source app builds that reference, **Then** it can address one universe-level `focus` object instead of app-specific flat focus fields.
5. **Given** a legacy snapshot still uses flat top-level `metis`, `executionModel`, and flat `focus*` keys, **When** it is loaded during the transition period, **Then** the app normalizes it into the new canonical topology without data loss.
6. **Given** one app saves a universe snapshot after editing only the fields it understands, **When** the save is persisted, **Then** unrelated top-level sections and unknown fields are preserved.
7. **Given** all three canonical metis sources are present, **When** Mimris opens the universe, **Then** the default active selection is `world.worldModel.metis`.
8. **Given** the user changes the metis selector in Mimris, **When** they choose `World Model`, `Origin TYPE Foundation`, or `Origin TEMPLATE Foundation`, **Then** the active modelling state switches to that source and edits are written back to that same canonical location.

### Edge Cases
- What happens when only world-model data exists and no operational data is present?
- What happens when legacy focus fields conflict with nested focus sections during normalization?
- What happens when one app understands only part of the canonical snapshot?

## Requirements

### Functional Requirements
- **FR-001**: The canonical shared universe snapshot MUST use top-level `worldDefinition`, `worldModel`, `operationalModel`, and `focus`.
- **FR-002**: `focus` MUST be a universe-level object rather than a field nested only inside `worldModel` or `operationalModel`.
- **FR-003**: `worldModel` MUST contain `metis`.
- **FR-003A**: Mimris MUST support canonical modelling sources at `world.worldModel.metis`, `originWorld.foundationModels.typeDefinition.metis`, and `originWorld.foundationModels.templateDefinition.metis`.
- **FR-003B**: Mimris MUST default to `world.worldModel.metis` when present.
- **FR-003C**: If `world.worldModel.metis` is absent, Mimris MUST fall back in this order: `originWorld.foundationModels.typeDefinition.metis`, `originWorld.foundationModels.templateDefinition.metis`, then legacy top-level `metis`.
- **FR-003D**: Mimris MUST expose exactly three labelled selector options for these canonical modelling sources: `World Model`, `Origin TYPE Foundation`, and `Origin TEMPLATE Foundation`.
- **FR-004**: `focus.project` MUST carry shared project/source context used by both apps.
- **FR-005**: `focus.worldModel` MUST carry model, modelview, object, objectview, relship, and related world-model focus references.
- **FR-006**: `focus.operational` MUST carry process, task, work-item, artifact, role, and related operational focus references.
- **FR-007**: `focus.document` MUST carry document-focused context.
- **FR-008**: The system MUST load legacy flat focus fields by normalizing them into the new universe-level `focus` object.
- **FR-009**: The system MUST load legacy top-level `metis` and `executionModel` fields by normalizing them into `worldModel` and `operationalModel`.
- **FR-009A**: Legacy top-level `metis` MUST remain a compatibility fallback only and MUST NOT be the preferred default when canonical scoped metis sources are present.
- **FR-010**: Save operations MUST preserve top-level sections and unknown fields not owned by the current app so cross-app round trips do not delete data.
- **FR-011**: Shared links and inter-app handoff MUST be able to address the universe through one canonical `focus` contract.

### Key Entities
- **Universe Snapshot**: The canonical persisted object shared between Mimris and Mimris AI Workspace.
- **World Definition**: The descriptive and governing context for the universe, including domain and public-site metadata.
- **World Model**: The modelling-state section that contains `metis` and related modelling content.
- **Operational Model**: The execution and process-oriented section for runtime work, tasks, artifacts, and related operational content.
- **Universe Focus**: The shared navigation/context object that spans project, world-model, operational, and document focus.

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
