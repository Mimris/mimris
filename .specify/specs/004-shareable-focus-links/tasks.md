# Tasks: Shareable Focus Links

**Input**: Design documents from `/.specify/specs/004-shareable-focus-links/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Canonical Share URL

- [x] T001 Add a shared focus-link builder that emits compact canonical `/model` URLs in `src/components/utils/focusShare.js`
- [x] T002 Make the copy-link action use the canonical focus-link builder in `src/defs/ContextView.tsx`
- [x] T003 Make the external-link button use the same canonical focus-link builder in `src/pages/modelling.tsx`

## Phase 2: Shared Link Loading

- [x] T004 Make `/model` load GitHub-backed project data directly from canonical share parameters in `src/pages/model.tsx`
- [x] T005 Resolve focused model and modelview defensively from the shared link in `src/pages/model.tsx`
- [x] T006 Show explicit loading, fetch-error, and empty-model states for shared links in `src/pages/model.tsx`

## Phase 3: Validation

- [ ] T007 Manually verify copied focus links are compact and well-formed
- [ ] T008 Manually verify the external-link button opens the same canonical URL shape
- [ ] T009 Manually verify a copied link works in a fresh browser context without prior local storage
