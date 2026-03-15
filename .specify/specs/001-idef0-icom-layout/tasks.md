# Tasks: IDEF0 ICOM Layout

**Input**: Design documents from `/.specify/specs/001-idef0-icom-layout/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Geometry And Routing

- [x] T001 Shorten left/right ICOM marker stubs in `src/akmm/ui_templates.ts`
- [x] T002 Tighten right-side hookup geometry without moving the visible stub to the wrong side in `src/akmm/ui_templates.ts`
- [x] T003 Change default relship routing fallback to orthogonal in `src/akmm/ui_buildmodels.ts`
- [x] T004 Change main default link routing to `go.Link.Orthogonal` in `src/akmm/ui_templates.ts`

## Phase 2: Label Behavior

- [x] T005 Move output-side label text further right to stay between orthogonal segments in `src/akmm/ui_templates.ts`
- [x] T006 Make side label text slightly transparent instead of using a visible background block in `src/akmm/ui_templates.ts`
- [x] T007 Allow top/bottom control and mechanism labels to wrap to two lines in `src/akmm/ui_templates.ts`
- [x] T008 Bottom-align top/bottom label text inside the two-line label box in `src/akmm/ui_templates.ts`
- [x] T009 Reduce horizontal spacing between neighboring control/mechanism labels in `src/akmm/ui_templates.ts`
- [x] T009a Keep top control labels bottom-aligned while bottom mechanism labels align from the first line in `src/akmm/ui_templates.ts`

## Phase 3: Border Alignment

- [x] T010 Tune top control strip outward until it reads flush with the visible group border in `src/akmm/ui_templates.ts`
- [x] T011 Tune bottom mechanism strip downward independently until it reads flush with the visible group border in `src/akmm/ui_templates.ts`
- [x] T011a Make object-to-group conversion create a non-ported group large enough to avoid initial inner-frame clipping in `src/components/gojs/components/Diagram.tsx`
- [x] T011b Keep non-ported group outer borders visible on all sides after selection and resize while preserving resize persistence in `src/akmm/ui_templates.ts`

## Phase 4: Documentation

- [x] T012 Update ICOM rendering notes in `docs/_specs/Overview.md`
- [x] T013 Capture the work as a real spec-kit feature under `.specify/specs/001-idef0-icom-layout/`

## Validation Tasks

- [ ] T014 Manually verify an IDEF0 model with long input/output/control/mechanism labels
- [ ] T015 Confirm persisted diagrams with explicit routing still honor stored routing values
- [ ] T016 Manually verify object-to-group conversion and subsequent resize persistence for non-ported groups
