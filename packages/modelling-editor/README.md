# @mimris/modelling-editor

Initial portable host/runtime foundation for the Mimris editor. Exports scoped host access, optional draft hooks, detached runtime hydration, per-diagram drag protection, node reconciliation and deferred callback cleanup.

The relationship-type React form is exported from `@mimris/modelling-editor/react`, with its CSS module included and exported as `@mimris/modelling-editor/relationship-type-editor.css`. A compatible React peer and CSS-module bundler are required for that client entry; existing Bootstrap form/utility classes are supplied by the host. The root helper entry stays safe to import without a DOM.

This checkpoint does **not** export the full GoJS canvas/editor. Remaining components, icon assets and their host-owned seams still require extraction. A separate `/gojs` entry now exports guided dragging/drop-layout helpers using the tested GoJS 3.1.10 host peer. The full canvas/helper graph and complete browser-consumer acceptance remain pending.

Run `npm run build:packages` or `npm run test:editor` from the repository root. `npm pack` rebuilds this package; build core first. ESM JavaScript and declarations are emitted under `dist`. Core and Toolkit are public type peers; the local build maps core declarations from the sibling package without importing application source.

Hosts supply their own state projection, dispatch and optional persistence. Mutable runtimes hydrate detached snapshots. The package does not create a store, choose browser storage, import Next routes or own server authentication/permissions.

Standalone transitional re-exports remain under `src/editorHost` and `src/editorRuntime` and point at built artifacts. Run `watch:core` and `watch:editor` alongside development when editing package sources. Version 0.0.0 is private and has not been published.

Palette normalization and shallow change-detection helpers are also exported from the root. Normalize detached mutable runtime data only; the helpers retain the existing in-place boolean normalization behavior.

`@mimris/modelling-editor/inspector-row` exports the client property row independently of the CSS-module form entry. React is a host peer and regex-parser is a package dependency. Parent inspector/modal and Bootstrap utility styling stay host-owned.

`@mimris/modelling-editor/selection-inspector` exports a component factory with explicit runtime/policy/catalog capabilities. Create once outside React render; pass detached mutable runtime objects. Application-specific adapter and modal composition stay in the host.

`@mimris/modelling-editor/palette` exports a component factory for the palette wrapper with explicit tooltip/icon/template capabilities. It requires a browser DOM and host GoJS/gojs-react peers. Create once outside render.

The Node-safe root also exports link-port/point normalization and saved-path selection. Existing saved coordinate arrays and valid ports are preserved; normalization operates on detached mutable runtime data.
