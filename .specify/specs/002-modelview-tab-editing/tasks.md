# Tasks: Modelview Tab Editing

**Input**: Design documents from `/.specify/specs/002-modelview-tab-editing/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Modelview Tab Interaction

- [x] T001 Add inline rename state and double-click activation to the existing modelview tab strip in `src/components/Modeller.tsx`
- [x] T002 Add rename confirmation modal with editable `name` and `description` fields in `src/components/Modeller.tsx`
- [x] T003 Keep focused modelview state synchronized after rename in `src/components/Modeller.tsx` and `src/reducers/reducer.js`

## Phase 2: Reorder Persistence

- [x] T004 Add a persisted `REORDER_MODELVIEWS` action type in `src/actions/types.js`
- [x] T005 Reorder the current model's `modelviews` array in Redux when a tab is dropped on another tab in `src/reducers/reducer.js`
- [x] T006 Add drag-and-drop behavior to the modelview tab strip in `src/components/Modeller.tsx`

## Phase 3: Keyboard Safety

- [x] T007 Exempt form controls from the global `Space` pan handler so modal text fields accept spaces in `src/components/gojs/components/Diagram.tsx`

## Validation Tasks

- [ ] T008 Manually verify inline rename start, save, and cancel behavior on modelview tabs
- [ ] T009 Manually verify modal save preserves unchanged description text and persists edited description text
- [ ] T010 Manually verify drag-and-drop modelview tab reorder persists after refresh/save flow
- [ ] T011 Manually verify `Space` inserts spaces in the description textarea and still pans the canvas outside form controls
- [x] T012 Run production build verification
