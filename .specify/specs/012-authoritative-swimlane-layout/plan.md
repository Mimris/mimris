# Implementation Plan: Preserve Authoritative Swimlane Layout

1. Carry `layoutRevision` through `cxObjectView`, JSON import/export, and GoJS node data.
2. Detect complete revised Pool/Lane geometry during `InitialLayoutCompleted`.
3. Bypass both immediate and deferred initial normalization for authoritative pools.
4. Verify TypeScript, tests, and the embedded BPMN model visually.

