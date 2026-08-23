# Implementation Plan: Preserve Authoritative Swimlane Layout

1. Carry `layoutRevision` through `cxObjectView`, JSON import/export, and GoJS node data.
2. Detect complete revised Pool/Lane geometry during `InitialLayoutCompleted`.
3. Bypass both immediate and deferred initial normalization for authoritative pools.
4. Replace automatic Lane content layout with frame-only Pool/Lane normalization that preserves member positions.
5. Keep the Pool fixed during Lane drag, then synchronize equal Lane widths and fit the Pool to the final Lane stack.
6. Enforce content-aware Lane resize bounds and align Pool/Lane border geometry.
7. Separate explicit file-open replacement from geometry-preserving background refreshes.
8. Verify TypeScript, tests, production build, and the embedded BPMN model visually.

## Progress Tracking

- [x] Specification and compatibility constraints documented.
- [x] `layoutRevision` preserved through import, runtime node data, and export.
- [x] Authoritative Pool/Lane detection implemented.
- [x] Immediate and deferred startup normalization guarded.
- [x] Revised swimlane placeholders suppressed.
- [x] Lane contents preserved during Pool/Lane normalization and interactive edits.
- [x] Pool frame stabilized during Lane drag and fitted after edits.
- [x] Equal Lane widths and content-aware resize limits implemented.
- [x] Pool/Lane top and bottom border alignment corrected.
- [x] Explicit file opens restore saved geometry instead of preserving unsaved edits.
- [x] Automated and visual verification completed.
