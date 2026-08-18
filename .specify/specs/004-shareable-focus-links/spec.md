# Feature Specification: Shareable Focus Links

**Feature Branch**: `004-shareable-focus-links`  
**Created**: 2026-04-07  
**Status**: In Progress  
**Input**: User description: "Make the open-in-new-tab and copy-link actions produce a shareable current-focus URL that can be sent by e-mail without becoming too large."

## User Scenarios & Testing

### Primary User Story
A modeller wants to open the current focus in a separate browser tab and copy a link that can be emailed to another person without embedding the whole project state in the URL.

### Acceptance Scenarios
1. **Given** the user is focused on a GitHub-backed project model and modelview, **When** they click the external-link button, **Then** a new browser tab opens using a compact URL that identifies the source file and focused model/modelview.
2. **Given** the user is focused on a GitHub-backed project model and modelview, **When** they click the copy-link action, **Then** the clipboard receives the same compact focus URL shape that the external-link button uses.
3. **Given** another user receives that copied focus URL by e-mail, **When** they open it directly, **Then** the app loads the referenced project file from the shared source and resolves the requested model and modelview without requiring preexisting local browser storage.
4. **Given** the requested model or modelview identifier is missing or no longer present, **When** the shared link is opened, **Then** the app falls back to the first available imported model and modelview instead of failing.
5. **Given** the referenced project file resolves to no models, **When** the shared link is opened, **Then** the app shows an explicit empty-state message instead of an indefinite loading screen.

### Edge Cases
- What happens when the share URL omits an optional branch or path?
- What happens when the clipboard action runs outside localhost or on a deployed host?
- What happens when the linked source cannot be fetched from GitHub?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST generate share links from source-location fields and focused identifiers rather than serializing full project state into the URL.
- **FR-002**: The system MUST use one canonical compact URL shape for both the external-link action and the copy-link action.
- **FR-003**: The system MUST prefer stable focus identifiers over display names when constructing share links.
- **FR-004**: The system MUST let the `/model` page load a shared project directly from URL parameters when local browser storage is absent.
- **FR-005**: The system MUST resolve the requested focused model and modelview from the loaded project, with fallback to the first available entries.
- **FR-006**: The system MUST continue supporting same-browser opening even when local browser state is present.
- **FR-007**: The system MUST keep the resulting share URL compact enough for ordinary email use by limiting it to project source and focus fields only.

### Key Entities
- **Focus Share URL**: A compact link containing the project source location and focused model/modelview identifiers.
- **Canonical Share Parameters**: The source and focus fields that define the shared link shape.
- **Shared Model Loader**: The page flow that reconstructs modelling state from the share URL.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on user workflow and shareability
- [x] Written for non-technical stakeholders and developers reviewing UI behavior
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and unambiguous
- [x] Scope is bounded to compact share links and shared-link loading
- [x] Dependencies and assumptions identified
