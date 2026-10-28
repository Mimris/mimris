# Tasks

- [x] Normalize automatic ordinary-link drawing-edge ports during Reload materialization; test temporary edge removal and preserved explicit/manual ports, visually reproduce top-entry versus corrected left-entry attachment, and run 122 tests and TypeScript checks.

- [x] Extend the saved-route computation guard to ordinary manual links; verify native JSON reload, repeated endpoint binding invalidations and drag-preview precedence, visually compare the saved and reloaded route, and run all 121 tests and TypeScript checks.

- [x] Capture routes for multi-node drags with and without the connecting link selected. Verify repeated translation and delayed persistence using keyed GoJS links, visually check the selected-node/link case, and run all 119 tests and TypeScript checks.

- [x] Capture internal routes for generic container drags, translate all bends with both endpoints, and retain final geometry in delayed saves. Test repeated container moves and visually verify unchanged internal layout; run all 117 tests and TypeScript checks.

- [x] Project saved orthogonal endpoint runs along their segment axes; assert source/target attachment edges and center coordinates during repeated drag/drop moves, visually verify the arrow enters View's left edge, and rerun 116 tests and TypeScript checks.

- [x] Fix saved orthogonal paths with multiple collinear endpoint stubs in both drag preview and drop reanchoring; test repeated moves of both endpoints with real six-point routes, visually verify saved bends after crossing the nodes, and run all 116 tests and TypeScript checks.

- [x] Preserve live routing during same-container node moves and delayed automatic route refreshes; test repeated moves of either endpoint against stale Normal relationship views, visually verify orthogonal routes, and run all 115 tests and TypeScript checks.

- [x] Preserve manual-path intent in relationship-view serialization and both import paths.
- [x] Materialize the intent marker in GoJS link data.
- [x] Extend production importer/model-builder regression coverage for saved manual paths, legacy paths and explicit automatic-routing markers.
- [x] Verify in the browser: reshape, Reload, drag a connected node through the application's GoJS dragging tool, inspect bends/attachment, and Reload again.
- [x] Run the full test suite and TypeScript checks.
- [x] Correct stale endpoint reference points in drag-time and drop-time reanchoring; limit adjacent bend alignment to orthogonal multi-segment links.
- [x] Add real GoJS endpoint regression coverage and verify a downward Task drag stays attached after mouse-up in the browser.
