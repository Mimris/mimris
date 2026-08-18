# Implementation Plan: Shareable Focus Links

**Branch**: `004-shareable-focus-links` | **Date**: 2026-04-07 | **Spec**: [.specify/specs/004-shareable-focus-links/spec.md](./spec.md)
**Input**: Feature specification from `/.specify/specs/004-shareable-focus-links/spec.md`

## Summary
Unify the open-in-new-tab and copy-link actions around one compact focus URL, then make the `/model` page load the referenced GitHub-backed project directly from that URL so the link works when emailed.

## Technical Context
**Language/Version**: TypeScript and JavaScript  
**Primary Dependencies**: Next.js, React, Redux, existing GitHub raw-file loader  
**Storage**: URL query parameters, optional browser storage fallback, GitHub-hosted JSON project files  
**Testing**: manual browser verification, existing repo test command if available  
**Target Platform**: web application  
**Project Type**: web  
**Performance Goals**: no noticeable slowdown when opening a shared focus link  
**Constraints**: keep URLs compact; preserve compatibility with existing GitHub-backed project files; prefer incremental changes  
**Scale/Scope**: focused on share-link generation and `/model` page loading

## Constitution Check

- Persisted model compatibility: PASS
- Visual verification required: PASS, shared links should be checked in the browser
- Incremental change scope: PASS
- Metamodel/model/UI consistency: PASS

## Design Notes

- Generate share links with `URLSearchParams` so encoding and separators stay correct.
- Reuse one helper from both the copy-link action and the external-link button.
- Let `/model` prefer URL-driven loading when share parameters are present, then fall back to local browser storage for same-browser convenience.
- Resolve focus by id first and then by name for compatibility with older links or existing expectations.

## Files

- `src/components/utils/focusShare.js`
- `src/defs/ContextView.tsx`
- `src/pages/modelling.tsx`
- `src/pages/model.tsx`

## Validation

- Open the external-link button and confirm the new tab uses a compact `/model?...` URL.
- Copy the focus link and confirm the clipboard URL is well-formed and email-safe.
- Open the copied URL in a fresh browser context and confirm the referenced project loads from GitHub with the correct focused model/modelview.
- Confirm the link still works if the requested model/modelview is missing by falling back to the first available entries.
