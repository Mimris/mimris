## Mimris Agent Guide
- **Project shape**: Next.js Page Router app under `src/pages`, with Redux + Redux-Saga state in `src/store.tsx`, `src/reducers/reducer.js`, and `src/saga.js`.
- **UI shell**: `src/components/gojs/GoJSApp.tsx` hosts the GoJS diagram, palettes, and modals; `DiagramWrapper` in `src/components/gojs/components/Diagram.tsx` drives nearly all diagram behavior.
- **Metis runtime**: Domain data lives in a mutable `cxMetis` instance (see `src/akmm/metamodeller.ts`). Keep its `current*` pointers aligned when modifying models/metamodels.
- **State sources**: Redux `phData`/`phFocus`/`phUser` come from `startupModel/Mimris-template_PR.json`; reducers expect those shapes (`phData.metis.metamodels/models/...`).
- **Dispatch pattern**: Diagram code updates Redux by cloning class instances to plain JSON via `jsn` helpers (e.g., `new jsn.jsnObjectView(objview)`); always `JSON.stringify` payloads passed into action creators because they call `JSON.parse(data.value)`.
- **Example**: 
  ```ts
  const payload = JSON.stringify({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data });
  dispatch(setGojsModel({ value: payload }));
  ```
- **Saga IO**: `src/saga.js` handles `LOAD_DATA*` actions, reaching `http://localhost:4000/` or GitHub; respect cookie handling when touching fetch logic.
- **Layout helpers**: Automatic layout + drag/drop logic is centralized in `handleDoLayout`, `handleSaveLayout`, and `src/components/gojs/layout/DropLayoutManager.ts`; reuse `deriveDropLayoutConfig` when adding new presets.
- **Context menus**: HTML context menus are built through `build*MenuItems` in `Diagram.tsx`; extend via `HtmlMenuItem` arrays and `showSubMenu(...)` instead of direct DOM tweaks.
- **Mode switching**: Many handlers branch on `myMetis.modelType === 'Modelling' | 'Metamodelling'`; ensure new behavior respects both or gates appropriately.
- **Selections**: `phFocus` mirrors diagram selection; recompute focus via dispatchers like `UPDATE_*` actions and keep `myMetis.currentSelection` in sync when mutating.
- **Templates**: Node/link/group visuals come from `src/akmm/ui_templates.ts` and `uit.add*Templates`; update these instead of editing GoJS templates inline.
- **Drop rules**: BPMN-style drop behaviors derive from metamodel object types (see `buildDropLayoutOverridesFromMetis` in `GoJSApp.tsx`); extend there when new object types need special placement.
- **Persistence**: After model/layout mutations, commit back to Redux with `LOAD_TOSTORE_*` actions and update `jsn.jsnExportMetis` snapshots so the store reflects the GoJS state.
- **APIs**: Custom API routes under `src/pages/api` expose GraphQL (`graphql/`, `gqlschema/`) plus auth endpoints (`login.ts`, `signup.ts`); reuse existing fetch patterns from saga when adding endpoints.
- **External data**: GitHub integration flows through `src/components/githubServices/githubService` and saga `loadDataGithubSaga`; expect `org/repo/path/file` parameters.
- **Local file IO**: `src/components/LoadLocal` bridges file imports into Redux; use it as a reference for new import/export surfaces.
- **Styling**: Bootstrap/Reactstrap drive layout (see `src/components`), with custom CSS in `src/components/gojs/GoJSApp.css`; stay consistent with these utilities.
- **Build & dev**: `npm run dev` starts `tsc --downlevelIteration` and Next.js; `npm run watch` is the dedicated TypeScript watcher; `npm run build` runs `tsc` + `next build`.
- **TypeScript hygiene**: Many legacy files are `@ts-nocheck`; when adding TS code, prefer strict typing in new modules and avoid introducing implicit `any` into shared helpers.
- **GraphQL schema**: Generated SDL/resolvers live in `public/gql` and `src/pages/api/graphql`; update both schema and resolver when adjusting fields.
- **Documentation**: Project docs are under `docs/` and published to GitHub Pages; keep exec-level explanations in sync when altering major flows.
- **Testing status**: No automated tests yet (`npm test` placeholder). When adding tests, document how to run them here.
- **When unsure**: Trace from `DiagramWrapper` → `myMetis` → Redux reducer to confirm a change affects diagram, persisted model, and exported JSON consistently.
