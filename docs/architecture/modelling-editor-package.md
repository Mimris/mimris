# Modelling editor package foundation

`packages/modelling-editor` now owns the relationship-type React form/CSS and seven portable host/runtime modules: access, draft patching, hydration, drag protection, node reconciliation, deferred callbacks and relationship draft helpers. Original application paths are thin re-exports of built ESM artifacts. Each editor instance binds its own host and mutable runtime; teardown removes only its own state.

Build/test from the repository root with `npm run build:packages` and `npm run test:editor`. Standard app dev/build/test scripts build both packages first. Package source/declarations reference core through its public peer name; local compiler paths resolve the sibling declarations. A packed consumer installs both packages and needs no application aliases.

The package can import in Node without a DOM. This is a foundation check, not a complete browser editor consumer. Remaining extraction seams:

| Component | Dependency to resolve before moving |
| --- | --- |
| Modelling | Dormant project/page dependencies removed; audit remaining active forms/reports and runtime graph |
| Modeller | User-settings persistence is now an optional standalone callback; incomplete SVG handler needs a separate decision |
| GoJSApp | AKM runtime/helper graph and application-specific UI utilities |
| Diagram | Relationship form/helpers/CSS extracted; remaining canvas helpers and UI/dialog assets |

File/user/server capabilities belong to hosts. Reusable runtime/rendering code and assets belong to the eventual editor package. Peer ownership for the complete canvas and a complete browser consumer still require validation when the remaining components move. Do not describe this private 0.0.0 foundation as a complete exported editor.

The client form entry is `@mimris/modelling-editor/react`; CSS modules are bundled by the consuming frontend and the host supplies existing Bootstrap form/utility styling. Parent modal/container composition remains host-owned. Do not pass readonly Redux records to the mutable runtime apply helper.

## Catalogs and asset serving

The Node-safe root exports icon/image catalogs, bundled/unresolved asset names and `resolveEditorAssetUrl`. Stored values remain unchanged. Hosts may serve the 43 exported `@mimris/modelling-editor/assets/*` resources at their own static base and resolve known values against it. Unknown values and remote URLs remain opaque; the resolver does not silently substitute defaults.

Package-owned files live under assets and are emitted under dist/assets. Standalone public copies are retained during the serving transition, with byte-equality tests guarding drift. The historical property.png reference has no corresponding file and remains explicitly unresolved. Remote catalog URLs are preserved, not mirrored or availability-validated by the package build.

## GoJS tools

`@mimris/modelling-editor/gojs` exports GuidedDraggingTool and drop-layout configuration/application helpers. GoJS is a host peer pinned to the tested 3.1.10 version; the root helper entry does not import it. The extension's original notices are retained and included in THIRD_PARTY_NOTICES.md. Use one host GoJS instance for both diagrams and the packaged tools.

Extraction checks cover peer identity, isolated configuration/defaults, headless tool attachment/cleanup and standalone drop/drag. Full multi-node/group/alignment and main canvas consumer acceptance are still pending.

## Palette runtime data

The root exports palette node/link normalization and shallow change detection. These helpers operate on detached mutable palette data: they recursively normalize empty boolean-like fields in place, preserve unknown fields and geometry, apply existing category defaults, and retain shallow identity comparisons. Hosts must not pass readonly Redux snapshots into normalization. Cyclic runtime references are guarded; this is not a persisted-data migration.

## Inspector row

The client entry `@mimris/modelling-editor/inspector-row` exports the existing InspectorRow control without application imports or the relationship form's CSS-module dependency. React is supplied by the host; regex-parser is a package dependency. Host callbacks receive the original property context and string/boolean values. Unknown saved select values, inherited styling, checkbox state, number drafts and blur validation retain existing behavior. Bootstrap utility styling and the parent inspector/modal remain host-owned. The legacy component path is a thin artifact re-export.

The component retains its legacy ts-nocheck and narrow prop declarations during extraction; this checkpoint does not claim a redesigned or fully typed inspector API.

## Selection inspector adapter

`@mimris/modelling-editor/selection-inspector` exports `createSelectionInspector(services)` and its adapter/prop contracts. Create the component once outside render so its React identity remains stable. Supply the mutable runtime property constructor, row policy helpers, template/figure catalogs, GUID/numeric helpers, category/type constants and appearance-field policy. The standalone module supplies those capabilities from its existing AKM modules; the package imports none of them.

The inspector and its nested property editor retain existing algorithms and mutable-runtime behavior, including resetting runtime submodel lists during rendering. Supply a detached mutable Metis runtime, never readonly Redux state. The callback and parent modal remain host-owned. colornames and printf are declared package dependencies. The legacy ts-nocheck and narrow props remain; this extraction does not redesign the inspector API. The original unused private cheerio import is removed.

Browser acceptance covered an Information object-view dialog and a numeric edit followed by reopening. Object-type property creation/deletion, relationship inspectors and two simultaneous browser editors remain pending.

## Palette adapter

`@mimris/modelling-editor/palette` exports `createPaletteWrapper(services)` with tooltip and template/icon capabilities. Create once outside React render; supply the host React, GoJS and gojs-react peers and detached mutable runtime props. Standalone supplies its existing helpers from a stable adapter. The palette uses the packaged normalization helpers, removing the duplicate application implementation.

Initialization requires a browser DOM. The existing idempotent node/link category guards patch the host GoJS model prototype when the factory is invoked; this behavior is retained during extraction, not claimed per-host isolated. Adapter/ref tests prove independent React refs and runtime props, not two simultaneous browser editors. Standalone palette rendering and Information drag/drop were checked visually. Context menus, relationship links and alternate model palettes require broader browser acceptance.

Legacy ts-nocheck and opaque runtime props remain. Parent containers and global CSS classes are still host-owned.

## Link runtime data

The Node-safe root exports link-port normalization, runtime point conversion and saved-path selection helpers. Existing point arrays keep their identity; GoJS-style iterators flatten to coordinate arrays. Longest-path and first-nonempty-path policies remain distinct. Valid port identifiers, unknown fields and routing values are preserved; missing/non-string ports retain the existing empty-string normalization. These helpers accept detached mutable runtime data and are not a persisted-data validator.

GoJSApp consumes emitted package helpers. The main canvas and target palette also reuse package boolean normalization, removing duplicate code. No render/layout algorithms were changed in this extraction.
