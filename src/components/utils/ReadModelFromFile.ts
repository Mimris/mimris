// @ts-nocheck

// import { CONSTRAINT } from "sqlite3";
import { InitialState } from "../../reducers/reducer";
import { setFocusModel } from "../../actions/actions";
import { i } from "./SvgLetters";
import { buildMimrisStateFromWorkspaceSnapshot, isWorkspaceUniverseSnapshot } from "./workspaceUniverseAdapter";
import {
    loadLegacyUniverseSnapshot,
    selectSharedUniverseState,
    setUniverseFocus,
    setUniversePhData,
    setUniverseSource,
    setUniverseUser,
} from "../../sharedUniverse";
import { getCurrentStore } from "../../store";

const debug = false
const LAST_FOCUS_MODEL_STORAGE_KEY = 'mimris.modelling.focusModelId';

const clearPersistedFileFocus = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LAST_FOCUS_MODEL_STORAGE_KEY);
}

const hasRenderableModelviewContent = (modelview: any) => {
    const objectviews = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
    const relshipviews = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
    return objectviews.length > 0 || relshipviews.length > 0;
}

const resolveFocusableModelview = (model: any, requestedModelview: any = null) => {
    const modelviews = Array.isArray(model?.modelviews) ? model.modelviews.filter(Boolean) : [];
    if (!modelviews.length) return null;
    const requested = requestedModelview
        ? modelviews.find(mv => mv?.id === requestedModelview?.id || mv?.name === requestedModelview?.name)
        : null;
    if (requested && hasRenderableModelviewContent(requested)) return requested;
    return modelviews.find(hasRenderableModelviewContent) || requested || modelviews[0] || null;
}

const buildSourcePropsFromSharedUniverse = (fallbackProps) => {
    const store = getCurrentStore?.();
    if (!store) return fallbackProps || {};
    const sharedUniverse = selectSharedUniverseState(store.getState() as any);
    if (!sharedUniverse) return fallbackProps || {};
    return {
        ...(fallbackProps || {}),
        phData: {
            ...(fallbackProps?.phData || {}),
            domain: sharedUniverse.world.worldDefinition.domain ?? fallbackProps?.phData?.domain,
            metis: sharedUniverse.world.worldModel.metis ?? fallbackProps?.phData?.metis,
            documents: sharedUniverse.compatibility.documents ?? fallbackProps?.phData?.documents,
        },
        phFocus: sharedUniverse.world.focus || fallbackProps?.phFocus,
        phUser: sharedUniverse.user || fallbackProps?.phUser,
        phSource: sharedUniverse.source ?? fallbackProps?.phSource,
        phList: sharedUniverse.compatibility.modelList ?? fallbackProps?.phList,
    };
}

const stripWorkspaceUniverseMetadata = (phUser: any) => {
    if (!phUser || typeof phUser !== 'object') return phUser;
    const { __workspaceUniverse, ...rest } = phUser;
    return rest;
}

export const ReadProjectFromFile = async (props, dispatch, e) => { // Read Project from file
    if (!debug) console.log('10 ReadModelFromFile', props, e)
    e.preventDefault();
    const reader = new FileReader();
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    if ((debug)) console.log('13 ReadModelFromFile', props, reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => {
        const text = (e.target.result)
        if (debug) console.log('19 ReadModelFromFile', text)
        let importedfile = JSON.parse(text)
        // remove null models and models with only {} in them
        const cleanedData = importedfile.phData.metis.models.filter(m => m && Object.keys(m).length > 0);
        const filename = reader.fileName
        const data = {
            ...importedfile,
            phData: {
                ...importedfile.phData,
                metis: {
                    ...importedfile.phData.metis,
                    models: cleanedData,
                },
            },
            phUser: stripWorkspaceUniverseMetadata(importedfile.phUser || props?.phUser || InitialState.phUser),
            phSource: filename,
        }
        if (debug) console.log('356 ReadModelFromFile', data, importedfile?.phData?.metis.models, importedfile?.phData?.metis.metamodels)
        clearPersistedFileFocus()
        props.dispatch(loadLegacyUniverseSnapshot(data))
        // dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
        if (debug) console.log('29 ReadModelFromFile', filename, props)
    };
    reader.readAsText(e.target.files[0])
}

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    e.preventDefault();
    const reader = new FileReader();
    const legacySourceProps = props?.phData ? props : props?.ph
    const sourceProps = buildSourcePropsFromSharedUniverse(legacySourceProps)
    const resetFileInput = () => {
        if (e?.target) e.target.value = ''
    }
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    if (!debug) console.log('42 ReadModelFromFile', props, reader.fileName)
    if (!reader.fileName) {
        resetFileInput()
        return null
    }
    reader.onload = async (e) => {
        const text = (e.target.result)
        if (debug) console.log('46 ReadModelFromFile', text)
        let importedfile = JSON.parse(text)
        const filename = reader.fileName
        if (importedfile.project) console.log('ReadModelFromFile.ts: The imported file contains .project', importedfile)
        if (importedfile.project) importedfile = importedfile.project

        if (isWorkspaceUniverseSnapshot(importedfile)) {
            const adaptedState = buildMimrisStateFromWorkspaceSnapshot(importedfile, {
                sourceName: filename,
                sourcePath: filename,
            })
            if (!adaptedState?.phData?.metis?.models?.length) {
                alert('No models in this file.')
                resetFileInput()
                return
            }
            clearPersistedFileFocus()
            dispatch(loadLegacyUniverseSnapshot({
                ...adaptedState,
                phUser: stripWorkspaceUniverseMetadata(adaptedState.phUser || InitialState.phUser),
            }))
            dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: filename } })
            resetFileInput()
            return
        }

        const toArray = (value) => {
            if (Array.isArray(value)) return value.filter(Boolean)
            if (!value) return []
            if (typeof value === 'object') {
                if ('id' in value) return [value]
                return Object.values(value).filter(Boolean)
            }
            return [value]
        }
        const importedMetisSource = importedfile?.metis || importedfile
        const importedModel = {
            metamodels: toArray(importedMetisSource.metamodels),
            models: toArray(importedMetisSource.models)
        };
        const importedPrimaryModel = importedModel.models[0];

        if (importedfile?.phData) {
            const importedProjectMetis = importedfile.phData?.metis || {}
            const importedProjectModels = toArray(importedProjectMetis.models)
            const importedProjectFocus = importedfile.phFocus || {}
            if (importedProjectModels.length === 0) {
                alert('No models in this file.')
                resetFileInput()
                return
            }
            const resolvedProjectModel = importedProjectModels.find(model => model?.id === importedProjectFocus?.focusModel?.id)
                || importedProjectModels[0]
                || null
            const resolvedProjectModelview = resolveFocusableModelview(resolvedProjectModel, importedProjectFocus?.focusModelview)
            const sanitizedProject = {
                ...importedfile,
                phData: {
                    ...InitialState.phData,
                    ...importedfile.phData,
                    metis: {
                        ...importedProjectMetis,
                        models: Array.isArray(importedProjectMetis.models) ? importedProjectMetis.models.filter(Boolean) : [],
                        metamodels: Array.isArray(importedProjectMetis.metamodels) ? importedProjectMetis.metamodels.filter(Boolean) : [],
                    },
                },
                phFocus: {
                    ...importedProjectFocus,
                    focusModel: resolvedProjectModel ? { id: resolvedProjectModel.id, name: resolvedProjectModel.name } : null,
                    focusModelview: resolvedProjectModelview ? { id: resolvedProjectModelview.id, name: resolvedProjectModelview.name } : null,
                },
            }
            clearPersistedFileFocus()
            dispatch(loadLegacyUniverseSnapshot({
                ...InitialState,
                phData: sanitizedProject.phData,
                phFocus: sanitizedProject.phFocus,
                phUser: stripWorkspaceUniverseMetadata(sanitizedProject.phUser || sourceProps?.phUser || InitialState.phUser),
                phSource: sanitizedProject.phSource || filename,
                lastUpdate: new Date().toISOString(),
            }))
            dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: filename } })
            resetFileInput()
            return
        }

        if (!importedfile?.phData) {
            const incomingMetis = importedfile?.metis
                ? {
                    ...importedfile.metis,
                    models: toArray(importedfile.metis?.models),
                    metamodels: toArray(importedfile.metis?.metamodels),
                }
                : {
                    ...importedfile,
                    models: toArray(importedfile.models),
                    metamodels: toArray(importedfile.metamodels),
                }
            if (incomingMetis.models?.length === 0) {
                alert('No models in this file.')
                resetFileInput()
                return
            }
            const requestedModel = importedfile?.phFocus?.focusModel || null
            const resolvedModel = incomingMetis.models?.find(model => model?.id === requestedModel?.id || model?.name === requestedModel?.name)
                || importedPrimaryModel
                || incomingMetis.models?.[0]
                || null
            const resolvedModelview = resolveFocusableModelview(resolvedModel, importedfile?.phFocus?.focusModelview)

            clearPersistedFileFocus()
            dispatch(loadLegacyUniverseSnapshot({
                ...InitialState,
                phData: {
                    ...InitialState.phData,
                    ...(importedfile?.domain ? { domain: importedfile.domain } : {}),
                    metis: incomingMetis,
                },
                phFocus: {
                    ...InitialState.phFocus,
                    ...(resolvedModel ? { focusModel: { id: resolvedModel.id, name: resolvedModel.name } } : { focusModel: null }),
                    ...(resolvedModelview ? { focusModelview: { id: resolvedModelview.id, name: resolvedModelview.name } } : { focusModelview: null }),
                },
                phUser: stripWorkspaceUniverseMetadata(sourceProps?.phUser || InitialState.phUser),
                phSource: filename,
                lastUpdate: new Date().toISOString(),
            }))
            dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: filename } })
            resetFileInput()
            return
        }
        
                            
        if (!debug) console.log('52 ReadModelFromFile', importedModel)

        const impObjecttypes = toArray(importedfile.objecttypes)
        const impRelshiptypes = toArray(importedfile.relshiptypes)
        const impModelviews = toArray(importedfile.modelviews)
        const impMetamodels = importedModel.metamodels
        const impObjects = toArray(importedfile.objects)
        const impRelships = toArray(importedfile.relships)
        const impModels = importedModel.models
        // const impModel = (impModels) && impModels[0]  // max one model in modelview file for now
        const impModelview = impModelviews[0] || null // max one modelview in modelview file for now
        const impMetamodel = impMetamodels[0] || null // max one model in modelview file for now

        // ---------------------  Set up current model for merging of imported data ---------------------
        const metis = sourceProps?.phData?.metis || importedfile.phData?.metis
        const focus = sourceProps?.phFocus || importedfile.phFocus
        if (!metis || !focus) return null
        const metisModels = Array.isArray(metis.models) ? metis.models.filter(Boolean) : []
        const metisMetamodels = Array.isArray(metis.metamodels) ? metis.metamodels.filter(Boolean) : []
        const curmod = metisModels.find(m => m?.id === focus.focusModel?.id)
        if (!curmod) return null
        const curmmod = metisMetamodels.find(m => m?.id === curmod.metamodelRef)
        const modelviews = Array.isArray(curmod.modelviews) ? curmod.modelviews.filter(mv => mv && mv.id != undefined) : [] // filter out null or empthy modelviews

        const curmodview = modelviews.find(mv => mv?.id === focus.focusModelview?.id)

        let mmindex = (impMetamodel?.id) && metisMetamodels.findIndex(m => m?.id === impMetamodel?.id)

        // ---------------------  Set up imported model for merging of imported data ---------------------

        console.log('79 ReadModelFromFile.ts: impMetamodels0', importedModel)
        let data = importedfile
        if (!data) return null
        const currentMetis = sourceProps?.phData?.metis
        const currentModels = Array.isArray(currentMetis?.models) ? currentMetis.models.filter(Boolean) : []
        const currentMetamodels = Array.isArray(currentMetis?.metamodels) ? currentMetis.metamodels.filter(Boolean) : []
        data = {
                ...sourceProps,
                phData: {
                    ...sourceProps?.phData,
                    metis: { 
                        models: currentModels.map(m => 
                            (importedPrimaryModel?.id === m?.id) ? importedPrimaryModel : m
                        ),
                        metamodels: [
                            ...currentMetamodels
                        ]
                    },
                }
            }

        if (debug) console.log('105 ReadModelFromFile', data)


        // check if imported objtype is compatible with current metamodel
        if (impMetamodels.length > 0) {
            data.phData?.metis?.metamodels[0]?.objecttypes?.forEach(ot => { // add standard necessary attributes to relship
                if (!ot.abstract) { ot.abstract = false }
                if (!ot.viewkind) { ot.viewkind = 'Object' }
                if (!ot.typeName) { ot.typeName = 'Object type'; }
                if (!ot.markedAsDeleted) { ot.markedAsDeleted = false; }
                if (!ot.modified) { ot.modified = false; }
            });
            // check if imported objtype is compatible with current metamodel
            data.phData?.metis?.metamodels[0]?.objecttypeviews?.forEach(otv => { // add standard necessary attributes to relship
                if (!otv.viewkind) { otv.viewkind = 'Object' }
                if (!otv.template) { otv.template = 'textAndIcon' }
                if (!otv.markedAsDeleted) { otv.markedAsDeleted = false; }
                if (!otv.modified) { otv.modified = false; }
            });
            // check if imported reltype is compatible with current metamodel
            data.phData?.metis?.metamodels[0]?.relshiptypes?.forEach(r => { // add standard necessary attributes to relship
                if (!r.relshipkind) { r.relshipkind = 'Association'; }
                if (!r.cardinality) { r.cardinality = ''; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = ''; }
                if (!r.cardinalityTo) { r.cardinalityTo = ''; }
            });
        }
        // -------------- check if imported relship is compatible with current metamodel ---------------------
        if (impModels.length > 0) {
            // -------------- check if imported objects is compatible with current metamodel ---------------------
            // first we check the imported modelview against the current metamodel
            data.phData?.metis?.models[0]?.objects?.forEach(o => { // add standard necessary attributes to object
                if (!o.category) { o.category = 'Object'; }
                if (!o.typeName) { o.typeName = 'Generic'; }
                if (!o.description) { o.description = ''; }
                if (!o.nameId) { o.nameId = '' }
                if (!o.viewkind) { o.viewkind = '' }
                if (!o.markedAsDeleted) { o.markedAsDeleted = false; }
                if (!o.modified) { o.modified = false; }
                if (!o.generatedTypeId) { o.generatedTypeId = '' }
                if (!o.abstract) { o.abstract = false }
                if (!o.valueset) { o.valueset = null }
                if (!o.relshipkind) { o.relshipkind = 'Association' }
            });
            data.phData?.metis?.models[0]?.relship?.forEach(r => { // add standard necessary attributes to relship 
                if (!r.viewkind) { r.viewkind = '' }
                if (!r.markedAsDeleted) { r.markedAsDeleted = false; }
                if (!r.modified) { r.modified = false; }
                if (!r.relshipkind) { r.description = 'Association'; }
                if (!r.cardinality) { r.cardinality = '0-n'; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = '0'; }
                if (!r.cardinalityTo) { r.cardinalityTo = 'n'; }
            });
        } else {
            // -------------- check if imported objects is compatible with current metamodel ---------------------
            impObjects?.forEach(o => { // add standard necessary attributes to object
                if (!o.category) { o.category = 'Object'; }
                if (!o.typeName) { o.typeName = 'Generic'; }
                if (!o.description) { o.description = ''; }
                if (!o.viewkind) { o.viewkind = '' }
                if (!o.markedAsDeleted) { o.markedAsDeleted = false; }
                if (!o.modified) { o.modified = false; }
                if (!o.generatedTypeId) { o.generatedTypeId = '' }
                if (!o.abstract) { o.abstract = false }
                if (!o.valueset) { o.valueset = null }
                if (!o.relshipkind) { o.relshipkind = 'Association' }
            });
            impRelships?.forEach(r => { // add standard necessary attributes to relship
                if (!r.viewkind) { r.viewkind = '' }
                if (!r.markedAsDeleted) { r.markedAsDeleted = false; }
                if (!r.modified) { r.modified = false; }
                if (!r.relshipkind) { r.description = 'Association'; }
                if (!r.cardinality) { r.cardinality = '0-n'; }
                if (!r.cardinalityFrom) { r.cardinalityFrom = '0'; }
                if (!r.cardinalityTo) { r.cardinalityTo = 'n'; }
            });
        }



        if (debug) console.log('160 ReadModelFromFile 1', data.phData?.metis)

        // -------------map over objecttypes in modelff and add typeName from objecttypes
        function addTypenameFromObjectTypes(objecttypes, objects) { // obecttypes and objects is imported from file
            if (debug) console.log('67 ReadModelFromFile', objecttypes, objects)
            objects?.forEach(o => {
                const otindex = objecttypes?.findIndex(ot => (ot) && ot?.id === o?.typeRef)
                if (otindex >= 0) {
                    o.typeName = objecttypes[otindex].name
                }
                o.nameId = o.name
                o.description = o.description
            })
            return objects
        }
        const editedmodelffobjects = addTypenameFromObjectTypes(impObjecttypes, impObjects)

        // chande the typeRef in objects to point to types with the same typeName in currentMetamodel.objecttypes
        // map over mmodelffobjecttypes and find the type in currentMetamodel.objecttypes with the same typeName and replace the typeRef in mmodelffobjects
        function replaceTypeRefFromObjectTypesWhithSameTypename(objecttypes, objects) {
            if (debug) console.log('67 ReadModelFromFile', objecttypes, objects)
            objects?.forEach(o => {
                // check if objecttype exists in currentMetamodel.objecttypes
                const otindex = objecttypes?.findIndex(ot => ot?.name === o?.typeName)
                if (debug) console.log('90 otindex', otindex, o.typeName)
                if (otindex >= 0) {
                    o.typeRef = objecttypes[otindex].id
                    o.typeName = objecttypes[otindex].name
                }
            })
            return objects
        }
        const editedmodelffobjects2 = (curmod.objecttypes) && replaceTypeRefFromObjectTypesWhithSameTypename(curmmod?.objecttypes || [], editedmodelffobjects)
        // models
        let mindex = currentModels.findIndex(m => m?.id === sourceProps?.phFocus?.focusModel?.id) // current focusmodel index
        let mlength = currentModels.length
        // ---------------------  replace existing with the imported (overwrite) ---------------------          
        const tmpo = Array.isArray(currentModels[mindex]?.objects) ? currentModels[mindex].objects.filter(Boolean) : [] // remove all objects from tmpo that are in modelff.objects
        if (debug) console.log('124 ReadModelFromFile', tmpo);

        // merge objects from modelff.objects into tmpo
        function mergeObjectsFromModelffObjects(objects, tmpo) {
            if (!tmpo) return;
            if (debug) console.log("120 ReadModelFromFile", objects, tmpo);
            objects?.forEach((o) => {
                const oindex = tmpo.findIndex((ot) => ot?.id === o?.id);
                if (debug) console.log("133 ReadModelFromFile", oindex, o, tmpo);
                if (oindex < 0) {
                    tmpo.push(o); // if object does not exist, then add it to props.phData.metis.models[mindex].objects
                } else {
                    tmpo[oindex] = o; // if object exists, then replace it in props.phData.metis.models[mindex].objects
                }
            });
            // Remove duplicates based on the 'id' property¯
            const uniqueTmpo = tmpo?.filter((obj, index, self) => {
                return index === self.findIndex((t) => t?.id === obj?.id);
            });
            return uniqueTmpo;
        }

        const editedmodelffobjects3 = mergeObjectsFromModelffObjects(impObjects, tmpo);

        if (debug) console.log('144 ReadModelFromFile', editedmodelffobjects3)

        // ------------------------------------  import based on diff importfiles ------------------------------------    
        if (!data.phData) { // if file is a project file, just skip the rest of this function
            // objettypes
            let otindex, otlength
            if (debug) console.log('75 ReadModelFromFile', editedmodelffobjects, editedmodelffobjects2)
            // modelviews
            let mvindex, mvlength
            mvindex = (impModelview?.id) && currentModels[mindex]?.modelviews?.findIndex(mv => mv?.id === impModelview?.id) // current modelview index
            mvlength = currentModels[mindex]?.modelviews?.length;
            if (!mvindex || mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
            const tmpmv = currentModels[mindex]?.modelviews
            if (debug) console.log('112 ReadModelFromFile', tmpmv, mvindex, mvlength, impModelview)
            if (mvindex >= 0) { // if modelview exist, then add additional objectviews to the existing modelview
                // curmodview?.objectviews.forEach(ov => {
                //     const ovindex = tmpmv[mvindex].objectviews.findIndex(ovv => ovv.id === ov.id)
                //     if (ovindex < 0) { tmpmv[mvindex].objectviews.push(ov) } // if objectview does not exist, then add it to the existing modelview
                // })
            } else { // if modelview does not exist, then add it to props.phData.metis.models[mindex].modelviews
                // tmpmv.push(modelff.modelview)
            }
            let oindex = (impObjects.length > 0) && tmpo.findIndex(o => o?.id === impObjects[0]?.id)
            const olength = tmpo.length
            if (oindex && (oindex < 0)) { oindex = olength } // oindex = -1, i.e.  not fond, which means adding a new object
            // ---------------------  replace existing with the imported (overwrite) ---------------------
            let rindex = impRelships.length > 0 ? currentModels[mindex]?.relships?.findIndex(r => (r) && r?.id === impRelships[0]?.id) : null;
            const rlength = currentModels[mindex]?.relships?.length
            if (rindex && (rindex < 0)) { rindex = rlength } // rindex = -1, i.e.  not fond, which means adding a new relationship
            //  if relationship already exist in props.phData.metis.models[mindex].relships, then remove it from props.phData.metis.models[mindex].relships 
            // const tmprels = props.phData.metis.models[mindex].relships
            // if (rindex >= 0) { tmprels.splice(rindex, 1) } // if relationship exist, then remove it from props.phData.metis.models[mindex].relships, i.e. the relationship will be replaced by the new relationship
            //  if metamodel already exist in props.phData.metis.metamodels, then replace it with the new metamodel
            const mmlength = currentMetamodels.length;
            if (!mmindex || mmindex < 0) mmindex = mmlength// if metamodel exist, then replace it with the new metamodel
            if (debug) console.log('233 ReadModelFromFile', mindex, mvindex, mmindex)
        }
        // ---------------------  add metamodel if imorted  --------------------
        if (debug) console.log('237 ReadModelFromFile', filename, props,)

        // ---------------------  check type of import --------------------- Todo: this can be removed

        // if (filename.includes('_MV')) { // if modelff is a modelview, then it is a modelview file with objects and metamodel
        //     if (debug) console.log('248 ReadModelFromFile _MV found', data)

        //     if (!impObjects) { //|| !impRelships) {
        //         const r = window.confirm("This Modelview import has no Objects and/or Relships. Click OK to cancel?")
        //         if (r === false) { return null } // if user clicks cancel, then do nothing
        //     }

        //     const mmod = data.metamodels
        //     const modview = data.modelviews
        //     const mobjects = data.objects
        //     const mrelships = data.relships

        //     // dispatch mmod, modview, mobjects, mrelships to store
        //     const r = window.confirm(`This import includes metamodel: ${mmod.name}. If you want to import this metamodel, Click OK`)
        //     if (r === true) {
        //         dispatchLocalFile('UPDATE_METAMODEL_PROPERTIES', mmod)
        //     }
        //     dispatchLocalFile('UPDATE_MODELVIEW_PROPERTIES', modview)
        //     const objects = mobjects.map(o => {
        //         dispatchLocalFile('UPDATE_OBJECT_PROPERTIES', o)
        //     })
        //     const relships = mrelships.map(r => {
        //         dispatchLocalFile('UPDATE_RELSHIP_PROPERTIES', r)
        //     })
        //     return; // skip the rest of this function
        // }
        // // merge imported with existing project
        // if (data.phData || filename.includes('_PR' || '.Project')) { // its a project file, just import as is
        //     data = importedfile
        // } else if (importedfile.phData) { // its a model, modelview or metamodel file, merge with existing project
        //     data = {
        //         phData: {
        //             ...props.phData,
        //             metis: {
        //                 ...props.phData.metis,
        //                 metamodels: [
        //                     ...props.phData.metis.metamodels,
        //                     (impMetamodels) && data.phData.metis.metamodels,
        //                 ],
        //                 models: [
        //                     ...props.phData.metis.models,
        //                     ...data.phData.metis.models,
        //                 ],
        //             },
        //         },
        //     }
        // } else if (filename.includes('_MO')) { // its a model, modelview or metamodel file, merge with existing project
        //     if (debug) console.log('402 ReadModelFromFile', data)//, data.models[0].modelviews.length)
        //     if (!Array.isArray(data.models))
        //         data.models = [data.models];
        //     if (data.models[0].modelviews.length === 0) { // if modelview exists, then add it to   data.phData.metis.models
        //         if (debug) console.log('334 ReadModelFromFile', data.models[0].modelviews.length)
        //         data.models[0].modelviews[0] =
        //         {
        //             id: 'mv1',
        //             markedAsDeleted: false,
        //             name: 'mv1',
        //             modified: false,
        //             modelRef: data.models[0].id,
        //             UseUMLrelshipkinds: false,
        //             includeInheritedReltypes: false,
        //             objectviews: [],
        //             relshipviews: [],
        //             objecttypeviews: [],
        //             relshiptypeviews: []
        //         }
        //     }

        //     if (debug) console.log('304 ReadModelFromFile', data, props.phData.metis.metamodels)
        //     data = {
        //         phData: {
        //             ...props.phData,
        //             metis: {
        //                 ...props.phData.metis,
        //                 metamodels: [
        //                     ...props.phData.metis.metamodels,
        //                     // (impMetamodels) && data.phData.metis.metamodels,             
        //                 ],
        //                 models: [
        //                     ...props.phData.metis.models,
        //                     ...data.models,
        //                 ],
        //             },
        //         },
        //     }
        //     if (debug) console.log('307 ReadModelFromFile', data)
        // } else if (filename.includes('_OR')) { // its a Object relationship file, merge with existing project'
        //     if (debug) console.log('370 ReadModelFromFile', data)
        //     if (!data.objects) data.objects = []
        //     if (!data.relships) data.relships = []
        //     if (debug) console.log('373 ReadModelFromFile', data)
        //     let mindex = props.phData?.metis?.models?.findIndex(m => m.id === curmod.id) // current model index
        //     let mlength = props.phData?.metis?.models.length
        //     // check if imported file has objects and relships
        //     if (data.objects && data.relships) {
        //         data = {
        //             phData: {
        //                 ...props.phData,
        //                 metis: {
        //                     ...props.phData.metis,
        //                     models: [
        //                         ...props.phData.metis.models?.slice(0, mindex),
        //                         {
        //                             ...props.phData.metis.models[mindex],
        //                             objects: [
        //                                 ...props.phData.metis.models[mindex].objects,
        //                                 ...data.objects,
        //                             ],
        //                             relships: [
        //                                 ...props.phData.metis.models[mindex].relships,
        //                                 ...data.relships,
        //                             ],
        //                         },
        //                         ...props.phData.metis.models?.slice(mindex + 1, mlength),
        //                     ],
        //                 },
        //             },
        //         };
        //     }
        //     if (debug) console.log('399 ReadModelFromFile', data)
        // } else if (filename.includes('_META')) { // its a metamodel file, merge with existing project'
        //     data = {
        //         phData: {
        //             ...props.phData,
        //             metis: {
        //                 ...props.phData.metis,
        //                 metamodels: [
        //                     ...props.phData.metis.models,
        //                     data,
        //                 ],
        //             },
        //         },
        //     }
        // } else {
        //     if (debug) console.log('335 ReadModelFromFile: ', data)
        //     // find current model index
        //     let mindex = props.phData?.metis?.models?.findIndex(m => m.id === curmod.id) // current model index
        //     // check if imported file has objects and relships
        //     if (data.phData?.metis?.models[0]?.objects && data.phData.metis.models[0]?.relships) {
        //         data = {
        //             phData: {
        //                 ...props.phData,
        //                 metis: {
        //                     ...props.phData.metis,
        //                     models: [
        //                         ...props.phData.metis.models?.slice(0, mindex),
        //                         {
        //                             ...props.phData.metis.models[mindex],
        //                             objects: [
        //                                 ...props.phData.metis.models[mindex].objects,
        //                                 ...data.phData.metis.models[0].objects,
        //                             ],
        //                             relships: [
        //                                 ...props.phData.metis.models[mindex].relships,
        //                                 ...data.phData.metis.models[0].relships,
        //                             ],
        //                         },
        //                         ...props.phData.metis.models?.slice(mindex + 1, mlength),
        //                     ],
        //                 },
        //             },
        //         }
        //     }
        // }


        if (debug) console.log('356 ReadModelFromFile', data)
        dispatch(setUniversePhData(data.phData))
        if (data.phFocus) dispatch(setUniverseFocus(data.phFocus))
        if (data.phSource) dispatch(setUniverseSource(data.phSource))
        if (data.phUser) dispatch(setUniverseUser(data.phUser))
        dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: filename } })
        // dispatch({type: 'SET_FOCUS_REFRESH', data:  {id: Math.random().toString(36).substring(7), name: 'refresh'}})
        resetFileInput()

    };
    reader.readAsText(e.target.files[0])
}

export const ReadMetamodelFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => {
        const text = (e.target.result)
        const metamodelff = JSON.parse(text)
        const sourceProps = buildSourcePropsFromSharedUniverse(props)
        //   alert(text)
        if (debug) console.log('170 ReadModelFromFile', sourceProps);
        let mmmindex = sourceProps.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = sourceProps.phData?.metis?.metamodels.length
        if (mmmindex < 0) { mmmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('174 ReadModelFromFile', metamodelff, mmmindex, mmlength);
        const data = {
            phData: {
                ...sourceProps.phData,
                metis: {
                    ...sourceProps.phData.metis,
                    metamodels: [
                        ...sourceProps.phData.metis.metamodels.slice(0, mmmindex),
                        metamodelff,
                        ...sourceProps.phData.metis.metamodels.slice(mmmindex + 1, sourceProps.phData.metis.metamodels.length),
                    ],
                    models: sourceProps.phData.metis.models,
                },
            },
        };
        if (debug) console.log('190 ReadModelFromFile', data);

        dispatch(setUniversePhData(data.phData))
    };
    reader.readAsText(e.target.files[0])
}
