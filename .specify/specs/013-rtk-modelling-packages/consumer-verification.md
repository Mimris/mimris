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
