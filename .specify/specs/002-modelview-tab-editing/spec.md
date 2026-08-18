# Feature Specification: Model And Modelview Tab Editing

**Feature Branch**: `002-modelview-tab-editing`  
**Created**: 2026-03-22  
**Status**: In Progress  
**Input**: User description: "Make modelview tabs editable directly, allow drag reorder, confirm description updates when the name changes, keep the modeller viewport fit tidy, and give model tabs the same rename and reorder behavior."

## User Scenarios & Testing

### Primary User Story
A modeller working across several models and modelviews wants to rename and reorder tabs directly in the tab strips so view organization is fast and does not require background context-menu editing.

### Acceptance Scenarios
1. **Given** a model has multiple modelviews, **When** the user double-clicks a modelview tab, **Then** the tab name becomes editable inline.
2. **Given** a modelview tab is being renamed, **When** the user presses `Enter` or leaves the field, **Then** a confirmation modal opens with editable `name` and `description` fields before the change is saved.
3. **Given** the rename confirmation modal is open, **When** the user saves without editing the description, **Then** the new name is saved and the prior description remains unchanged.
4. **Given** the rename confirmation modal is open, **When** the user edits the description and saves, **Then** both the modelview name and description are persisted.
5. **Given** the rename confirmation modal is open, **When** the user presses `Cancel`, **Then** the pending rename is discarded and no modelview properties are changed.
6. **Given** a modelview tab is being renamed inline, **When** the user presses `Escape`, **Then** inline editing is canceled without opening the confirmation modal.
7. **Given** multiple modelview tabs are visible, **When** the user drags one tab onto another, **Then** the tab order changes and the persisted `modelviews` array reflects the new order.
8. **Given** a modelview is focused elsewhere in the UI, **When** its name is changed from the tab workflow, **Then** the focused modelview name shown in the rest of the interface updates immediately.
9. **Given** the rename confirmation modal contains a description textarea, **When** the user types `Space`, **Then** a normal space character is inserted instead of triggering canvas pan behavior.
10. **Given** the modeller is displayed inside the main modelling page, **When** the page renders at normal desktop height, **Then** the modelview canvas area fills the available modeller panel cleanly with only a small consistent margin around it instead of leaving a large empty block below.
11. **Given** multiple model tabs are visible, **When** the user double-clicks a model tab, **Then** the tab name becomes editable inline.
12. **Given** a model tab is being renamed, **When** the user presses `Enter` or leaves the field, **Then** a confirmation modal opens with editable `name` and `description` fields before the change is saved.
13. **Given** multiple model tabs are visible, **When** the user drags one model tab onto another, **Then** the tab order changes and the persisted `models` array reflects the new order.
14. **Given** a model is focused elsewhere in the UI, **When** its name is changed from the tab workflow, **Then** the focused model name shown in the rest of the interface updates immediately.
15. **Given** the application restores persisted modelling state that is missing `focusModelview` or has a focused model with no `modelviews`, **When** the modelling page opens, **Then** the page recovers without throwing and continues rendering the available model data.

### Edge Cases
- What happens when the first modelview in the array is the focused tab and is renamed or reordered?
- What happens when the first model in the array is the focused tab and is renamed or reordered?
- What happens when a tab is dropped onto itself?
- What happens when the user clears the inline rename field or only enters whitespace?
- What happens when the diagram-level `Space` keyboard shortcut is active while a modal input has focus?
- What happens when a renamed modelview has a long description that should remain untouched?
- What happens when a renamed model has a long description that should remain untouched?
- What happens when modeller and detail panes have slightly different heights and the parent modelling wrapper would otherwise show a large empty background area?
- What happens when persisted local or session recovery data references a modelview that no longer exists, or a model without any `modelviews`?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST allow direct inline editing of a modelview tab label from the existing modelview tab strip.
- **FR-002**: The system MUST require explicit confirmation in a modal before saving a modelview rename triggered from the tab strip.
- **FR-003**: The system MUST let the rename confirmation modal edit both `name` and `description`.
- **FR-004**: The system MUST preserve the existing description when the modal is saved without changing the description field.
- **FR-005**: The system MUST cancel pending tab rename changes when the user dismisses the modal or cancels inline editing.
- **FR-006**: The system MUST support drag-and-drop reordering of modelview tabs using the persisted `modelviews` array order as the source of truth.
- **FR-007**: The system MUST ignore no-op drag drops where the source and target modelview are the same.
- **FR-008**: The system MUST keep `phFocus.focusModelview` synchronized with the saved modelview name after rename.
- **FR-009**: The system MUST prevent the diagram-level `Space` panning shortcut from intercepting keystrokes inside modal form controls.
- **FR-010**: The system MUST size the modeller and adjacent detail panes so the modelling page shows only a small deliberate outer margin around the active work area, without a large empty area beneath the canvas.
- **FR-011**: The system MUST allow direct inline editing of a model tab label from the existing model tab strip.
- **FR-012**: The system MUST require explicit confirmation in a modal before saving a model rename triggered from the tab strip.
- **FR-013**: The system MUST let the model rename confirmation modal edit both `name` and `description`.
- **FR-014**: The system MUST preserve the existing model description when the modal is saved without changing the description field.
- **FR-015**: The system MUST support drag-and-drop reordering of model tabs using the persisted `models` array order as the source of truth.
- **FR-016**: The system MUST ignore no-op drag drops where the source and target model tabs are the same.
- **FR-017**: The system MUST keep `phFocus.focusModel` synchronized with the saved model name after rename.
- **FR-018**: The system MUST restore persisted modelling state defensively so missing `metis`, `models`, `focusModelview`, or `modelviews` entries do not crash the modelling page or leave it stuck in a false loading state.

### Key Entities
- **Modelview Tab**: The visible tab in the modeller header that selects the active modelview.
- **Model Tab**: The visible tab in the modelling header that selects the active model.
- **Rename Confirmation Modal**: The modal dialog that confirms and edits modelview `name` and `description` before save.
- **Modelview Order**: The persisted order of entries in `model.modelviews`, which determines tab sequence.
- **Model Order**: The persisted order of entries in `metis.models`, which determines model tab sequence.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on user workflow and persistence behavior
- [x] Written for non-technical stakeholders and developers reviewing UI behavior
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and visually reviewable
- [x] Scope is bounded to model and modelview tab editing, reorder, and modal keyboard behavior
- [x] Dependencies and assumptions identified
