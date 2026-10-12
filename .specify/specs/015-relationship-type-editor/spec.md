# Feature Specification: Relationship Type Editor

**Created**: 2026-10-08
**Status**: Implemented and verified

## User Story

Select a relationship in the Metamodel view, edit its definition and appearance, apply the changes, and save/reopen the project without losing them.

## Requirements

- Edit name, description, source and target object types, and cardinality at each end in a Definition section.
- Edit line color, width, style, arrowheads, and end labels in a separate Appearance section.
- Keep edits in a draft. Cancel and closing the dialog must not mutate the live type or diagram.
- Apply must validate a non-empty name, existing non-deleted endpoint types, non-negative cardinalities (`0`, `1`, `*`, `0..1`, `1..*`, etc.), and a positive line width.
- Apply must update the relationship diagram and dispatch serialized relationship type and type-view updates through the existing persistence path.
- Preserve type IDs, type-view IDs, properties, inheritance, and existing project formats. No migration is required.
- Existing model relationships are not migrated when endpoint definitions change. Usage reporting and impact analysis are a later increment.

## Acceptance

1. Change a relationship name, cardinality, and appearance, then Apply: diagram label, cardinalities, and styling refresh.
2. Save and reopen: edits and stable IDs remain intact.
3. Cancel edits: live type and diagram remain unchanged.
4. Invalid endpoints, reversed cardinality bounds, and invalid line widths keep the editor open with a readable error.
5. Change endpoints: the metamodel link connects the selected types and endpoint type adjacency lists remain consistent.

## Verification

- Regression tests for draft isolation, validation, endpoint updates, styling, serialization, and persistence.
- Production build and repository tests.
- Visual inspection of Definition/Appearance controls, validation, Apply, and Cancel.

### Results (2026-10-08)

- All 66 tests pass, including draft isolation, repaired legacy endpoints, invalid cardinality ranges, endpoint membership, production serialization/import, and persisted universe updates.
- Production build passes TypeScript checking, compilation, and generation of all 33 static pages.
- Browser verification in the full application with IRTV_META: Cancel leaves the type unchanged; reversed bounds block Apply; editing `performs` updates its label, cardinalities, blue dashed line, Diamond arrow, and end labels. The serialized project snapshot contains the updates and stable type/type-view IDs.
- Reloading the saved browser project restores the edited definition and appearance. Changing the target from Task to Information reconnects the metamodel link while retaining its ID and styling.
- A portable JSON round trip is covered by the production serializer/importer test; the browser check covers the saved session snapshot rather than the download/upload file picker.

### Relationship Typeview Reload Fix

- The existing **Edit Relationship Typeview** dialog MUST persist edits on Done for relationship links, even though no node shares the link key.
- Done MUST preserve explicitly edited arrowheads and MUST NOT replace diagram endpoint keys with type-view styling fields.
- The typeview opener resolves metamodel links through `reltype`, `relshiptype`, or a stable relationship type reference.
- Regression coverage executes the production modal save handler and checks serialized dispatch and browser snapshot persistence. All 67 repository tests and standalone TypeScript checking pass.
- Full application browser verification: change the `performs` typeview to a blue line and Diamond arrow, click Done, then the application's Reload. Both values remain in the saved snapshot and rebuilt metamodel diagram.
- Legacy inspector field updates use a shallow React state update because cyclic runtime diagram references cannot be finalized with Immer. The same Done/Reload browser check completes without the development error overlay.
