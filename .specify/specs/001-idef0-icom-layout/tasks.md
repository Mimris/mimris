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
- [x] T011c Clear stale persisted path points for moved port-to-port relationships so orthogonal routes recompute from correct port sides in `src/components/gojs/components/Diagram.tsx`
- [x] T011d Rebuild converted object/group parts live on canvas so conversion is visible immediately without reload in `src/components/gojs/components/Diagram.tsx`

## Phase 4: Documentation

- [x] T012 Update ICOM rendering notes in `docs/_specs/Overview.md`
- [x] T013 Capture the work as a real spec-kit feature under `.specify/specs/001-idef0-icom-layout/`

## Phase 5: Group Dragging And Pan Behavior

- [x] T019 Require `Shift` for regrouping into non-lane groups in `src/akmm/ui_templates.ts` and `src/components/gojs/GoJSApp.tsx`
- [x] T020 Make first-time `Shift` detach from a group persist cleanly without snap-back in `src/components/gojs/GoJSApp.tsx`
- [x] T021 Reduce the default nested-group size ratio so multiple subprocesses with ICOMs fit inside a parent in `src/components/gojs/GoJSApp.tsx` and `src/akmm/ui_templates.ts`
- [x] T022 Fix grouped-child drag clamping so nested groups stay under the cursor while moving inside a parent in `src/components/gojs/components/Diagram.tsx`
- [x] T023 Add temporary `Space`-drag canvas panning without breaking normal background drag behavior in `src/components/gojs/components/Diagram.tsx`
- [x] T023a Keep `ProjectMenuBar` dispatch wiring stable after interaction changes by passing page-level dispatch explicitly in `src/components/loadModelData/ProjectMenuBar.tsx`, `src/pages/index.tsx`, and `src/pages/modelling.tsx`
- [x] T023b Make ported group body hit zones distinguish inner-frame move behavior from group-body relationship hookup in `src/akmm/ui_templates.ts`
- [x] T023c Restore explicit ICOM port hookup on groups by fixing pickable port containers and visible port hit areas in `src/akmm/ui_templates.ts`
- [x] T023d Default `isFollowedBy` and `triggers` relationships to `AvoidsNodes` when no explicit routing is set in `src/components/gojs/GoJSApp.tsx` and `src/akmm/ui_buildmodels.ts`
- [x] T023e Stop persisting point arrays for auto-routed `Orthogonal` and `AvoidsNodes` links while preserving persisted points for explicit non-orthogonal routes in `src/akmm/ui_templates.ts`, `src/akmm/ui_diagram.ts`, and `src/akmm/ui_gojs.ts`
- [x] T023f Remove the duplicate `getGroupByLocation` implementation block introduced during merge resolution so `src/akmm/ui_common.ts` stays parseable while preserving the active group-containment behavior

## Validation Tasks

- [ ] T014 Manually verify an IDEF0 model with long input/output/control/mechanism labels
- [ ] T015 Confirm persisted diagrams with explicit routing still honor stored routing values
- [ ] T016 Manually verify object-to-group conversion and subsequent resize persistence for non-ported groups
- [ ] T017 Manually verify that moved port-to-port process relationships no longer flip sides after stale path clearing
- [ ] T018 Manually verify canvas menu conversion between object and group without using reload
- [ ] T024 Manually verify non-Shift drag over a process group does not regroup the dragged process or subprocess
- [ ] T025 Manually verify `Shift` drag into and out of process groups, including first-attempt detach, nested sizing, and cursor-aligned child dragging
- [ ] T026 Manually verify `Space`-drag pans the canvas over nested groups and does not trigger click/zoom behavior on mouse-up
- [ ] T027 Manually verify the project menu bar renders and its project load/save actions still work on both landing and modelling pages
- [ ] T028 Manually verify a ported group moves from the visible inner frame, connects from the remaining group body, and still prefers explicit ports when hovered
- [ ] T029 Manually verify explicit group ports hook up relationships directly instead of selecting the group body
- [ ] T030 Manually verify new `isFollowedBy` and `triggers` relationships default to `AvoidsNodes` while persisted explicit routing values remain unchanged
- [ ] T031 Manually verify `Orthogonal` and `AvoidsNodes` links reroute from current geometry after moving nodes and do not save stale point arrays, while manually routed non-orthogonal links still persist their point arrays
