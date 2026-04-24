# Tasks: Snapshot Share Links

**Input**: Design documents from `/.specify/specs/005-snapshot-share-links/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Snapshot Storage

- [x] T001 Add a file-backed snapshot create API in `src/pages/api/share/index.ts`
- [x] T002 Add a snapshot read API in `src/pages/api/share/[id].ts`
- [x] T003 Keep generated snapshot JSON files out of git while preserving the share directory in `.gitignore` and `data/shares/.gitkeep`

## Phase 2: Share-Link Generation

- [x] T004 Add client helpers to create short snapshot share links in `src/components/utils/focusShare.js`
- [x] T005 Make the copy-link action create snapshot share links in `src/defs/ContextView.tsx`
- [x] T006 Make the external-link button create snapshot share links in `src/pages/modelling.tsx`

## Phase 3: Share Loading

- [x] T007 Make `/model` load snapshot shares from `share=<id>` before local-state or GitHub fallback in `src/pages/model.tsx`
- [x] T008 Restore shared focus defensively from snapshot state in `src/pages/model.tsx`
- [x] T009 Show clear missing-share and empty-model states in `src/pages/model.tsx`

## Phase 4: Validation

- [ ] T010 Manually verify local-file snapshots open in a new tab
- [ ] T011 Manually verify copied snapshot links work in another browser context
- [ ] T012 Manually verify invalid share ids show a clear error
