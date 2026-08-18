# Implementation Plan: GoJS Swimlane Core

**Branch**: `003-gojs-swimlane-core` | **Date**: 2026-06-30 | **Spec**: [.specify/specs/003-gojs-swimlane-core/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/003-gojs-swimlane-core/spec.md`

## Summary
Replace the current hybrid BPMN swimlane implementation with a GoJS-sample-first swimlane core that owns all pool/lane behavior, while preserving Mimris palette drag/drop, BPMN metamodel creation, and persisted model compatibility.

## Technical Context
**Language/Version**: TypeScript  
**Primary Dependencies**: Next.js, React, GoJS, Redux  
**Storage**: persisted model and modelview JSON data  
**Testing**: manual visual verification plus existing build/test commands  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable regression in drag, resize, reload, or palette drop responsiveness  
**Constraints**: preserve persisted BPMN semantics; keep changes incremental behind a feature flag; avoid dual active swimlane layout owners  
**Scale/Scope**: swimlane behavior replacement spanning template ownership, drag/drop integration, persistence minimization, and legacy logic retirement

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS
- Incremental change scope: PASS, via feature flag and phased replacement
- Metamodel/model/UI consistency: PASS, BPMN semantics remain but swimlane mechanics move to one owner

## Research Notes

- The current failures are ownership conflicts, not isolated geometry bugs.
- Swimlane behavior is currently spread across:
  - `src/akmm/ui_swimlane.ts`
  - `src/akmm/ui_diagram.ts`
  - `src/components/gojs/components/Diagram.tsx`
  - `src/components/gojs/GoJSApp.tsx`
  - `src/components/gojs/layout/DropLayoutManager.ts`
  - `src/akmm/ui_gojs.ts`
- A GoJS-sample-first core is more likely to succeed than continued patching because GoJS already solves group membership, lane stacking, and pool/lane interaction semantics.

## Design Notes

- `src/akmm/ui_swimlane.ts` becomes the single owner of swimlane mechanics.
- `src/components/gojs/GoJSApp.tsx` persists completed actions but does not perform post-hoc geometry repair for ordinary swimlane operations.
- `src/components/gojs/components/Diagram.tsx` keeps only minimal swimlane integration hooks needed to host the GoJS tools.
- `src/akmm/ui_templates.ts` and BPMN-specific files continue to map templates and data, but stop implementing swimlane mechanics.
- Palette drag/drop remains standard Mimris behavior, but a thin drop adapter decides only what to create and which `group` to assign.
- `group` becomes the source of truth for membership; geometry is not used to infer structure during ordinary operation.

## File Ownership Targets

### Single Owner After Refactor
- `src/akmm/ui_swimlane.ts`
  - pool template
  - lane template
  - pool/lane layout
  - pool/lane resize behavior
  - pool/lane collapse/expand behavior
  - lane ordering semantics

### Adapter / Integration Files
- `src/components/gojs/GoJSApp.tsx`
  - drop adapter
  - persistence dispatch for completed swimlane actions
  - feature flag wiring
- `src/components/gojs/components/Diagram.tsx`
  - tool registration and generic diagram integration
- `src/akmm/ui_gojs.ts`
  - model mapping for `laneIndex` and other persisted swimlane contract fields

### Legacy Logic To Remove Or Quarantine
- `src/akmm/ui_diagram.ts`
  - swimlane-specific `doGroupLayout` branch
- `src/components/gojs/GoJSApp.tsx`
  - pool/lane normalization passes
  - pool geometry snapshots and watchdog stabilization
  - geometry-derived reparent repair during ordinary pool/lane operations
- `src/components/gojs/components/Diagram.tsx`
  - drag compensation and post-drag restoration logic added to fight legacy swimlane drift
- `src/components/gojs/layout/DropLayoutManager.ts`
  - swimlane structural inference logic beyond ordinary node placement inside existing lanes

## Phased Execution

### Phase 1: Freeze Ownership
- Add a feature flag such as `useGoJSSwimlaneCore`.
- Document current swimlane ownership and mark legacy behavior paths as quarantine targets.
- Prevent new swimlane fixes from being added outside `ui_swimlane.ts` unless strictly temporary.

### Phase 2: Build The New Core
- Rework `ui_swimlane.ts` to follow the GoJS swimlane sample as closely as practical.
- Keep exactly one pool template and one lane template.
- Implement pool/lane group semantics directly in the core.
- Define the swimlane persistence contract explicitly.

### Phase 3: Rebuild Drop Integration
- Create a thin drop adapter for pool, lane, and ordinary BPMN nodes.
- On lane drop to pool:
  - create lane group data
  - set `group = poolKey`
  - set `laneIndex`
  - let the core place and size the lane
- Remove duplicate post-drop repair passes for successful swimlane drops.

### Phase 4: Simplify Persistence
- Persist only `loc`, `size`, `group`, `laneIndex`, and `isExpanded` for swimlanes.
- Shrink `SelectionMoved` swimlane handling to completed-action persistence only.
- Remove pool/lane move stabilization and geometry watchdog behavior for the new core path.

### Phase 5: Retire Legacy Paths
- Delete or bypass old swimlane layout behavior in `ui_diagram.ts`.
- Delete or bypass old drag compensation in `Diagram.tsx`.
- Delete or bypass normalization and snapshot repair logic in `GoJSApp.tsx`.
- Remove swimlane-specific inference from `DropLayoutManager.ts` that duplicates core behavior.

## Files

- `src/akmm/ui_swimlane.ts`
- `src/akmm/ui_diagram.ts`
- `src/akmm/ui_templates.ts`
- `src/akmm/ui_gojs.ts`
- `src/components/gojs/GoJSApp.tsx`
- `src/components/gojs/components/Diagram.tsx`
- `src/components/gojs/layout/DropLayoutManager.ts`
- `docs/lane-resize-pool-sync-spec.md`

## Validation

- Create a new pool, add lanes, and verify true membership.
- Move a pool by header and confirm lanes follow during drag and remain after release.
- Resize pool and lane geometry, reload, and verify persistence matches visuals.
- Collapse and expand a pool and verify member restoration.
- Drop BPMN nodes from palette into lanes and verify persisted grouping after reload.
- Verify the new feature flag can be turned on without affecting unrelated BPMN nodes.
- Verify the legacy path can be disabled once the new core passes the manual matrix.
