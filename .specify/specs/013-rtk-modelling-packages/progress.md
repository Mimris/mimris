# Implementation progress

Branch: `codex/rtk-implementation`. Baseline: `d2bfac08`. Updated: 2026-10-08.

## P0 evidence

- Baseline non-incremental TypeScript check passed with no diagnostics.
- Baseline production build passed; existing duplicate GoJS-global warnings occurred during page collection.
- CI uses pnpm 10.15.0 and frozen pnpm-lock.yaml installation, consistent with package.json. Keep pnpm for dependency installation; npm test/build invoke existing scripts without changing the lockfile. Agent install guidance still needs reconciliation in a later documentation change.
- [Action inventory](./action-inventory.md) identifies 84 distinct legacy reducer action types and literal consumer locations. Caller tracing through action creators, behavioral fixtures, persistence effects and retirement gates remain pending; P0 is incomplete.

## First P1 increment

- Added `src/editorHost/access.ts`: a typed host-access boundary bound to each runtime Metis/editor instance through a WeakMap. Cleanup only removes its own binding, allowing remount/rebinding without stale cleanup detaching a newer host.
- Standalone Modelling binds host access in a layout effect and cleans it up on unmount. State reads derive fresh canonical-first compatibility props from the current Redux store.
- Modal and group helpers use their editor's binding instead of importing the standalone store singleton. Unbound editors have no global fallback.
- Shared-universe selectors no longer import standalone RootState. Hosts can supply projected data from a different root shape.
- Added isolation tests for two host/editor pairs, fresh state reads, dispatch routing, cleanup and remounts. Updated the modal test harness to account for the injected access module.

## Verification

- `npm test`: 79 passed, 0 failed, 0 skipped, including the two new host-access tests.
- `tsc --noEmit --incremental false`: passed before and after the increment.
- Browser at localhost:3101/model: standalone editor and palettes rendered; dragged an Information object into the diagram; inline label edit succeeded; Edit Object modal changed the object name in the Objects list. View label remained independently editable. Browser error log was empty after these operations.
- No file round-trip, two-editor browser scenario, swimlane/group resize, relationship-view appearance, undo/redo or performance validation is claimed by this smoke check.
- A production build overlapped with the dev server and failed because both wrote .next. That attempt is not a code-regression result. Stop the dev server before the final build verification.
- Final `npm run build` with the dev server stopped passed. The existing duplicate GoJS-global warning remains. The temporary verification tab and server were closed/stopped.

## Second P1 increment

- Migrated all three GoJSApp store reads to the editor-instance host binding (group grab permission, moved group persistence and view update coalescing).
- File import functions accept optional host access. Standalone Modelling and LoadFile supply their React provider store; legacy callers can still use their supplied props or an editor-instance binding.
- File read completion resolves current host state rather than borrowing the last-created application store or retaining a pre-read source projection.
- Removed currentStore/getCurrentStore from store.tsx after verifying no source callers remain. Each makeStore invocation now has no global registration side effect.
- Added delayed metamodel import tests for two independent hosts, current-state preservation, dispatch isolation and the props-only fallback.
- Automated suite: 81 tests passed. Typecheck passed. Production build passed before the final file-read timing adjustment; final verification is recorded below when complete.
- React review: new useStore calls are unconditional in the file-dialog component; host binding includes effect cleanup and dependencies; no second React provider or host store is created by the editor.
- Final verification after the file-read timing adjustment: 81 tests passed, non-incremental TypeScript check passed, production build passed and git diff --check passed. No source references to getCurrentStore/currentStore remain.
- Production browser smoke check: editor, model tabs and palettes rendered with an empty browser error log. Browser automation mouse-input commands timed out when opening File; fresh interactive file-dialog and group-move checks remain pending. This is an automation limitation, not evidence that those UI operations pass or fail. The temporary tab/server were closed/stopped.

## Third P1 increment

- Added optional EditorDraftPersistence host commands: readDraft, saveDraft and saveCurrentDraftAfter. The editor does not choose storage when these capabilities are absent.
- Moved modal-helper browser persistence into src/standalone/editorPersistence.ts and wired the standalone host binding to it. Session/local storage policy still uses the existing memorystate utility.
- Deferred writes read current host state when they execute; pending writes are cancelled on host teardown. Stale callbacks cannot persist after disposal.
- ui_modal no longer imports the browser memory-storage utility or reads session/local storage directly. Its compatibility patching and Redux dispatch remain for later migration.
- Added tests for host-owned draft reading, fresh deferred snapshots, independent timer ownership and disposal. Relationship Typeview Done regression coverage now uses injected persistence.
- Remaining work: extracting file/save UI commands, removing direct props mutation/multiple dispatch paths, and tracing mutable runtime aliases before RTK reducer conversion.
- Verification for this increment: all 83 tests passed, non-incremental typecheck passed, production build passed and git diff --check passed. Existing duplicate GoJS-global build warnings remain. Fresh interactive storage/file-save browser verification is still pending; no new browser success is claimed.

## Remaining coupling

| Surface | Remaining responsibility |
| --- | --- |
| `src/store.tsx` | Legacy mirror/fallback and disabled middleware checks remain; the global store singleton is removed |
| `src/components/gojs/GoJSApp.tsx` | Reads are scoped; broader mutable runtime aliases and callback lifecycle still need tracing |
| `src/components/utils/ReadModelFromFile.ts` | Reads use host access; browser FileReader, storage cleanup and format normalization still need separation into host commands/core adapters |
| `src/akmm/ui_modal.ts` | Draft persistence and modal update routing are host-owned; other editor/runtime dependencies and separate compatibility snapshot actions remain |
| `src/akmm/ui_common.ts` | Other application imports, including page/context dependencies, need separation |
| `src/components/Modelling.tsx` | Router, loaders, file UI and storage remain mixed with the editor; next P1 increment extracts host commands |

No legacy reducer, dependency or file compatibility adapter has been deleted. The obsolete store singleton has been removed. P1 gate and P2–P6 remain open. Complete the operation/host capability boundary and runtime alias tracing before general Immer conversion.

## Fourth P1 increment

- Added resolveEditorDispatch: a bound editor host is authoritative; unbound legacy callers select the first available method with its receiver preserved. Dispatch failures do not retry a different store.
- Routed dropdown/modal update actions and compatibility universe snapshot updates through this single route. Existing property actions and snapshot actions remain separate operations pending reducer parity work.
- Compatibility snapshots read current host phData before falling back to props; direct props patching and persisted format compatibility remain unchanged for this increment.
- Added regression coverage for exactly-once routing, receiver binding and dispatch failure isolation. Existing Typeview Done test now explicitly asserts one property action.
- All 85 tests, non-incremental typecheck, production build and git diff --check passed. Existing duplicate GoJS-global warning remains. Interactive modal/save verification remains pending; no browser success is claimed.

## Fifth P1 increment

- Removed direct patches of props.phData for object views, relationship views, relationship types and relationship type views in modal dispatchUpdate. Runtime diagram objects remain mutable pending the P2 alias audit.
- Persisted fallback snapshots now clone the scoped host projection; relationship-view saves also clone current host metadata rather than retaining React props references.
- Strengthened the Typeview Done regression with frozen input props, the real scoped host binding and the production universe reducer. It proves one property action updates canonical state and the saved draft while preserving original props and link endpoints.
- All 85 tests, non-incremental typecheck, production build and git diff --check passed. Existing duplicate GoJS-global warning remains. Browser modal/save verification remains pending. General reducer parity and the P1 gate remain open.

## Sixth increment — reducer characterization and first P2 boundary

- Added real-reducer parity fixtures for the four modal property families and recorded the legacy trailing-typeview deletion bug. Canonical updates preserve those entries.
- Added session-owned snapshot hydration and applied it to Modelling, Palette and GenGojsModel; removed the unused setMymetisModel import. The real importer passes against frozen startup input in independent sessions.
- Initial runtime/action/lifecycle findings and remaining gates are recorded in [runtime-audit.md](./runtime-audit.md). P1/P2 remain incomplete; no general RTK conversion or runtime-handler deletion is claimed.
- Verification: 91 tests, non-incremental typecheck, production build and diff check passed. Browser model switching, palette drop and inline rename passed with empty browser error logs. Full save/reopen and undo/redo remain pending. Screenshot: /tmp/mimris-rtk-runtime-verification.jpg. Temporary verification server/tab were closed.
- React review: shared helper imports are direct, stable and hook-free; existing hydration gating/effect scheduling are preserved. Snapshot cloning happens at import time, not on each diagram movement.

## Seventh increment — transaction callback ownership and queued action isolation

- Removed the duplicate raw model-change callback registration; the installed ReactDiagram adapter owns conversion, completed-transaction delivery and listener teardown.
- Detached view action payloads from runtime queue data and added instance-specific queue cancellation on GoJSApp teardown.
- 93 tests, non-incremental typecheck, production build and diff check passed. Browser object drop/drag passed with no errors. Post-drag rename showed an unresolved list/diagram label mismatch; full rename acceptance is not claimed. Temporary browser tab/server were closed.
- Next P2 work: isolate module-global drag-protection maps, investigate label reconciliation, and audit remaining delayed callbacks and dispatch aliases. P1/P2 gates remain open.

## Eighth increment — editor-scoped drag protection and label reconciliation

- Moved drag-protection maps into per-diagram WeakMap state with explicit teardown, removing module-global shared locks.
- Fixed ordinary object rename projection: reconcile live data, persist the edited view independently of reverse-index completeness, and synchronize React node labels without changing dragged geometry. Queue flushes carry name/text as well as style/geometry.
- 97 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains. Final development-browser drag/rename check passed: diagram/list labels agree, dragged position is retained and browser error logs are empty. Temporary diagnostics were removed and development server/tab were closed.
- Remaining: audit other delayed callbacks/runtime dispatch payloads, verify file save/reopen and undo/redo, complete P1/P2 acceptance gates, then convert the characterized reducer families to RTK.

## Ninth increment — deferred editor work and export/reopen evidence

- Made GoJSApp deferred runtime callbacks instance-owned and cancellable, including event-loop callbacks delivered after teardown. Tests cover independent editor ownership and stale callback guards.
- Browser project export passed and the downloaded JSON was inspected. Interactive reopen is unverified: file chooser automation timed out and the temporary tab/picker could not be confirmed closed. Server stopped. Full details are in runtime-audit.md.
- Added an automated round trip through the production exporter, file reader and canonical reducer. Labels, references, IDs, geometry, focus, metamodels and unknown model/view properties survive.
- 100 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains.
- Preserved current disabled undo-history baseline. Enabling it requires separate canonical-writeback verification. Remaining host file/storage boundaries and other timer/action payload paths still prevent claiming P1/P2 completion.

## Tenth increment — GoJS draft persistence boundary

- Routed object-view draft patches through the owning editor host and removed direct browser storage/URL policy from GoJSApp. Standalone persistence now owns Workspace-authority suppression.
- Fixed immediate transaction flush payload aliases and guarded disposed instances. Tests prove immediate/deferred flushes cannot duplicate writes and dispatched nested arrays are detached.
- 104 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warning remains. No new browser success is claimed; interactive reopen remains unverified.
- Remaining standalone file composition and transitive editor dependencies are listed in runtime-audit.md. Finish these boundaries and the remaining runtime acceptance before claiming P1/P2 or starting general RTK reducer conversion.

## Eleventh increment — standalone file composition

- Extracted OSDU/File toolbar controls into StandaloneFileControls and added StandaloneModelling. Both model/modelling routes explicitly compose this wrapper; bare Modelling renders only supplied renderFileControls, with no standalone fallback.
- Removed direct file reader/writer/control imports and obsolete commented file-control implementation from Modelling. Other application/storage dependencies remain to be separated.
- Added a typed standalone file command adapter. LoadFile uses a stable memoized adapter for current host reads/import dispatch and existing export writers. Other standalone File dialog callers keep their behavior and formats.
- Tests prove host-specific imports, preserved method receivers, asynchronous-reader host access, and original export writer/filename argument selection.
- 106 tests, non-incremental typecheck, production build and diff check passed. Browser standalone render/File dialog controls passed with an empty error log; screenshot /tmp/mimris-file-controls-verification.jpg. Temporary verification tab closed; server session was no longer available during cleanup. Interactive file reopen remains unverified as previously recorded.
- React review: render function is module-stable, command memo dependencies are store/dispatch, hooks remain unconditional, and file controls retain existing DOM/SSR behavior. P1/P2 gates remain open; no general reducer conversion claimed.

## Twelfth increment — standalone storage policy and first RTK leaf

- Moved remembered focus, user settings, sparse-startup draft protection and Workspace metadata trimming into StandaloneModelling/modellingPersistence. Bare Modelling receives persistence/focus capabilities through props and no longer imports standalone storage/hooks or accesses browser storage.
- Removed unused router/server/login/recovery/GitHub control imports and inactive element declarations from Modelling. No route/API or compatibility format was deleted.
- Converted showDeleted/showModified diagram preferences to a typed RTK createReducer leaf. Canonical typed actions and existing raw action names are supported; only the preference leaf enters Immer. Removed both legacy reducer cases and added root ownership/no-op handling so these actions cannot fall back to legacy reduction.
- The two Modeller preference dispatch sites are in commented-out controls, not currently mounted buttons. Their references use typed actions; browser checks do not exercise these preference controls. Legacy action creators/type constants remain compatibility exports pending the broader cleanup ledger.
- Tests verify preference compatibility, user metadata, serialized false values, untouched model identity/unfrozen model graph and root identity for typed/legacy no-ops. This is a bounded leaf migration, not completion of general P3 model migration.
- 111 tests, non-incremental typecheck, production build and diff check passed. Browser model switching and remembered focus after reload passed with empty error logs. Screenshot /tmp/mimris-host-focus-verification.jpg. Verification tab/server closed.
- P1/P2 gates remain open for transitive application imports, remaining runtime/action paths and interactive reopen. Continue per-family migration only after checking each affected leaf's aliases/acceptance.

## Thirteenth increment — canonical focus ownership and typed Toolkit actions

- Added `setUniverseFocusField` with a closed union of the 20 existing focus fields. Raw `SET_FOCUS_*` field actions remain compatible through the same canonical handler. Whole-focus and focus-user actions are unchanged.
- Removed the 20 duplicate legacy focus-field cases and unused imports/allowlist entries. Root ownership includes canonical no-op focus actions so they cannot fall back into legacy reduction.
- Standalone remembered model/view restoration now uses the typed action. Serialized focus shape, null clearing, unknown metadata and existing snapshot normalization are preserved.
- Added 20 integration tests covering typed/raw parity, independent roots, root mirroring, null clearing, input immutability, model-graph identity and no-op identity. Focus still uses the existing immutable canonical reducer: arbitrary focus records can contain model graphs, so this increment does not put them through Immer or claim full P3 completion.
- Verification: 131 tests and non-incremental TypeScript check passed. Production build result recorded below. No diagram behavior change or new browser verification is claimed.
- Final production build passed with the existing duplicate GoJS-global warning; `git diff --check` passed. Changes remain uncommitted.

## Fourteenth increment — session action ownership and focus clearing

- Added typed Toolkit actions for focus-user and visible-context updates; whole-focus replacement uses its existing typed action. All three raw compatibility names share canonical handlers, including no-op identity handling.
- Removed the three corresponding legacy reducer cases and their imports/allowlist entries. The legacy dispatch adapter translates focus-field, focus-user and visible-context operations to typed actions; unknown actions retain their original identity.
- Fixed canonical-to-legacy focus projection: null whole-focus replacement now clears `phFocus` rather than leaving a stale selection. Later canonical updates retain the cleared focus.
- Added immutable typed/raw integration coverage and adapter routing coverage. 136 tests passed; no new browser or diagram-behavior validation is claimed. Focus remains outside Immer while graph-bearing focus payloads are still supported. General P1/P2 and broader P3 gates remain open.
- Final non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning persists. Changes remain uncommitted.

## Fifteenth increment — typed model/view ordering and legacy retirement

- Added typed Toolkit model and model-view reorder actions. Updated all three active drag-and-drop callers (Modelling, Modeller and modelSuite/Model) and the legacy dispatch adapter; raw names remain supported by the canonical reducer.
- Removed both duplicate legacy reorder cases and imports. Root ownership now covers reorder no-ops, preventing fallback into legacy reduction for missing IDs or identical source/target selections.
- Added integration coverage for typed/raw parity, forward/reverse moves, record identity, focus preservation, unchanged geometry and frozen input, plus adapter payload identity. 139 tests and non-incremental TypeScript check passed.
- React checklist: imports are direct; transient drag IDs remain in existing refs; existing guards and ref clearing are preserved; no effects, rendering, accessibility markup or new subscriptions were added. Existing ts-nocheck headers remain in place. No new browser/visual check is claimed; this increment changes action routing, not diagram behavior.
- Ordering still uses the characterized immutable canonical reducer, not Immer over model graphs. Full RTK conversion, runtime serialization and P1/P2 gates remain incomplete.
- Final production build and diff check passed. Existing duplicate GoJS-global warning remains. Changes remain uncommitted.

## Sixteenth increment — typed model/model-view property updates

- Added typed Toolkit model and model-view property actions; raw model, target-model and model-view update names share their canonical handlers. The existing host dispatch adapter now translates these aliases.
- Before deletion, all three operations passed characterization against the actual old reducer for matching-ID edits. Removed those three old cases/imports after characterization; retained saved-shape regression fixtures and typed/raw root parity coverage.
- Tests cover metadata preservation, focus updates, explicit non-focused model edits, unchanged view geometry/collections, view creation without stale collection import, mutable graph isolation and empty-model no-op ownership. Existing canonical behavior remains: model edits resolve explicit IDs before focus, and view patches cannot replace their collections. Target-model aliases retain the existing canonical focus synchronization.
- 146 tests, non-incremental TypeScript and diff checks passed. No new diagram behavior or browser verification is claimed. These graph updates still use the immutable canonical reducer while runtime serialization gates remain open; typed actions alone do not complete P3.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Seventeenth increment — typed relationship properties and object-name audit

- Added a typed Toolkit relationship property action and host-adapter translation. Raw `UPDATE_RELSHIP_PROPERTIES` shares its canonical handler, including empty-model no-op ownership.
- Characterized existing and appended relationship edits against the actual old reducer before removing its case/import. Retained saved-shape regression fixtures, raw/typed parity, endpoint/metadata preservation, untouched-view identity, mutable graph isolation and adapter payload identity coverage.
- Object property retirement is deferred: the old object handler propagates changed names into views whose names are blank or inherited, whereas `updateCurrentModelCollection` only changes the object record. This difference requires a deliberate canonical fix and visual rename verification before deletion. Existing canonical object behavior is unchanged in this increment.
- No diagram behavior or new browser verification is claimed. Graph updates remain immutable canonical functions pending runtime serialization gates; typed action routing does not complete P3.
- Verification: 150 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning persists. Changes remain uncommitted.

## Eighteenth increment — canonical object-name propagation and legacy retirement

- Fixed canonical object property updates to propagate non-empty changed names to matching objectviews across the focused model when labels are blank/null/undefined or equal to the previous object name. Explicit custom labels remain unchanged. Unaffected view records/collections retain identity; geometry and unknown properties are preserved.
- Added typed Toolkit object property actions and legacy-adapter translation; raw aliases share the handler and empty-model no-ops remain canonical.
- Actual legacy-reducer characterization passed for renamed, empty-name and undefined-name patches before retiring its case/import. Retained saved-shape fixtures plus custom-label, multi-view, creation, description-only update, graph isolation and adapter coverage.
- Production-browser check at localhost:3101/model: dropped an isolated Information object, renamed through Edit Object to `RTK inherited name`, and confirmed the Objects list and diagram label agree. Browser errors were empty. Screenshot: /tmp/mimris-object-name-propagation.jpg. The Object View modal has no name field, so custom-label preservation is verified by reducer tests, not claimed as a browser result. Temporary tab and server were closed/stopped before the final build.
- Runtime graph reducers remain immutable functions; full RTK conversion and wider P1/P2 gates remain open. No undo/redo or interactive file round-trip validation is claimed.
- Final verification: 156 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning persists. No listener remains on port 3101. Changes remain uncommitted.

## Nineteenth increment — typed view-property actions and legacy retirement

- Added typed Toolkit object-view and relationship-view property actions; the host adapter translates raw property aliases and the object-view-name alias. Canonical empty-model no-ops are owned by the root.
- Removed both duplicate view-property cases after their existing actual-reducer characterization passed. Removed the obsolete view-name case, which referenced the historical nested `phData.model.metis.models[0].model` shape and did not implement the current canonical patch behavior. Legacy raw names remain supported.
- Removed the now-unused legacy optional-field pruning helper and constants. The canonical implementation continues to own geometry/appearance merging, view targeting and inheritance pruning.
- Added typed/raw geometry, reference, metadata and view-target routing tests, including startup-normalized saved IDs and removal of transient target metadata. Added appearance-inheritance and graph isolation coverage. No diagram behavior changes or new visual checks are claimed for this action-routing/duplicate-removal increment.
- Broader runtime serialization, general P1/P2 and full reducer conversion remain incomplete.
- Final verification: 163 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains. Changes remain uncommitted.

## Twentieth increment — typed metamodel property actions

- Added separate typed Toolkit actions for direct metamodel patches and focused-model target-metamodel patches; the host adapter translates their raw aliases. Existing canonical selection/append behavior is preserved.
- Characterized both matching-ID patch operations against the actual old reducer before removing their cases/imports. Retained saved-shape regression fixtures and typed/raw parity checks.
- Added coverage for unknown metadata and collection preservation, untouched metamodel/model identity, new metamodel append, target resolution without a patch ID, graph isolation and distinct adapter routes.
- 168 tests, non-incremental typecheck and diff check passed. No diagram behavior or new browser verification is claimed. Metamodel collection/type actions still await migration; broader runtime isolation and full P3 conversion remain open.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Twenty-first increment — typed metamodel collection operations

- Added a typed Toolkit metamodel-item action with closed collection names and explicit current/target scope. Consolidated all 20 existing raw aliases into a documented routing table and added host-adapter translation. Existing canonical routing is preserved, including target relationship-type-view -> current, datatype/methodtype -> target, and value aliases -> current objecttypes.
- Characterization matched the actual old reducer for 18 single-record operations. Historical method-type reduction threw while slicing an absent collection, and value reduction referenced undefined `indexvvpot`; these broken fallback handlers were not adopted as expected behavior. Existing canonical merge behavior remains.
- Retired all 20 old collection cases/imports and removed unused derived metamodel/view lookups and unused action imports from the legacy reducer. Saved-shape regression fixtures remain after retirement, including the previously documented relationship-type-view tail preservation correction.
- Added all-route typed/raw tests and merge/append regression coverage for unknown fields, untouched records/metamodels, collection tails, graph identity, missing-target root no-ops and adapter payload identity. Canonical routing tests use an independent explicit mapping.
- No diagram behavior change or new browser check is claimed. Historical alias semantics remain a separately reviewable concern; runtime serialization, mirrored state and full P3/package gates remain open.
- Final verification after cleanup: 209 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains. Changes remain uncommitted.

## Twenty-second increment — project/domain ownership and unknown-action identity

- Added typed Toolkit project property and current-metamodel actions; raw domain properties now route through the existing typed domain merge action. The host adapter translates all three aliases.
- Removed their old cases/imports after saved-shape characterization. Domain merge preserves unknown metadata rather than copying only three named fields; that canonical behavior predates this increment.
- Consolidated migrated-action root ownership into `isUniverseOwnedAction`. Unknown actions now preserve an existing canonical root when the legacy reducer returns unchanged state, avoiding needless projection rebuilds. Legacy-only roots still initialize their canonical projection; initialization coverage prevents suppressing that compatibility path.
- Added typed/raw saved-data checks, collection/domain metadata preservation, adapter routing and unknown-action identity/initialization coverage. 215 tests, non-incremental typecheck and diff check passed. No diagram behavior or new browser verification is claimed.
- Legacy reducer now contains load actions, failure handling and runtime compatibility actions; model/session property handlers are retired. Mutable runtime state, mirrored legacy roots, snapshot-loader duplication and full RTK/package gates remain open.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Twenty-third increment — partial loaders and compatibility clearing

- Added a distinct typed focus-load action that normalizes model/view selections against the current graph. The host adapter now translates `LOAD_TOSTORE_PHFOCUS` to this operation; direct focus replacement remains separate. Previously the adapter skipped the normalization implemented by raw canonical focus loads.
- Retired the four old partial-loader cases/imports (phData, focus, user, source). Raw user/source loads route through the existing typed actions; repeated identical user/source values retain root identity through centralized ownership.
- Fixed canonical compatibility projection for null user/source values: phUser/phSource now clear rather than retaining stale values. Null focus clearing remains covered.
- Added typed/raw focus normalization, immutable input/metadata, null clearing, no-op identity, adapter distinction and background-refresh vs explicit file-geometry replacement coverage. Existing full-snapshot/load-success/new-model actions remain pending; their semantics are not changed here.
- 220 tests, non-incremental typecheck and diff check passed. No new browser check is claimed. Runtime compatibility fields, mirrored durable state and full RTK/package gates remain incomplete.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Twenty-fourth increment — load-result ownership and durable legacy retirement

- Added a typed Toolkit load-result action with seven explicit kinds covering direct legacy snapshot, server data, GitHub snapshot, model result, model list, new model and model-with-new-view result. Existing canonical raw branches remain the operation implementations; typed dispatch delegates to them, preserving current normalization/merge semantics.
- Host adapters translate success/new-model routes. `LOAD_TOSTORE_DATA` adapter intentionally retains its existing background `setUniverseState` refresh behavior; direct raw/typed legacy snapshot application remains replacement. Geometry tests characterize both routes separately.
- Removed all seven old durable loader cases/imports, the now-unused normalizer import and unused focus locals from the legacy reducer. Remaining cases are failure and 11 runtime compatibility actions; no durable data/property cases remain there.
- Fixed null model-list projection so `phList` clears stale entries. Tests cover all seven raw/typed routes, model replace/append/domain-only results, source labels, unknown fields, model-view replacement, immutable inputs, adapter routing and snapshot geometry distinctions.
- 231 tests, non-incremental typecheck and diff check passed. No interactive file reopen or new browser check is claimed. Loader transport/auth remains host-owned. Mutable runtime compatibility state and mirrored durable roots still prevent full P3/P4 completion; graph reducers remain immutable functions rather than Immer over runtime-facing records.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Twenty-fifth increment — retire unused Redux runtime writes

- Repository caller audit found no active imports/calls of the 11 runtime Redux action creators. Table.tsx runtime-field reads were unused variables/debug-only output; its route render is also commented. Active Metis/GoJS methods remain on editor instances and are unrelated to the retired Redux creators.
- Removed all 11 unused creators/constants and old runtime reducer cases. Removed unused Table runtime reads and the initial phMymetis field. Legacy reducer is reduced to startup snapshot composition and host FAILURE handling; unused historic comments/model guards were removed with that implementation.
- Root handles all 11 old raw runtime action strings as harmless no-ops, including before initial store creation. Cyclic instance payloads cannot enter state through those writes. Host error updates preserve canonical universe identity rather than rebuilding durable projection.
- Updated obsolete stub tests to reflect the retired runtime writes and remaining host-error fallback. Added actual-production root tests for every retired action with cyclic payloads, initialization/JSON safety, runtime mutability and independent error state.
- 243 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains. No new browser check is claimed: active diagram runtime ownership/code paths were not changed here. Changes remain uncommitted.
- This closes the unused runtime-action path, not all serialization gates: graph-bearing focus records, imported unknown values, legacy mirrored roots and independent-host/undo/reopen acceptance still require work. Middleware checks remain disabled.

## Twenty-sixth increment — canonical-only selector and hydration boundary

- Consumer audit found active Redux consumers already use shared-universe or compatibility selectors, and editor getState boundaries project compatibility props. Runtime helper reads refer to these projected host views, not a global store.
- Fixed selector authority: an existing canonical universe, including intentional null domain/model/focus/user/source/list values, takes precedence over stale legacy aliases. Shared-universe selection returns the actual canonical object; host-only changes retain compatibility projection identity.
- Compatibility field selectors now project from canonical state rather than directly reading stored aliases. Legacy-only file roots remain supported by the fallback selector projection.
- Fixed buildUniverseStateFromLegacy authority and document handling for canonical-only rehydration. Previously canonical nulls could fall back to stale aliases, and documents were read only from legacy phData.
- Added canonical-only root projection, stale-mirror null suppression, memoized projection identity, legacy-only file readability and canonical-document rehydration tests. 246 tests, non-incremental typecheck and diff check passed.
- The standalone root still writes mirrored aliases. Physical mirror removal and unknown phData metadata preservation require the next root/persistence-boundary change; this increment prepares those consumers without changing the stored format. No diagram behavior or new browser verification is claimed.
- Final production build passed with the existing duplicate GoJS-global warning. Changes remain uncommitted.

## Twenty-seventh increment — remove stored mirrored roots

- Removed mirrorUniverseToLegacy and changed the standalone Redux root to store one canonical universe plus host metadata/error state. Legacy durable aliases and retired runtime fields are stripped during startup/legacy-root normalization; updates no longer write them.
- Legacy editor/file shapes are derived through selectors at host boundaries. Updated integration tests to initialize actual canonical roots and explicitly inspect selector projections; production root assertions independently confirm no aliases are stored.
- Added optional compatibility.phDataMetadata for unknown legacy phData fields. Startup/snapshot hydration and partial data patches retain this metadata; projection restores it alongside domain/models/documents. Known durable fields are excluded from metadata, avoiding graph duplication. Saved legacy JSON projects and reopens without a format migration.
- 249 tests, non-incremental typecheck, production build and diff check passed. Tests cover real-root alias absence, cyclic legacy runtime-field removal, unknown metadata save/reopen, partial metadata preservation and host metadata identity. Existing duplicate GoJS-global warning remains.
- Production browser localhost:3101/model rendered the editor; Information palette drop and inline rename to `Canonical Redux` succeeded with matching diagram/list labels. Model switching to CORE and back succeeded; browser error logs were empty. Screenshot: /tmp/mimris-canonical-redux-root.jpg. Temporary browser tab/server were closed/stopped.
- Remaining: middleware serialization/immutability gates, graph-bearing focus/import values, full runtime acceptance (independent hosts, undo/reopen), actual Toolkit graph reducer conversion and package extraction. This removes duplicated root storage; it does not declare the full migration complete. Changes remain uncommitted.

## Twenty-eighth increment — enable Toolkit middleware diagnostics

- Removed global immutableCheck/serializableCheck disablement. Standalone stores use default Toolkit middleware, with no ignored active actions or state paths.
- Added a narrowly scoped first middleware that discards the 11 retired raw runtime-write actions before diagnostics traverse their potentially cyclic instance payloads. Their reducer-level no-op protection remains for direct reducer use.
- Added actual configureStore coverage for representative object/relationship/view/focus/load edits, absence of serialization diagnostics, retired cyclic-action isolation, and detection of an intentional external canonical-state mutation. 252 tests, non-incremental typecheck and diff check passed.
- Development-browser localhost:3101/model rendered cleanly; palette drop and inline rename to `Checked Redux` passed with matching diagram/list labels and no serialization/mutation error logs. One coordinate interaction timed out, then succeeded after refreshing UI state. Screenshot: /tmp/mimris-redux-checks.jpg. Temporary tab and development server were closed/stopped before the build.
- Middleware performance remains open: mutation diagnostics emitted development timing warnings of 52–354 ms during drop dispatches (test run also had a 42 ms warning), above the default 32 ms threshold. No paths/checks were disabled or thresholds raised to hide this. Production builds omit these development checks through Toolkit's standard behavior.
- General serialization acceptance, graph/focus shape optimization, full runtime acceptance and actual Toolkit graph reducer/package conversion remain incomplete. Changes remain uncommitted.
- Final production build passed with the existing duplicate GoJS-global warning.

## Implementation checkpoint — 2026-10-09

Increments 1–28 are included in this implementation checkpoint: scoped editor hosts, standalone file/persistence composition, runtime hydration/lifecycle isolation, typed canonical actions, legacy handler retirement, canonical-only Redux roots, saved metadata projection and enabled Toolkit diagnostics. Verification at this checkpoint: 252 tests, non-incremental typecheck, production build and diff check passed; development drop/rename passed without serialization/mutation errors. Middleware performance, Toolkit graph reducer conversion, remaining acceptance checks and package extraction remain pending.
