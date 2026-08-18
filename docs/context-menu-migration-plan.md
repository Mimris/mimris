# Context Menu Migration Plan

## Scope
Migrate from mixed context menu systems to a single HTML context menu system in:

- `src/components/gojs/components/Diagram.tsx`

Current state:

- New HTML menus are active for background, node, and link contexts.
- Legacy GoJS menus are still reachable through `More… (old menu)` in all three contexts.

## Parity Matrix

### Background context

| Status | Items |
| --- | --- |
| Migrated | Paste, Paste View, Select…, Copy Selected, Model…, Modelview…, Metamodel…, Relationship…, Layout…, Zoom All, Zoom Selection, Verify & Repair Model, Verify & Repair Metamodels, New/Edit/Delete Model, New/Edit/Delete Modelview, New/Edit/Delete/Replace/Add/Clear Metamodel, Add Missing Relationship Views, Unhide Hidden Relationship Views, Delete Invisible Objects, Undelete Selection, Set Layout Scheme, Do Layout, Save Layout, Open / Close All Groups, Toggle Cardinality / Relationship Kind / Relationship Names / Ask for Relationship Name / Include Inherited Reltypes |
| Missing (old-only) | Set Link Routing, Set Link Curve, New Target Model, Set Target Model, Update Project from AdminModel, Set Modelview as Template, !!! PURGE DELETED !!! |
| Legacy-only but likely deprecated/debug/disabled | Generate SVG, Toggle Admin layer, Modelview nodes, Modelview links, Make Diagram, Verify and Repair myMetis, Clear RelationshipTypeViews, Generate Metamodel |

### Node context

| Status | Items |
| --- | --- |
| Migrated | Copy, Paste, Paste View, Edit Object, Edit Object View, Connect to Selected, Add Connected Objects, Hide Connected Relationships, Sort Selection, Delete Selection, Delete Selected Views, Delete / Delete View, Edit Relationship Type, Select All Objects of This Type, Delete… |
| Missing (old-only) | Change Icon, Change Object Type, Edit Object Type, Execute Method, Export Task Model, Generate Datatype, Generate Submodel(s), Generate Target Object Type, Generate osduIds, Open Group, Convert to Group, Convert to Node, Align Vertical, Align Horizontal, Spread Even Vertical, Spread Even Horizontal, Select Content, Show Typeview, Reset to Typeview (for nodes), Do Layout (group-scoped variant), Set Layout Scheme (group-scoped variant) |
| Legacy-only but likely deprecated/debug/disabled | Add Lane(s), Edit Attribute (currently guarded off in old menu), Cut, Test Eval, Test InputPattern, Get My Scale, Select connected objects |

### Link context

| Status | Items |
| --- | --- |
| Migrated | Edit Relationship, Edit Relationship View, Change Relationship Type, Clear Path, Show Typeview, Reset to Typeview, Edit Relationship Type, Select All Relationships of This Type, Select All Between These Objects, Sort Selection, Delete Selection, Delete Selected Views, Delete / Delete View, Delete… |
| Missing (old-only) | Hide View, Select all views of this relationship, Swap Direction, New Typeview, Generate Relationship Type |
| Legacy-only but likely deprecated/debug/disabled | Cut, Edit Attribute (guarded off), Add to Selection, TEST |

### Port context

| Status | Items |
| --- | --- |
| Missing (old-only) | Add Port, Change port name, Change port color, Remove port |

## Priority Backlog

1. Eliminate functional gaps used in normal modelling flow.
2. Keep low-value debug/admin items out of the new menu unless explicitly needed.
3. Remove legacy fallback only after parity and tests are in place.

### P1 (high value)

1. Link: `Hide View`, `Select all views of this relationship`, `Swap Direction`.
2. Node: `Change Icon`, `Open Group`, group layout/align/spread actions.
3. Background: `Set Link Routing`, `Set Link Curve`.
4. Port: add dedicated HTML port submenu parity.

### P2 (conditional, depends on product decision)

1. Node method-driven actions (`Execute Method`, `Generate osduIds`, `Generate Datatype`, `Generate Submodel(s)`).
2. Background target-model/admin actions (`New/Set Target Model`, `Update Project from AdminModel`, `Set Modelview as Template`, `PURGE DELETED`).
3. Link `New Typeview` and `Generate Relationship Type`.

### P3 (cleanup)

1. Remove dead/disabled legacy actions that always evaluate to unavailable.
2. Remove `More… (old menu)` entries.
3. Delete `advancedPartContextMenu`, `advancedLinkContextMenu`, and `advancedContextMenu` blocks.

## Implementation Plan

1. Create a menu action registry:
   - `id`, `label`, `context`, `visible`, `enabled`, `run`.
2. Build context menus from registry + context reducers:
   - `background`, `node(object/objecttype/group)`, `link(relationship/typeview)`, `port`.
3. Migrate P1 actions first with feature flags if needed.
4. Add tests for visibility/enabled rules and three right-click integration paths.
5. Remove legacy fallback and run final regression pass.

## Definition of Done

1. No `More… (old menu)` in background/node/link menus.
2. Legacy advanced menu definitions removed from `Diagram.tsx`.
3. All accepted actions represented in new registry.
4. Tests cover menu visibility and key action dispatch flows.
