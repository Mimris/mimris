# Tasks: Preserve Authoritative Swimlane Layout

- [x] Preserve `layoutRevision` across object-view representations.
- [x] Guard immediate initial swimlane normalization.
- [x] Guard deferred initial swimlane normalization.
- [x] Preserve live geometry when a newer layout revision arrives.
- [x] Keep legacy and incomplete swimlane data on the normalization path.
- [x] Stack Lane frames without automatically laying out their member nodes.
- [x] Keep Lane widths synchronized and resize the Pool to the Lane stack.
- [x] Keep the Pool stationary during active Lane dragging.
- [x] Preserve Lane-relative content positions during Lane movement.
- [x] Prevent Lane resizing from clipping existing member content.
- [x] Add left content inset and align Pool/Lane top and bottom borders.
- [x] Make explicit project and model file opens restore saved geometry.
- [x] Add regression tests for explicit file-open replacement behavior.
- [x] Restore the standard right-click context menu on Pool and Lane templates.
- [x] Add an explicit Lane Flow context-menu layout for left-to-right processes and parallel routes.
- [x] Run TypeScript verification.
- [x] Run the full test suite and production build.
- [x] Visually verify the embedded BPMN Pool/Lane layout.

## September 2026 follow-up

- [x] Repair Lane membership even when layoutRevision is present.
- [x] Persist repaired Lane member objectviews.
- [x] Detach stale members and prevent duplicate descendant drag processing.
- [x] Require containment before adopting overlapping objects.
- [x] Avoid broad relationship purges during movement.
- [x] Use explicit group ports and shared member-scale defaults.
- [x] Compact workspace Save and Refresh controls.
- [x] Run 57 tests and standalone TypeScript verification.
- [x] Verify production build for this release.
- [ ] Visually verify Lane/group dragging, ports, scale and workspace toolbar for this release.
