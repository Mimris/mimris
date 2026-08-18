# Tasks: Local Project Import Guardrails

**Input**: Design documents from `/.specify/specs/003-local-project-import-guardrails/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Import Flow

- [x] T001 Keep the project-menu local file picker reusable for repeated imports in `src/components/loadModelData/ProjectMenuBar.tsx`
- [x] T002 Avoid redundant route pushes when importing from the modelling page in `src/components/loadModelData/ProjectMenuBar.tsx`
- [x] T003 Reset imported state from the application baseline before applying wrapped project-file data in `src/components/utils/ReadModelFromFile.ts`
- [x] T004 Reset imported state from the application baseline before applying legacy model-file data in `src/components/utils/ReadModelFromFile.ts`
- [x] T005 Resolve imported focus defensively and refresh the modelling view after successful import in `src/components/utils/ReadModelFromFile.ts`

## Phase 2: Empty-File Handling

- [x] T006 Reject local imports with no effective models and warn the user clearly in `src/components/utils/ReadModelFromFile.ts`
- [x] T007 Show an explicit empty import message instead of an indefinite loading state in `src/components/Modelling.tsx`

## Phase 3: Validation

- [ ] T008 Manually verify landing-page local import navigates into modelling with the imported data
- [x] T009 Manually verify modelling-page local import replaces data without route churn
- [ ] T010 Manually verify the same local file can be selected twice in a row
- [ ] T011 Manually verify empty-file imports show "No models in this file." and do not leave stale state visible
- [x] T012 Manually verify a legacy local project opened on `/modelling` survives browser Reload without the active modelview becoming blank
