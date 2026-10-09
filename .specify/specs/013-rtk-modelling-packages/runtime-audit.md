# Runtime boundary audit — initial findings

Date: 2026-10-09. Scope: active standalone editor hydration and modal reducer families. This is a partial P2 audit, not the P2 gate.

## Confirmed aliases and changes

- `Modelling.tsx` owns a stable `cxMetis` instance in a React ref. Its previous `importData(metis, true)` passed the Redux-selected Metis tree directly to the legacy importer.
- `Palette.tsx` and `GenGojsModel.ts` also import selected Metis data into the session runtime. All three entry points now use `editorRuntime/hydrate.ts`, which clones the serializable input before import. Import frequency, focus selection and generation-content gating are unchanged.
- `metamodeller.ts:importObjectTypeView` assigns defaults into its input record; `importRelshipView` normalizes `markedAsDeleted` in its input and assigns the input `points` array directly to the runtime view. These behaviors make detachment necessary. The importer still mutates its detached session data.
- The frozen-startup fixture exercises the real importer twice and confirms input preservation and independent session model objects. This proves the top-level hydration boundary, not every later direct `importObjectView`/`importRelshipView` call.

## Legacy runtime state

`store.tsx` still lists 11 legacy runtime action types, with reducer handlers storing `phMymetis`, `phMyGoModel`, `phMyGoMetamodel` and `phGojs`. Static source searches found their action creators but no active editor dispatch callers. `Table.tsx` still reads these legacy fields; backup/temp sources also contain references. Their deletion requires route/consumer review and an explicit ledger. No runtime handler is deleted on the basis of this initial search.

`modelSuite/Model.tsx` keeps GoJS projections in component state, and the active Modelling runtime is ref-owned. GoJS node/link objects still contain mutable AKMM instances, so they must remain outside serializable model state.

## Reducer characterization

`modalReducerParity.test.mjs` loads the actual legacy reducer, canonical universe reducer and root reducer. Four fixtures cover object-view, relationship-view, relationship-type and relationship-type-view property edits against frozen input/actions. They preserve unknown properties, geometry, references, unrelated host fields and untouched modelview identity; root output shares the canonical Metis tree.

One intentional divergence is recorded: the legacy relationship-type-view handler passes the array itself as the end argument to `slice`, dropping trailing entries. The canonical implementation preserves those entries. This defect is already avoided by canonical ownership; no new persistence migration is needed. The fixture requires preservation instead of copying the defect.

## Remaining work

- Audit all direct importer calls outside top-level hydration and all serializer payloads for nested runtime aliases.
- Trace GoJS transaction callbacks, projection suppression and lifecycle cleanup. `Diagram.tsx` registers `addModelChangedListener`, and `GoJSApp.handleModelChange` processes diagram changes; exactly-once behavior across drag/resize/link/undo/redo is not yet established.
- Undo-manager configuration is commented in Diagram initialization, while mutation code toggles `skipsUndoManager`. Do not infer supported undo semantics from those comments; inspect the initialized runtime and UI before changing history ownership.
- Remove runtime Redux handlers only after live route/consumer evidence, then enable middleware checks for validated paths.

## Verification

91 automated tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warning remains. Production browser verification confirmed model switching, Information-object palette drop, inline rename and empty error logs. Save/reopen, relationship editing, drag/resize, undo/redo and long-session performance remain pending. Temporary server and verification tab were closed.

## Transaction queue and callback increment

- Installed `gojs-react/lib/esm/gojsreact.js` confirms ReactDiagram converts completed model transactions with `toIncrementalData`, calls onModelChange, and removes its listener on unmount. Removed Diagram's additional direct registration of the same callback (which supplied raw ChangedEvent instead of IncrementalData), and its mismatched removeChangedListener call. ReactDiagram remains the callback owner.
- Object/relationship-view queues now clone each action payload before dispatch. In particular, runtime link points and relshipview points no longer alias arrays retained by dispatched actions. Runtime projection updates still use session-owned queue values.
- GoJSApp teardown cancels its two view-dispatch timers, clears queue references and rejects subsequent enqueue attempts. Other deferred diagram callbacks remain to be audited; this is not full lifecycle isolation.
- Production queue-function tests verify coalescing, detached frozen action arrays, and independent teardown. 93 tests, typecheck, production build and diff check pass.
- Browser object drop and movement passed with empty error logs. Rename after movement updated the object list but left the diagram label unchanged in the captured state. This is unresolved; baseline attribution and label reconciliation need investigation. Do not count that rename as a passing acceptance check. Screenshot: /tmp/mimris-rtk-transaction-verification.jpg.
- Confirmed additional P2 gap: GoJSApp's module-level globalPreserveNodeStateByKey and globalLockMovedNodeLocByKey maps are shared across editor instances. Move these to session ownership before claiming independent runtime isolation.

## Diagram-owned locks and post-drag label repair

- Replaced module-global drag maps with `editorRuntime/dragProtection.ts`: WeakMap ownership per diagram, stable maps through React rerenders, and explicit clearing during GoJSApp teardown. All map write paths share this ownership, including SelectionMoved. Identical IDs in separate diagrams cannot share locks.
- Live label/appearance reconciliation now compares incoming values with live model data, rather than assuming the React projection matches it. Geometry is excluded from that reconciliation; stale blank names still preserve the existing default.
- TextEdited uses view identity aliases, includes the currently edited view even when reverse indexes are incomplete, and persists each deduplicated view independently of finding a mutable GoJS node. Completed name edits dispatch the view synchronously instead of relying on a deferred view queue. Live node data is updated through GoJS model APIs.
- The decisive browser fix synchronizes React's cached node labels for ordinary object name edits as well as swimlanes. Otherwise ReactDiagram could restore the old cached label after the object list updated. The projection update preserves dragged loc/size and unrelated node identity.
- Queue flushes also apply name/text to runtime node/view projections and live model data, avoiding stale labels when queued view updates contain them.
- Regression tests use a real GoJS model and bound TextBlock, production queue functions and the production React projection method. Coverage includes frozen action separation, geometry retention, incomplete reverse indexes and independent drag-map teardown.
- Final development-browser check confirmed drag followed by rename updates both object list and diagram label at the dragged position, with empty browser error logs. Screenshot: /tmp/mimris-rtk-label-verification.jpg. Earlier failed label checks are superseded by this passing check. No file save/reopen or undo/redo acceptance is claimed.
- Temporary trace statements were removed. The development server/tab were closed before the final production build. Broader timer/runtime-payload audit and P1/P2 gates remain open.

## Deferred lifecycle and file acceptance increment

- Added `editorRuntime/deferredCallbacks.ts` to own GoJSApp's delayed relayout, rerouting, post-modal reconciliation and group visibility work. Disposal cancels pending callbacks and guards callbacks already queued in the event loop. The two view dispatch queues retain their existing separately tested disposal. A source AST check found no non-arrow callback scope capturing the new scheduler incorrectly; the SubGraph affectedParts iterator now uses an arrow to preserve its editor receiver.
- These changes cover GoJSApp deferred work; Diagram template hover/UI timers and other editor helpers remain outside this scheduler and still need classification. P2 lifecycle isolation is not globally complete.
- Production browser export passed: created and renamed an Information object, used File → Save Project, and inspected the downloaded JSON. It contains 5 models, 5 metamodels, and the named object view with preserved object reference, loc and size. Test artifact: /Users/snorrefossland/Downloads/IRTV-Template_PR (1).json.
- After resetting to a fresh editor, interactive reopen was blocked by CDP DOM.setFileInputFiles timeout. Subsequent browser state/close calls also timed out; the temporary picker/tab could not be confirmed closed. This is an automation limitation, not evidence that file import succeeds or fails. The local server was stopped.
- Added a production exporter/file-reader/canonical-reducer round-trip test. It validates labels, IDs, references, geometry, focus, metamodel presence and unknown model/view properties using a synthetic standalone project fixture. This automated result does not substitute for interactive reopen.
- Undo baseline: installed GoJS default Diagram.undoManager.isEnabled is false; Diagram initialization's enablement is commented out. Context menu undo/redo commands exist, but enabled history and canonical writeback have not been established. No history feature was enabled during this migration increment.
- 100 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warning remains. Broader action payload audit, host file/storage separation and acceptance gates remain open.

## Host-owned GoJS draft persistence and immediate flush

- Removed GoJSApp's direct memorystate session/local storage helper and URL-query policy. `editorHost/objectViewDraft.ts` uses only the owning host's optional persistence capability. It patches an existing detached draft by objectview ID and optional modelview identity, removes routing metadata from persisted view fields, and clones nested patch values. Missing hosts, capabilities or drafts do not choose a browser backend.
- Standalone `editorPersistence.ts` now owns the workspaceAuthority=redux exclusion for reads, writes and deferred saves. This preserves the GoJS authority rule at the backend boundary and applies it consistently to modal persistence as well.
- Audited immediate transaction flush and found it bypassed payload cloning. Both object-view and relationship-view flushes now dispatch detached data, reject disposed editor instances and cancel their deferred duplicates. The production flush regression uses frozen actions and confirms no shared points arrays.
- Tests cover duplicate view IDs in different modelviews, two independent host drafts, preserved unknown fields, nested patch detachment, absent capabilities and Workspace authority. 104 tests, non-incremental typecheck, production build and diff check pass. Existing duplicate GoJS-global warning remains.
- Source search confirms no live sessionStorage/localStorage/file helper accesses in ui_modal, GoJSApp or Diagram. Remaining file/browser policy lives in standalone LoadFile, SaveModelToFile, ReadModelFromFile and Modelling composition; these still need a reusable host command boundary before package extraction. ui_common and other transitive dependencies need continued review.
- No fresh browser acceptance is claimed for this increment. Interactive reopen remains blocked/unverified as recorded above. P1/P2 gates remain open.

## Standalone file composition boundary

- Model and modelling routes now compose StandaloneModelling, which supplies StandaloneFileControls. Modelling's optional renderFileControls slot has no application fallback.
- LoadFile retains its standalone Redux/form UI but delegates model/metamodel reads and JSON exports to standalone/fileCommands.ts. The adapter passes the owning host to existing asynchronous readers and preserves the five export writers. Import command resolution starts the reader; imported state still applies from its completion callback.
- Existing OSDU conversion and legacy file normalization algorithms are unchanged. Browser FileReader, download policy and file naming remain in standalone adapters/utilities; they are not yet physically extracted into packages.
- 106 tests/typecheck/build/diff check passed; production browser File controls/dialog and empty error logs verified. Native picker reopen remains unverified. Remaining coupling includes Modelling's persistence/router/server/recovery composition, other transitive application imports and runtime acceptance gaps.

## Runtime Redux-write audit (2026-10-09)

No active repository caller imports/invokes the 11 old runtime action creators. Table.tsx reads were unused, and the historical Diagram backup is not an active source module. Removed creators/constants/handlers; raw strings are ignored at the root to prevent cyclic runtime payloads re-entering Redux. Per-editor Metis/GoJS ownership remains unchanged. Production root tests cover all retired strings, empty initialization and cyclic payload isolation. This does not prove all graph/focus/import data is serializable; full middleware checks and outstanding browser acceptance remain pending.

## Canonical-only consumer boundary (2026-10-09)

Active Redux readers use shared/compatibility selectors; scoped runtime hosts supply compatibility projections. Selectors and legacy-root hydration now treat a present canonical universe as authoritative, including nulls, and support roots with no stored aliases. Canonical document rehydration and projection identity are covered. Physical standalone mirror removal remains pending, including explicit handling of unknown phData metadata at saved-file boundaries.

## Stored mirrors removed (2026-10-09)

Standalone Redux now stores a canonical universe and host metadata only. Legacy roots are normalized once and known durable/runtime aliases are discarded; editor/file boundaries use selector projections. Unknown phData fields are retained as canonical compatibility metadata and restored on projection. Real-root tests assert absence of aliases rather than masking stored mirrors through a test facade. Canonical-only browser rendering/drop/rename/model switching passed. Full serialization/immutability, independent-host and undo/reopen gates remain open.

## Middleware checks enabled (2026-10-09)

Default Toolkit mutation/serialization middleware is enabled for development; retired runtime-action strings are discarded before diagnostic traversal. Active paths are not ignored. Actual-store tests detect state mutation and accept representative durable edits without serialization errors. Browser drop/rename passed without serialization/mutation failures. Development mutation checks took 52–354 ms across several drop dispatches, so performance remains an explicit open gate; no suppressions were added.
