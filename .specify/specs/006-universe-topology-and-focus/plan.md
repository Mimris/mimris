# Implementation Plan: Universe Topology And Shared Focus

**Branch**: `006-universe-topology-and-focus` | **Date**: 2026-04-07 | **Spec**: [.specify/specs/006-universe-topology-and-focus/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/006-universe-topology-and-focus/spec.md`

## Summary
Define a canonical universe snapshot shared by Mimris and Mimris AI Workspace with top-level `worldDefinition`, `worldModel`, `operationalModel`, and universe-level `focus`, then migrate loading, saving, and handoff around normalization rather than flat legacy fields.

## Technical Context
**Language/Version**: TypeScript and JavaScript  
**Primary Dependencies**: existing Redux store shape, JSON import/export paths, shared server-file persistence  
**Storage**: server-side JSON universe files and local JSON import/export files  
**Testing**: schema normalization tests, manual cross-app load/save verification, existing repo build  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable regression in universe load/save responsiveness  
**Constraints**: preserve compatibility with legacy Mimris snapshots and preserve unknown fields from Mimris AI Workspace snapshots  
**Scale/Scope**: focused on schema topology, normalization, selectors/adapters, and cross-app round-trip safety

## Constitution Check

- Persisted model compatibility: PASS, migration must be normalization-first
- Visual verification required: PASS, focus handoff and cross-app load/save should be checked in the browser
- Incremental change scope: PASS, introduce compatibility layer before replacing legacy callers
- Metamodel/model/UI consistency: PASS

## Design Notes

- Treat the current workbench top-level store as the source schema reference while introducing the new canonical topology.
- Preserve full snapshots during Mimris save so unknown workbench-only fields survive round trips.
- Normalize legacy top-level `metis`, `executionModel`, and flat `focus*` fields into the new canonical sections at load time.
- Allow Mimris to own only the world-model and shared-focus fields it truly edits while preserving the rest of the snapshot.
- Keep the future server-file integration aligned to the same canonical topology rather than a Mimris-only wrapper.
- Canonical active modelling source is `world.worldModel.metis`.
- Shared variants should be sourced from separate universes, while legacy top-level `metis` remains compatibility fallback-only ingestion.
- Query-driven `/model` loads must gate the modelling surface on the requested URL payload, using the explicit route parameters as the first-render source of truth so the initial local template does not flash before the remote snapshot arrives.
- Shared-universe read migration uses `selectMimrisCompatibilityProps` as the boundary for app-level components that still pass legacy-shaped props to AKMM/GoJS internals.
- Shared-universe write migration uses explicit action creators and helpers such as `setUniverseDomain` and `dispatchUniversePhData` before removing legacy dispatch compatibility.

## Migration Matrix

### Loader Normalization Rules

1. Detect the target canonical shape first.
   - If the payload already contains top-level `worldDefinition`, `worldModel`, `operationalModel`, and `focus`, treat it as canonical and apply only default filling for missing optional subsections.

2. Detect the current Mimris AI Workspace shape second.
   - Normalize:
     - top-level `metis` -> `world.worldModel.metis` as compatibility fallback
     - top-level `executionModel` -> `operationalModel`
     - top-level `documents` -> `worldModel.documents`
     - top-level `domainCategories` -> `worldModel.domainCategories`
     - `focus.focusProj` -> `focus.project`
     - `focus.focusModel` -> `focus.worldModel.model`
     - `focus.focusModelview` -> `focus.worldModel.modelview`
     - `focus.focusDoc` -> `focus.document.doc`

3. Detect the current Mimris shape third.
   - Normalize:
     - `phData.domain` -> `worldDefinition.domain`
     - `phData.metis` -> active scoped metis resolved from canonical selection rules
     - `phFocus.focusProj` -> `focus.project`
     - `phFocus.focusModel` -> `focus.worldModel.model`
     - `phFocus.focusModelview` -> `focus.worldModel.modelview`
     - `phFocus.focusObject` -> `focus.worldModel.object`
     - `phFocus.focusObjectview` -> `focus.worldModel.objectview`
     - `phFocus.focusRelship` -> `focus.worldModel.relship`
     - `phFocus.focusRelshipview` -> `focus.worldModel.relshipview`
     - `phFocus.focusTargetModel` -> `focus.worldModel.targetModel`
     - `phFocus.focusTargetModelview` -> `focus.worldModel.targetModelview`
     - `phFocus.focusTask` -> `focus.operational.task`
     - `phFocus.focusRole` -> `focus.operational.role`
     - `phFocus.focusDoc` -> `focus.document.doc`
     - `phSource` or `phFocus.focusSource` -> `focus.meta.source`
     - `phFocus.focusRefresh` -> `focus.meta.refreshToken`

4. Fill defaults for missing sections.
   - The loader should always ensure `worldDefinition`, `worldModel`, `operationalModel`, `focus`, and `workspace` exist.
   - The loader should default the active metis scope in this order:
      1. `world.worldModel.metis`
      2. legacy top-level `metis`

5. Preserve unknown fields.
   - Unrecognized top-level or nested fields should survive normalization so future or app-specific data is not dropped.

### Save And Merge Rules

1. Keep the original loaded snapshot in memory.
   - Save flows should merge Mimris-owned updates into that source snapshot rather than rebuilding the whole payload from Mimris-only knowledge.

2. Mimris-owned sections for save should be limited to:
   - `worldDefinition.domain` if domain editing is enabled
    - one selected scoped metis source:
       - `world.worldModel.metis`
   - `focus.project`
   - `focus.worldModel.*`
   - optional `focus.document.doc`
   - optional `focus.meta.source`

3. Mimris should preserve by default:
   - `operationalModel`
   - `workspace`
   - `blueprint`
   - `contextProfiles`
   - `contextValues`
   - `attachmentsCatalog`
   - `collaborationThreads`
   - `systemPrompt`
   - all unknown fields

4. Canonical save output should always use the new top-level shape.
   - Legacy inputs should load through normalization and save back as canonical snapshots.

5. Save conflict protection should be added later.
   - Introduce `updatedAt` or revision-based optimistic checks when server-file persistence is implemented.

### Selector Rename Rules

- `state.phData.domain` -> `state.worldDefinition.domain`
- `state.phData.metis` -> active scoped metis resolved from canonical source selection
- `state.executionModel` -> `state.operationalModel`
- `state.phFocus.focusProj` -> `state.focus.project`
- `state.phFocus.focusModel` -> `state.focus.worldModel.model`
- `state.phFocus.focusModelview` -> `state.focus.worldModel.modelview`
- `state.phFocus.focusObject` -> `state.focus.worldModel.object`
- `state.phFocus.focusObjectview` -> `state.focus.worldModel.objectview`
- `state.phFocus.focusRelship` -> `state.focus.worldModel.relship`
- `state.phFocus.focusRelshipview` -> `state.focus.worldModel.relshipview`
- `state.phFocus.focusTargetModel` -> `state.focus.worldModel.targetModel`
- `state.phFocus.focusTargetModelview` -> `state.focus.worldModel.targetModelview`
- `state.phFocus.focusTask` -> `state.focus.operational.task`
- `state.phFocus.focusRole` -> `state.focus.operational.role`
- `state.phFocus.focusDoc` -> `state.focus.document.doc`
- `state.phFocus.focusRefresh` -> `state.focus.meta.refreshToken`
- `state.phFocus.focusSource` -> `state.focus.meta.source`
- current AI workspace `state.metis` -> `state.worldModel.metis`
- current AI workspace `state.executionModel` -> `state.operationalModel`
- current AI workspace `state.focus.focusProj` -> `state.focus.project`
- current AI workspace `state.focus.focusModel` -> `state.focus.worldModel.model`
- current AI workspace `state.focus.focusModelview` -> `state.focus.worldModel.modelview`
- current AI workspace `state.focus.focusDoc` -> `state.focus.document.doc`

### Transition Strategy

1. Introduce compatibility selectors that read canonical fields first and legacy fields second.
2. Move consumers to compatibility selectors before changing writers.
3. Centralize legacy-shaped compatibility props in one selector so React components do not manually reconstruct `phData`, `phFocus`, `phUser`, `phSource`, or `phList`.
4. Convert low-risk app-level writes to explicit shared-universe action creators before changing diagram mutation code.
5. Introduce shared dispatch helpers for complete `phData` replacement paths used by AKMM/GoJS, then migrate raw `LOAD_TOSTORE_PHDATA` call sites incrementally.
6. Normalize loaders before switching persistence to the canonical shape.
7. Switch save flows to merge-preserving canonical writes.
8. Remove legacy selector fallbacks only after both Mimris and Mimris AI Workspace are aligned.
9. Keep the UI selector limited to the three canonical sources and do not surface legacy top-level `metis` as a primary option.
10. Keep compatibility fallback indicators internal to diagnostics and avoid persistent legacy status banners in the mini-model route.

## Files

- `.specify/specs/006-universe-topology-and-focus/spec.md`
- `.specify/specs/006-universe-topology-and-focus/plan.md`
- `.specify/specs/006-universe-topology-and-focus/tasks.md`
- `.specify/tasks.yaml`

## Validation

- Verify a canonical snapshot can be explained and traversed by both apps using the same top-level sections.
- Verify legacy flat Mimris snapshots can normalize into the new topology without losing modelling state.
- Verify a merged save preserves unknown fields from a workbench-origin snapshot.
- Verify shared links can target the new universe-level focus contract.
- Verify `/model?...` loads do not briefly paint the initial local template before the requested remote or shared snapshot resolves.
- Verify app-level compatibility props prefer canonical `universe` state while legacy `ph*` fields are still present.
- Verify complete `phData` replacement dispatches can route through shared-universe helpers without breaking legacy call sites.
