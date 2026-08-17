# Implementation Plan: Local Project Import Guardrails

**Branch**: `003-local-project-import-guardrails` | **Date**: 2026-04-07 | **Spec**: [.specify/specs/003-local-project-import-guardrails/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/003-local-project-import-guardrails/spec.md`

## Summary
Harden local project import so valid files replace prior session state cleanly, empty model files fail with an explicit message, repeated imports from the project menu remain reliable, and browser reload restores the imported project instead of a blank/default startup state.

## Technical Context
**Language/Version**: TypeScript  
**Primary Dependencies**: Next.js, React, Redux  
**Storage**: persisted local JSON project files and in-memory Redux state  
**Testing**: manual import verification, existing repo test command if available  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable delay added to local file import flow  
**Constraints**: preserve compatibility with persisted model data and legacy import shapes; keep changes incremental  
**Scale/Scope**: focused on local file import handling in `src/components/loadModelData`, `src/components/utils`, and empty-state rendering in the modelling page

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS, local import flow and modelling state should be checked in the browser
- Incremental change scope: PASS
- Metamodel/model/UI consistency: PASS

## Design Notes

- Reset imported state from the application baseline before overlaying file content so stale project data does not leak across imports.
- Resolve imported focus defensively for both wrapped and legacy file shapes.
- Clear the hidden file input before and after selection handling so repeated imports of the same file are allowed.
- Show an explicit empty-file message instead of treating an empty model list as an indefinite loading case.
- Avoid redundant route pushes when import occurs from the modelling page itself.
- On `/modelling` reload, recover directly from browser `memorystate` and prefer the snapshot with the most modelview content when session and local storage disagree.
- Guard browser persistence so a sparse startup render cannot overwrite a richer imported local-project snapshot before recovery completes.
- Preserve explicit import/refresh writes so intentionally opened empty or replacement files can still update browser storage.

## Files

- `src/components/loadModelData/ProjectMenuBar.tsx`
- `src/components/utils/ReadModelFromFile.ts`
- `src/pages/modelling.tsx`
- `src/components/Modelling.tsx`

## Validation

- Import a valid project from the landing page and confirm it opens in the modelling view.
- Import a valid project while already on the modelling page and confirm the route does not churn.
- Import two different local project files back-to-back and confirm stale focus and model state do not carry over.
- Re-import the same local file twice in a row and confirm both imports fire.
- Import an empty or model-less file and confirm the user sees "No models in this file."
- Open a legacy local project file on `/modelling`, reload the browser page, and confirm the active modelview content remains visible.
