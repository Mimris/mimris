# Implementation Plan: Snapshot Share Links

**Branch**: `005-snapshot-share-links` | **Date**: 2026-04-07 | **Spec**: [.specify/specs/005-snapshot-share-links/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/005-snapshot-share-links/spec.md`

## Summary
Add file-backed snapshot storage under `data/shares`, return short ids through an API route, and make the existing open/copy share actions use those snapshot links so local-file state can be sent to other people.

## Technical Context
**Language/Version**: TypeScript and JavaScript  
**Primary Dependencies**: Next.js API routes, Node.js filesystem APIs, React  
**Storage**: server-side JSON files under `data/shares`  
**Testing**: manual browser verification, existing repo test command if available  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: share creation should complete fast enough to feel immediate in the UI  
**Constraints**: keep share links short; do not expose raw snapshot files through `public/`; preserve modelling-state compatibility  
**Scale/Scope**: focused on snapshot API routes, share-link generation, and `/model` share loading

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS, snapshot links should be checked in the browser
- Incremental change scope: PASS
- Metamodel/model/UI consistency: PASS

## Design Notes

- Store snapshots as JSON files in `data/shares` with application-controlled read access through API routes.
- Use short generated ids in links rather than embedding model data in the URL.
- Let `/model?share=<id>` load the snapshot first, before falling back to local browser state or GitHub-backed source loading.
- Use one client-side helper so both the external-link button and the copy-link action create links the same way.

## Files

- `src/pages/api/share/index.ts`
- `src/pages/api/share/[id].ts`
- `src/components/utils/focusShare.js`
- `src/defs/ContextView.tsx`
- `src/pages/modelling.tsx`
- `src/pages/model.tsx`
- `.gitignore`
- `data/shares/.gitkeep`

## Validation

- Click the external-link button on a local-file project and confirm it opens a short `share=` link in a new tab.
- Copy the link and confirm another browser context can load the same snapshot.
- Confirm invalid share ids show a clear error.
- Confirm snapshots with no models show the explicit empty-file message.
