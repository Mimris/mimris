# Tasks

- [x] Define compatibility policy and the initial appearance field scope.
- [x] Add shared resolution and sparse override persistence for new views.
- [x] Preserve legacy effective appearance during import/export.
- [x] Connect instance editors and existing reset actions.
- [x] Verify geometry, override intent and persistence with regression tests, including the production importer/model builder and Redux override-map replacement.
- [x] Check inherited/overridden object and relationship rendering in the browser; verify relationship inspector Done/Reload and object Reset to Typeview/Reload.
- [x] Document the saved formats and compatibility behavior in `docs/view-appearance.md`.
- [x] Expose Reset to Typeview consistently in instance context menus, including relationship and abbreviated object menus; verify visibility and relationship reset after Reload in the browser.
- [x] Fix object-view inspector live updates to use the rendered GoJS Part; test color binding and template replacement without Reload, and verify appearance changes and Done/Reload in the browser.
- [x] Fix appearance-only React prop synchronization so repeated color edits and Reset to Typeview remain visible; verify genuine context-menu edits, Done, immediate reset and Reload in the browser, and add a render-state regression test.
- [x] Restrict relationship-view close updates to explicitly touched fields; cover text-size edits with conflicting untouched routing/curve values, verify the close handler on a rendered loop, and run 91 tests and TypeScript checks.
- [x] Synchronize edited relationship fields to the runtime link mirror; verify two successive queued move updates and rendered text scales remain unchanged.
- [x] Protect queued geometry saves and React state rebuilds from stale relationship appearance; test two successive saves against a deliberately stale runtime snapshot, verify rendered label scale, and run 92 tests and TypeScript checks.
- [x] Resolve diagram events against the current Metis and remove the redundant self-loop full-universe save; cover stale event state and retained targeted path saves, and run 93 tests and TypeScript checks.
