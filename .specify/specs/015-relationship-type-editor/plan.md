# Implementation Plan

1. Use the existing Metamodel relationship context-menu entry to open a dedicated editor.
2. Create an isolated draft with Definition and Appearance sections; normalize repaired legacy runtime endpoints for display.
3. Validate the draft before changing the live type. Keep IDs, properties, inheritance, and persisted schema intact.
4. Apply definition and appearance, reconcile endpoint adjacency, refresh metamodel links, and dispatch production serialized type/type-view updates.
5. Keep the dialog usable at smaller viewport heights with a scrolling body and accessible Apply/Cancel controls.
6. Verify with kernel serialization/import tests, universe persistence tests, the production build, and the full application in an isolated browser profile.

No migration or automatic rewriting of existing model relationships is included. Type usage reporting remains future work.
