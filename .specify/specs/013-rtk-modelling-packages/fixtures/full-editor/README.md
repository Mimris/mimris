# Full editor acceptance fixture

This is a temporary test app, not a standalone product route. It mounts the actual packaged modelling canvas and diagram with the existing standalone runtime/template/UI adapters, separate Toolkit stores and identical saved model IDs.

Copy AcceptanceScreen.jsx into the root of an isolated current Mimris checkout. Add src/pages/package-acceptance.jsx there:

```jsx
import dynamic from 'next/dynamic';
export default dynamic(() => import('../../AcceptanceScreen'), { ssr: false });
```

Install the checkout's dependencies, build the packages, then run `./node_modules/.bin/next dev -p 3106`. Webpack was used for the fixture with reused external dependencies; Turbopack did not resolve that temporary dependency layout. Open `/package-acceptance`.

The live report reads the native diagram and records the Shift flag at SelectionMoved. The saved report reads only the owning canonical store. A stable memoized canvas keeps diagnostic polling from forcing model reconciliation during dragging. The host wraps dispatch with bindLegacyUniverseDispatch because its reducer root contains only the canonical modelling slice rather than standalone's compatibility root reducer.

Test:

1. Move A's node and compare live/saved locations with B's unchanged state.
2. Drag the container from the white body, away from its ports and expander; repeat quickly. Inspect live/saved positions. Header/edge hit regions can initiate linking rather than movement.
3. Move a node into the container; verify both native and saved group IDs. Collapse/expand and verify visibility and unchanged position.
4. Save A, reload A and compare restored group/position/unknown fields while B remains unchanged.
5. For manual ungrouping, hold Shift throughout dragging the node outside. Check the recorded modifier is true and both group fields are cleared. The automated modifier attempt recorded false, so it did not establish Shift-drag acceptance.

The Save/Reload controls use host-local browser storage and remount the editor. They do not establish native file-dialog acceptance. Initial fixture testing also exercised a legacy textAndIcon group fallback; the retained seed uses groupWithPorts. Native routes, swimlanes/ports, undo/redo, long-session behavior and Workspace integration remain separate checks.
