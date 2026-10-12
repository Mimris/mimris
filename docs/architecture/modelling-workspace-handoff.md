# Modelling packages: Workspace handoff

Updated 2026-10-12. This documents implemented package boundaries in Mimris; it does not claim changes to mimris-ai-workspace.

## Package status

Both packages are private, version 0.0.0, ESM and GPL-3.0-only. Deliver them as locally built tarballs or workspace dependencies; they are not published registry packages. GoJS licensing remains the host's responsibility, including the retained Northwoods notices.

- `@mimris/modelling-core`: serializable Toolkit reducer, operations, selectors, compatibility dispatch and appearance helpers. `/appearance` is also exported.
- `@mimris/modelling-editor`: Node-safe runtime/host helpers and contracts.
- `/canvas`: `createModellingCanvas`, the main modelling orchestration component.
- `/diagram`: `createDiagramEditor`, the GoJS diagram and interaction implementation.
- `/gojs`: drag/layout/geometry helpers and tools.
- `/palette`, `/selection-inspector`, `/inspector-row`, `/react`: previously extracted UI exports.
- `/relationship-type-editor.css`, `/assets/*`: packaged stylesheet and image files.

Build core before editor. Root `npm test`, `npm run build` and `npm run dev` build both automatically. The repository pins pnpm 10.15.0 and maintains pnpm-lock.yaml; use `pnpm install --frozen-lockfile` for reproducible installation. npm scripts are command runners and remain supported. Do not introduce a competing lockfile. Root dependencies name the matching 0.0.0 workspace packages, with workspace membership for npm and pnpm and explicit pnpm workspace linking. Building after installation updates the same linked workspace artifacts rather than an installed copy of absent build output. Standalone imports public entries rather than private emitted paths.

The clean consumer verified React 18.3.1, React DOM 18.3.1, Toolkit 2.12.0, GoJS 3.1.10, gojs-react 1.1.3 and Next 15.5.19. The manifests state compatible peer ranges; these versions are evidence, not a latest-version recommendation. Dependency listing shows React and GoJS deduplicated. Existing GoJS ESM/CommonJS global warnings remain and do not establish complete prototype isolation.

## Host composition

The canonical slice fields are `world.worldDefinition.domain`, `world.worldModel.metis`, `world.focus`, `user`, `source` and compatibility documents/modelList/phDataMetadata. Keep Workspace metadata in its own host-owned state and use modelling operations on the owned slice.

The host owns its Redux store, root shape, persistence, routing, authentication, sharing and file operations. For a host composing only the core reducer, wrap legacy editor dispatch with `bindLegacyUniverseDispatch` before sending it to the store. Standalone already supplies its compatibility root behavior. Bind each mutable Metis runtime with `bindEditorHost`; project its own store into the compatibility shape with `selectMimrisCompatibilityProps`. Hydrate mutable runtime data from clones using `hydrateEditorRuntime`. Durable edits return as serializable actions; never store live GoJS/Metis objects in Redux.

Create factories outside React rendering, retaining their component identities:

```tsx
import { createDiagramEditor } from '@mimris/modelling-editor/diagram';
import { createModellingCanvas } from '@mimris/modelling-editor/canvas';

const Diagram = createDiagramEditor({
  services: diagramRuntimeServices,
  components: diagramUiComponents,
  projects: projectCapabilities,
});
const ModellingCanvas = createModellingCanvas({
  services: canvasRuntimeServices,
  components: { ...canvasUiComponents, DiagramWrapper: Diagram },
  isAutomaticallyDroppedSelfRelationship,
});
```

The existing standalone adapters are concrete examples: `src/editorHost/canvasServices.ts`, `canvasComponents.ts`, `diagramServices.ts`, `diagramComponents.ts` and `diagramProjectServices.ts`. Workspace must supply corresponding runtime/template/UI capabilities. Those implementations still reside in the host; the editor package does not import Mimris's application source. Legacy capability signatures and component props remain opaque during extraction, with ts-nocheck in large legacy components. This is not a fully typed editor API redesign.

Project generation, selecting existing project files and downloading generated projects are explicit `DiagramProjectServices` capabilities. Standalone uses browser file/download helpers in `generatedProjectFiles.ts`. Workspace can provide its own project workflow; server/database/auth logic stays outside both packages.

Global layout/modal/Bootstrap styling remains host-owned. The public stylesheet export includes its class-mapping declaration, so consumers need no app-specific type shim. Import the packaged relationship stylesheet and supply its class mapping/form ID through the diagram UI adapter. Preserve existing saved icon identifiers. There are 43 bundled image files; `resolveEditorAssetUrl(value, assetBaseUrl)` can map known identifiers to host-served URLs while retaining unknown/remote identifiers. Existing `property.png` is unresolved. Serving all packaged assets in Workspace remains an integration task.

## Verification and remaining acceptance

Implemented and verified: public core/editor/canvas/diagram import boundaries, native helper tests, standalone production build, actual clean npm tarball installation and consumer production build. The clean consumer used a differently shaped host root and physically installed artifacts, with independent edits, movement, save/reset/reload, unknown-field preservation and cancellation for only the closed host. Its canvas is consumer-owned; this is not full simultaneous Mimris-editor acceptance.

Standalone browser checks cover palette rendering/drop and basic object-view dialog interaction. A subsequent fixture mounted two complete packaged editors with standalone adapters and verified scoped movement, registered membership, collapse/expand, host save/remount/reload and rapid container moves 0.412 seconds apart. This does not establish every host policy or full Workspace consumption. Manual Shift-drag ungrouping, relationship routes, swimlanes/ports, undo/redo, native file open/save/reopen and long-session performance remain acceptance gates. Shared category prototype guards are retained and must be assessed for differing host policies. Do not treat focused tests or factory construction as proof of those browser flows.

Next Workspace change: install the tarballs, implement the adapters, mount one editor with a Workspace-owned store and project persistence, then run those acceptance gates. Sharing universes/worlds/models between roles is a later Workspace-owned server feature; it is not implemented by this handoff.
