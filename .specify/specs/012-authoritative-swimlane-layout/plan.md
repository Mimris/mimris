# Implementation Plan: Preserve Authoritative Swimlane Layout

1. Carry `layoutRevision` through `cxObjectView`, JSON import/export, and GoJS node data.
2. Detect complete revised Pool/Lane geometry during `InitialLayoutCompleted`.
3. Bypass both immediate and deferred initial normalization for authoritative pools.
4. Verify TypeScript, tests, and the embedded BPMN model visually.

## Progress Tracking

- [x] Specification and compatibility constraints documented.
- [x] `layoutRevision` preserved through import, runtime node data, and export.
- [x] Authoritative Pool/Lane detection implemented.
- [x] Immediate and deferred startup normalization guarded.
- [x] Revised swimlane placeholders suppressed.
- [x] Automated and visual verification completed.
