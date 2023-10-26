const debug = false;

import {
  FAILURE,
  LOAD_DATA,
  LOAD_DATAGITHUB,
  LOAD_DATAGITHUB_SUCCESS,
  LOAD_DATA_SUCCESS,
  LOAD_DATAMODELLIST,
  LOAD_DATAMODELLIST_SUCCESS,
  LOAD_DATAMODEL,
  LOAD_DATAMODEL_SUCCESS,
  LOAD_TOSTORE_DATA,
  LOAD_TOSTORE_PHFOCUS,
  LOAD_TOSTORE_PHDATA,
  LOAD_TOSTORE_PHUSER,
  LOAD_TOSTORE_PHSOURCE,
  LOAD_TOSTORE_NEWMODEL,
  LOAD_TOSTORE_NEWMODELVIEW,
  SET_FOCUS_PHFOCUS,
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
  SET_FOCUS_ISSUE,

  SET_USER_SHOWDELETED,
  SET_USER_SHOWMODIFIED,

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
  UPDATE_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_PROPERTIES,
  UPDATE_RELSHIP_PROPERTIES,
  UPDATE_RELSHIPVIEW_PROPERTIES,
  UPDATE_OBJECTTYPE_PROPERTIES,
  UPDATE_TARGETMETAMODEL_PROPERTIES,
  UPDATE_TARGETMODEL_PROPERTIES,
  UPDATE_TARGETOBJECTTYPE_PROPERTIES,
  UPDATE_TARGETPROPERTY_PROPERTIES,
  UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES,
  UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES,
  UPDATE_TARGETRELSHIPTYPE_PROPERTIES,
  UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_TARGETDATATYPE_PROPERTIES,
  UPDATE_TARGETMETHOD_PROPERTIES,
  UPDATE_TARGETVALUE_PROPERTIES,
  UPDATE_VIEWSTYLE_PROPERTIES,
  UPDATE_OBJECTTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTTYPEGEOS_PROPERTIES,
  UPDATE_DATATYPE_PROPERTIES,
  UPDATE_PROPERTY_PROPERTIES,
  UPDATE_METHODTYPE_PROPERTIES,
  UPDATE_METHOD_PROPERTIES,
  UPDATE_VALUE_PROPERTIES,
  UPDATE_RELSHIPTYPE_PROPERTIES,
  UPDATE_RELSHIPTYPEVIEW_PROPERTIES,
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME,
  SET_VISIBLE_CONTEXT
} from '../actions/types';

//import context from '../pages/context';


// import InitStateJson from './InitialState.json'

import StartInitStateJson from '../startupModel/AKM-INIT-Startup__PR.json'
// import StartInitStateJson from '../startupModel/AKM-Core-Type-Definitions__PR.json'
// import StartInitStateJson from '../startupModel/INIT-Startup_Project.json'
// import LoadInitmodel from '../components/LoadModelData/LoadInitmodel'

const InitStateJson = StartInitStateJson
// const InitStateJson = (LoadInitmodel) ? LoadInitmodel : StartInitStateJson

if (debug) console.log('86 InitStateJson', InitStateJson);
const InitState = JSON.parse(JSON.stringify(InitStateJson))

// import { IntitalProjectJson } from 'git/akmmodels/AKMM-Project_IDEF.json'
// const InitState = JSON.parse(JSON.stringify(InitProjectJson)) 
// const InitProject = JSON.parse(JSON.stringify(InitProject))
// // const InitMetamodels = JSON.parse(JSON.stringify(InitMetamodelsJson)) 
// // const InitModels = JSON.parse(JSON.stringify(InitModelsJson)) 
// let InitphData = InitState

// if (InitProject) InitphData = InitProject


// if (debug) console.log('38 InitialState', InitState);

// export const InitialState = {
//   phData: null, //InitState.phData,
//   // phData: {
//   //   metis: {
//   //     name: 'Empty AKMM model',
//   //     description: 'AKMM Model',
//   //     metamodels: [],
//   //     models: [], 
//   //     currentMetamodelRef: '',
//   //     currentModelRef: '',
//   //     currentModelviewRef: '',
//   //     currentTemplateRef: '',
//   //     currentTargetMetamodelRef: '',
//   //     currentTargetModelRef: '',
//   //     currentTargetModelviewRef: '',
//   //     currentTaskModelRef: '',
//   //   },
//   // }, //InitState.phData,
//   // phList: null, // list of models from AMMServer (firebase)
//   phFocus: null, //InitState.phFocus,
//   phUser: null, //InitState.phUser,
//   phSource: null, //InitState.phSource,
//   lastUpdate: new Date().toISOString()
// }

export const InitialState = {
  phData: InitState.phData,
  // phList: null, // list of models from AMMServer (firebase)
  phFocus: InitState.phFocus,
  // phGojs: null,
  phMymetis: null,
  // phMyGoModel: null,
  // phMyGoMetamodel: null,
  phUser: InitState.phUser,
  phSource: InitState.phSource,
  lastUpdate: new Date().toISOString()
}

let focusTask
let focusSource
let focusModelview
let focusObject
let focusObjectview = null
let focusRelship = null
let focusRelshipview = null
let focusObjecttype = null
let focusRelshiptype = null
let focusOrg
let focusProj
let focusRole
let focusCollection

function reducer(state = InitialState, action) {

  const { phData, phFocus, phUser } = state;
  const { type, payload } = action;
  const focusModel = phFocus?.focusModel
  const curModel = phData.metis.models.find((m) => m.id === focusModel?.id) || phData.metis.models[0] //current model;
  if (debug) console.log('174 reducer state', state, curModel);
  if (!curModel) return state;
  const curModelIndex = phData.metis.models.findIndex((m) => m.id === focusModel?.id);
  const curModelview = curModel?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id) || curModel?.modelviews[0] //current modelview
  let curModelviewIndex = curModel?.modelviews?.findIndex(mv => mv.id === state.phFocus?.focusModelview?.id) // curretn modelview index
  const curModelviewsLength = curModel?.modelviews?.length // lentgh of modelviews array
  if (curModelviewIndex < 0) { curModelviewIndex = curModelviewsLength } // if modelview not found, i.e. -1, then add a new modelview

  // const curObjectType = curMetamodel.objecttypes.find((ot) => ot.id === curObjectView.objecttypeRef);
  // const curObjectTypeIndex = curMetamodel.objecttypes.findIndex((ot) => ot.id === curObjectView.objecttypeRef);

  const curMetamodel = phData.metis.metamodels.find((m) => m.id === curModel.metamodelRef);
  const curMetamodelIndex = phData.metis.metamodels.findIndex((m) => m.id === curModel.metamodelRef);



        // ToDo:
      // add new object + date and issue name and github link
      // const getContext = (curObjectIndex) => {
      //   return {
        //   (curObjectIndex < 0) 
        //     ? {
        //         ...curModel?.objects[curObjectIndex].context,
        //         created: {
          //         user: state.phUser?.focusUser?.id,
          //         date: new Date().toISOString(),
          //         issue: state.phFocus?.focusIssue?.id,
          //         github: state.phFocus?.focusIssue?.github,
        //         },
        //         modified: {
        //           user: state.phUser?.focusUser?.id,
        //           date: new Date().toISOString(),
        //           issue: state.phFocus?.focusIssue?.id,
        //           github: state.phFocus?.focusIssue?.github,
        //         },
        //       }
        //     : curModel?.objects[curObjectIndex]?.context
        //     }
        //   }
      //  }

  if (debug) console.log('188 reducer action', action)
  switch (action.type) {
    case FAILURE:
      if (debug) console.log('113 FAILURE', action);
      return {
        ...state,
        ...{ error: action.error }
      }
    case LOAD_DATA_SUCCESS:
      // if (debug) console.log('160 LOAD_DATA_SUCCESS', action);
      return {
        ...state,
        phData: action.data,
        phSource: 'Model server'
      }
    case LOAD_DATAGITHUB_SUCCESS:
      if (debug) console.log('160 LOAD_DATAGITHUB_SUCCESS', action, action.data.data.phData);
      const retval_LOAD_DATAGITHUB_SUCCESS =
      {
        ...state,
        phData: action.data.data.phData,
        phSource: action.data.data.phSource, //'GitHub'
        phFocus: action.data.data.phFocus,
        phUser: action.data.data.phUser,
        lastUpdate: action.data.data.lastUpdate
      }
      if (debug) console.log('170 LOAD_DATAGITHUB_SUCCESS', retval_LOAD_DATAGITHUB_SUCCESS);
      return retval_LOAD_DATAGITHUB_SUCCESS

    case LOAD_DATAMODELLIST_SUCCESS:
      if (debug) console.log('122 LOAD_DATAMODELLIST_SUCCESS', action);
      return {
        ...state,
        phList: action.data,
      }
    case LOAD_DATAMODEL_SUCCESS:
      if (debug) console.log('132 LOAD_DATAMODEL_SUCCESS', action);
      let loadmodindex = state.phData?.metis?.models?.findIndex(m => m.id === action.data?.id) // current model index
      if (debug) console.log('431 reducer', loadmodindex)
      if (loadmodindex < 0) { loadmodindex = state.phData.metis.models.length }
      if (debug) console.log('433 reducer', loadmodindex)
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, loadmodindex),
              action.data.model,
              ...state.phData.metis.models.slice(loadmodindex + 1, state.phData.metis.models.length),
            ]
          },
        },
        phSource: 'Model server'
      }
    case LOAD_TOSTORE_DATA:
      if (debug) console.log('169 LOAD_TOSTORE_DATA', action);
      return {
        ...state,
        ...action.data
      }
    case LOAD_TOSTORE_PHDATA:
      if (debug) console.log('227 LOAD_TOSTORE_PHDATA', action);
      const retval_LOAD_TOSTORE_PHDATA =
      {
        ...state,
        phData: action.data
      }
      if (debug) console.log('235 LOAD_TOSTORE_PHDATA', retval_LOAD_TOSTORE_PHDATA);
      return retval_LOAD_TOSTORE_PHDATA;
    case LOAD_TOSTORE_PHFOCUS:
      if (debug) console.log('183 LOAD_TOSTORE_PHFOCUS', action);
      return {
        ...state,
        phFocus: action.data
      }
    case LOAD_TOSTORE_PHUSER:
      if (debug) console.log('176 LOAD_TOSTORE_PHUSER', action);
      return {
        ...state,
        phUser: action.data
      }
    case LOAD_TOSTORE_PHSOURCE:
      if (debug) console.log('176 LOAD_TOSTORE_PHSOURCE', action);
      return {
        ...state,
        phSource: action.data
      }
    case LOAD_TOSTORE_NEWMODEL:
      if (debug) console.log('113 LOAD_TOSTORE_NEWMODEL', action);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models, action.data
            ]
          }
        }
      }
    case LOAD_TOSTORE_NEWMODELVIEW:
      if (debug) console.log('113 LOAD_TOSTORE_NEWMODELVIEW', action.data);
      const curmnew = state.phData?.metis?.models?.find(m => m.id === action.data.id) //current model
      let curmindexnew = state.phData?.metis?.models?.findIndex(m => m.id === action.data.id) // current model index
      // const curmnew = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      // const curmindexnew = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      if (curmindexnew < 0) curmindexnew = state.phData?.metis?.models.length
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curmindexnew),
              action.data,
              ...state.phData.metis.models.slice(curmindexnew + 1, state.phData?.metis?.models.length),
            ]
          }
        }
      }
    case SET_FOCUS_PHFOCUS:
      if (debug) console.log('190 SET_FOCUS_PHFOCUS', action.data);
      return {
        ...state,
        phFocus: action.data
      }
    case SET_FOCUS_USER:
      if (debug) console.log('190 SET_FOCUS_USER', action.data);
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: action.data
        },
      }
    case SET_FOCUS_TAB:
      if (debug) console.log('218 SET_FOCUS_TAB', action.data);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTab: action.data
        },
      }
    case SET_FOCUS_MODEL:
      if (debug) console.log('316 red', action.data);
      const retval_SET_FOCUS_MODEL = {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModel: action.data
        }
      }
      if (debug) console.log('324 red', retval_SET_FOCUS_MODEL.phFocus.focusModel);
      return retval_SET_FOCUS_MODEL

    case SET_FOCUS_MODELVIEW:
      if (debug) console.log('262 SET_FOCUS_MODELVIEW', state, action.data);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModelview: action.data
        }
      }
    case SET_FOCUS_TARGETMETAMODEL:
      if (debug) console.log('121 reducer targetmetamodel', state, action.data);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTargetMetamodel: action.data
        }
      }
    case SET_FOCUS_TARGETMODEL:
      if (debug) console.log('121 red', state, action.data);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTargetModel: action.data
        }
      }
    case SET_FOCUS_TARGETMODELVIEW:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTargetModelview: action.data
        }
      }
    case SET_FOCUS_OBJECT:
      if (debug) console.log('235 SET_FOCUS_OBJECT', state, action.data);
      const retval_SET_FOCUS_OBJECT = {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusObject: action.data
        }
      }
      return retval_SET_FOCUS_OBJECT

    case SET_FOCUS_OBJECTVIEW:
      if (debug) console.log('375 SET_FOCUS_OBJECTVIEW', state, action.data);
      const retval_SET_FOCUS_OBJECTVIEW = {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusObjectview: action.data
        }
      }
      if (debug) console.log('383 SET_FOCUS_OBJECTVIEW', retval_SET_FOCUS_OBJECTVIEW);
      return retval_SET_FOCUS_OBJECTVIEW

    case SET_FOCUS_RELSHIP:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusRelship: action.data
        }
      }
    case SET_FOCUS_RELSHIPVIEW:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusRelshipview: action.data
        }
      }
    case SET_FOCUS_OBJECTTYPE:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusObjecttype: action.data
        }
      }
    case SET_FOCUS_RELSHIPTYPE:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusRelshiptype: action.data
        }
      }

    // case SET_MYMETIS_METAMODEL:
    //   if (debug) console.log('269 SET_MYMETIS_METAMODEL', action);
    //   return {
    //     ...state,
    //     phMymetis: {
    //       ...state.phMymetis,
    //       myMetis: action.myMetis
    //     }
    //   }

    case SET_FOCUS_PROJ:
      if (debug) console.log('430 SET_FOCUS_PROJ', action.data)
      const retval_SET_FOCUS_PROJ = {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusProj: action.data
        }
      }
      if (debug) console.log('438 retval_SET_FOCUS_PROJ', retval_SET_FOCUS_PROJ)
      return retval_SET_FOCUS_PROJ

    case SET_FOCUS_ORG:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusOrg: action.data
        }
      }
    case SET_FOCUS_ROLE:
      if (debug) console.log('350 role', action);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusRole: action.data
        }
      }
    case SET_FOCUS_COLLECTION:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusCollection: action.data
        }
      }
    case SET_FOCUS_TASK:
      if (debug) console.log('367 task', action);
      // if (debug) console.log('104', action.data);

      // focusTask = action.data.focusTask
      // focusObject = (action.data.focusTask?.focus.focusObject) ? action.data.focusTask.focus.focusObject : state.phFocus.focusObject
      // focusSource = (action.data.focusTask?.focus.focusSource) ? action.data.focusTask.focus.focusSource : state.phFocus.focusSource
      // focusModelview = (action.data.focusTask?.focus.focusModelview) ? action.data.focusTask.focus.focusModelview : state.phFocus.focusModelview
      // focusOrg = (action.data.focusTask?.focus.focusOrg) ? action.data.focusTask.focus.focusOrg : state.phFocus.focusOrg
      // focusProj = (action.data.focusTask?.focus.focusProj) ? action.data.focusTask.focus.focusProj : state.phFocus.focusProj
      // focusRole = (action.data.focusTask?.focus.focusRole) ? action.data.focusTask.focus.focusRole : state.phFocus.focusRole
      // focusCollection = (action.data.focusTask?.focus.focusCollection) ? action.data.focusTask.focus.focusCollection : state.phFocus.focusCollection

      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTask: action.data
          // focusTask: focusTask,
          // focusObject: focusObject,
          // focusSource: focusSource,
          // focusModelview: focusModelview,
          // focusOrg: focusOrg,
          // focusProj: focusProj,
          // focusRole: focusRole,
          // focusCollection: focusCollection
        }
      }
    case SET_FOCUS_ISSUE:
      if (debug) console.log('519 SET_FOCUS_ISSUE', action);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusIssue: action.data
        }
      }
    case SET_FOCUS_SOURCE:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusSource: action.data
        }
      }
    case SET_FOCUS_REFRESH:
      if (debug) console.log('483 SET_FOCUS_REFRESH', action);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusRefresh: action.data
        }
      }
    case SET_USER_SHOWDELETED:
      if (debug) console.log('440 SET_USER_SHOWDELETED', action);
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: {
            ...state.focusUser,
            diagram: {
              ...state.phUser.focusUser.diagram,
              showDeleted: action.data
            }
          }
        }
      }
    case SET_USER_SHOWMODIFIED:
      if (debug) console.log('528 SET_USER_SHOWMODIFIED', action);
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: {
            ...state.focusUser,
            diagram: {
              ...state.phUser.focusUser.diagram,
              showModified: action.data
            }
          }
        }
      }
    case SET_MYMETIS_MODEL:
      // if (debug) console.log('228 SET_MYMETIS_MODEL', action);
      return {
        ...state,
        phMymetis: {
          ...state.phMymetis,
          myMetis: action.myMetis
        }
      }
    case SET_MYMETIS_PARAMETER:
      // if (debug) console.log('221 SET_MYMETIS_PARAMETER', action.data);
      return {
        ...state,
        phMymetis: {
          ...state.phMymetis,
          myMetis: {
            ...state.phMymetis.myMetis,
            pasteViewsOnly: (action.data.pasteViewsOnly) && action.data.pasteViewsOnly,
            deleteViewsOnly: (action.data.deleteViewsOnly) && action.data.deleteViewsOnly
          }
        }
      }
    case SET_MY_GOMODEL:
      // if (debug) console.log('220 SET_MY_GOMODEL', action);
      return {
        ...state,
        phMyGoModel: {
          ...state.phMyGoModel,
          myGoModel: action.myGoModel
        }
      }
    case SET_MY_GOMETAMODEL:
      // if (debug) console.log('220 SET_MY_GOMODEL', action);
      return {
        ...state,
        phMyGoMetamodel: {
          ...state.phMyGoMetamodel,
          myGoMetamodel: action.myGoMetamodel
        }
      }
    case SET_GOJS_METAMODELPALETTE:
      if (debug) console.log('592 SET_GOJS_METAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodelPalette: action.gojsMetamodelPalette
        }
      }
    case SET_GOJS_METAMODELMODEL:
      if (debug) console.log('601 SET_GOJS_METAMODELMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodelModel: action.gojsMetamodelModel
        }
      }
    case SET_GOJS_TARGETMETAMODEL:
      if (debug) console.log('229 SET_GOJS_TARGETMETAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsTargetMetamodel: action.gojsTargetMetamodel
        }
      }
    case SET_GOJS_METAMODEL:
      // if (debug) console.log('219 SET_GOJS_METAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodel: action.gojsMetamodel
        }
      }
    case SET_GOJS_MODEL:
      if (debug) console.log('560 SET_GOJS_MODEL', action, state);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModel: action.gojsModel
        }
      }
    case SET_GOJS_TARGETMODEL:
      // if (debug) console.log('210 SET_GOJS_TARGETMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsTargetModel: action.gojsTargetModel
        }
      }
    case SET_GOJS_MODELOBJECTS:
      // if (debug) console.log('210 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModelObjects: action.gojsModelObjects
        }
      }
    case UPDATE_PROJECT_PROPERTIES:
      if (debug) console.log('429 UPDATE_PROJECT_PROPERTIES', action);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            ...action.data,
          },
        },
      }
    case UPDATE_MODEL_PROPERTIES:
      if (debug) console.log('429 UPDATE_MODEL_PROPERTIES', action, state.phData);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                ...action.data,
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
    case UPDATE_TARGETMODEL_PROPERTIES:
      // if (debug) console.log('472 UPDATE_TARGETMODEL_PROPERTIES', action);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                ...action.data,
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
    case UPDATE_MODELVIEW_PROPERTIES:
      if (!debug) console.log('713 UPDATE_MODELVIEW_PROPERTIES', action);
      const curmv = curModel?.modelviews?.find(mv => mv.id === action?.data?.id) // current modelview
      let curModviewIndex = curModel?.modelviews?.findIndex(mv => mv.id === action?.data?.id) // current modelview index
      const curmvlength = curModel?.modelviews?.length
      if (curModviewIndex < 0) { curModviewIndex = curmvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
      if (!debug) console.log('714 UPDATE_MODELVIEW_PROPERTIES', curModviewIndex, state.phData.metis.models[curModelIndex].modelviews[curModviewIndex])

      const retval_UPDATE_MODELVIEW_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                modelviews: [
                  ...curModel?.modelviews?.slice(0, curModviewIndex),
                  {
                    ...curModel?.modelviews[curModviewIndex],
                    ...action.data,
                  },
                  ...curModel?.modelviews?.slice(curModviewIndex + 1),
                ]
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
      if (!debug) console.log('731 retval', retval_UPDATE_MODELVIEW_PROPERTIES);
      return retval_UPDATE_MODELVIEW_PROPERTIES

    case UPDATE_OBJECT_PROPERTIES:
      if (debug) console.log('743 UPDATE_OBJECT_PROPERTIES', action);
      const curObject = curModel?.objects?.find((o) => o.id === action.data?.id);
      let curObjectIndex = curModel?.objects?.findIndex((o) => o.id === curObject?.id);
      const curObjectLength = curModel?.objects?.length;
      if (curObjectIndex < 0) { curObjectIndex = curObjectLength }  // if object not found, i.e. -1, then add a new object

      // const context = getContext(curObjectIndex)
      
      const retval_UPDATE_OBJECT_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                objects: [
                  ...curModel?.objects.slice(0, curObjectIndex),
                  {
                    ...curModel.objects[curObjectIndex],
                    ...action.data,
                    // ...context,
                  },
                  ...curModel?.objects.slice(curObjectIndex + 1, curModel?.objects.length)
                ],
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ],
          },
        }
      }
      if (debug) console.log('773 retval_UPDATE_OBJECT_PROPERTIES', retval_UPDATE_OBJECT_PROPERTIES)
      return retval_UPDATE_OBJECT_PROPERTIES

    case UPDATE_OBJECTVIEW_PROPERTIES:
      if (debug) console.log('777 UPDATE_OBJECTVIEW_PROPERTIES: ', action);
      const curObjectview = curModelview?.objectviews?.find(ov => ov.id === action?.data?.id) // current objectview
      let curObjectviewIndex = curModelview?.objectviews?.findIndex((ov) => ov.id === curObjectview?.id); // current objectview index
      const curObjectviewsLength = curModelview?.objectviews?.length
      if (curObjectviewIndex < 0) { curObjectviewIndex = curObjectviewsLength } // ovindex = -1, i.e.  not fond, which means adding a new objectview

      const retval_UPDATE_OBJECTVIEW_PROPERTIES =
      {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                modelviews: [
                  ...curModel?.modelviews?.slice(0, curModelviewIndex),
                  {
                    ...curModel?.modelviews[curModelviewIndex],
                    objectviews: [
                      ...curModelview?.objectviews?.slice(0, curObjectviewIndex),
                      {
                        ...curModelview.objectviews[curObjectviewIndex],
                        ...action.data,
                      },
                      ...curModelview?.objectviews?.slice(curObjectviewIndex + 1, curModelview?.objectviews.length)
                    ]
                  },
                  ...curModel?.modelviews?.slice(curModelviewIndex + 1, curModel.modelviews.length),
                ],
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
      if (debug) console.log('857 retval', retval_UPDATE_OBJECTVIEW_PROPERTIES);
      return retval_UPDATE_OBJECTVIEW_PROPERTIES

    case UPDATE_RELSHIP_PROPERTIES:
      if (debug) console.log('697 UPDATE_RELSHIP_PROPERTIES', action);
      const curRelship = curModel?.relships?.find((r) => r?.id === action.data?.id) || [];
      let curRelshipIndex = curModel?.relships?.findIndex((r) => r?.id === curRelship?.id);
      const curRelshipLength = curModel?.relships?.length;
      if (curRelshipIndex < 0) { curRelshipIndex = curRelshipLength }

      const retval_UPDATE_RELSHIP_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                relships: [
                  ...curModel.relships.slice(0, curRelshipIndex),
                  {
                    ...curModel.relships[curRelshipIndex],
                    ...action.data,
                  },
                  ...curModel.relships.slice(curRelshipIndex + 1, curModel.relships.length)
                ]
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
      return retval_UPDATE_RELSHIP_PROPERTIES

    case UPDATE_RELSHIPVIEW_PROPERTIES:
      if (debug) console.log('857 UPDATE_RELSHIPVIEW_PROPERTIES', action);
      const curRelshipview = curModelview?.relshipviews?.find(rv => rv?.id === action?.data?.id) // current relshipview
      let curRelshipviewIndex = curModelview?.relshipviews?.findIndex((rv) => rv?.id === curRelshipview?.id) //action?.data?.id); // current relshipview index
      const curRelshipviewsLength = curModelview?.relshipviews?.length
      if (curRelshipviewIndex < 0) { curRelshipviewIndex = curRelshipviewsLength } // rvindex = -1, i.e.  not fond, which means adding a new relshipview

      const retval_UPDATE_RELSHIPVIEW_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curModelIndex),
              {
                ...state.phData.metis.models[curModelIndex],
                modelviews: [
                  ...curModel?.modelviews?.slice(0, curModelviewIndex),
                  {
                    ...curModel?.modelviews[curModelviewIndex],
                    relshipviews: [
                      ...curModelview?.relshipviews?.slice(0, curRelshipviewIndex),
                      {
                        ...curModelview?.relshipviews[curRelshipviewIndex],
                        ...action.data,
                      },
                      ...curModelview?.relshipviews.slice(curRelshipviewIndex + 1, curModelview?.relshipviews?.length)
                    ]
                  },
                  ...curModel?.modelviews.slice(curModelviewIndex + 1, curModel?.modelviews?.length),
                ],
              },
              ...state.phData.metis.models.slice(curModelIndex + 1, state.phData.metis.models.length),
            ]
          },
        },
      }
      if (debug) console.log('889 retval', retval_UPDATE_RELSHIPVIEW_PROPERTIES);
      return retval_UPDATE_RELSHIPVIEW_PROPERTIES

    case UPDATE_OBJECTTYPE_PROPERTIES:
      if (debug) console.log('949 UPDATE_OBJECTTYPE_PROPERTIES', action);
      const curmodot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmot = state.phData?.metis?.metamodels?.find(m => m.id === curmodot.metamodelRef)
      const curmmindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodot.metamodelRef)
      const curot = curmmot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthot = curmmot?.objecttypes.length
      let indexot = curmmot?.objecttypes?.findIndex(ot => ot.id === curot?.id)
      if (indexot < 0) { indexot = lengthot }
      if (debug) console.log('957 reducer', lengthot, indexot);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindexot),
              {
                ...state.phData.metis.metamodels[curmmindexot],
                objecttypes: [
                  ...curmmot?.objecttypes.slice(0, indexot),
                  {
                    ...curmmot?.objecttypes[indexot],
                    ...action.data,
                  },
                  ...curmmot?.objecttypes.slice(indexot + 1, curmmot.objecttypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_METAMODEL_PROPERTIES:
      if (debug) console.log('992 UPDATE_METAMODEL_PROPERTIES', action);
      const curm_mm = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      // const action_mm = state.phData?.metis?.metamodels?.find(mm => mm.id === action.data.id) //incoming action meta model
      let curmmindex_mm = state.phData?.metis?.metamodels?.findIndex(mm => mm.id === action?.data?.id)  // current metamodel index
      if (debug) console.log('1009 UPDATE_METAMODEL_PROPERTIES', curmmindex_mm);

      if (curmmindex_mm < 0) curmmindex_mm = state.phData.metis.metamodels.length
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindex_mm),
              {
                ...state.phData.metis.metamodels[curmmindex_mm],
                ...action.data,
              },
              ...state.phData.metis.metamodels.slice(curmmindex_mm + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_TARGETMETAMODEL_PROPERTIES:
      if (debug) console.log('1028 UPDATE_TARGEMETAMODEL_PROPERTIES', action);
      const curm_tmm = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmm_tmm = state.phData?.metis?.metamodels?.find(mm => mm.id === curm_tmm.targetMetamodelRef) //current meta model
      let curmmindex_tmm = state.phData?.metis?.metamodels?.findIndex(mm => mm.id === curm_tmm.targetMetamodelRef)  // current metamodel index
      if (debug) console.log('1031 curmm_tmm', curmm_tmm, curmmindex_tmm)
      if (curmmindex_tmm < 0) curmmindex_tmm = state.phData.metis.metamodels.length
      if (debug) console.log('1033 curmm_tmm', curmm_tmm, curmmindex_tmm)
      if (debug) console.log('1034 metamodels', state.phData?.metis?.metamodels[curmmindex_tmm]);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindex_tmm),
              {
                ...state.phData.metis.metamodels[curmmindex_tmm],
                ...action.data,
              },
              ...state.phData.metis.metamodels.slice(curmmindex_tmm + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_TARGETOBJECTTYPE_PROPERTIES:
      if (debug) console.log('1108 UPDATE_TARGETOBJECTTYPE_PROPERTIES action.data', action.data);
      const curmodtot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmmtot = state.phData?.metis?.metamodels?.find(m => m.id === curmodtot.targetMetamodelRef) //current target meta model
      if (debug) console.log('1111 UPDATE_TARGETOBJECTTYPE_PROPERTIES', curmmtot, curmodtot);
      if (!curmmtot) return state;
      const curmmindextot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtot.targetMetamodelRef) //current target meta model index
      const curtot = curmmtot?.objecttypes?.find(ot => ot.id === action?.data?.id) //current target object type
      const lengthtot = curmmtot?.objecttypes?.length //current objecttypes array length
      let indextot = curmmtot?.objecttypes?.findIndex(ot => ot.id === curtot?.id) //current target objecttype index
      if (indextot < 0) { indextot = lengthtot }
      if (debug) console.log('1118 reducer', lengthtot, indextot, curmmtot?.objecttypes);
      if (debug) console.log('1119 objecttypes', curmmtot?.objecttypes);
      if (debug) console.log('1120 action.data', action.data);

      const retval = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindextot),
              {
                ...state.phData.metis.metamodels[curmmindextot],
                objecttypes: [
                  ...curmmtot?.objecttypes.slice(0, indextot),
                  {
                    ...curmmtot?.objecttypes[indextot],
                    ...action.data,
                  },
                  ...curmmtot?.objecttypes.slice(indextot + 1, curmmtot.objecttypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindextot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1112 retval', retval, 'state.phData', state.phData);
      return retval;

    case UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES:
      if (debug) console.log('1201 UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', action);
      const curmodtotv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmmtotv = state.phData?.metis?.metamodels?.find(m => m.id === curmodtotv.targetMetamodelRef) //current target meta model
      const curmmindextotv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtotv.targetMetamodelRef) //current target meta model index
      const curtotv = curmmtotv?.objecttypeviews?.find(ot => ot.id === action?.data?.id) //current target objecttypeview
      const lengthtotv = curmmtotv?.objecttypeviews.length //current objecttypeviews array length
      let indextotv = curmmtotv?.objecttypeviews?.findIndex(ot => ot.id === curtotv?.id) //current target objecttypeview index
      if (debug) console.log('1208 indextotv', curmmtotv, indextotv, lengthtotv);
      if (indextotv < 0) { indextotv = lengthtotv }
      if (debug) console.log('1210 indextotv', indextotv, lengthtotv);
      // const curo = curModel?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curModel?.objects?.findIndex(o => o.id === curov?.objectRef)
      const retval_TARGETOBJECTTYPEVIEW =
      {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindextotv),
              {
                ...state.phData.metis.metamodels[curmmindextotv],
                objecttypeviews: [
                  ...curmmtotv?.objecttypeviews?.slice(0, indextotv),
                  {
                    ...curmmtotv?.objecttypeviews[indextotv],
                    ...action.data,
                  },
                  ...curmmtotv?.objecttypeviews.slice(indextotv + 1, curmmtotv.objecttypeviews.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindextotv + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1266 retval_TARGETOBJECTTYPEVIEW', retval_TARGETOBJECTTYPEVIEW, 'action data ', action.data);
      return retval_TARGETOBJECTTYPEVIEW;

    case UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES:
      if (debug) console.log('930 UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', action);
      const curmodt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmt = state.phData?.metis?.metamodels?.find(m => m.id === curmodt.targetMetamodelRef)
      const curmmtindex = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodt.targetMetamodelRef)
      const otcurt = curmmt?.objtypegeos?.find(ot => ot.id === action?.data?.id)
      const ottlength = curmmt?.objtypegeos?.length
      let ottindex = curmmt?.objtypegeos?.findIndex(ot => ot.id === otcurt?.id)
      if (ottindex < 0) { ottindex = ottlength }
      if (debug) console.log('929 curmmt', curmodt, curmmt, otcurt);
      if (debug) console.log('930 curmmt', curmmt.objtypegeos, ottindex);
      if (curmmt.objtypegeos) {
        return {
          ...state,
          phData: {
            ...state.phData,
            metis: {
              ...state.phData.metis,
              metamodels: [
                ...state.phData.metis.metamodels.slice(0, curmmtindex),
                {
                  ...state.phData.metis.metamodels[curmmtindex],
                  objtypegeos: [
                    ...curmmt?.objtypegeos?.slice(0, ottindex),
                    {
                      ...curmmt?.objtypegeos[ottindex],
                      ...action.data,
                    },
                    ...curmmt?.objtypegeos?.slice(ottindex + 1, curmmt.objtypegeos.length)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmtindex + 1, state.phData.metis.metamodels.length),
              ]
            },
          },
        }
      }
    case UPDATE_TARGETPROPERTY_PROPERTIES:
      if (debug) console.log('900 UPDATE_TARGETPROPERTY_PROPERTIES', action);
      const curmotpot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtpot = state.phData?.metis?.metamodels?.find(m => m.id === curmotpot.targetMetamodelRef)
      if (curmmtpot) {
        const curmmtpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmotpot.targetMetamodelRef)
        const curtpot = curmmtpot?.properties?.find(ot => ot.id === action?.data?.id)
        const lengthottp = curmmtpot?.properties?.length
        let indextpot = curmmtpot?.properties?.findIndex(ot => ot.id === curtpot?.id)
        if (debug) console.log('911 UPDATE_TARGETPROPERTY_PROPERTIES', indextpot, lengthottp)//, curmotpot, curmmtpot);   
        if (indextpot < 0) { indextpot = lengthottp }
        return {
          ...state,
          phData: {
            ...state.phData,
            metis: {
              ...state.phData.metis,
              metamodels: [
                ...state.phData.metis.metamodels.slice(0, curmmtpindexot),
                {
                  ...state.phData.metis.metamodels[curmmtpindexot],
                  properties: [
                    ...curmmtpot?.properties.slice(0, indextpot),
                    {
                      ...curmmtpot?.properties[indextpot],
                      ...action.data,
                    },
                    ...curmmtpot?.properties.slice(indextpot + 1, curmmtpot?.properties.length)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmtpindexot + 1, state.phData.metis.metamodels.length),
              ]
            },
          },
        }
      }
    case UPDATE_TARGETRELSHIPTYPE_PROPERTIES:
      if (debug) console.log('501 UPDATE_TARGETRELSHIPTYPE_PROPERTIES', action);
      const curmodtrt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtrt = state.phData?.metis?.metamodels?.find(m => m.id === curmodtrt.targetMetamodelRef)
      const curmmindextrt = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtrt.targetMetamodelRef)
      const curtrt = curmmtrt?.relshiptypes?.find(ot => ot.id === action?.data?.id)
      const lengthtrt = curmmtrt?.relshiptypes?.length
      let indextrt = curmmtrt?.relshiptypes?.findIndex(ot => ot.id === curtrt?.id)
      if (indextrt < 0) { indextrt = lengthtrt }
      if (debug) console.log('619 indexrt', curmmtrt, indexrt, lengthtrt);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindextrt),
              {
                ...state.phData.metis.metamodels[curmmindextrt],
                relshiptypes: [
                  ...curmmtrt?.relshiptypes?.slice(0, indextrt),
                  {
                    ...curmmtrt?.relshiptypes[indextrt],
                    ...action.data,
                  },
                  ...curmmtrt?.relshiptypes?.slice(indextrt + 1, curmmtrt?.relshiptypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindextrt + 1, state.phData.metis.metamodels.length),
            ]
          }
        }
      }
    case UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES:
      if (debug) console.log('501 UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', action);
      const curmodtrtv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtrtv = state.phData?.metis?.metamodels?.find(m => m.id === curmodtrtv.metamodelRef)
      const curmmindextrtv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmtrtv.id)
      const curtrtv = curmmtrtv?.relshiptypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthtrtv = curmmtrtv?.relshiptypeviews.length
      let indextrtv = curmmtrtv?.relshiptypeviews?.findIndex(ot => ot.id === curtrtv?.id)
      if (indextrtv < 0) { indextrtv = lengthtrtv }
      if (debug) console.log('669 ovindex', curmmtrtv, curmmindextrtv, curtrtv);
      if (debug) console.log('670 ovindex', lengthtrtv, indextrtv);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindextrtv),
              {
                ...state.phData.metis.metamodels[curmmindextrtv],
                relshiptypeviews: [
                  ...curmmtrtv?.relshiptypeviews?.slice(0, indextrtv),
                  {
                    ...curmmtrtv?.relshiptypeviews[indextrtv],
                    ...action.data,
                  },
                  ...curmmtrtv?.relshiptypeviews.slice(indextrtv + 1, curmmtrtv?.relshiptypeviews.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindextrtv + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_TARGETDATATYPE_PROPERTIES: {
      if (debug) console.log('501 UPDATE_TARGETDATATYPE_PROPERTIES', action);
      let curmodtdtot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      if (debug) console.log('765', curmodtdtot)
      let curmmdtdot = state.phData?.metis?.metamodels?.find(m => m.id === curmodtdtot.targetMetamodelRef)
      let curmmdtdindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtdtot.targetMetamodelRef)
      let curdtdot = curmmdtdot?.datatypes?.find(ot => ot.id === action?.data?.id)
      let lengthotdtd = curmmdtdot?.datatypes.length
      let indexdtdot = curmmdtdot?.datatypes?.findIndex(ot => ot.id === curdtdot?.id)
      if (indexdtdot < 0) { indexdtdot = lengthotdtd }
      if (debug) console.log('607 reducer', lengthotdtd, indexdtdot);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmdtdindexot),
              {
                ...state.phData.metis.metamodels[curmmdtdindexot],
                datatypes: [
                  ...curmmdtdot?.datatypes.slice(0, indexdtdot),
                  {
                    ...curmmdtdot?.datatypes[indexdtdot],
                    ...action.data,
                  },
                  ...curmmdtdot?.datatypes.slice(indexdtdot + 1, curmmdtdot?.datatypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmdtdindexot + 1, state.phData.metis.metamodels),
            ]
          },
        },
      }
    }
    case UPDATE_TARGETVALUE_PROPERTIES:
      // if (debug) console.log('501 UPDATE_TARGETVALUE_PROPERTIES', action);
      const curmotvptot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtvpot = state.phData?.metis?.metamodels?.find(m => m.id === curmotvptot.metamodelRef)
      const curmmtvpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmotvptot.metamodelRef)
      const curtvpot = curmmtvpot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthottvp = curmmtvpot?.objecttypes.length
      let indextvpot = curmmtvpot?.objecttypes?.findIndex(ot => ot.id === curtvpot?.id)
      if (indextvpot < 0) { indextvpot = lengthottvp }
      // if (debug) console.log('607 reducer', lengthot, indexot);   
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmtvpindexot),
              {
                ...state.phData.metis.metamodels[curmmtvpindexot],
                objecttypes: [
                  ...curmmtvpot?.objecttypes.slice(0, indextvpot),
                  {
                    ...curmmtvpot?.objecttypes[indextvpot],
                    ...action.data,
                  },
                  ...curmmtvpot?.objecttypes.slice(indextvpot + 1, curmmtvpot?.objecttypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmtvpindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_TARGETMETHOD_PROPERTIES:
      if (debug) console.log('1287 UPDATE_TARGETMETHOD_PROPERTIES', action);
      let curmoddtot1 = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) // current model
      if (debug) console.log('1627', curmoddtot1)
      let targetcurmmddot = state.phData?.metis?.metamodels?.find(m => m.id === curmoddtot1.targetMetamodelRef) // current model's target metamodel
      let targetcurmmddindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmoddtot1.targetMetamodelRef) // current model's target metamodel's index
      let targetcurddot = targetcurmmddot?.methods?.find(ot => ot.id === action?.data?.id) // current model's target metamodel's target method
      let targetlengthotdd = targetcurmmddot?.methods?.length
      let targetindexddot = targetcurmmddot?.methods?.findIndex(ot => ot.id === targetcurddot?.id)
      if (targetindexddot < 0) { targetindexddot = targetlengthotdd }
      if (debug) console.log('1634 reducer', targetlengthotdd, targetindexddot, state.phData);
      let retval_UPDATE_TARGETMETHOD_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, targetcurmmddindexot),
              {
                ...state.phData.metis.metamodels[targetcurmmddindexot],
                methods: [
                  ...targetcurmmddot?.methods.slice(0, targetindexddot),
                  {
                    ...targetcurmmddot?.methods[targetindexddot],
                    ...action.data,
                  },
                  ...targetcurmmddot?.methods.slice(targetindexddot + 1, targetcurmmddot?.methods.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(targetcurmmddindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1321 retval', retval_UPDATE_TARGETMETHOD_PROPERTIES);
      return retval_UPDATE_TARGETMETHOD_PROPERTIES;

    case UPDATE_OBJECTTYPEVIEW_PROPERTIES:
      if (debug) console.log('501 UPDATE_OBJECTTYPEVIEW_PROPERTIES', action);
      const curmodotv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmotv = state.phData?.metis?.metamodels?.find(m => m.id === curmodotv.metamodelRef)
      const curmmindexotv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodotv.metamodelRef)
      const curotv = curmmotv?.objecttypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthotv = curmmotv?.objecttypeviews.length
      let indexotv = curmmotv?.objecttypeviews?.findIndex(ot => ot.id === curotv?.id)
      if (indexotv < 0) { indexotv = lengthotv }
      if (debug) console.log('411 ovindex', ovindex, ovlength);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindexotv),
              {
                ...state.phData.metis.metamodels[curmmindexotv],
                objecttypeviews: [
                  ...curmmotv?.objecttypeviews.slice(0, indexotv),
                  {
                    ...curmmotv?.objecttypeviews[indexotv],
                    ...action.data,
                  },
                  ...curmmotv?.objecttypeviews.slice(indexotv + 1, curmmotv?.objecttypeviews.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexotv + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_VIEWSTYLE_PROPERTIES:
      if (debug) console.log('501 UPDATE_VIEWSTYLE_PROPERTIES', action);
      const curmodvs = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmvs = state.phData?.metis?.metamodels?.find(m => m.id === curmodvs.metamodelRef)
      const curmmindexvs = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodvs.metamodelRef)
      const curvs = curmmvs?.viewstyles?.find(vs => vs.id === action?.data?.id)
      const lengthvs = curmmvs?.viewstyles.length
      let indexvs = curmmvs?.viewstyles?.findIndex(vs => vs.id === curvs?.id)
      if (indexvs < 0) { indexvs = lengthvs }
      if (debug) console.log('411 indexvs', indexvs, lengthvs);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindexvs),
              {
                ...state.phData.metis.metamodels[curmmindexvs],
                viewstyles: [
                  ...curmmvs?.viewstyles.slice(0, indexvs),
                  {
                    ...curmmvs?.viewstyles[indexvs],
                    ...action.data,
                  },
                  ...curmmvs?.viewstyles.slice(indexvs + 1, curmmvs?.viewstyles.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexvs + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_OBJECTTYPEGEOS_PROPERTIES:
      if (debug) console.log('501 UPDATE_OBJECTTYPEGEOS_PROPERTIES', action);
      const curmod = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmm = state.phData?.metis?.metamodels?.find(m => m.id === curmod.metamodelRef)
      const curmmindex = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmod.metamodelRef)
      const otcur = curmm?.objtypegeos?.find(ot => ot.id === action?.data?.id)
      const otlength = curmm?.objtypegeos?.length
      let otindex = curmm?.objtypegeos?.findIndex(ot => ot.id === otcur?.id)
      if (otindex < 0) { otindex = otlength }
      let retval_UPDATE_OBJECTTYPEGEOS_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindex),
              {
                ...state.phData.metis.metamodels[curmmindex],
                objtypegeos: [
                  ...curmm?.objtypegeos.slice(0, otindex),
                  {
                    ...curmm?.objtypegeos[otindex],
                    ...action.data,
                  },
                  ...curmm?.objtypegeos.slice(otindex + 1, curmm?.objtypegeos.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindex + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1411 retval', retval_UPDATE_OBJECTTYPEGEOS_PROPERTIES);
      return retval_UPDATE_OBJECTTYPEGEOS_PROPERTIES;

    case UPDATE_DATATYPE_PROPERTIES:
      if (debug) console.log('1621 UPDATE_DATATYPE_PROPERTIES', action);
      let curmoddtot2 = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      if (debug) console.log('1627', curmoddtot2)
      let curmmddot = state.phData?.metis?.metamodels?.find(m => m.id === curmoddtot2.targetMetamodelRef)
      let curmmddindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmoddtot2.targetMetamodelRef)
      let curddot = curmmddot?.datatypes?.find(ot => ot.id === action?.data?.id)
      let lengthotdd = curmmddot?.datatypes?.length
      let indexddot = curmmddot?.datatypes?.findIndex(ot => ot.id === curddot?.id)
      if (indexddot < 0) { indexddot = lengthotdd }
      if (debug) console.log('1634 reducer', lengthotdd, indexddot);
      let retval_UPDATE_DATATYPE_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmddindexot),
              {
                ...state.phData.metis.metamodels[curmmddindexot],
                datatypes: [
                  ...curmmddot?.datatypes.slice(0, indexddot),
                  {
                    ...curmmddot?.datatypes[indexddot],
                    ...action.data,
                  },
                  ...curmmddot?.datatypes.slice(indexddot + 1, curmmddot?.datatypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmddindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1670 retval', retval_UPDATE_DATATYPE_PROPERTIES);
      return retval_UPDATE_DATATYPE_PROPERTIES;

    case UPDATE_METHODTYPE_PROPERTIES:
      if (debug) console.log('1621 UPDATE_METHODTYPE_PROPERTIES', action);
      let curmomttot3 = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      if (debug) console.log('1623', curmoddtot3)
      let curmmmtot = state.phData?.metis?.metamodels?.find(m => m.id === curmomttot3.targetMetamodelRef)
      curmmddindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmomttot3.targetMetamodelRef)
      curddot = curmmmtot?.methodtypes?.find(ot => ot.id === action?.data?.id)
      lengthotdd = curmmmtot?.methodtypes?.length
      indexddot = curmmmtot?.methodtypes?.findIndex(ot => ot.id === curmtot?.id)
      if (indexddot < 0) { indexddot = lengthotdd }
      if (debug) console.log('1630 reducer', lengthotdd, curmtddot, indexddot);
      let retval_UPDATE_METHODTYPE_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmddindexot),
              {
                ...state.phData.metis.metamodels[curmmddindexot],
                methods: [
                  ...curmtddot?.methodtypes.slice(0, indexddot),
                  {
                    ...curmtddot?.methodtypes[indexddot],
                    ...action.data,
                  },
                  ...curmtddot?.methods.slice(indexddot + 1, curmmtdot?.methods.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmddindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1660 retval', retval_UPDATE_METHODTYPE_PROPERTIES);
      return retval_UPDATE_METHODTYPE_PROPERTIES;

    case UPDATE_PROPERTY_PROPERTIES:
      // if (debug) console.log('501 UPDATE_PROPERTY_PROPERTIES', action);
      let curmopot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      let curmmpot = state.phData?.metis?.metamodels?.find(m => m.id === curmopot.metamodelRef)
      let curmmpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmopot.metamodelRef)
      let curpot = curmmpot?.properties?.find(ot => ot.id === action?.data?.id)
      let lengthotp = curmmpot?.properties.length
      let indexpot = curmmpot?.properties?.findIndex(ot => ot.id === curpot?.id)
      if (indexpot < 0) { indexpot = lengthotp }
      // if (debug) console.log('607 reducer', lengthot, indexot);   
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmpindexot),
              {
                ...state.phData.metis.metamodels[curmmpindexot],
                properties: [
                  ...curmmpot?.properties?.slice(0, indexpot),
                  {
                    ...curmmpot?.properties[indexpot],
                    ...action.data,
                  },
                  ...curmmpot?.properties.slice(indexpot + 1, curmmpot?.properties.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmpindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_METHOD_PROPERTIES:
      if (debug) console.log('1541 UPDATE_METHOD_PROPERTIES', action);
      let curmoddtot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      if (debug) console.log('1543', curmoddtot)
      let metamodelRef = curmoddtot.metamodelRef;
      curmmddot = state.phData?.metis?.metamodels?.find(m => m.id === metamodelRef)
      curmmddindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelRef)
      curddot = curmmddot?.methods?.find(ot => ot.id === action?.data?.id)
      lengthotdd = curmmddot?.methods?.length
      indexddot = curmmddot?.methods?.findIndex(ot => ot.id === curddot?.id)
      if (indexddot < 0) { indexddot = lengthotdd }
      if (debug) console.log('1551 reducer', lengthotdd, indexddot, state.phData);
      let retval_UPDATE_METHOD_PROPERTIES = {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmddindexot),
              {
                ...state.phData.metis.metamodels[curmmddindexot],
                methods: [
                  ...curmmddot?.methods.slice(0, indexddot),
                  {
                    ...curmmddot?.methods[indexddot],
                    ...action.data,
                  },
                  ...curmmddot?.methods.slice(indexddot + 1, curmmddot?.methods.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmddindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
      if (debug) console.log('1576 retval', retval_UPDATE_METHOD_PROPERTIES);
      return retval_UPDATE_METHOD_PROPERTIES;

    case UPDATE_VALUE_PROPERTIES:
      // if (debug) console.log('501 UPDATE_VALUE_PROPERTIES', action);
      const curmovptot = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmvpot = state.phData?.metis?.metamodels?.find(m => m.id === curmovptot.metamodelRef)
      const curmmvpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmovptot.metamodelRef)
      const curvpot = curmmvpot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthotvp = curmmvpot?.objecttypes.length
      let indexvpot = curmmvpot?.objecttypes?.findIndex(ot => ot.id === curvpot?.id)
      if (indexvpot < 0) { indexvpot = lengthotvp }
      // if (debug) console.log('607 reducer', lengthot, indexot);   
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmvpindexot),
              {
                ...state.phData.metis.metamodels[curmmvpindexot],
                objecttypes: [
                  ...curmmvpot?.objecttypes.slice(0, indexvpot),
                  {
                    ...curmmvpot?.objecttypes[indexvpot],
                    ...action.data,
                  },
                  ...curmmvpot?.objecttypes.slice(indexvvpot + 1, curmmvpot?.objecttypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmvpindexot + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }

    case UPDATE_RELSHIPTYPE_PROPERTIES:
      if (debug) console.log('501 UPDATE_RELSHIPTYPE_PROPERTIES', action);
      const curmodrt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmrt = state.phData?.metis?.metamodels?.find(m => m.id === curmodrt.metamodelRef)
      const curmmindexrt = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodrt.metamodelRef)
      const currt = curmmrt?.relshiptypes?.find(ot => ot.id === action?.data?.id)
      const lengthrt = curmmrt?.relshiptypes?.length
      let indexrt = curmmrt?.relshiptypes?.findIndex(ot => ot.id === currt?.id)
      if (indexrt < 0) { indexrt = lengthrt }
      if (debug) console.log('619 indexrt', curmmrt, indexrt, lengthrt);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindexrt),
              {
                ...state.phData.metis.metamodels[curmmindexrt],
                relshiptypes: [
                  ...curmmrt?.relshiptypes?.slice(0, indexrt),
                  {
                    ...curmmrt?.relshiptypes[indexrt],
                    ...action.data,
                  },
                  ...curmmrt?.relshiptypes?.slice(indexrt + 1, curmmrt?.relshiptypes.length)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexrt + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }

    case UPDATE_RELSHIPTYPEVIEW_PROPERTIES:
      if (debug) console.log('501 UPDATE_RELSHIPTYPEVIEW_PROPERTIES', action);
      const curmodrtv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmrtv = state.phData?.metis?.metamodels?.find(m => m.id === curmodrtv.metamodelRef)
      const curmmindexrtv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmrtv.id)
      const currtv = curmmrtv?.relshiptypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthrtv = curmmrtv?.relshiptypeviews.length
      let indexrtv = curmmrtv?.relshiptypeviews?.findIndex(ot => ot.id === currtv?.id)
      if (indexrtv < 0) { indexrtv = lengthrtv }
      if (debug) console.log('669 ovindex', curmmrtv, curmmindexrtv, currtv);
      if (debug) console.log('670 ovindex', lengthrtv, indexrtv);
      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            metamodels: [
              ...state.phData.metis.metamodels.slice(0, curmmindexrtv),
              {
                ...state.phData.metis.metamodels[curmmindexrtv],
                relshiptypeviews: [
                  ...curmmrtv?.relshiptypeviews?.slice(0, indexrtv),
                  {
                    ...curmmrtv?.relshiptypeviews[indexrtv],
                    ...action.data,
                  },
                  ...curmmrtv?.relshiptypeviews.slice(indexrtv + 1, curmmrtv?.relshiptypeviews)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexrtv + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }

    case UPDATE_OBJECTVIEW_NAME:
      // name and shortName
      let ovIndex, objvs3
      // if (debug) console.log('299', action);
      // if (debug) console.log('300',
      //   state.phData.model.metis.models[0].model.objectviews.filter(ovs => ovs.objectRef === "#" + action.data.id)
      // );
      const objvs = state.phData.model.metis.models[0].model.objectviews.filter(ovs => ovs.objectRef === "#" + action.data.id)
      let objvs2 = objvs
      const newOvs = objvs.map(ov => {
        ovIndex = objvs2.findIndex(objv => objv.id === ov.id)
        objvs3 =
          [
            ...objvs2.slice(0, ovIndex),
            objvs2[ovIndex],
            ...objvs2.slice(ovIndex + 1, objvs2.length),
          ]
        objvs2 = objvs3
      })

      // if (debug) console.log('316'.newOvs);

      return {
        ...state,
        phData: {
          ...state.phData,
          model: {
            ...state.phData.model,
            metis: {
              ...state.phData.model.metis,
              models: [
                // ...state.phData.model.metis.models,
                {
                  model: {
                    ...state.phData.model.metis.models[0].model,
                    objectviews: newOvs,
                  },
                },
              ],
            },
          },
        }
      }

    case SET_VISIBLE_CONTEXT:
      if (debug) console.log('1776 SET_VISIBLE_CONTEXT', action);

      let retval_SET_VISIBLE_CONTEXT = {
        ...state,
        phUser: {
          ...state.phUser,
          appSkin: {
            ...state.phUser.appSkin,
            visibleContext: action.data,
          },
        },
      }
      if (debug) console.log('1784 SET_VISIBLE_CONTEXT', retval_SET_VISIBLE_CONTEXT.phUser.appSkin.visibleContext);
      return retval_SET_VISIBLE_CONTEXT;

    default:
      return state
  }
}

export default reducer
