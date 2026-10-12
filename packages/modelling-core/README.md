# @mimris/modelling-core

Host-neutral universe types, Toolkit reducer/actions, compatibility selectors, legacy file/action adapters and pure appearance helpers. Each host owns its store. The package imports no React, Next.js, GoJS, storage, authentication or server modules.

Run `npm run build:core` and `npm run test:core` from the repository root. The build emits ESM JavaScript and declarations under `dist`; `npm pack` rebuilds and includes those artifacts. Toolkit is a peer dependency. Version 0.0.0 is a private extraction checkpoint, not a published release.

Consumers import the public package entry and supply `universeReducer` to their own store. For a different root shape, project its selected universe as `{ universe: hostState.workspace.selected }` before calling `selectMimrisCompatibilityProps`. Durable reducer results are readonly; editor runtimes must hydrate detached records.

Standalone transitional re-exports of built artifacts remain under `src/sharedUniverse` and `src/akmm/viewAppearance.ts`. They contain no implementation copies. Workspace integration and editor-package extraction remain separate pending work.
