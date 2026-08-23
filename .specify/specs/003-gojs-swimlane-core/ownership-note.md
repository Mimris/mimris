# Swimlane Ownership Note

## Purpose

This note captures the current swimlane ownership problem and the Phase 1 quarantine boundary for `003-gojs-swimlane-core`.

## Current Owners

- `src/akmm/ui_swimlane.ts`
  - templates
  - some resize and pool/lane behavior
- `src/akmm/ui_diagram.ts`
  - legacy `doGroupLayout` swimlane layout and geometry correction
- `src/components/gojs/components/Diagram.tsx`
  - lane/pool drag integration and post-drag legacy layout callbacks
- `src/components/gojs/GoJSApp.tsx`
  - `SelectionMoved`
  - `ExternalObjectsDropped`
  - swimlane persistence, normalization, stabilization, and repair
- `src/components/gojs/layout/DropLayoutManager.ts`
  - additional swimlane-aware placement logic

## Target Owner

- `src/akmm/ui_swimlane.ts`
  - single owner for pool/lane templates, layout, resize, move, collapse/expand, and membership semantics

## Adapter Owners

- `src/components/gojs/GoJSApp.tsx`
  - thin drop adapter
  - completed-action persistence
- `src/components/gojs/components/Diagram.tsx`
  - minimal GoJS tool registration and integration
- `src/akmm/ui_gojs.ts`
  - model mapping for persisted swimlane contract fields

## Phase 1 Quarantine Targets

These legacy paths remain active in Phase 1 but are explicitly marked for bypass or removal in later phases:

- `src/akmm/ui_diagram.ts`
  - `doGroupLayout` swimlane branch
- `src/components/gojs/GoJSApp.tsx`
  - `SelectionMoved` swimlane stabilization and repair
  - `ExternalObjectsDropped` swimlane correction logic
- `src/components/gojs/components/Diagram.tsx`
  - post-drag calls back into `ui_diagram.doGroupLayout`

## Feature Flag

- Canonical flag: `useGoJSSwimlaneCore`
- Primary storage: `diagram.model.modelData.useGoJSSwimlaneCore`
- Runtime mirror: `diagram.__useGoJSSwimlaneCore`

Phase 1 does not change behavior yet. It establishes a single switch and explicit quarantine boundaries so Phase 2 can replace swimlane ownership safely.
