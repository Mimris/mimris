import { 
  FAILURE, 
  LOAD_DATA, 
  LOAD_DATA_SUCCESS, 
  LOAD_TOSTORE_PHDATA, 
  LOAD_TOSTORE_PHSOURCE,
  LOAD_TOSTORE_PHFOCUS, 
  SET_FOCUS_USER, 
  SET_FOCUS_OBJECT, 
  SET_FOCUS_OBJECTVIEW, 
  SET_FOCUS_RELSHIP, 
  SET_FOCUS_RELSHIPVIEW, 
  SET_FOCUS_OBJECTTYPE, 
  SET_FOCUS_RELSHIPTYPE, 
  SET_MYMETIS_MODEL,
  SET_MY_GOMODEL,
  SET_MY_GOMETAMODEL,
  SET_FOCUS_MODEL, 
  SET_GOJS_MODEL, 
  SET_GOJS_METAMODEL,
  SET_GOJS_METAMODELPALETTE, 
  SET_GOJS_METAMODELMODEL,
  SET_FOCUS_MODELVIEW,
  SET_FOCUS_PROJ, 
  SET_FOCUS_ORG, 
  SET_FOCUS_ROLE, 
  SET_FOCUS_COLLECTION, 
  SET_FOCUS_TASK, 
  SET_FOCUS_SOURCE, 
  UPDATE_MODEL_PROPERTIES,
  UPDATE_MODELVIEW_PROPERTIES,
  UPDATE_OBJECTTYPE_PROPERTIES,
  UPDATE_OBJECTTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTTYPEGEOS_PROPERTIES,
  UPDATE_RELSHIPTYPE_PROPERTIES,
  UPDATE_RELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTVIEW_PROPERTIES,
  UPDATE_RELSHIPVIEW_PROPERTIES,
  UPDATE_OBJECT_PROPERTIES,
  UPDATE_RELSHIP_PROPERTIES,
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME
} from './types';

export const failure = (error) => {
  return {
    type: FAILURE,
    error
  }
}

export const loadData = () => {
  return { type: LOAD_DATA }
}

export const loadDataSuccess = (data) => {
  // console.log('37 --loadDataSuccess ', data);
  return {
    type: LOAD_DATA_SUCCESS,
    data
  }
}

export const setFocusPhsource = (data) => {
  // console.log('46---actions |setFocusPhsource ', data);
  return {
    type: LOAD_TOSTORE_PHSOURCE,
    data: JSON.parse(data.value)
  }
}
export const setFocusPhdata = (data) => {
  // console.log('21---actions | setFocusPhdata ', data);
  return {
    type: LOAD_TOSTORE_PHDATA,
    data: JSON.parse(data.value)
  }
}

export const setFocusPhfocus = (data) => {
  // console.log('21---actions | setFocusPhfocus ', data);
  return {
    type: LOAD_TOSTORE_PHFOCUS,
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
export const setFocusModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_FOCUS_MODEL,
    data: JSON.parse(data.value)
  }
}
export const setMymetisModel = (data) => {
  console.log('21---myMetis', data);
  return {
    type: SET_MYMETIS_MODEL,
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
  console.log('100---myGoMetamodel', data);
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
export const setfocusModelview = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_MODELVIEW,
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

export const update_model_properties = (data) => {
  console.log('76 actions update_model_properties', data.payload);
  return {
    type: UPDATE_MODEL_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_modelview_properties = (data) => {
  console.log('76 actions update_modelview_properties', data.payload);
  return {
    type: UPDATE_MODELVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objectview_properties = (data) => {
  console.log('76 actions update_objectview_properties', data.payload);
  return {
    type: UPDATE_OBJECTVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_relshipview_properties = (data) => {
  console.log('76 actions update_relshipview_properties', data.payload);
  return {
    type: UPDATE_RELSHIPVIEW_PROPERTIES,
    data: JSON.parse(data.value)
  }
}
export const update_objecttype_properties = (data) => {
  console.log('205 actions update_objecttype_properties', data.payload);
  return {
    type: UPDATE_OBJECTTYPE_PROPERTIES,
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