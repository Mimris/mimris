# Tasks

- [x] Inspect live node ports and exercise existing self-link validation.
- [x] Add a linking tool that prefers distinct eligible side ports for self-links.
- [x] Cover body-port self-links, explicit side-port self-links and unchanged ordinary links using real GoJS regression tests.
- [x] Verify drawing, relationship-type confirmation and persisted anchors after Reload in the browser.
- [x] Run all 81 tests, TypeScript checks and diff whitespace checks.
- [x] Add self-link corner reshaping that permits movement in both axes while preserving orthogonal route shape.
- [x] Test successive breakpoint movements with real GoJS points; verify an actual reshape-tool drag and Reload in the browser.
- [x] Run all 82 tests and TypeScript checks.

- [x] Verify `sequenceLinkTemplate` lower-right corner dragging adjusts adjacent bends, keeps Orthogonal routing and survives Reload.
- [x] Preserve the complete translated loop through drag/drop callbacks and queued saves; clear the remembered translation on a new reshape.
- [x] Verify editing a sequence-link corner, two successive node moves and Reload preserve every loop point relative to the node.
- [x] Add translation and queued-save regression tests; run all 84 tests and TypeScript checks.
- [x] Capture fresh self-loops before dragging and disable automatic endpoint adjustment for preserved loops, including GoJS List points.
- [x] Verify fresh and edited bottom-to-right loops retain every point and both attachment sides across successive node moves and Reload.
- [x] Add regression coverage for fresh-loop capture and List-backed points; run all 86 tests and TypeScript checks.
- [x] Protect the synchronous mouse-up queue flush and React link reconciliation from stale loop points; clear remembered translations before processing a new reshape.
- [x] Add regression tests for both stale drop-update paths; verify repeated drops and Reload, and run all 88 tests and TypeScript checks.
- [x] Protect sequence self-loops from GoJS route recomputation, including reconstructed links with persisted Array/List points.
- [x] Verify native browser mouse drag/release retains the rectangle, then reshape again and Reload; add route-invalidation coverage and run all 89 tests and TypeScript checks.
- [x] Share the route-computation guard across all editable relationship templates; test wiring and fallback from empty live points.
- [x] Compare default and sequence templates using native browser drag/release and route invalidation; verify visually and run all 90 tests and TypeScript checks.
