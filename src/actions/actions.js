import { 
  FAILURE, 
  LOAD_DATA, 
  LOAD_DATA_SUCCESS, 
  LOAD_DATAGITHUB,
  LOAD_DATAGITHUB_SUCCESS, 
  LOAD_DATAMODELLIST, 
  LOAD_DATAMODELLIST_SUCCESS, 
  LOAD_DATAMODEL, 
  LOAD_DATAMODEL_SUCCESS, 
  LOAD_TOSTORE_PHDATA, 
  LOAD_TOSTORE_PHFOCUS,
  LOAD_TOSTORE_PHUSER, 
  LOAD_TOSTORE_PHSOURCE,
  LOAD_TOSTORE_NEWMODEL,
  LOAD_TOSTORE_NEWMODELVIEW,
  SET_FOCUS_USER, 
  SET_FOCUS_TAB,
  SET_FOCUS_MODEL, 
  SET_FOCUS_MODELVIEW,
  SET_FOCUS_TARGETMETAMODEL,
  SET_FOCUS_TARGETMODEL, 
  SET_FOCUS_TARGETMODELVIEW,
  SET_FOCUS_OBJECT, 
  SET_FOCUS_OBJECTVIEW, 
  SET_FOCUS_RELSHIP, 
  SET_FOCUS_RELSHIPVIEW, 
  SET_FOCUS_OBJECTTYPE, 
  SET_FOCUS_RELSHIPTYPE, 
  SET_FOCUS_PROJ, 
  SET_FOCUS_ORG, 
  SET_FOCUS_ROLE, 
  SET_FOCUS_COLLECTION, 
  SET_FOCUS_TASK, 
  SET_FOCUS_SOURCE, 
  SET_FOCUS_REFRESH, 
  SET_USER_SHOWDELETED,

  SET_MYMETIS_MODEL,
  SET_MYMETIS_PARAMETER,
  SET_MY_GOMODEL,
  SET_MY_GOMETAMODEL,

  SET_GOJS_MODEL, 
  SET_GOJS_TARGETMODEL,
  SET_GOJS_MODELOBJECTS,
  SET_GOJS_METAMODEL,
  SET_GOJS_METAMODELPALETTE, 
  SET_GOJS_METAMODELMODEL,
  SET_GOJS_TARGETMETAMODEL,


  UPDATE_PROJECT_PROPERTIES,
  UPDATE_MODEL_PROPERTIES,
  UPDATE_MODELVIEW_PROPERTIES,
  UPDATE_METAMODEL_PROPERTIES,
  UPDATE_OBJECTTYPE_PROPERTIES,
  UPDATE_OBJECTTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTTYPEGEOS_PROPERTIES,
  UPDATE_DATATYPE_PROPERTIES,
  UPDATE_TARGETMETAMODEL_PROPERTIES,
  UPDATE_TARGETMODEL_PROPERTIES,
  UPDATE_TARGETOBJECTTYPE_PROPERTIES,
  UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES,
  UPDATE_TARGETBJECTTYPEGEOS_PROPERTIES,
  UPDATE_TARGETRELSHIPVIEW_PROPERTIES,
  UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_TARGETDATATYPE_PROPERTIES,
  UPDATE_TARGETALUE_PROPERTIES,
  UPDATE_TARGETRELSHIPTYPE_PROPERTIES,
  UPDATE_PROPERTY_PROPERTIES,
  UPDATE_TARGETPROPERTY_PROPERTIES,
  UPDATE_VALUE_PROPERTIES,
  UPDATE_TARGETMETHOD_PROPERTIES,
  UPDATE_RELSHIPTYPE_PROPERTIES,
  UPDATE_RELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTVIEW_PROPERTIES,
  UPDATE_RELSHIPVIEW_PROPERTIES,
  UPDATE_OBJECT_PROPERTIES,
  UPDATE_RELSHIP_PROPERTIES,
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME
} from './types';

const debug = false

export const failure = (error) => {
  return {
    type: FAILURE,
    error
  }
}

export const loadData = () => {
  return { type: LOAD_DATA }
}
export const loadDataGithub = () => {
  return { type: LOAD_DATAGITHUB }
}

export const loadDataSuccess = (data) => {
  // console.log('37 --loadDataSuccess ', data);
  return {
    type: LOAD_DATA_SUCCESS,
    data
  }
}

export const loadDataModelList = () => {
  if (debug) console.log('93 actions loadDataModelList ');
  return { type: LOAD_DATAMODELLIST }
}

export const loadDataModelListSuccess = (data) => {
  if (debug) console.log('37 loadDataModelListSuccess ', data);
  return {
    type: LOAD_DATAMODELLIST_SUCCESS,
    data
  }
}

export const loadDataGithubSuccess = (data) => {
  if (!debug) console.log('37 loadDataGithubSuccess ', data);
  return {
    type: LOAD_DATAGITHUB_SUCCESS,
    data
  }
}

export const loadDataModel = (data) => {
  return { type: LOAD_DATAMODEL },
  data
}

export const loadDataModelSuccess = (data) => {
  if (debug) console.log('110 actions loadDataModelSuccess ', data);
  return {
    type: LOAD_DATAMODEL_SUCCESS,
    data
  }
}


export const loadToStorePhdata = (data) => {
  // console.log('21---actions | setFocusPhdata ', data);
  return {
    type: LOAD_TOSTORE_PHDATA,
    data: JSON.parse(data.value)
  }
}

export const loadToStorePhfocus = (data) => {
  // console.log('21---actions | setFocusPhfocus ', data);
  return {
    type: LOAD_TOSTORE_PHFOCUS,
    data: JSON.parse(data.value)
  }
}
export const loadToStorePhuser = (data) => {
  // console.log('21---actions | setFocusPhfocus ', data);
  return {
    type: LOAD_TOSTORE_PHUSER,
    data: JSON.parse(data.value)
  }
}
export const loadToStorePhsource = (data) => {
  // console.log('46---actions |setFocusPhsource ', data);
  return {
    type: LOAD_TOSTORE_PHSOURCE,
    data: JSON.parse(data.value)
  }
}

export const loadToStoreNewModel = (data) => {
  // console.log('21---actions | loadToStoreNewModel ', data);
  return {
    type: LOAD_TOSTORE_NEWMODEL,
    data: JSON.parse(data.value)
  }
}
export const loadToStoreNewModelview = (data) => {
  // console.log('21---actions | loadToStoreNewModelview ', data);
  return {
    type: LOAD_TOSTORE_NEWMODELVIEW,
    data: JSON.parse(data.value)
  }
}
export const setFocusUser = (data) => {
  // console.log('21---actions |', data);
  return {
    type: SET_FOCUS_USER,
    data: JSON.parse(data.value)
  }
}
export const setFocusTab = (data) => {
  // console.log('21---actions |', data);
  return {
    type: SET_FOCUS_TAB,
    data: JSON.parse(data.value)
  }
}
export const setFocusModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_FOCUS_MODEL,
    data: JSON.parse(data.value)
  }
}
export const setFocusModelview = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_MODELVIEW,
    data: JSON.parse(data.value)
  }
}
export const setFocusTargetMetamodel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_FOCUS_TARGETMETAMODEL,
    data: JSON.parse(data.value)
  }
}
export const setFocusTargetModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_FOCUS_TARGETMODEL,
    data: JSON.parse(data.value)
  }
}
export const setFocusTargetModelview = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_TARGETMODELVIEW,
    data: JSON.parse(data.value)
  }
}
export const setMymetisModel = (data) => {
  console.log('103---myMetis', data);
  return {
    type: SET_MYMETIS_MODEL,
    data: JSON.parse(data.value)
  }
}
export const setMyMetisParameter = (data) => {
  console.log('110---MyMetisParameter', data);
  return {
    type: SET_MYMETIS_PARAMETER,
    data: JSON.parse(data.value)
  }
}
export const setMyGoModel = (data) => {
  console.log('21---myMetis', data);
  return {
    type: SET_MY_GOMODEL,
    data: JSON.parse(data.value)
  }
}
export const setMyGoMetamodel = (data) => {
  if (debug) console.log('100---myGoMetamodel', data);
  return {
    type: SET_MY_GOMETAMODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsMetamodelPalette = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_METAMODELPALETTE,
    data: JSON.parse(data.value)
  }
}
export const setGojsMetamodelModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_METAMODELMODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsTargetMetamodel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_TARGETMETAMODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsMetamodel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_METAMODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_MODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsTargetModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_TARGETMODEL,
    data: JSON.parse(data.value)
  }
}
export const setGojsModelObjects = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_MODELOBJECTS,
    data: JSON.parse(data.value)
  }
}
export const setFocusObject = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_OBJECT,
    data: JSON.parse(data.value)
  }
}
export const setFocusObjecttype = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_OBJECTTYPE,
    data: JSON.parse(data.value)
  }
}
export const setFocusRelshiptype = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_RELSHIPTYPE,
    data: JSON.parse(data.value)
  }
}


export const setFocusProj = (data) => {
  return {
    type: SET_FOCUS_PROJ,
    data: JSON.parse(data.value)
  }
}

export const setFocusOrg = (data) => {
  return {
    type: SET_FOCUS_ORG,
    data: JSON.parse(data.value)
  }
}
export const setFocusRole = (data) => {
  return {
    type: SET_FOCUS_ROLE,
    data: JSON.parse(data.value)
  }
}
export const setFocusCollection = (data) => {
  return {
    type: SET_FOCUS_COLLECTION,
    data: JSON.parse(data.value)
  }
}
export const setFocusTask = (data) => {
  // console.log('action-Task-data', data.value);
  // console.log('action-Task-data', JSON.parse(data.value));
  return {
    type: SET_FOCUS_TASK,
    data: JSON.parse(data.value)
  }
}
export const setfocusSource = (data) => {
  // console.log('action-type-data', data);
  return {
    type: SET_FOCUS_SOURCE,
    data: JSON.parse(data.value)
  }
}
export const setfocusRefresh = (data) => {
  // console.log('action-type-data', data);
  return {
    type: SET_FOCUS_REFRESH,
    data: JSON.parse(data.value)
  }
}

export const setUserShowDeleted = (data) => {
  // console.log('action-type-data', data);
  return {
    type: SET_USER_SHOWDELETED,
    data: JSON.parse(data.value)
  }
}

export const update_project_properties = (data) => {
  // console.log('76 actions update_model_properties', data.payload);
  return {
    type: UPDATE_PROJECT_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_model_properties = (data) => {
  // console.log('76 actions update_model_properties', data.payload);
  return {
    type: UPDATE_MODEL_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_modelview_properties = (data) => {
  // console.log('76 actions update_modelview_properties', data.payload);
  return {
    type: UPDATE_MODELVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_metamodel_properties = (data) => {
  // console.log('76 actions update_metamodel_properties', data.payload);
  return {
    type: UPDATE_METAMODEL_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objectview_properties = (data) => {
  // console.log('269 actions update_objectview_properties', data.payload);
  return {
    type: UPDATE_OBJECTVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_relshipview_properties = (data) => {
  // console.log('76 actions update_relshipview_properties', data.payload);
  return {
    type: UPDATE_RELSHIPVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objecttype_properties = (data) => {
  // console.log('205 actions update_objecttype_properties', data.payload);
  return {
    type: UPDATE_OBJECTTYPE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetmodel_properties = (data) => {
  // console.log('205 actions update_targetmodel_properties', data.payload);
  return {
    type: UPDATE_TARGETMODEL_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetobjecttype_properties = (data) => {
  console.log('205 actions update_targetobjecttype_properties', data.payload);
  return {
    type: UPDATE_TARGETOBJECTTYPE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objecttypeview_properties = (data) => {
  console.log('205 actions update_objecttypeview_properties', data.payload);
  return {
    type: UPDATE_OBJECTTYPEVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objecttypegeos_properties = (data) => {
  console.log('205 actions update_objecttypegeos_properties', data.payload);
  return {
    type: UPDATE_OBJECTTYPEGEOS_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_property_properties = (data) => {
  console.log('205 actions update_property_properties', data.payload);
  return {
    type: UPDATE_PROPERTY_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetmetamodel_properties = (data) => {
  console.log('345 actions update_targetmetamodel_properties', data.payload);
  return {
    type: UPDATE_TARGETMETAMODEL_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetobjecttypegeos_properties = (data) => {
  console.log('205 actions update_targetobjecttypegeos_properties', data.payload);
  return {
    type: UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetrelshiptype_properties = (data) => {
  console.log('205 actions update_targetrelshiptype_properties', data.payload);
  return {
    type: UPDATE_TARGETRELSHIPTYPE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetrelshiptypeview_properties = (data) => {
  console.log('205 actions update_targetrelshiptypeview_propertie', data.payload);
  return {
    type: UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetproperty_properties = (data) => {
  console.log('205 actions update_targetproperty_properties', data.payload);
  return {
    type: UPDATE_TARGETPROPERTY_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_targetvalue_properties = (data) => {
  console.log('205 actions update_targetvalue_properties', data.payload);
  return {
    type: UPDATE_TARGETVALUE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_datatype_properties = (data) => {
  console.log('311 actions update_datatype_properties', data.payload);
  return {
    type: UPDATE_DATATYPE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_value_properties = (data) => {
  console.log('205 actions update_value_properties', data.payload);
  return {
    type: UPDATE_VALUE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_relshiptype_properties = (data) => {
  console.log('205 actions update_relshiptype_properties', data.payload);
  return {
    type: UPDATE_RELSHIPTYPE_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_relshiptypeviews_properties = (data) => {
  console.log('205 actions update_relshiptypeviews_properties', data.payload);
  return {
    type: UPDATE_RELSHIPTYPEVIEWS_PROPERTIES,
    data: JSON.parse(data.value)
  }
}

export const update_object_properties = (data) => {
  console.log('205 actions update_object_properties', data.payload);
  return {
    type: UPDATE_OBJECT_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_relship_properties = (data) => {
  console.log('205 actions update_relship_properties', data.payload);
  return {
    type: UPDATE_RELSHIP_PROPERTIES,
    data: JSON.parse(data.value)
  }
}

export const update_objectview_name = (data) => {
  // console.log('76 action-object-edit-data', data.payload);
  return {
    type: UPDATE_OBJECTVIEW_NAME,
    data: JSON.parse(data.value)
  }
}

export const edit_object_properties = (data) => {
  // console.log('76 action-object-edit-data', data.payload);
  return {
    type: EDIT_OBJECT_PROPERTIES,
    data: JSON.parse(data.value)
  }
}