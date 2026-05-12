# Tasks: Model And Modelview Tab Editing

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

## Phase 2B: Model Tab Interaction

- [x] T006A Add inline rename state and double-click activation to the existing model tab strips in `src/components/Modelling.tsx` and `src/components/modelSuite/Model.tsx`
- [x] T006B Add rename confirmation modal with editable `name` and `description` fields for model tabs in `src/components/Modelling.tsx` and `src/components/modelSuite/Model.tsx`
- [x] T006C Keep focused model state synchronized after rename in `src/reducers/reducer.js`
- [x] T006D Add a persisted `REORDER_MODELS` action type in `src/actions/types.js`
- [x] T006E Reorder the persisted `models` array in Redux when a model tab is dropped on another tab in `src/reducers/reducer.js`
- [x] T006F Add drag-and-drop behavior to the model tab strips in `src/components/Modelling.tsx` and `src/components/modelSuite/Model.tsx`
- [x] T006G Remove refresh-on-click churn from model tab selection so double-click edit can fire reliably in `src/components/Modelling.tsx` and `src/components/modelSuite/Model.tsx`

## Phase 3: Keyboard Safety

- [x] T007 Exempt form controls from the global `Space` pan handler so modal text fields accept spaces in `src/components/gojs/components/Diagram.tsx`

## Phase 4: Viewport Fit

- [x] T008 Adjust modeller and detail pane sizing so the modelling page keeps a small outer margin without showing a large empty strip below the canvas in `src/components/Modeller.tsx`, `src/components/Modelling.tsx`, `src/components/export/ReportModule.tsx`, and `src/components/FocusDetails.tsx`

## Phase 5: Recovery Robustness

- [x] T008A Harden persisted state recovery so missing `metis`, `focusModelview`, or `modelviews` entries do not crash or falsely block rendering in `src/pages/modelling.tsx`, `src/pages/index.tsx`, `src/components/Modelling.tsx`, and `src/components/Modeller.tsx`

## Validation Tasks

- [ ] T009 Manually verify inline rename start, save, and cancel behavior on modelview tabs
- [ ] T010 Manually verify modal save preserves unchanged description text and persists edited description text
- [ ] T011 Manually verify drag-and-drop modelview tab reorder persists after refresh/save flow
- [ ] T012 Manually verify `Space` inserts spaces in the description textarea and still pans the canvas outside form controls
- [ ] T013 Manually verify the modelling page keeps only a small margin around the modeller with no large empty strip below the canvas
- [ ] T014 Manually verify model tab inline rename start, save, and cancel behavior
- [ ] T015 Manually verify drag-and-drop model tab reorder persists after refresh/save flow
- [x] T016 Run production build verification
