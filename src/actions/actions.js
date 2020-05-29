import { 
  FAILURE, 
  LOAD_DATA, 
  LOAD_DATA_SUCCESS, 
  SET_FOCUS_PHDATA, 
  SET_FOCUS_PHSOURCE,
  SET_FOCUS_PHFOCUS, 
  SET_FOCUS_USER, 
  SET_FOCUS_OBJECT, 
  SET_MYMETIS_MODEL,
  SET_MY_GOMODEL,
  SET_FOCUS_MODEL, 
  SET_GOJS_MODEL, 
  SET_GOJS_METAMODEL,
  SET_FOCUS_MODELVIEW,
  SET_FOCUS_PROJ, 
  SET_FOCUS_ORG, 
  SET_FOCUS_ROLE, 
  SET_FOCUS_COLLECTION, 
  SET_FOCUS_TASK, 
  SET_FOCUS_SOURCE, 
  UPDATE_OBJECTVIEW_PROPERTIES,
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
    type: SET_FOCUS_PHSOURCE,
    data: JSON.parse(data.value)
  }
}
export const setFocusPhdata = (data) => {
  // console.log('21---actions | setFocusPhdata ', data);
  return {
    type: SET_FOCUS_PHDATA,
    data: JSON.parse(data.value)
  }
}

export const setFocusPhfocus = (data) => {
  // console.log('21---actions | setFocusPhfocus ', data);
  return {
    type: SET_FOCUS_PHFOCUS,
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
export const setGojsModel = (data) => {
  // console.log('21---', data);
  return {
    type: SET_GOJS_MODEL,
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
export const setFocusObject = (data) => {
  // console.log('21---', data.value);
  return {
    type: SET_FOCUS_OBJECT,
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
export const edit_object_properties = (data) => {
  // console.log('76 action-object-edit-data', data.payload);
  return {
    type: EDIT_OBJECT_PROPERTIES,
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
export const update_objectview_name = (data) => {
  // console.log('76 action-object-edit-data', data.payload);
  return {
    type: UPDATE_OBJECTVIEW_NAME,
    data: JSON.parse(data.value)
  }
}