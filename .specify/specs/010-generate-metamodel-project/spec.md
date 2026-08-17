# Feature Specification: Generate Metamodel Project Files

**Feature Branch**: `alpha-pre`
**Created**: 2026-08-01
**Status**: In progress
**Input**: Generate the metamodel represented by a specific Metamodel object in a TYPE model into either a new project file or a previously generated project file.

## User Scenarios & Testing

### Primary User Story
A modeller with one or more Metamodel objects in a TYPE model wants to generate each selected metamodel into a reusable project file, and later regenerate it into the same project without losing models built with that metamodel.

### Acceptance Scenarios
1. **Given** a TYPE model contains multiple Metamodel objects, **When** the user invokes generation on one object, **Then** only that clicked object identifies the generated metamodel and project provenance.
2. **Given** the user chooses a new project, **When** generation succeeds, **Then** Mimris downloads a project file containing the generated metamodel and an initial empty model and modelview based on it.
3. **Given** the user selects an existing generated project file, **When** its provenance matches the clicked Metamodel object, **Then** Mimris replaces the generated metamodel while preserving the project's models, modelviews, and unrelated metamodels.
4. **Given** an older project has no provenance but contains a same-named metamodel, **When** the user confirms the fallback match, **Then** Mimris updates that metamodel and adds provenance.
5. **Given** the selected file is invalid or belongs to another source Metamodel object, **When** validation runs, **Then** generation is cancelled without downloading a misleading project.
6. **Given** the existing in-project generation command is used, **When** generation succeeds, **Then** its current behavior remains available.

### Edge Cases
- Cancelling file selection must not generate or download a file.
- A selected project may contain more than one metamodel; unrelated entries must remain unchanged.
- Models referring to the replaced metamodel ID must remain valid, so regeneration must retain the established target metamodel ID.
- File names must be sanitized and use the established `_PR.json` suffix.

## Requirements

### Functional Requirements
- **FR-001**: The Metamodel-object context menu MUST offer generation in the current project, a new project file, or an existing project file.
- **FR-002**: All generation destinations MUST use the clicked Metamodel object's stable ID as source identity.
- **FR-003**: New generated project files MUST include source provenance, the generated metamodel, and an initial model and modelview using it.
- **FR-004**: Existing generated projects MUST be selectable from local JSON files.
- **FR-005**: Updating an existing project MUST preserve models, modelviews, unrelated metamodels, and other project data.
- **FR-006**: Updating MUST preserve the existing generated metamodel ID and rewrite internal references from the newly generated ID where necessary.
- **FR-007**: Same-name fallback for files without provenance MUST require explicit confirmation.
- **FR-008**: A provenance mismatch MUST prevent an accidental update unless the user explicitly chooses a same-name legacy migration.
- **FR-009**: Output MUST be downloaded rather than silently overwriting the selected local file.
- **FR-010**: Invalid JSON and incompatible project structures MUST produce a readable error.

### Key Entities
- **Source Metamodel Object**: The clicked object in the TYPE model, identified by project, model, modelview, and object IDs.
- **Generated Project**: A portable Mimris project document containing generated metamodel content and models based on it.
- **Generation Provenance**: Stable source identifiers stored on the generated metamodel and project document.

## Verification

- Unit-test creation, matching, replacement, reference preservation, and invalid file handling.
- Run TypeScript, repository tests, and the production build.
- Visually verify the context submenu and local-file chooser workflow.

## Review & Acceptance Checklist

### Content Quality
- [x] Focused on user-visible behavior
- [x] Supports multiple Metamodel objects
- [x] Existing behavior remains available
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable
- [x] File safety behavior is explicit
- [x] Compatibility behavior is explicit
