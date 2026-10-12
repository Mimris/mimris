# Modelling core package

`packages/modelling-core` owns the canonical universe types, Toolkit reducer/actions, compatibility selectors, persisted-file/action adapters and pure appearance helpers. It depends only on the host's Redux Toolkit peer and does not create a store or import application/editor services.

Build and verify from the repository root:

```sh
npm run build:core
npm run test:core
```

The package emits ESM and TypeScript declarations under `dist`. Its public entries are `@mimris/modelling-core` and `@mimris/modelling-core/appearance`. Version 0.0.0 is a private extraction checkpoint. `npm pack` in the package directory rebuilds artifacts through its prepack hook.

A host creates its own store and can use any enclosing root shape:

```ts
import { configureStore } from '@reduxjs/toolkit';
import { universeReducer, selectMimrisCompatibilityProps } from '@mimris/modelling-core';

const store = configureStore({ reducer: { selectedUniverse: universeReducer } });
const editorProps = selectMimrisCompatibilityProps({
  universe: store.getState().selectedUniverse,
});
```

Durable reducer snapshots are readonly. Mutable Metis/GoJS runtime instances must hydrate detached data; they do not belong to core or Redux. Hosts own browser/file persistence, server integration, authentication and permissions.

Standalone imports currently pass through thin re-exports of built package artifacts under `src/sharedUniverse` and `src/akmm/viewAppearance.ts`. Dev/build/test scripts build core first, so webpack and Turbopack both resolve real ESM files without application-specific extension aliases. Run `npm run watch:core` alongside development when editing package sources.

Extraction verification includes a no-DOM Node consumer, independent host stores, source-import boundaries, a tarball installation and consumer declaration checking. The editor package, public package-name wiring in standalone and actual Workspace integration remain pending.
