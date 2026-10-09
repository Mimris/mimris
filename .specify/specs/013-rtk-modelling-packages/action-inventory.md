# Legacy action inventory

Generated from source on 2026-10-08 at implementation baseline plus the first host-access increment. Static inventory only; identifiers may be imported through action creators, and reducer matches do not prove behavior parity.

| Action | Canonical source mentions | Consumer files with literal action/type |
| --- | --- | --- |
| FAILURE | No | `src/saga.js` |
| LOAD_DATAGITHUB_SUCCESS | Yes | Trace action-creator imports |
| LOAD_DATAMODELLIST_SUCCESS | Yes | Trace action-creator imports |
| LOAD_DATAMODEL_SUCCESS | Yes | Trace action-creator imports |
| LOAD_DATA_SUCCESS | Yes | Trace action-creator imports |
| LOAD_TOSTORE_DATA | Yes | `src/pages/model.tsx` |
| LOAD_TOSTORE_NEWMODEL | Yes | Trace action-creator imports |
| LOAD_TOSTORE_NEWMODELVIEW | Yes | `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_diagram.ts` |
| LOAD_TOSTORE_PHDATA | Yes | `src/components/utils/SelectContext.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_diagram.ts`, `src/akmm/ui_common.ts` (additional files) |
| LOAD_TOSTORE_PHFOCUS | Yes | `src/components/utils/SelectContext.tsx`, `src/pages/Login.tsx`, `src/pages/tasks.tsx` |
| LOAD_TOSTORE_PHSOURCE | Yes | `src/components/utils/SelectContext.tsx`, `src/pages/tasks.tsx` |
| LOAD_TOSTORE_PHUSER | Yes | `src/pages/tasks.tsx` |
| REORDER_MODELS | Yes | `src/components/Modelling.tsx`, `src/components/modelSuite/Model.tsx` |
| REORDER_MODELVIEWS | Yes | `src/components/Modeller.tsx` |
| SET_CURRENT_METAMODEL | Yes | `src/components/Palette.tsx` |
| SET_FOCUS_COLLECTION | Yes | Trace action-creator imports |
| SET_FOCUS_ISSUE | Yes | `src/components/Issues.tsx` |
| SET_FOCUS_MODEL | Yes | `src/components/Modelling.tsx`, `src/components/Modeller.tsx`, `src/components/TargetModeller.tsx`, `src/components/loadModelData/LoadServer.tsx`, `src/components/modelSuite/Model.tsx` (additional files) |
| SET_FOCUS_MODELVIEW | Yes | `src/components/Modelling.tsx`, `src/components/Modeller.tsx`, `src/components/TargetModeller.tsx`, `src/components/loadModelData/LoadServer.tsx`, `src/components/modelSuite/Model.tsx` (additional files) |
| SET_FOCUS_OBJECT | Yes | `src/components/FocusDetails.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/GoJSPaletteApp.tsx`, `src/components/table/ObjectTable.tsx` |
| SET_FOCUS_OBJECTTYPE | Yes | `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/GoJSPaletteApp.tsx` |
| SET_FOCUS_OBJECTVIEW | Yes | `src/components/FocusDetails.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/GoJSPaletteApp.tsx` |
| SET_FOCUS_ORG | Yes | Trace action-creator imports |
| SET_FOCUS_PHFOCUS | Yes | Trace action-creator imports |
| SET_FOCUS_PROJ | Yes | `src/components/Modeller.tsx`, `src/components/forms/ProjectDetailsForm.tsx`, `src/pages/project.tsx` |
| SET_FOCUS_REFRESH | Yes | `src/components/FocusDetails.tsx`, `src/components/Modelling.tsx`, `src/components/Modeller.tsx`, `src/components/loadModelData/LoadGithubParams.tsx`, `src/components/loadModelData/ProjectMenuBar.tsx` (additional files) |
| SET_FOCUS_RELSHIP | Yes | `src/components/gojs/GoJSApp.tsx` |
| SET_FOCUS_RELSHIPTYPE | Yes | `src/components/gojs/GoJSApp.tsx` |
| SET_FOCUS_RELSHIPVIEW | Yes | `src/components/gojs/GoJSApp.tsx` |
| SET_FOCUS_ROLE | Yes | `src/components/Tasks.tsx`, `src/components/utils/SetRoleTaskFilter.ts` |
| SET_FOCUS_SOURCE | Yes | Trace action-creator imports |
| SET_FOCUS_TAB | Yes | Trace action-creator imports |
| SET_FOCUS_TARGETMETAMODEL | Yes | `src/components/TargetMetaPalette.tsx` |
| SET_FOCUS_TARGETMODEL | Yes | Trace action-creator imports |
| SET_FOCUS_TARGETMODELVIEW | Yes | Trace action-creator imports |
| SET_FOCUS_TASK | Yes | `src/components/Tasks.tsx`, `src/components/utils/SetRoleTaskFilter.ts` |
| SET_FOCUS_USER | Yes | `src/tmpfiles/Context.js`, `src/pages/Login.tsx` |
| SET_GOJS_METAMODEL | No | `src/store.tsx` |
| SET_GOJS_METAMODELMODEL | No | `src/store.tsx` |
| SET_GOJS_METAMODELPALETTE | No | `src/store.tsx` |
| SET_GOJS_MODEL | No | `src/store.tsx`, `src/components/utils/SelectContext.tsx` |
| SET_GOJS_MODELOBJECTS | No | `src/store.tsx` |
| SET_GOJS_TARGETMETAMODEL | No | `src/store.tsx` |
| SET_GOJS_TARGETMODEL | No | `src/store.tsx` |
| SET_MYMETIS_METAMODEL | No | Trace action-creator imports |
| SET_MYMETIS_MODEL | No | `src/store.tsx` |
| SET_MYMETIS_PARAMETER | No | `src/store.tsx` |
| SET_MY_GOMETAMODEL | No | `src/store.tsx` |
| SET_MY_GOMODEL | No | `src/store.tsx` |
| SET_USER_SHOWDELETED | Yes | `src/components/Modeller.tsx` |
| SET_USER_SHOWMODIFIED | Yes | `src/components/Modeller.tsx` |
| SET_VISIBLE_CONTEXT | Yes | Trace action-creator imports |
| UPDATE_DATATYPE_PROPERTIES | Yes | `src/components/gojs/components/Diagram.tsx` |
| UPDATE_DOMAIN_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_METAMODEL_PROPERTIES | Yes | `src/components/EditFocusModal.tsx`, `src/components/utils/ReadModelFromFile.ts`, `src/akmm/ui_diagram.ts`, `src/akmm/ui_common.ts`, `src/akmm/ui_modal.ts` (additional files) |
| UPDATE_METHODTYPE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_METHOD_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_MODELVIEW_PROPERTIES | Yes | `src/components/FocusDetails.tsx`, `src/components/Modeller.tsx`, `src/components/EditFocusModal.tsx`, `src/components/utils/ReadModelFromFile.ts`, `src/components/gojs/GoJSApp.tsx` (additional files) |
| UPDATE_MODEL_PROPERTIES | Yes | `src/components/Modelling.tsx`, `src/components/EditFocusModal.tsx`, `src/components/modelSuite/Model.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx` (additional files) |
| UPDATE_OBJECTTYPEGEOS_PROPERTIES | Yes | `src/components/EditFocusModal.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx` |
| UPDATE_OBJECTTYPEVIEW_PROPERTIES | Yes | `src/components/FocusDetails.tsx`, `src/components/EditFocusModal.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_common.ts` (additional files) |
| UPDATE_OBJECTTYPE_PROPERTIES | Yes | `src/components/FocusDetails.tsx`, `src/components/EditFocusModal.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/akmm/ui_modal.ts` |
| UPDATE_OBJECTVIEW_NAME | Yes | Trace action-creator imports |
| UPDATE_OBJECTVIEW_PROPERTIES | Yes | `src/components/FocusDetails.tsx`, `src/components/EditFocusModal.tsx`, `src/components/forms/EditProperties.tsx`, `src/components/utils/SetColorsTopOSDUTypes.ts`, `src/components/gojs/GoJSApp.tsx` (additional files) |
| UPDATE_OBJECT_PROPERTIES | Yes | `src/components/FocusDetails.tsx`, `src/components/Modeller.tsx`, `src/components/EditFocusModal.tsx`, `src/components/utils/ConvertJSONToAkmModel.ts`, `src/components/utils/ConnectImportedTopOSDUTypes.ts` (additional files) |
| UPDATE_PROJECT_PROPERTIES | Yes | `src/components/Modeller.tsx`, `src/components/gojs/components/Diagram.tsx` |
| UPDATE_PROPERTY_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_RELSHIPTYPEVIEW_PROPERTIES | Yes | `src/components/EditFocusModal.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_common.ts`, `src/akmm/ui_modal.ts` |
| UPDATE_RELSHIPTYPE_PROPERTIES | Yes | `src/components/EditFocusModal.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_modal.ts`, `src/akmm/ui_generateTypes.ts` |
| UPDATE_RELSHIPVIEW_PROPERTIES | Yes | `src/components/EditFocusModal.tsx`, `src/components/forms/EditProperties.tsx`, `src/components/gojs/GoJSApp.tsx`, `src/components/gojs/components/Diagram.tsx`, `src/akmm/ui_methods.ts` (additional files) |
| UPDATE_RELSHIP_PROPERTIES | Yes | `src/components/Modeller.tsx`, `src/components/EditFocusModal.tsx`, `src/components/utils/ConvertJSONToAkmModel.ts`, `src/components/utils/ConnectImportedTopOSDUTypes.ts`, `src/components/utils/ReadModelFromFile.ts` (additional files) |
| UPDATE_TARGETDATATYPE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETMETAMODEL_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETMETHOD_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETMODEL_PROPERTIES | Yes | `src/akmm/ui_diagram.ts` |
| UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETOBJECTTYPE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETPROPERTY_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETRELSHIPTYPE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_TARGETVALUE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_VALUE_PROPERTIES | Yes | Trace action-creator imports |
| UPDATE_VIEWSTYLE_PROPERTIES | Yes | Trace action-creator imports |

## Completion work

For each row, trace action-creator callers and aliases, identify the owning canonical operation and persistence effect, link a behavioral fixture, and record a retirement gate before removing the legacy case. This inventory is not a deletion list. Runtime-only actions need session ownership rather than a canonical model handler.

## First migrated leaf: diagram preferences

SET_USER_SHOWDELETED and SET_USER_SHOWMODIFIED are now owned by diagramPreferences.ts (RTK createReducer), with typed setDiagramShowDeleted/setDiagramShowModified actions. Their legacy reducer handlers and related reducer imports were removed. Raw action strings and existing action creators/constants remain supported compatibility surfaces. Modeller's two dispatch sites are currently commented-out UI; no active preference click path is claimed.

Acceptance: real root/canonical tests preserve user/focus-user metadata and sibling diagram fields, serialize boolean false, leave the modelling graph unfrozen/unchanged, and retain root identity for no-op typed/compatibility actions. Root ownership explicitly prevents fallback for handled no-ops. Broader reducers and callers remain in inventory.

### Focus-field ownership increment

The 20 fields in `legacyFocusFieldByActionType` now accept the typed Toolkit `setUniverseFocusField({field, value})` action and their original raw action names through a single canonical handler. Their old reducer cases/imports/allowlist entries are removed. Standalone remembered-focus restoration is a typed caller; other callers and legacy action creators remain compatible. Whole-focus replacement and focus-user handlers remain separate. Integration tests cover all 20 field routes, including null clearing and no-op root identity. Focus payload normalization and general runtime serialization gates remain open; focus records have not been wrapped in Immer.

### Remaining session ownership increment

`SET_FOCUS_PHFOCUS`, `SET_FOCUS_USER`, and `SET_VISIBLE_CONTEXT` now share canonical handlers with typed Toolkit actions. Their old reducer handlers are retired; raw dispatch remains compatible, and the host dispatch adapter translates these and all 20 focus-field aliases. Whole-focus clearing mirrors null to `phFocus` so persisted compatibility state cannot retain an old selection. Snapshot load actions remain distinct: `LOAD_TOSTORE_PHFOCUS` retains its existing model-bound normalization behavior.

### Model/view reorder ownership increment

`REORDER_MODELS` and `REORDER_MODELVIEWS` share canonical handlers with `reorderUniverseModels` and `reorderUniverseModelviews`. All three active tab-drop callers use the typed actions, and the legacy adapter translates raw names. Duplicate old cases/imports are removed. Invalid/missing IDs and identical source/target IDs leave the root unchanged; order changes retain model/view record identity, focused selection and diagram geometry. Canonical graph reducers remain immutable functions pending wider runtime-isolation gates.

### Model/model-view property ownership increment

`UPDATE_MODEL_PROPERTIES` and `UPDATE_TARGETMODEL_PROPERTIES` share `updateUniverseModel`; `UPDATE_MODELVIEW_PROPERTIES` shares `updateUniverseModelview`. The legacy adapter translates all three. Old cases/imports were removed after passing actual-reducer characterization on matching-ID patches. Tests preserve unknown metadata, focus synchronization, explicit model-ID selection, graph identity, saved geometry and sanitized view collections. Existing canonical target-model focus synchronization differs from the historical handler, which omitted it; this canonical behavior predates the increment. Raw aliases remain available to other callers.

### Relationship property ownership and object-name gap

`UPDATE_RELSHIP_PROPERTIES` shares `updateUniverseRelationship` and is translated by the legacy host adapter. Its old handler/import were removed after actual-reducer characterization for merge/append behavior. Regression coverage retains endpoint references, unknown fields, saved view geometry and collection identity. The old object property handler is retained: inherited/blank view-name propagation exists there but is absent from the canonical object collection helper. Resolve that gap with explicit-label preservation and visual rename checks before retiring the object handler.

### Object property name gap resolved

`UPDATE_OBJECT_PROPERTIES` now shares the typed `updateUniverseObject` handler and is translated by the host adapter. Canonical updates restore the historical inherited/blank view-name propagation rule and preserve custom labels, unknown properties and view geometry. Actual legacy characterization passed before case/import retirement; saved-shape regressions remain. Inherited-label rename passed visually through Edit Object; custom-label preservation is covered by tests. The earlier object-handler deferral is resolved.

### View-property ownership increment

Object-view properties/name and relationship-view properties now map to typed Toolkit actions through the host adapter; raw names remain canonical aliases. Duplicate old property cases were retired after characterization. The historical view-name case used a retired nested state shape; canonical view-name patch behavior remains covered. Unused optional-field helpers/constants are removed from the old reducer. Canonical targeting, optional blank-field handling, inheritance pruning and saved geometry behavior are unchanged.

### Metamodel property ownership increment

`UPDATE_METAMODEL_PROPERTIES` and `UPDATE_TARGETMETAMODEL_PROPERTIES` now share separate typed Toolkit actions with canonical handlers and host-adapter routes. Old cases/imports were retired after actual-reducer characterization. Direct patches resolve the patch ID; target patches resolve the focused model's targetMetamodelRef. Existing append behavior, saved collections and unknown fields remain unchanged. Collection/type property actions are still separate pending work.

### Metamodel collection ownership increment

All 20 collection-property aliases now share `updateUniverseMetamodelItem({scope, collection, patch})` via `legacyMetamodelCollectionRoutes`. Raw dispatch and host-adapter translation preserve pre-existing canonical routes. Eighteen old handlers matched single-record characterization; method-type and value fallback handlers threw (absent collection slice / undefined index). All 20 old cases/imports are removed. Independent route fixtures preserve historical unusual mappings rather than silently changing their semantics. Regression tests cover merge/append/tails/metadata and absent-target no-op identity. The reducer still uses immutable graph operations, not Immer over runtime-facing models.

### Remaining project/domain property ownership

Project properties, domain properties and current-metamodel selection now route to typed canonical actions; their old cases/imports are retired. Root ownership is centralized for migrated actions, and unknown actions preserve an already-canonical root while still initializing legacy-only roots. Remaining old cases are loaders, failure and runtime compatibility actions. Existing broad domain-merge semantics preserve unknown fields; no persisted format migration is introduced.

### Partial-loader ownership increment

The phData/focus/user/source partial loaders now have canonical typed ownership; their old cases/imports are retired. Focus loads normalize via `loadUniverseFocus`, while `setUniverseFocus` remains direct replacement. The host adapter now respects that distinction. Null user/source projection clears legacy aliases, and repeated values are no-ops. Refresh geometry preservation and explicit-file replacement geometry are covered separately. Full snapshots, success loaders and new-model operations remain pending.

### Durable loader retirement

All seven remaining durable raw load operations share typed `loadUniverseResult` ownership. Success/new-model host adapters translate to it; the full-snapshot adapter retains its existing background-refresh operation. Direct snapshot replacement and background refresh have separate geometry fixtures. Old durable loader cases/imports are removed. Only failure/runtime compatibility cases remain in the old reducer. Null list projection now clears stale `phList`. Existing canonical load behavior, including normalization and unknown model fields, remains authoritative; no transport or server code moved into core.

### Runtime Redux-write retirement

All 11 runtime Redux creators had no active callers; remaining Table reads were unused. Creators/constants and reducer cases are removed. Old raw strings remain root-level no-ops to prevent stale dispatches from writing mutable/cyclic instances. Active editor-instance Metis.setGojsModel and similar runtime methods are retained. Only startup/error compatibility remains in the old reducer. Serialization of graph-bearing focus and imported unknown fields still needs its separate gate.
