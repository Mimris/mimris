# Packed-package browser consumer verification

Date: 2026-10-11. Tested checkpoint: `608c2f6a`.

## Scope and setup

A temporary independent Next.js consumer used core/editor npm tarballs built from the committed source. Both Mimris package directories were physical extracted archive files, not source symlinks. Existing installed application/peer dependencies were reused through symlinks; this is not a clean registry-install or dependency-resolution test. No application modules, standalone routes or Workspace code were imported by the fixture.

The fixture mounts two host-owned Toolkit stores using identical model/object/view IDs. It imports the public core reducer/actions/selectors and editor host binding, hydration, callback lifecycle, InspectorRow, Palette factory and GuidedDraggingTool. A simple consumer-owned GoJS canvas stands in for the not-yet-exported full Mimris canvas. Metis hydration uses a minimal fixture runtime, not the full AKM implementation. Persistence is host-scoped browser localStorage, not a server or file download.

Server: temporary app on localhost:3102, Next.js development webpack build; HTTP GET / returned 200. Fixture source is retained under fixtures/packed-consumer. To recreate, build/pack the checkpoint packages, extract them under a separate app's node_modules/@mimris, supply compatible Next/React/Toolkit/GoJS/gojs-react and declared editor dependencies, place index.jsx under pages/index.jsx and TestScreen.jsx at the app root, then run Next locally. The included config transpiles the two public package names.

## Observed browser results

- Editing A's packaged InspectorRow changed A's canonical object name while B remained unchanged. Editing B separately also left A unchanged.
- Dragging A's existing node with the packaged tool changed A's durable location from 40 40 to 140 90; B stayed at 40 40.
- Saving A, resetting A and reloading A restored its name and geometry. Unknown object/view/project fields remained keep/keep/keep.
- Both packaged palettes rendered concurrently with independent React refs and runtime props.
- Queued 5-second edits for both instances, then closed A while B was still pending. B completed; the visible completion audit contained only B, proving A's callback was canceled.
- Restoring A and reloading its saved state did not reset B's completed edit.
- Fresh final browser session had no console warnings or errors. An earlier fixture setup omitted the consumer canvas linkKeyProperty required by gojs-react; corrected in the fixture before acceptance and reran with fresh logs. No package code was changed.

Screenshots: /tmp/mimris-packed-two-instances-final.jpg and /tmp/mimris-packed-lifecycle.jpg. Temporary tabs and server were closed/stopped after verification.

Archive SHA-256:
- core: 79319ceb6502c872cc75f0a16b2f67900b743902a031c030582097599a4e76c4
- editor: f050bd97279156bc71abbf8f9e7d90bd9dcfab7a7f4fb9affb414e1e78bf293a

## Remaining acceptance

This passes the scoped component/store/lifecycle consumer check, not full two-editor Mimris acceptance. Full canvas and AKM integration, palette-to-canvas creation with durable persistence, relationships, groups/swimlanes, undo/redo, file reopening, package asset serving, clean dependency installation and Workspace integration remain pending. The relationship form/CSS and SelectionInspector factory were not mounted in this fixture. Existing GoJS prototype guards still have shared effects; the observed flow does not establish complete host isolation.

## Clean installed current package checkpoint (2026-10-12)

- Built current artifacts and installed their tarballs with npm into /tmp/mimris-clean-consumer-7iwhmmr3 with no source/dependency symlinks. The final installation reused registry cache after the first clean install. Public core/editor/canvas/diagram imports and consumer production build passed. npm dependency listing showed React 18.3.1 and GoJS 3.1.10 deduplicated with gojs-react 1.1.3; Toolkit 2.12.0 and Next 15.5.19 were used. This verifies package dependency resolution, unlike the earlier reused-peer fixture.
- Confirmed 43 installed packaged asset files. Final editor artifact includes the corrected dynamic template service usage; no static/dynamic application imports remain in canvas/diagram implementations.
- Browser on localhost:3104: changed A name, saved/reset/reloaded; B stayed unchanged. Moved A from 40 40 to 110 80, saved, closed/restored/reloaded and recovered that geometry and name with unknown fields intact. Closed A while both hosts had delayed edits; only B completed. Final browser logs were clean. Screenshot /tmp/mimris-clean-consumer-verified.jpg. Temporary tab/server closed/stopped.
- This fixture still uses a consumer-owned canvas with packaged row/palette/tools. Public main/diagram factories were imported and separately construction-tested, but full simultaneous Mimris-editor rendering and complete runtime/template adapter integration are not established by this consumer check. Grouping, routes/ports/swimlanes, undo/redo, native file reopening and performance acceptance remain open.

Final artifact SHA-256:
- mimris-modelling-core-0.0.0.tgz: 79319ceb6502c872cc75f0a16b2f67900b743902a031c030582097599a4e76c4
- mimris-modelling-editor-0.0.0.tgz: ff27b750980b4f327c046b800d06e4d1ea1815bf7c6e025c62ebfc5028d3a273

The final public CSS export includes its own class-mapping declaration. An installed consumer TypeScript check imported that stylesheet without a Mimris-specific ambient shim and passed. Final package metadata uses workspace-linked 0.0.0 build dependencies; the corrected artifact was reinstalled from an empty consumer node_modules with the existing registry cache.

## Two complete packaged editors with standalone adapters (2026-10-12)

- Retained fixture: fixtures/full-editor/AcceptanceScreen.jsx and README.md. Unlike the earlier consumer-owned test canvas, this mounts actual createModellingCanvas/createDiagramEditor composition and native GoJS interactions, using existing standalone runtime/template/UI adapters, independent stores and identical saved IDs.
- Fixture host dispatch initially omitted legacy-action adaptation for its core-only reducer. Added bindLegacyUniverseDispatch; live node movement then updated the owning canonical store. Stable memoized props prevent diagnostic polling from triggering reconciliation during a drag. Fresh page reloads were used after fixture changes; HMR-preserved native state is not acceptance evidence.
- A node moved from 40 80 to 100 110, then 140 130; live/saved membership matched the registered container. Placed it clearly in the container at 500 244. Native collapse hid it; expand restored visibility and the same location. Host save/reload restored membership, geometry and unknown fields; B remained at its original values.
- Ported container movement verified from the white body (header/edge hits can initiate linking). Two consecutive container drops at 08:16:39.547 and 08:16:39.959 UTC were 0.412 seconds apart, inside the old 12-second lock window. Live and saved positions advanced from 436.9868995633188 204.36681222707426 to 458.73362445414847 215.2401746724891 and remained stable. B's container stayed at 350 150.
- Current ported-template member save/reload also retained group membership and location 295.5240174672489 106.09606986899567, with unknown fields kept and B unchanged. Screenshot /tmp/mimris-full-editor-acceptance.png includes both complete editor instances.
- Automated Shift+drag did not detach; the recorded native event had shift=false. This is not evidence of a product detach failure or pass. Manual Shift-drag, native file opening, complex routes/swimlanes/ports, undo/redo and long-session/performance acceptance remain pending.
- Full-editor rendering exposed an empty style jsx block warning in the emitted package. Removed the empty block (no CSS content) and added a regression assertion; no visual styling behavior changed. Old warning logs from before that correction are not fresh-run errors.
