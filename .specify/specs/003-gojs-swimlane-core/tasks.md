# Tasks: GoJS Swimlane Core

**Input**: Design documents from `/.specify/specs/003-gojs-swimlane-core/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Ownership Freeze

- [x] T001 Add a swimlane core feature flag in `src/components/gojs/GoJSApp.tsx` and related integration points
- [x] T002 Document current swimlane behavior owners and quarantine targets in a short reference note under `.specify/specs/003-gojs-swimlane-core/`
- [x] T003 Mark legacy swimlane-specific logic in `src/akmm/ui_diagram.ts`, `src/components/gojs/GoJSApp.tsx`, and `src/components/gojs/components/Diagram.tsx` for removal or bypass under the new flag

## Phase 2: New Swimlane Core

- [x] T004 Refactor `src/akmm/ui_swimlane.ts` so it contains the single authoritative pool template
- [x] T005 Refactor `src/akmm/ui_swimlane.ts` so it contains the single authoritative lane template
- [x] T006 Rebuild pool/lane mechanics in `src/akmm/ui_swimlane.ts` from a GoJS-sample-first layout and tool model
- [x] T007 Define and enforce the swimlane persistence contract (`loc`, `size`, `group`, `laneIndex`, `isExpanded`) in `src/akmm/ui_swimlane.ts` and `src/akmm/ui_gojs.ts`

## Phase 3: Drop Adapter

- [x] T008 Implement a thin swimlane drop adapter in `src/components/gojs/GoJSApp.tsx` for pool, lane, and ordinary BPMN node drops
- [x] T009 Make lane-on-pool drops persist real membership immediately through `group = poolKey`
- [x] T010 Make ordinary BPMN node drops into lanes persist lane membership without changing swimlane geometry rules
- [x] T011 Remove duplicate post-drop swimlane repair passes from `src/components/gojs/GoJSApp.tsx` when the new core path is active

## Phase 4: Persistence Simplification

- [ ] T012 Reduce swimlane-specific `SelectionMoved` persistence in `src/components/gojs/GoJSApp.tsx` to completed-action persistence only
- [ ] T013 Remove or bypass pool move stabilization, geometry snapshots, and swimlane watchdog logic in `src/components/gojs/GoJSApp.tsx` under the new core flag
- [ ] T014 Remove or bypass geometry-derived swimlane reparent and normalization logic in `src/components/gojs/GoJSApp.tsx` under the new core flag
- [ ] T015 Keep `src/components/gojs/components/Diagram.tsx` limited to minimal tool integration for the new core path

## Phase 5: Legacy Retirement

- [ ] T016 Remove or bypass swimlane-specific `doGroupLayout` behavior in `src/akmm/ui_diagram.ts` when the new core is active
- [ ] T017 Remove or bypass legacy pool/lane drag compensation logic in `src/components/gojs/components/Diagram.tsx`
- [ ] T018 Remove swimlane structural inference from `src/components/gojs/layout/DropLayoutManager.ts` when it duplicates core behavior
- [ ] T019 Remove duplicated swimlane template ownership from `src/akmm/ui_templates.ts` and related files

## Phase 6: Validation

- [ ] T020 Manually verify: create a pool, add one lane, move pool by header, release, and confirm no jump
- [x] T021 Manually verify: resize a pool or lane and confirm automatic layout updates all lane geometry without a manual **Do Layout** action; verify the contained lane layout remains stable
- [ ] T022 Manually verify: collapse and expand a pool and confirm lanes hide and restore correctly
- [ ] T023 Manually verify: drag BPMN nodes from palette into lanes and confirm lane membership persists after reload
- [ ] T024 Manually verify: standalone lane drop behavior is intentional and documented
- [x] T025 Run `npm run build`
- [ ] T026 Run `npm test`
