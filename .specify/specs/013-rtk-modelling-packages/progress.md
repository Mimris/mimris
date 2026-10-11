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

## Twenty-ninth increment — read-only store snapshots and diagnostic performance

- Added a standalone store reducer boundary using Toolkit createNextState auto-freezing. Changed durable roots are read-only; unchanged roots preserve identity. The underlying immutable operation reducer remains independently usable, and editor runtime hydration continues to clone snapshot data.
- Default diagnostic middleware stays enabled with unchanged thresholds and no active-path exclusions. Frozen snapshots let mutation tracking skip immutable subtrees; serializer caching can reuse frozen shared records.
- Added actual-store coverage for immediate mutation rejection, structural sharing/no-op identity, and a mutable runtime importer operating on detached geometry while the canonical snapshot remains unchanged. 253 tests and non-incremental typecheck passed; the test run emitted no middleware timing warnings.
- Development-browser comparison repeated Information palette drop, inline rename to `Readonly Redux` and drag to a new position. All succeeded with matching labels and empty warning/error logs, unlike the previous 52–354 ms mutation-check warnings on the same small fixture flow. Screenshot: /tmp/mimris-readonly-redux.jpg. Initial page navigation timed out during development compilation; the existing created tab loaded successfully when inspected after compilation. Temporary tab/server were closed/stopped before the final build.
- This is evidence for the checked fixture flow, not a large-model benchmark. Broad graph reducer conversion, imported-data serialization acceptance, independent-editor/undo/reopen checks and package extraction remain open. Changes since checkpoint 786c39d2 remain uncommitted.
- Final production build and diff check passed; existing duplicate GoJS-global warning remains.

## Thirtieth increment — Toolkit universe reducer finalization

- Public universeReducer now uses Toolkit createReducer. Its default case supplies current(draft) to the characterized immutable operation implementation, preserving mature update/normalization logic and no-op identity while Toolkit owns readonly finalization. Internal alias/load delegation uses the immutable operation function directly to avoid nested reducer-finalization work.
- Direct reducer results are now readonly as well as standalone-store snapshots. Updated earlier mutable-canonical assertions to the readonly contract; separate runtime-hydration tests continue to prove mutable editor copies do not change durable snapshots. Retired runtime payloads remain unfrozen/no-op.
- Added Toolkit getInitialState/finalization/no-op identity and detached-runtime mutation coverage. 254 tests, non-incremental typecheck and diff check passed. Existing saved-shape, geometry, raw/typed alias, metadata and multi-host reducer checks remain green.
- No new browser check is claimed: standalone store snapshots were already frozen and the immediately prior browser drop/rename/drag check passed with empty diagnostics. Public reducer consumers now receive the same readonly guarantee; package/consumer acceptance remains pending.
- Immutable operation helpers are intentionally retained rather than rewritten as draft mutations. Remaining work includes package extraction/consumer builds, larger-model performance, independent-editor acceptance and undo/file-reopen checks. Changes since 786c39d2 remain uncommitted.
- Final production build passed with the existing duplicate GoJS-global warning.

## Thirty-first increment — extract modelling-core package

- Moved canonical universe types/actions/reducer, selectors, compatibility dispatch, diagram preferences and pure appearance helpers into packages/modelling-core. Original application paths are thin re-exports of built package artifacts; there are no duplicate implementations.
- Added private 0.0.0 package metadata, GPL license, explicit ESM/types exports, Toolkit peer dependency, independent NodeNext/declaration build and automatic prepack build. Package compilation uses ES2020 without DOM libraries. Generated dist output is ignored.
- Standalone dev/build/test/typecheck/start-build scripts build core first; watch:core supports package edits alongside development. Root tests include public core consumer/boundary tests. Documentation: docs/architecture/modelling-core-package.md.
- Verified public ESM import in Node without a DOM, independent host-owned stores under a different enclosing root, readonly state, saved metadata and a dependency boundary allowing only local core modules/Toolkit. Packed tarball installs into /tmp/mimris-core-consumer and its runtime/declaration consumer passed. The core was installed from its tarball, not symlinked; already-installed Toolkit/runtime dependencies were supplied as physical directories to avoid registry network access. Final pack includes JS/declarations, README and LICENSE; prepack build passed.
- Initial standalone webpack and Turbopack source-import checks failed on Node ESM .js source suffixes. A webpack extension fallback fixed only webpack and was removed. Final standalone re-exports consume real emitted .js files, avoiding resolver-specific configuration. Production build passed; Turbopack editor rendered and Information drop passed after reload with no new warning/error logs during that interaction. Screenshot: /tmp/mimris-extracted-core.jpg. Temporary tab/server were closed/stopped.
- Final root test suite: 256 passed (254 existing application tests plus 2 package tests). Independent core tests: 2 passed. Global typecheck, core build, packed consumer declaration check and diff check passed. Existing duplicate GoJS-global warning remains.
- Full editor-package extraction, standalone public package-name dependency wiring, clean browser editor consumers and Workspace integration remain pending. Changes since checkpoint 786c39d2 remain uncommitted; nothing was published.

## Thirty-second increment — portable modelling-editor foundation

- Moved scoped host access, optional draft patching, detached hydration, drag protection, reconciliation and deferred callbacks into packages/modelling-editor. Application paths are thin re-exports of emitted artifacts; mutable-runtime behavior is unchanged.
- Added private ESM/types manifest, license, declaration build and prepack hook. Core/Toolkit are public type peers; local compiler paths resolve sibling core declarations. App dev/build/test/typecheck commands build both packages first; editor source watch is available separately.
- Added public-entry tests for no-DOM import, host/runtime isolation, callback teardown, dependency/storage boundaries and shared host-registry identity across draft/binding helpers. Final root suite: 260 passed (254 application, 2 core-package, 4 editor-foundation tests).
- Installed the editor tarball alongside the core tarball in the temporary consumer. A public core/editor pair used a host-owned store, mutable detached runtime and scoped binding/cleanup without a DOM. Runtime and declaration checks passed. Peer runtime packages were supplied as physical directories from the existing installation; neither Mimris package was symlinked and no registry network was needed.
- Global typecheck, ordered package builds, production build and diff check passed. Turbopack standalone rendered and Information drop/inline rename to `Packaged Editor` passed with matching list/diagram labels and empty warning/error logs. Screenshot: /tmp/mimris-editor-foundation.jpg. Temporary tab/server were closed/stopped.
- This is an editor foundation, not a full React/GoJS package. Modelling's project form/schema generation, Modeller's SVG/user persistence, GoJSApp's helper graph and Diagram's icon/CSS/helper assets are documented in docs/architecture/modelling-editor-package.md. Rendering components and their host/asset seams remain pending; React/GoJS peer and full browser-consumer validation follow that move.
- Changes since checkpoint 786c39d2 remain uncommitted. Nothing was published; no Workspace repository was changed.

## Thirty-third increment — standalone user-settings host capability (2026-10-10)

- Removed direct SaveAkmmUser invocation from Modeller. It now requests an optional scheduleUserSettingsSave callback, propagated through Modelling and supplied by standalone composition. Hosts without this capability do not trigger browser user-settings writes.
- New standalone scheduler retains the existing writer, akmmUser key and 250 ms delay. Cleanup cancels only its timer and guards callbacks already queued; Workspace authority suppresses scheduling and rechecks authority before the delayed write.
- Removed unused SVG writer imports from Modeller and unused Node os/schema-generator imports from Modelling. The existing SVG handler only serializes to an unused string; this increment does not claim a working SVG download or replace that incomplete behavior.
- Added writer/key/snapshot, independent cancellation and initial/late Workspace-authority tests. 263 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains. No new browser check is claimed; diagram behavior/markup is unchanged.
- React review: standalone callback identity is module-stable, the editor effect depends on it and focus ID, and returned cleanup cancels the owning request. No new subscriptions or render-state effects were added. Existing user-setting behavior remains a host policy.
- Remaining React/GoJS extraction seams include project form/page-shell rendering, runtime/UI helper graph, icon/CSS assets and explicit SVG capability decisions. Changes since 786c39d2 remain uncommitted.

## Thirty-fourth increment — remove dormant project/page dependencies (2026-10-10)

- Audited Modelling's Page/project form dependencies. Page/connect existed only as an unused import/commented historical export. The project dialog's open handler had no callers; show state started false and no reachable path set it true. The secondary projectModalOpen setter/ref were unused.
- Removed those imports, dormant state/handlers/form dialog and its render reference. This removes unreachable application coupling rather than introducing a host callback for a feature with no reachable editor UI.
- Retained ProjectDetailsForm and its live Project/ProjectMenuBar call sites. Active standalone page composition and model-rename dialogs are unchanged.
- 263 tests, non-incremental typecheck, production build and diff check passed. No new tests or browser check were added for unreachable-code cleanup; no diagram behavior/active markup changed. Existing duplicate GoJS-global warning remains.
- Remaining extraction concerns are the runtime/UI helper graph, reports/forms that are actually used, icon/CSS assets, SVG capability decisions and a full React/GoJS consumer. Changes since 786c39d2 remain uncommitted.

## Thirty-fifth increment — packaged relationship form/helpers/CSS (2026-10-10)

- Moved relationship draft/validation/apply helpers, the React RelationshipTypeEditor and its CSS module into modelling-editor. Original helper/component paths are thin re-exports; Diagram imports the emitted stylesheet. Helper code received explicit TypeScript annotations without changing behavior.
- Added a separate client `@mimris/modelling-editor/react` entry, React peer, CSS asset export and asset-copy build step. The root entry remains React/DOM-free. Asset tests caught a root build command that omitted copying CSS; both package and root build commands now include that step.
- 264 tests, global typecheck, ordered package builds, production build and diff check passed. Tests assert separate client entry and exact emitted/source stylesheet contents, alongside existing real-runtime relationship validation/parity coverage.
- Packed tarball includes React JS/declarations and CSS. Installed consumer root remains no-DOM safe; public React-entry declaration consumption passed with compatible physical peer/type packages supplied from the existing installation. No Mimris package was symlinked and no registry network was needed.
- Turbopack browser: switched to metamodel, opened performs -> Edit Relationship Type, verified Definition and Appearance layouts, entered invalid source cardinality and confirmed validation blocked Apply. Canceled the draft; no valid model changes were applied. Browser errors were empty; one 33 ms serialization timing warning exceeded the default 32 ms threshold. Screenshot: /tmp/mimris-packaged-relationship-form.jpg. Temporary tab/server were closed/stopped.
- React review: extracted component is unchanged apart from local imports/client directive; lazy draft initialization, validation, accessibility IDs and callback flow remain. Parent modal stays host-owned. Existing Bootstrap utility/form classes remain a consumer styling requirement.
- Full GoJS canvas, remaining runtime/UI graph and icon assets still require extraction and browser-consumer validation. Changes since 786c39d2 remain uncommitted.

## Thirty-sixth increment — portable catalogs and packaged local assets (2026-10-10)

- Split iconList/iconList2/imageLibrary data from the application React selector into modelling-editor's Node-safe runtime exports. Diagram now imports pure package catalog code; the legacy form keeps its JSX selector and re-exports catalog functions.
- Copied 43 referenced local image/icon files into package-owned assets and emitted them under dist/assets with an explicit wildcard export. Standalone public files remain to preserve existing URLs; byte-equality tests detect drift between package source, emitted assets and retained public copies.
- Asset audit found 44 unique local references; property.png was already absent. Preserved that identifier, reported it via unresolvedEditorAssetNames and did not invent/substitute a resource. Remote URLs remain unchanged and were not downloaded or claimed verified.
- Added resolveEditorAssetUrl for host opt-in base URLs. Known packaged identifiers resolve against that base; unknown and remote values are returned unchanged. Existing standalone rendering paths and saved values are unchanged.
- 265 tests, non-incremental typecheck, ordered package builds, production build and diff check passed. Installed tarball catalog/asset exports passed without DOM or application-source imports; archive contains exactly 43 asset files. Existing duplicate GoJS-global warning remains.
- No new browser check is claimed for this pure data/byte-preserving move. Package-owned asset serving/public dependency wiring, the full GoJS/React canvas/helper graph and remaining independent-host acceptance still need work. Changes since 786c39d2 remain uncommitted.

## Thirty-seventh increment — GoJS tool/layout entry (2026-10-10)

- Moved GuidedDraggingTool and DropLayoutManager into a separate modelling-editor/gojs entry. Original application paths are thin artifact re-exports. Removed DropLayoutManager's unused ui_json import; runtime algorithms are unchanged.
- Declared the tested GoJS 3.1.10 host peer and retained the extension's original Northwoods notices, with a packaged provenance notice. The library is not bundled, and root helper imports remain GoJS-free.
- Added shared host-peer instanceof/tool-manager checks, independent tool configuration, guideline cleanup and nested layout-config isolation/default-preservation checks. 267 tests passed.
- Initial global typecheck raced new artifact generation and reported missing declarations; rerunning after package generation passed. Production build and diff check passed. Installed tarball GoJS-entry consumer shared its physical host peer and worked headlessly.
- Turbopack browser: expanded palette, retargeted a drop after palette reflow, dropped Information and dragged it to a new position. Final object position was visibly updated and warning/error logs were empty. Screenshot: /tmp/mimris-packaged-gojs-tools.jpg. Temporary tab/server were closed/stopped.
- Multi-node layout/alignment, group/swimlane behavior, undo/reopen and full canvas/browser-consumer acceptance remain pending. This moves two self-contained runtime modules; the main Diagram/GoJSApp/runtime-helper graph remains in application source. Changes since 786c39d2 remain uncommitted.

## Thirty-eighth increment — portable palette data helpers (2026-10-10)

- Extracted palette node/link normalization and shallow change detection from GoJSPaletteApp into the Node-safe editor root. The application uses emitted package code; helper algorithms remain unchanged. Retained the originating module copyright notice.
- Tests cover saved identifiers, geometry, unknown fields, category defaults, nested boolean normalization, cyclic mutable runtime data and shallow comparison/NaN behavior. Documentation explicitly restricts normalization to detached mutable runtime data rather than readonly Redux snapshots.
- 270 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warning remains. No new visual check is claimed for this unchanged pure-helper extraction.
- SelectionInspector and main canvas still depend on AKM/application utilities; full editor extraction and independent-host browser acceptance remain pending. Changes since 786c39d2 remain uncommitted.

## Thirty-ninth increment — packaged inspector row (2026-10-10)

- Moved InspectorRow into modelling-editor with an explicit client inspector-row entry. The original path is a thin re-export. React remains a host peer; regex-parser is declared as a runtime dependency. Original Northwoods notice and existing behavior are retained.
- Added public-entry checks for unknown saved select options, empty options, inherited styling, textarea rendering, checkbox callbacks, numeric drafts/host refresh and patterned blur validation. 273 tests, non-incremental typecheck, production build and diff check passed.
- Turbopack browser: dropped Information, opened its canvas Objectview -> Edit Object View dialog and visually verified the packaged text/number/textarea/select rows. No property edits were applied. Screenshot: /tmp/mimris-packaged-inspector-row.jpg. Temporary tab/server closed/stopped.
- Browser inspection also surfaced a rows=NaN React warning from the separate ObjectForm in src/components/forms/ObjectDetails.tsx; the source computes textarea rows from possibly absent lengths. It is outside the extracted row and remains unresolved. Existing duplicate GoJS-global production-build warning remains.
- React review retained existing class/state/callback behavior and rendering; legacy ts-nocheck/narrow props remain explicitly documented. Full SelectionInspector still depends on AKM/application helpers; the main canvas and independent-host browser acceptance remain pending. Changes since 786c39d2 remain uncommitted.

## Fortieth increment — selection inspector with explicit runtime adapter (2026-10-10)

- Moved SelectionInspector and its nested object-type property editor into modelling-editor/selection-inspector. A component factory accepts the property constructor, row policy, template/figure catalogs, GUID/numeric helpers, constants and appearance-field policy. Standalone creates one stable adapter outside render using its existing AKM modules. No store/application modules are imported by the packaged component.
- Preserved runtime algorithms and the original copyright notice; internal AKM type annotations become opaque runtime types. Removed the unused private cheerio import. Legacy ts-nocheck/narrow prop declarations and mutable-runtime rendering effects remain documented, rather than claimed redesigned. A source comparison confirmed the implementation matches after adapter/type-only transformations.
- Added public-entry tests for separate adapters with independent row policies, saved unknown layout values, numeric selected values and absent context. 275 tests, non-incremental typecheck and diff check passed.
- Turbopack browser: dropped Information, opened Objectview -> Edit Object View, changed memberscale from 1 to 2, completed Done and reopened the dialog showing 2. No browser errors; Redux serialization checks emitted 35 and 44 ms timing warnings after edits. Screenshot: /tmp/mimris-packaged-selection-inspector.jpg. Temporary tab/server closed/stopped.
- First production build exited successfully but showed missing helpblog manifest messages and zero shared chunks, suggesting stale development artifacts. Preserved generated .next outside the repo and reran with no active development listener. Clean production build passed; existing duplicate GoJS-global warnings remain.
- Full canvas/runtime helper extraction, object-type property create/delete and relationship inspector browser acceptance, package installation in Workspace and two simultaneous browser editors remain pending. Changes since 786c39d2 remain uncommitted.

## Forty-first increment — palette wrapper with explicit rendering adapter (2026-10-10)

- Moved PaletteWrapper into modelling-editor/palette with a stable component factory accepting tooltip and template/icon capabilities. Standalone supplies existing helpers; the package imports no application runtime modules. React, GoJS and gojs-react are host peers (tested gojs-react 1.1.3). Retained original Northwoods notice.
- Removed duplicate palette boolean/category normalization in favor of the existing package helpers. Saved identifiers, geometry and unknown fields retain the same behavior. Legacy ts-nocheck and mutable runtime props remain documented.
- Initial new headless initialization test failed because the existing initializer requires HTMLDivElement. Corrected verification scope to independent runtime props/React refs and rendered normalization; diagram construction is covered in the real browser, not claimed Node-safe. Final 277 tests, non-incremental typecheck, clean production build and diff check passed.
- Turbopack browser: verified IRTV palette icons/layout and dragged Information onto the canvas; the object appeared and the Objects palette updated. No browser errors; one Redux serialization timing warning of 55 ms exceeded the default 32 ms threshold. Screenshot: /tmp/mimris-packaged-palette-wrapper.jpg. Temporary tab/server closed/stopped before production build. Generated development .next artifacts were preserved outside the repo before the clean build; existing duplicate GoJS-global build warning remains.
- Existing idempotent category guards still modify the shared host GoJS model prototype when the factory runs. Full two-editor isolation, alternate palettes, relationship links/context menus, main canvas/runtime-helper extraction and Workspace package consumption remain pending. Changes since 786c39d2 remain uncommitted.

## Forty-second increment — portable link data and shared normalization (2026-10-10)

- Moved link port/point normalization, longest-path selection, first-nonempty-path selection and explicit saved-path detection into the Node-safe editor root. GoJSApp consumes emitted helpers; a source comparison confirmed extracted algorithms match the original implementation.
- Replaced duplicated boolean normalization in GoJSApp, Diagram and GoJSPaletteTargetApp with the existing package helper. Local category policies and target-palette link handling remain unchanged.
- Added checks for saved-array identity, point/number iterators, missing points, distinct path-selection policies, saved port identifiers, detached changed records, unknown fields and routing preservation. 280 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warning remains.
- No browser check is claimed for this pure-helper extraction; no rendering/layout behavior changed. Main canvas/runtime-helper extraction, complete host isolation and Workspace package consumption remain pending. Changes since 786c39d2 remain uncommitted.

## Package checkpoint review and commit (2026-10-10)

- Reviewed increments 29–42 as one scoped checkpoint: canonical Toolkit finalization/readonly snapshots, portable core, editor host/runtime helpers, relationship form/CSS, catalogs/assets, GoJS tools, inspector/palette adapters, standalone settings capability and unreachable-code cleanup. No new blocking regression found.
- Preserved unrelated metamodel palette visibility/model-loading edits in the working tree, including a separate appearance alias in tsconfig; they are excluded from this checkpoint.
- Normalized whitespace in newly tracked package source. Copied asset bytes remain unchanged; staged diff checking passes with inherited blank-at-EOF reporting disabled for the pre-existing SVG formatting. No generated dist/node_modules/Next artifacts are included.
- Exported the exact staged code to a temporary checkout using the existing dependency installation. All 280 tests, non-incremental typecheck and a fresh production build passed there, independently of unrelated working-tree changes. Existing GoJS duplicate-global warning and previously recorded browser timing/acceptance caveats remain. No new browser verification is claimed for the review/whitespace pass.
- This is a local checkpoint commit; complete canvas extraction, installed consumer/two-editor browser acceptance and Workspace integration remain pending.

## Packed-package browser consumer check (2026-10-11)

- Tested committed checkpoint 608c2f6a in a separate temporary app with physical core/editor tarball contents and reused installed peers. No current dirty application/package edits were consumed.
- Verified independent name edits, node movement, host save/reset/reload with unknown-field/geometry preservation and scoped callback cancellation after closing A. Fresh final logs were clean.
- Retained the fixture and evidence/limitations in consumer-verification.md. This covers the available row/palette/tool/core/host/lifecycle cluster using a consumer-owned canvas and minimal runtime; complete two-editor Mimris/Workspace acceptance remains pending. No production/package code changes or commit/push were made for this test.

## Forty-third increment — portable manual-link geometry (2026-10-11)

- Extracted routing preservation, modified-link sanitization, manual endpoint reanchoring and joint endpoint translation from GoJSApp into modelling-editor/gojs. Source comparison confirms algorithms match after export/import changes; original copyright retained.
- Added checks for peer enum/string routing, transient versus explicit manual paths, saved identifiers/unknown fields, copied coordinate arrays, joint endpoint translation and orthogonal endpoint segment preservation. All 284 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warnings remain.
- No new browser verification is claimed for this unchanged helper extraction. Earlier packed consumer acceptance covers controls/store/lifecycle only; full Mimris canvas and saved manual-link browser acceptance remain pending. Existing unrelated working-tree edits were preserved. This increment is uncommitted.

## Forty-fourth increment — shared node identity helpers (2026-10-11)

- Moved node alias extraction, live-node lookup and structural node-array comparison from GoJSApp into modelling-editor/gojs. Diagram's identical alias implementation now reuses the package helper. Existing alias priority, fallback IDs and reconciliation policies are unchanged; original notice retained.
- Added saved-ID/ordered deduplication, geometry/order versus membership checks and live native-GoJS lookup tests proving saved aliases resolve only within the supplied diagram. All 287 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global build warnings remain.
- No new visual check is claimed for this unchanged identity-helper extraction. Full canvas/reconciliation extraction and broader browser acceptance remain pending. Unrelated edits preserved; this increment remains uncommitted.

## Forty-fifth increment — portable node reconciliation (2026-10-11)

- Moved incoming-node reconciliation unchanged from GoJSApp into modelling-editor/gojs. The package uses its existing diagram-scoped drag protection and identity helpers, with no application imports. Original copyright and diagnostic logging retained.
- Added coverage for alias-based position locks isolated between native GoJS diagrams, expired protection cleanup, live geometry versus explicit new layout revisions, default-name preservation, unknown fields and unchanged incoming records. All 291 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new browser verification is claimed for this unchanged helper extraction. Incoming-link reconciliation, the full canvas extraction and broader browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Forty-sixth increment — portable link reconciliation (2026-10-11)

- Extracted incoming-link reconciliation from GoJSApp into the Node-safe editor root. Retained saved-route precedence, metadata fallback and unchanged-record identity, with original copyright preserved.
- Fixed an existing crash when a manual-path flag accompanied missing points: only normalized arrays with at least four coordinates count as manual paths. Non-array and short paths no longer override valid local routes.
- Added coverage for local versus incoming manual routes, unknown-field and input preservation, missing/malformed/short coordinates, iterator points and routing/relationship-view fallback. All 295 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for this runtime-data extraction and malformed-input fix. Full canvas browser acceptance and extraction of queued dispatch/remaining runtime helpers remain pending. Unrelated edits preserved; this increment is uncommitted.

## Forty-seventh increment — portable queued view dispatch (2026-10-11)

- Extracted safe dispatch cloning, object/relationship queues, immediate flushing and disposal into the Node-safe editor root. GoJSApp consumes emitted helpers, and optional draft writes use the package's existing host capability. Comparison with committed source confirms queue algorithms match after exports/imports and queue type annotations; original copyright retained.
- Added public-entry checks for runtime/cycle stripping, detached geometry, coalescing, native GoJS model synchronization, optional host draft persistence, per-editor teardown and immediate flush without duplicates. Existing source-driven regression tests now target the extracted functions, retaining the application rename test.
- Initial suite failed the dependency guard because it allowed only same-folder imports. Updated it to verify resolved relative imports stay within package src, retaining rejection of application/external dependencies. Final 299 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual verification is claimed for this unchanged queue extraction. Remaining canvas/runtime helpers and full canvas/browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Forty-eighth increment — portable rendered-scale queries (2026-10-11)

- Extracted group member-scale resolution, ancestor multiplication, live part/text scaling and relationship endpoint averaging into modelling-editor/gojs. GoJSApp consumes emitted queries; mutating scale application and binding synchronization remain in the canvas. Comparison with committed source confirms unchanged algorithms, with original copyright retained.
- Added native GoJS coverage for saved-field precedence, invalid-value defaults, nested ancestor products isolated by host hierarchy, live versus saved scale, endpoint averaging, absent endpoints and unchanged saved records. All 303 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for these unchanged read-only calculations. Remaining runtime helpers, scale application and full canvas browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Forty-ninth increment — portable scale application (2026-10-11)

- Extracted derived scale application and relationship text-scale synchronization into modelling-editor/gojs. GoJSApp consumes emitted helpers. Comparison with committed source confirms unchanged algorithms after import/export changes; original copyright retained. Nested-group sizing remains in the canvas.
- Added native GoJS checks for live/model/runtime scale agreement, separate host diagrams, relationship deduplication, endpoint-derived label scale, ungrouping and missing contexts/links. Initial test counted binding refreshes, which also occur automatically in GoJS; corrected it to count the intended textscale model writes. Final 307 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for this unchanged extraction. Full canvas browser acceptance, nested-group sizing and remaining runtime helper extraction remain pending. Unrelated edits preserved; this increment is uncommitted.

## Fiftieth increment — portable nested-group sizing (2026-10-11)

- Extracted nested-group sizing, group-like recognition and the shared 0.35 size ratio into modelling-editor/gojs. GoJSApp consumes emitted helpers and ratio. Comparison with committed source confirms unchanged algorithms after import/export changes; original copyright retained.
- Added native GoJS checks for resize/model/runtime agreement, independent host diagrams, saved IDs/unknown fields, minimum dimensions, invalid parent sizes, group flags/template recognition and ordinary-node/missing-context handling. All 311 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for this unchanged extraction. Live-bounds fallback and full nested-group browser acceptance remain pending alongside remaining modelling-area helpers. Unrelated edits preserved; this increment is uncommitted.

## Fifty-first increment — portable group containment queries (2026-10-11)

- Extracted native group-cycle detection and runtime object-descendant lookup into modelling-editor/gojs. GoJSApp consumes emitted queries. Comparison with committed source confirms unchanged algorithms after import/export changes; original copyright retained.
- Added native hierarchy checks for self/descendant rejection, ancestor/separate-group allowance and independent hosts. Object-graph tests cover active matching containment relationships, saved IDs, existing cycles, deleted/unrelated relationships and malformed inputs. All 314 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for these unchanged queries. Drop-target geometry, containment application and full modelling-area browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Fifty-second increment — portable drop-target geometry (2026-10-11)

- Extracted body-bound lookup, smallest containing group selection and visual containment into modelling-editor/gojs. GoJSApp consumes emitted helpers. Comparison with committed source confirms unchanged algorithms after import/export changes; original copyright retained.
- Added controlled native-GoJS geometry tests for named-body precedence/resize fallback, smallest-area selection, self/descendant rejection, full/center/45-percent-overlap policies, independent diagram targets and missing contexts. All 318 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- Controlled geometry tests do not prove browser layout or drag/drop acceptance; no new visual check is claimed for this unchanged extraction. Grab permissions, containment application and broader modelling-area browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Fifty-third increment — portable group grab permissions (2026-10-11)

- Extracted group grab permission lookup and model-list projection into modelling-editor/gojs. GoJSApp consumes emitted queries. Host access comes from the package's existing scoped registry; there is no global store or server access-control logic. Comparison with committed source confirms unchanged algorithms after import/export changes; original copyright retained.
- Added checks for host isolation/unbinding, saved-reference fallback, runtime lookup precedence, strict boolean flags, receiver binding, invalid contexts and unchanged model lists. All 322 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain.
- No new visual check is claimed for these unchanged queries. Containment application and broader modelling-area browser acceptance remain pending. Unrelated edits preserved; this increment is uncommitted.

## Fifty-fourth increment — portable containment application (2026-10-11)

- Extracted hierarchy lookup, group-state clearing, detachment/attachment and consistency diagnostics into modelling-editor/gojs. GoJSApp consumes emitted helpers. Comparison with committed source confirms unchanged algorithms after import/export and type-only casts; original copyright retained.
- Package compilation exposed legacy method attempts absent from current peer declarations (removeMembers/updateAllTargetBindings). Retained their guarded behavior with narrow casts rather than changing algorithms. Native GoJS tests cover location/unknown-field preservation, host isolation, parent reassignment, hierarchy lookup, missing contexts and retained detach-first behavior on rejected membership.
- All 326 tests, non-incremental typecheck, production build and diff check passed. Existing duplicate GoJS-global warnings remain. No new visual verification is claimed for this unchanged extraction; complete grouping/ungrouping browser acceptance remains pending alongside remaining modelling-area helpers. Unrelated edits preserved; this increment is uncommitted.

## Modelling-area browser containment check — partial (2026-10-11)

- Started this checkout's Turbopack server on isolated origin localhost:3103, consuming current emitted packages and preserving the user's existing localhost:3000 tab/data. Initial IRTV palette was blank; switching through the visible TypeDef CORE model rendered its palette. No conclusion about the initial palette cause is claimed.
- Visually created a Container and EntityType from the CORE palette, then moved EntityType from outside into the container body. Opened and completed Edit Object View. No browser error/warning logs were captured; server served modelling and user routes successfully, with its existing duplicate GoJS warning.
- Actual membership, collapse/expand and ungroup position preservation remain unverified. Collapse attempts timed out or left the view unchanged; coordinate/context-menu automation also intermittently timed out. Visual overlap is not proof of grouping. Stopped at this observability/control gap instead of claiming containment acceptance.
- Screenshot: /tmp/mimris-containment-browser-partial.jpg. Temporary browser tab closed and server stopped. No implementation changes, new commit or push. Next browser acceptance needs reliable membership evidence and a known grab-enabled test container before checking group/ungroup/save/reopen.

## Second-container-drag protection fix (2026-10-11)

- User reported standalone localhost:3000 container moving once and snapping back on the next move. Confirmed port 3000 serves this checkout. Inspection found prior post-move location locks remain for 12 seconds and Diagram's loc-write guard rejects different positions during that window.
- Added scoped alias-based release of previous drag protection when a new user drag begins. Release selected parts and group members before activation, then effective dragged parts (including lane/pool content) after activation. Other objects and hosts retain protection; completed moves continue installing fresh locks.
- All 327 tests and non-incremental typecheck passed. Regression test proves an active prior lock stops overriding the second move, unrelated objects/hosts remain protected and a fresh completed-position lock still rejects stale data.
- Isolated localhost:3103 browser: created CORE Container and moved it repeatedly to distinct stable locations; final logs contained no errors/warnings. Automation took about 14 seconds between the closest observed move completions, exceeding the 12-second lock window; exact rapid-repeat browser acceptance remains pending and is not claimed. Screenshot /tmp/mimris-second-drag-fixed.jpg. Temporary tab/server closed/stopped; user's port 3000 server left running. No production build run during live developer-server use. Changes uncommitted.

## Missing generic type during deletion — safeguard (2026-10-11)

- User reported null defRelType.typeview during SelectionDeleting. Reassignment previously set rel.type to null before crashing when the model lacked its generic relationship replacement.
- Added read-only preflight before any deletion/reassignment mutations. If instantiated relationship/object types lack a different active generic replacement, show a specific message, clear GoJS selection and return. Models with no instances remain deletable without a replacement. Existing explicitly chosen instance-deletion path is retained.
- All 330 tests and non-incremental typecheck passed, including missing/deleted/self replacement checks and a native GoJS deletion transaction proving selection clearing cancels removal. No new browser verification or production build claimed; user's localhost:3000 developer server remains running. Changes uncommitted.

## Reviewed package/runtime checkpoint (2026-10-11)

- Reviewed increments 43–54, scoped consumer/browser evidence and the reported second-drag/type-deletion fixes as one local checkpoint. Preserved unrelated metamodel visibility, inspector appearance, palette/model loading, tsconfig alias and automatic-layout route edits outside the index.
- Review found the selection-lock release block had been inserted in route capture rather than drag activation. Moved it into doActivate before super, retaining effective-part cleanup afterward; added an integration placement regression. This correction has not received new browser verification. Earlier repeated-movement observations do not prove rapid-repeat acceptance.
- Exported the exact staged implementation to /tmp/mimris-reviewed-checkpoint-i0wfepdh using the existing dependency installation. All 331 tests, non-incremental typecheck and fresh production build passed independently of excluded working-tree edits. Staged whitespace check passed. Existing duplicate GoJS-global build warnings remain.
- This checkpoint is local only. Manual rapid-repeat movement, safe type deletion, full grouping/ungrouping/save-reopen acceptance, remaining modelling-area extraction and Workspace integration remain pending.
