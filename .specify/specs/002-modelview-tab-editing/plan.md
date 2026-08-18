# Implementation Plan: Model And Modelview Tab Editing

**Branch**: `002-modelview-tab-editing` | **Date**: 2026-03-22 | **Spec**: [.specify/specs/002-modelview-tab-editing/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/002-modelview-tab-editing/spec.md`

## Summary
Add direct modelview and model tab rename and reorder controls in the modeller, backed by persisted Redux updates, a confirmation modal for name and description changes, and viewport-fit adjustments so the modeller panel fills its available area cleanly.

## Technical Context
**Language/Version**: TypeScript / JavaScript  
**Primary Dependencies**: Next.js, React, Reactstrap, Redux, GoJS  
**Storage**: persisted model JSON through existing Redux-backed save flow  
**Testing**: production build, manual visual verification of tab interactions  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable lag while editing or dragging tabs  
**Constraints**: preserve persisted modelview compatibility; do not break diagram keyboard shortcuts outside form controls  
**Scale/Scope**: focused on `src/components/Modeller.tsx`, `src/components/Modelling.tsx`, `src/components/modelSuite/Model.tsx`, `src/components/export/ReportModule.tsx`, `src/components/FocusDetails.tsx`, `src/reducers/reducer.js`, `src/actions/types.js`, and diagram keyboard handling in `src/components/gojs/components/Diagram.tsx`

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS
- Incremental change scope: PASS
- Model/UI consistency: PASS

## Design Notes

- Reuse the existing modelview tab strip rather than introducing a second navigation component.
- Reuse the existing model tab strips rather than introducing a second navigation component.
- Keep inline rename lightweight, but confirm the final save in a modal so `description` can be reviewed at the same time.
- Use the persisted `modelviews` array order as the only source of truth for tab sequencing.
- Use the persisted `models` array order as the only source of truth for model tab sequencing.
- Exempt focused form controls from the global `Space` pan shortcut so modal editing behaves like normal text input.
- Keep a small consistent visual margin around the modeller canvas rather than letting parent container backgrounds show as a large empty block below the work area.

## Files

- `src/components/Modeller.tsx`
- `src/components/Modelling.tsx`
- `src/components/modelSuite/Model.tsx`
- `src/components/export/ReportModule.tsx`
- `src/components/FocusDetails.tsx`
- `src/reducers/reducer.js`
- `src/actions/types.js`
- `src/components/gojs/components/Diagram.tsx`

## Validation

- Double-click a modelview tab and verify inline rename starts.
- Save a rename through the modal and verify name and description persistence behavior.
- Cancel a rename and verify no modelview property changes are saved.
- Drag modelview tabs into a new order and verify the order persists.
- Double-click a model tab and verify inline rename starts.
- Save a model rename through the modal and verify name and description persistence behavior.
- Cancel a model rename and verify no model property changes are saved.
- Drag model tabs into a new order and verify the order persists.
- Type spaces in the modal description field and verify no diagram pan shortcut fires.
- Verify the modelling page keeps only a small consistent margin around the modeller and does not show a large empty strip below the canvas.
