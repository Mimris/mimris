# Feature Specification: Select Connected Object Views

**Feature Branch**: `alpha-pre`
**Created**: 2026-06-02
**Status**: Implemented
**Input**: User need: improve the "Select connected objects" workflow so users can choose exact relationships, traverse multiple levels, and optionally add connected objects that are not yet visible in the active model view.

## User Scenarios & Testing

### Primary User Story
A modeller inspecting a diagram wants to start from one object, follow specific connected relationships, and select or add the connected objects and links needed to understand that local context.

### Acceptance Scenarios
1. **Given** an object is selected in a model view, **When** the user opens "Select connected objects", **Then** the dialog lists connected relationships by stable option values while displaying readable labels.
2. **Given** the user chooses one specific first-hop relationship, **When** the traversal runs, **Then** only that relationship is used for the first hop instead of matching unrelated relationships with the same display text.
3. **Given** the user chooses multiple traversal levels, **When** relationship type filters are supplied, **Then** later hops respect those filters while preserving the selected first-hop relationship constraint.
4. **Given** connected objects exist in the model but not in the current model view, **When** the user enables adding missing objects, **Then** missing object views and relationship views are created and selected in the active diagram.
5. **Given** connected objects are already visible, **When** the traversal runs, **Then** existing object views and relationship views are selected without creating duplicates.
6. **Given** relationship option labels are represented as objects with `value` and `label`, **When** the dialog renders, **Then** React receives text labels as option children and no object is rendered directly.

### Edge Cases
- Deleted relationships or objects must be ignored during traversal.
- Relationship selection must work when relationships are resolved from persisted references rather than live object instances.
- Direction choices must support incoming, outgoing, and all connected relationships without running duplicate traversals.

## Requirements

### Functional Requirements
- **FR-001**: The select-connected dialog MUST support relationship options with separate stable `value` and visible `label` fields.
- **FR-002**: The dialog MUST render only string labels in option text.
- **FR-003**: Relationship values that identify concrete relationships MUST be passed through as first-hop relationship IDs.
- **FR-004**: First-hop relationship ID filtering MUST take precedence over relationship type filtering for the first traversal step.
- **FR-005**: Relationship type filters MUST continue to constrain traversal when explicit first-hop IDs are not supplied or after the first hop.
- **FR-006**: The traversal MUST resolve objects and relationships from the current model or metis repository before using fallback references.
- **FR-007**: The traversal MUST optionally create missing object views and relationship views in the active model view.
- **FR-008**: Created object and relationship views MUST be added to the GoJS model and persisted through the existing model-view update dispatch path.
- **FR-009**: Existing visible object views and relationship views MUST be reused instead of duplicated.
- **FR-010**: The root object MUST remain selected alongside traversal results.

### Key Entities
- **Root Object View**: The object view from which traversal starts.
- **First-Hop Relationship**: A concrete relationship directly connected to the root object and selected by stable relationship ID.
- **Relationship Type Filter**: A broader type-name or type-ID filter used when traversal is not pinned to a concrete relationship.
- **Missing View Creation**: The optional creation of object views and relationship views for connected model elements that are not visible in the active model view.

## Verification

- Run the automated test suite.
- Run the production build.
- Verify the dialog visually because this is a diagram behavior change.
- Verify that selecting a relationship with an object-backed option no longer triggers a React "Objects are not valid as a React child" runtime error.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on diagram selection and connected-view behavior
- [x] Written for stakeholders and developers reviewing the change
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and unambiguous
- [x] Scope is bounded to select-connected object traversal
- [x] Dependencies and assumptions identified
