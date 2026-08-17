# Implementation Plan: Generate Metamodel Project Files

**Branch**: `alpha-pre` | **Date**: 2026-08-01 | **Spec**: `spec.md`

## Summary

Extend the existing Metamodel-object generation command with explicit destinations. Reuse the current generator, then transform its serialized result into either a new portable project or a validated update of a selected project. Keep file transformation pure and independently tested; keep browser selection and download at the UI boundary.

## Technical Context

**Language/Version**: TypeScript/JavaScript, current Next.js runtime  
**Primary Dependencies**: React, GoJS, existing AKM serializers  
**Storage**: Browser-selected and downloaded JSON project files  
**Testing**: Node test runner, TypeScript, Next.js build  
**Target Platform**: Modern desktop browsers  
**Project Type**: Web application  
**Constraints**: No silent filesystem overwrite; preserve persisted project compatibility; incremental diagram change

## Constitution Check

- Active work is specified under `.specify/specs/`: PASS.
- Persisted model compatibility is explicitly preserved: PASS.
- Diagram behavior will receive visual verification: REQUIRED.
- Change is incremental and reuses existing generation: PASS.

## Design

1. Add pure helpers for provenance, new-project construction, existing-project validation/update, reference rewriting, and download naming.
2. Add focused unit tests before UI integration.
3. Refactor the context action so generation returns the serialized target metamodel to a selected destination.
4. Add a three-choice Generate Metamodel submenu.
5. Use a transient local JSON input for existing-project selection and a normal browser download for output.
6. Verify automated checks and the rendered menu workflow.

## Progress Tracking

- [x] Specification complete
- [x] Initial constitution check passed
- [x] Pure project transformation implemented and tested
- [x] Context-menu workflow implemented
- [x] Automated verification passed
- [ ] Visual interaction verification pending a populated TYPE modelview (the local startup view rendered empty)
