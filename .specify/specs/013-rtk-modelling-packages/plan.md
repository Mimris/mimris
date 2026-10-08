# Implementation plan: RTK completion and reusable modelling packages

Date: 2026-10-08. Status: proposed; no runtime implementation authorized by this planning task.
Scope: item 1 of the agreed repository split, entirely in `mimris`.
Specification: [spec.md](./spec.md). Branch evidence: [branch-audit.md](./branch-audit.md).

## Starting point

The current branch is `codex/swimlane-membership-release`. Relevant migration work is already incorporated; do not restart from the old RTK branch. The working tree contains existing modelling/diagram changes that must remain intact. Establish an implementation baseline from the agreed integration branch and account for those changes before editing overlapping files; do not reset, stash or commit them implicitly.

Inspected code:

| Surface | Current behavior | Work remaining |
| --- | --- | --- |
| `src/store.tsx` | RTK configureStore, typed exports, canonical/legacy mirroring, disabled checks, global currentStore | Single ownership, safe runtime boundary, remove singleton, enable checks |
| `src/sharedUniverse/universeSlice.ts` | RTK createAction plus handwritten reducer and normalization | Typed operation families and createSlice/createReducer conversion |
| `src/sharedUniverse/selectors.ts` | Compatibility projections plus standalone RootState import | Host-independent selectors and memoized compatibility views |
| `src/sharedUniverse/legacyDispatch.ts` | Translates some old action types | Inventory all callers, retire translation incrementally |
| `src/reducers/reducer.js`, `src/actions/*` | Legacy reducer/action families remain | Migrate remaining behavior, prove coverage, delete superseded code |
| `src/akmm/ui_modal.ts`, `ui_common.ts` | Import getCurrentStore | Inject instance-scoped editor access |
| `src/components/Modelling.tsx` | Router, loaders, file export, storage, editor and server login mixed | Extract editor composition from host controls |
| `src/components/gojs/components/Diagram.tsx` | GoJS runtime, UI, AKMM operations and local-file component | Runtime adapter and injected host capabilities |
| `src/pages/model.tsx`, `_app.js` | Standalone routing/loading/provider | Retain as host shell |

Existing tests include actions, universe reducer, selectors, legacy dispatch, store wiring, palette, startup, generated metamodel project and Workspace model resolution. Store tests use a stub legacy reducer in places; they are not sufficient evidence for real end-to-end reducer parity.

Spec 006 records prior topology/compatibility work but contains historical shape proposals. Reuse its preservation requirements and implemented adapters, not every proposed path. This plan governs RTK/package extraction; it does not reopen universe topology or persistence formats.

## Target boundaries

```text
packages/modelling-core/src/
  types/          Serializable model/edit contracts
  operations/     Pure model and metamodel operations
  redux/          Typed RTK reducers/actions; subtree selectors
  compatibility/  Supported import/export normalization
  index.ts
packages/modelling-editor/src/
  components/     Editor, palette, inspectors and modelling controls
  runtime/        Instance-scoped GoJS and mutable Metis projections
  host/           Host adapter/context
  styles/         Explicit style entry and packaged assets
  index.ts
src/              Existing standalone Next application and host adapters
tests/package-host/  Small independent consumer fixture
```

Package names are provisional (`@mimris/modelling-core`, `@mimris/modelling-editor`). Choose registry/distribution later; packaging locally is in scope, publishing is not. Move modules only after their dependencies satisfy the boundary. `metamodeller.ts` cannot be assumed pure merely because it describes models; audit imports and mutation behavior before classifying it.

Core must import neither React/GoJS nor browser, filesystem, network or host application services. Editor may use React/GoJS and core, but not Next routing, standalone APIs, host storage, credentials or a global Redux store. Standalone may depend on both packages.

### State and host contract

- Keep standalone canonical modelling content at `universe.world.worldModel.metis` during this work. Keep current domain, focus and compatibility semantics until their consumers are explicitly migrated.
- Package operations act on owned modelling subtrees. They must not replace a host's whole universe or drop Workspace fields. The host composes these operations into its reducer without maintaining a second copy of Metis.
- Expose serializable, typed operations grouped by model, metamodel, object, relationship, view and geometry. IDs/timestamps are supplied by action preparation or host commands, not generated unpredictably inside reducers.
- Selectors accept an owned subtree or supplied selector binding, not standalone RootState. React bindings obtain host state through an injected adapter/provider.
- The initial adapter contract supplies current model/editor data, subscription/update access, typed dispatch, and optional host commands for open/save/export/navigation. Missing capabilities hide/disable corresponding controls; they do not fall back to standalone services.
- Keep transient selection/panels separate from durable model edits. Preserve legacy focus import/export through adapters; relocating the complete persisted focus schema is not required here.
- Runtime instances are scoped to an editor session. Build mutable projections from serializable data; never hand Redux-owned references to mutating GoJS/Metis code. Commit completed transactions back as operations and suppress projection/update feedback loops.
- Define undo/redo ownership explicitly in the runtime audit: retain current user-visible behavior, ensure undo/redo updates canonical data, and do not add an independent Redux history stack by accident.

## Ordered implementation increments

### P0 — Baseline and coverage inventory

1. Record base SHA, working-tree changes and branch audit; use the current integrated migration code.
2. Inventory every legacy action and reducer case: producers, consumers, canonical equivalent, persistence effect, test fixture and retirement condition. Include string dispatch, aliases, load success cases, target-model edits and runtime-only actions.
3. Map all store consumers, mutable runtime aliases, import/export formats, routes/APIs and dynamic registrations. Follow transitive editor dependencies and case-sensitive loader paths.
4. Run existing tests, non-emitting typecheck and production build; record exact baseline failures separately from new regressions. Capture representative standalone diagram screenshots and load/edit/save timings.
5. Reconcile tooling before dependency changes: AGENTS lists npm commands, while package.json declares pnpm 10.15.0 and pnpm-lock.yaml exists. Verify CI and installed dependencies; document one lockfile/install workflow rather than mixing installers.

Deliverables: action migration matrix, dependency map, baseline results and representative fixtures. Gate: each migrated family has known behavior and an acceptance fixture; existing dirty work is accounted for.

### P1 — Host seam and first operation

1. Introduce typed model/editor contracts in existing source locations before physically moving files.
2. Replace getCurrentStore usages in ui_modal/ui_common with explicitly supplied editor-session access. Remove the singleton only when all callers have migrated.
3. Separate routing, storage, login and file dialogs from Modelling/Diagram behind host commands. Preserve standalone command implementations and URL-driven loading.
4. Implement a small vertical path (for example object name edit) from editor through host dispatch to canonical state and back. Keep existing class components where conversion adds no value.
5. Verify isolated stores and mount/unmount behavior; ensure the editor contract can bind to a differently shaped host root without duplicating models.

Gate: the representative edit works in standalone and a minimal host adapter with no global store dependency.

### P2 — Runtime isolation before Immer conversion

1. Trace phMymetis, phGojs, other runtime actions and references retained by GoJS callbacks.
2. Move nonserializable runtime values into per-editor session services/refs with explicit lifecycle cleanup.
3. Ensure Redux state and runtime projections do not share mutable nested references. Test edits against frozen state and verify transactions/undo/redo write back exactly once.
4. Preserve diagram identity where possible; do not rebuild the whole diagram on every selection or unrelated host action.
5. Verify object edits, drag/resize, links, target editing and file reopen before converting the affected reducer families.

Gate: migrated model data stays immutable outside reducers; runtime objects do not enter its actions/state. Disabling middleware checks does not disable Immer freezing, so blindly wrapping the existing graph in createSlice is not an acceptable migration.

### P3 — Complete RTK reducer migration

Migrate in reviewable families, updating the action matrix after each:

1. Session preferences and focus operations, keeping model-bound focus validation atomic with relevant edits.
2. Snapshot load/open/replace/refresh and model-list operations. Preserve replace-versus-refresh geometry semantics and startup focus selection.
3. Project/model/modelview properties, creation/deletion and ordering.
4. Objects, relationships, objectviews and relationshipviews, including name/geometry updates, optional-field pruning and identity normalization.
5. Metamodel/type/typeview/property/datatype/method/value operations and target-model counterparts.

Use typed createSlice/createReducer case reducers and reusable pure helpers. Existing action types can be handled temporarily with extraReducers or a boundary translator. Every operation has one owner; avoid executing both legacy and canonical mutations for the same action.

For each family: characterize behavior using real reducers, convert, migrate callers, test persisted output and structural sharing, then remove its old case/action when unused. Do not retain duplicated handlers merely to keep an old import path alive. Thin transitional re-exports may have explicit removal tasks.

Gate: all live actions are accounted for; all supported edits are RTK-owned; unknown actions preserve state identity; unrelated edits do not reconstruct the entire universe.

### P4 — Remove duplicate state and compatibility dispatch

1. Move remaining phData/phFocus readers to subtree selectors or memoized legacy-shaped projections.
2. Remove rootReducer's reverse rebuild/mirroring once no caller writes or requires stored legacy duplicates.
3. Retain supported file-format adapters separately from runtime legacy action support. Internal cleanup must not remove old-file readability.
4. Move initial standalone fixtures out of the legacy reducer and preserve per-store initialization isolation.
5. Remove legacyDispatch, obsolete reducer/action modules and unused root reducer exports only when reference and dynamic-usage checks pass.
6. Enable serializableCheck and immutableCheck for migrated state, then globally when runtime separation is complete. Any temporary exclusions must name exact paths/actions, reason and removal gate; blanket false is not the final state.

Gate: one canonical model tree, no live legacy reducer fallback, no mutable runtime in Redux, no blanket-disabled checks, standalone acceptance matrix passes.

### P5 — Extract and build packages

1. Move the now-separated code into the two package folders; keep standalone composition under src. Avoid changing behaviour in the same commits as bulk moves.
2. Establish package manifests, explicit exports, declaration files, build output and style/asset entry points. Start with ESM; add another format only for a demonstrated consumer need.
3. Treat React/React DOM and relevant host-shared runtime libraries as compatible peers/external dependencies. Verify one React/context runtime in a consuming app and align GoJS licensing/initialization with the host.
4. Remove host-specific path aliases, accidental Node built-ins and internal dependency imports from browser exports. Importing core must work in Node without a DOM; editor loading must respect the client-only GoJS boundary.
5. Add dependency-boundary checks and switch standalone to public package imports. Validate CSS scoping, portal containers, asset URLs, sizing and editor teardown.
6. Build tarballs and install them in a clean consumer fixture with a host-owned store and a distinct root shape. Do not rely only on local symlinks, which can conceal missing published files or duplicate dependencies.

Gate: standalone and isolated consumer build and run using public exports; package artifacts contain all required assets/types; no imports point back to application src.

### P6 — Evidence-based cleanup and handoff

1. Audit legacy reducer/index/focus modules, saga wiring, deprecated helpers, duplicate components, commented implementation blocks and unused dependencies. These are candidates, not preapproved deletions.
2. Check static imports, string/dynamic loading, route conventions, CSS/assets, scripts, external API usage and saved identifiers before deletion. A page/API with no imports may still be active.
3. Keep a cleanup ledger: item, evidence, replacement if applicable, verification and reason for anything retained.
4. Update install/build guidance, stable package architecture documentation under docs, public API examples and standalone host wiring instructions.
5. Produce a Workspace handoff describing package versions, exports, owned state fields, adapter example, style setup, capabilities and known limits. Workspace's actual integration stays a separate task/repo change.

Gate: no verified unused migration code remains; intentional compatibility is documented; full validation passes or unresolved failures are explicitly reported without claiming completion.

## Verification matrix

| Area | Required evidence |
| --- | --- |
| Reducer parity | Real reducer tests for every live family; invariants for IDs/references, deletion, ordering and target edits |
| Files | Legacy, canonical, empty/model-less and Workspace-origin fixtures; semantic round trips preserving unknown fields |
| Geometry | Replacement versus refresh; layoutRevision, pool/lane frames, membership, links, ICOM ports, palette drop placement |
| State isolation | Frozen input edits, no runtime instances, two independent hosts, no singleton references, unknown-action identity |
| Browser | Standalone load/edit/save/reopen, focus switching, inspector/palette, undo/redo, mount/unmount, console checks |
| Packages | Clean tarball consumer, declarations, assets/styles, dependency boundaries and single React runtime |
| Performance | Compare representative load, edit and drag behavior with P0; investigate regressions before acceptance |
| Repository | Existing tests, package tests/build, non-emitting typecheck, production build and git diff --check |

Use `npm test` and `npm run build` as existing script entry points; use the reconciled package manager for dependency installation. A non-incremental `tsc --noEmit --incremental false` run avoids rewriting tracked tsbuildinfo. Do not claim typecheck/build or browser success from unit tests alone. No runtime checks have been run for this planning-only change.

## Delivery and rollback

Implement P0–P6 in dependency order as separate reviewable changes, with family-sized commits within P3. Integrate tests before deleting each old path. Keep file formats unchanged, so rollback is normally a code revert; verify snapshot compatibility before each release. Never run two writable implementations in production as a fallback. Package publication and deployment require their own scoped release work.

## Design decisions to resolve during implementation

- Final package names and workspace/build tooling after P0 tooling audit.
- Exact ownership and representation of existing undo/redo after runtime tracing.
- Detailed host contract and peer-version ranges proven by the first consumer fixture.
- Deletion eligibility of standalone routes/APIs and scripts after usage audit.

These are bounded implementation investigations, not reasons to invent a server layer or redesign persisted universes.

## Constitution check

Persisted compatibility: preserved with round-trip gates. Visual verification: mandatory for diagram/editor changes. Incremental scope: phased operations before extraction. Model/metamodel/UI consistency: tested together. Active planning: this spec-kit folder; durable reference docs are added in P6. No constitutional exception is proposed.

## Technical references

- [Redux incremental migration](https://redux.js.org/usage/migrating-to-modern-redux): old and new reducer code can coexist during a staged migration.
- [RTK and Immer](https://redux.js.org/toolkit/usage/immer-reducers): distinguish reducer draft mutation from mutation of runtime/state references.
- [React invalid hook call guidance](https://react.dev/errors/321): package validation must account for duplicate React copies.
