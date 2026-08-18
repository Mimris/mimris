# Implementation Plan: IDEF0 ICOM Layout

**Branch**: `001-idef0-icom-layout` | **Date**: 2026-03-14 | **Spec**: [.specify/specs/001-idef0-icom-layout/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/001-idef0-icom-layout/spec.md`

## Summary
Adjust IDEF0 ICOM marker geometry, label placement, default relship routing, and auto-routed point persistence so diagrams remain readable and reroute cleanly after movement.

## Technical Context
**Language/Version**: TypeScript  
**Primary Dependencies**: Next.js, React, GoJS, Redux  
**Storage**: persisted model and modelview JSON files  
**Testing**: manual visual verification, existing repo test command if available  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable regression in diagram rendering responsiveness  
**Constraints**: preserve persisted model compatibility; tune geometry incrementally  
**Scale/Scope**: focused on `src/akmm/ui_templates.ts` plus routing and point-persistence behavior in related diagram/model build code

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS, must be manually checked
- Incremental change scope: PASS
- Metamodel/model/UI consistency: PASS

## Research Notes

- The output side label collision is better solved by moving the label corridor than by forcing layer order.
- Side hookup geometry must be adjusted without moving the visible stub to the wrong side.
- Top and bottom strips require independent tuning because they do not visually align the same way.

## Design Notes

- Keep side marker lines visually neutral and short.
- Keep side labels slightly transparent rather than adding an opaque visible background block.
- Use orthogonal routing as the default fallback only when no explicit relview routing exists.
- Avoid storing point arrays for auto-routed `Orthogonal` and `AvoidsNodes` links so GoJS can recompute current paths.
- Allow top/bottom labels to wrap to two lines with compact horizontal spacing.
- Keep `getGroupByLocation` in `src/akmm/ui_common.ts` as a single implementation block after merge resolution so the grouping behavior remains buildable.

## Files

- `src/akmm/ui_templates.ts`
- `src/akmm/ui_buildmodels.ts`
- `src/akmm/ui_diagram.ts`
- `src/akmm/ui_gojs.ts`
- `docs/_specs/Overview.md`

## Validation

- Open an IDEF0 example and check input/output hookups near the group border.
- Check a long output label against an orthogonal routed relship.
- Check top control and bottom mechanism strips against the visible group border.
- Check top/bottom label wrapping and spacing with both one-line and two-line labels.
- Check that orthogonal and `AvoidsNodes` links reroute cleanly after movement without replaying stale stored points.
- Check that explicitly stored non-orthogonal link points still persist across save and reload.
