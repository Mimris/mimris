# Feature Specification: Local Project Import Guardrails

**Feature Branch**: `003-local-project-import-guardrails`  
**Created**: 2026-04-07  
**Status**: In Progress  
**Input**: User description: "Make local project-file loading reset stale state, reject empty model files clearly, and let repeated local-file imports behave reliably from the project menu."

## User Scenarios & Testing

### Primary User Story
A modeller opening a local project file wants the imported project to replace stale in-memory state cleanly, move into the modelling view when needed, and fail with a clear message when the file does not contain any models.

### Acceptance Scenarios
1. **Given** the user opens a valid local project file from the landing page, **When** the file is loaded, **Then** the app navigates to the modelling page and shows the imported project instead of the prior session state.
2. **Given** the user opens a valid local project file while already on the modelling page, **When** the file is loaded, **Then** the current page stays stable and the new project replaces the previous in-memory data without requiring a second navigation.
3. **Given** a previously loaded project contained models, **When** the user imports a different valid project file, **Then** model, focus, source, and related persisted state are reset to the imported file rather than inheriting stale values from the previous project.
4. **Given** the user selects a local file that contains no models, **When** the import is processed, **Then** the app warns the user that there are no models in the file and does not leave the modelling page stuck in a misleading loading state.
5. **Given** the user imports a local file and then immediately chooses the same file again, **When** the picker is reopened, **Then** the second selection is accepted and the import flow runs again.
6. **Given** the imported data resolves to an empty `metis.models` collection, **When** the modelling page renders, **Then** the page shows an explicit empty-file message instead of an indefinite loading message.
7. **Given** the user opens a legacy local project file on `/modelling`, **When** the user reloads the browser page, **Then** the active modelview is restored from the imported project state and does not get replaced by a blank startup/default snapshot.
8. **Given** both `sessionStorage` and `localStorage` contain recoverable modelling snapshots, **When** `/modelling` starts after a reload, **Then** the app chooses the recoverable snapshot with the richest modelview content instead of a sparse or blank snapshot.

### Edge Cases
- What happens when a file picker is opened and dismissed without choosing a file?
- What happens when an imported file provides partial project data but omits optional focus, source, or user fields?
- What happens when the imported file uses a legacy top-level metis structure instead of a full `phData` wrapper?
- What happens when a sparse startup render occurs before reload recovery has dispatched the imported project state?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST let the project menu open a local JSON project file from both the landing page and the modelling page.
- **FR-002**: The system MUST navigate to the modelling page after a successful local import only when the user is not already on that page.
- **FR-003**: The system MUST replace the current in-memory project state defensively when importing a local file so stale project data does not survive into the new session.
- **FR-004**: The system MUST preserve compatibility with both wrapped project files and legacy imports that provide model data without a full `phData` wrapper.
- **FR-005**: The system MUST resolve focus to the imported model and modelview when present, or to the first available imported model and modelview when explicit focus is missing.
- **FR-006**: The system MUST reject local imports whose effective model list is empty and present a clear "No models in this file." message to the user.
- **FR-007**: The system MUST reset the local file input after each open, cancel, success, or empty-file rejection so the same file can be selected again immediately.
- **FR-008**: The modelling page MUST distinguish between "data is still loading" and "the imported file contains no models" so an empty import does not appear to hang.
- **FR-009**: The modelling page MUST recover a previously imported local project from browser `memorystate` on page reload without falling back to default startup content.
- **FR-010**: The modelling page MUST prefer the recoverable persisted snapshot with the most modelview content when session and local storage disagree.
- **FR-011**: The modelling page MUST NOT overwrite a richer persisted local-project snapshot with a sparse startup snapshot before reload recovery completes.

### Key Entities
- **Local Project File**: A JSON file selected from the local filesystem that may contain either full project state or legacy model data.
- **Imported Project State**: The in-memory application state produced from the selected file, including project data, focus, source, and user fields.
- **Resolved Focus Model**: The model chosen to become active after import, either from explicit stored focus or the first available imported model.
- **Empty Import**: A local file whose effective imported model list is empty and must be rejected with explicit feedback.
- **Recoverable Snapshot**: A `memorystate` entry in browser storage that contains `phData.metis` and can be restored after a page reload.
- **Sparse Startup Snapshot**: An early render state with less modelview content than the persisted project state and no explicit import/refresh marker.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on user workflow and import reliability
- [x] Written for non-technical stakeholders and developers reviewing UI behavior
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and unambiguous
- [x] Scope is bounded to local project import, state reset, and empty-file handling
- [x] Dependencies and assumptions identified
