# Tasks: Universe Topology And Shared Focus

**Input**: Design documents from `/.specify/specs/006-universe-topology-and-focus/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Canonical Contract

- [x] T001 Define the canonical top-level universe sections as `worldDefinition`, `worldModel`, `operationalModel`, and `focus` in `.specify/specs/006-universe-topology-and-focus/spec.md`
- [x] T002 Define universe-level focus subsections for `project`, `worldModel`, `operational`, `document`, and `meta` in `.specify/specs/006-universe-topology-and-focus/spec.md`
- [x] T003 Record the cross-app preservation rule so save flows keep unknown fields from snapshots they do not fully own in `.specify/specs/006-universe-topology-and-focus/spec.md`

## Phase 2: Migration Design

- [x] T004 Define legacy-to-canonical mapping rules for flat `focus*`, top-level `metis`, and top-level `executionModel` in `.specify/specs/006-universe-topology-and-focus/plan.md`
- [x] T005 Define normalization-first rollout so legacy snapshots continue to load during transition in `.specify/specs/006-universe-topology-and-focus/plan.md`
- [x] T006 Define merge-preserving save expectations for Mimris interoperability with Mimris AI Workspace in `.specify/specs/006-universe-topology-and-focus/plan.md`

## Phase 3: Follow-on Implementation Work

- [x] T007 Add canonical universe normalization helpers in Mimris
- [x] T008 Update Mimris adapters to read/write canonical scoped metis sources and universe-level `focus`
- [x] T008A Prevent `/model` query-driven loads from rendering the initial local template before the requested snapshot resolves
- [x] T008B Centralize legacy-shaped app props behind `selectMimrisCompatibilityProps`
- [x] T008C Convert project-domain edits to explicit shared-universe dispatch
- [x] T008D Introduce `dispatchUniversePhData` for complete `phData` replacement paths and migrate selected call sites
- [ ] T009 Add server-file read/write against the canonical universe snapshot format
- [ ] T010 Align the same spec-kit method and canonical contract planning in `mimris-ai-workspace`

## Validation Tasks

- [ ] T011 Review the contract against the current `mimris-ai-workspace` top-level Redux store
- [ ] T012 Verify the contract still supports share-link focus handoff
- [x] T013 Verify the migration plan preserves legacy Mimris snapshots
- [x] T014 Verify compatibility selector prefers canonical universe state and falls back to legacy `ph*`
- [x] T015 Verify shared phData dispatch helper emits explicit universe action while legacy mapping still works
