# Feature Specification: Snapshot Share Links

**Feature Branch**: `005-snapshot-share-links`  
**Created**: 2026-04-07  
**Status**: In Progress  
**Input**: User description: "Make local-file state shareable by storing a snapshot on the server and sending a short link to others."

## User Scenarios & Testing

### Primary User Story
A modeller working with a locally imported or unsaved project wants to send another person a short link that opens the same focused state without depending on the sender's browser storage or a GitHub-backed source file.

### Acceptance Scenarios
1. **Given** the user is working on a local or unsaved project, **When** they click the open-in-new-tab action, **Then** the app stores a server-side snapshot and opens a short share link in a new tab.
2. **Given** the user is working on a local or unsaved project, **When** they click the copy-link action, **Then** the clipboard receives a short share link instead of a large state-bearing URL.
3. **Given** another person opens the short share link, **When** the app resolves the share id, **Then** the shared snapshot loads without requiring prior browser-local state.
4. **Given** the snapshot contains a focused model and modelview, **When** the recipient opens the link, **Then** the app restores that focus with fallback to the first available entries if the stored focus is incomplete.
5. **Given** the share id does not exist, **When** the link is opened, **Then** the app shows a clear load error instead of a misleading blank or loading state.

### Edge Cases
- What happens when the snapshot payload is invalid or missing required project fields?
- What happens when the share directory does not exist yet?
- What happens when a snapshot contains no models?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST create a server-side snapshot file for a share request and return a short identifier.
- **FR-002**: The system MUST store snapshot files outside the public static asset path so access remains controlled by application routes.
- **FR-003**: The system MUST let `/model` load a snapshot directly from a `share` query parameter.
- **FR-004**: The system MUST keep share links compact by using a short identifier rather than embedding full project state in the URL.
- **FR-005**: The system MUST let both the open-in-new-tab action and the copy-link action create share links from the current in-memory project state.
- **FR-006**: The system MUST restore shared model and modelview focus defensively from the stored snapshot.
- **FR-007**: The system MUST show a clear error when a referenced share id cannot be loaded.

### Key Entities
- **Snapshot Share**: A persisted server-side JSON copy of the current project state identified by a short id.
- **Share Id**: The short identifier returned by the server and used in the share URL.
- **Share Loader**: The page flow that resolves a share id into persisted project state.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on user workflow and sharable local state
- [x] Written for non-technical stakeholders and developers reviewing UI behavior
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and unambiguous
- [x] Scope is bounded to server-side snapshot shares and short-link loading
- [x] Dependencies and assumptions identified
