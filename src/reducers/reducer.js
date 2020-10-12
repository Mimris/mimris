import {
  FAILURE,
  LOAD_DATA,
  LOAD_DATA_SUCCESS,
  LOAD_TOSTORE_PHDATA,
  LOAD_TOSTORE_PHSOURCE,
  LOAD_TOSTORE_PHFOCUS,
  LOAD_TOSTORE_NEWMODEL,
  LOAD_TOSTORE_NEWMODELVIEW,
  SET_FOCUS_USER,
  SET_FOCUS_MODEL,
  SET_FOCUS_MODELVIEW,
  SET_FOCUS_TARGETMODEL,
  SET_FOCUS_TARGETMODELVIEW,
  SET_FOCUS_OBJECT,
  SET_FOCUS_OBJECTVIEW,
  SET_FOCUS_RELSHIP,
  SET_FOCUS_RELSHIPVIEW,
  SET_FOCUS_OBJECTTYPE,
  SET_FOCUS_RELSHIPTYPE,
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
  SET_FOCUS_PROJ,
  SET_FOCUS_ORG,
  SET_FOCUS_ROLE,
  SET_FOCUS_COLLECTION,
  SET_FOCUS_TASK,
  SET_FOCUS_SOURCE,
  UPDATE_MODEL_PROPERTIES,
  UPDATE_MODELVIEW_PROPERTIES,
  UPDATE_METAMODEL_PROPERTIES,
  UPDATE_OBJECTVIEW_PROPERTIES,
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
  UPDATE_TARGETVALUE_PROPERTIES,
  UPDATE_OBJECTTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTTYPEGEOS_PROPERTIES,
  UPDATE_DATATYPE_PROPERTIES,
  UPDATE_PROPERTY_PROPERTIES,
  UPDATE_VALUE_PROPERTIES,
  UPDATE_RELSHIPTYPE_PROPERTIES,
  UPDATE_RELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_OBJECT_PROPERTIES,
  UPDATE_RELSHIP_PROPERTIES,
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME
} from '../actions/types';


import InitStateJson from './InitialState.json'

const InitState = JSON.parse(JSON.stringify(InitStateJson)) 
// console.log('38 InitialState', InitState);

export const InitialState = {
  phData: InitState.phData,
  phFocus: InitState.phFocus,
  phGojs: null,
  phMymetis: null,
  phMyGoModel: null,
  phMyGoMetamodel: null,
  phUser: InitState.phUser,
  phSource: InitState.phSource

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
  
  switch (action.type) {
    case FAILURE:
      return {
        ...state,
        ...{ error: action.error }
      }

    case LOAD_DATA_SUCCESS:
      // console.log('160 LOAD_DATA_SUCCESS', action);
      return {
        ...state,
        phData: action.data,   
        phSource: 'Model server'
      }
    case LOAD_TOSTORE_PHDATA:
      // console.log('169 LOAD_TOSTORE_PHDATA', action);   
      return {
        ...state,
        phData: action.data
      }
    case LOAD_TOSTORE_PHSOURCE:
      // console.log('176 SET_FOCUS_SOURCE', action.data);   
      return {
        ...state,
        phSource: action.data
      }
    case LOAD_TOSTORE_PHFOCUS:
      // console.log('183 LOAD_TOSTORE_PHFOCUS', action.data);   
      return {
        ...state,
        phFocus: action.data
      }
    case LOAD_TOSTORE_NEWMODEL:
      console.log('113 LOAD_TOSTORE_NEWMODEL', action.data);    
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
      console.log('113 LOAD_TOSTORE_NEWMODELVIEW', action.data);   
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
    case SET_FOCUS_USER:
      // console.log('190 SET_FOCUS_USER', action.data);   
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: action.data
        },
      } 
    case SET_FOCUS_MODEL:
      // console.log('121 red', state, action.data); 
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModel: action.data
        }
      }
    case SET_FOCUS_MODELVIEW:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModelview: action.data
        }
      }
    case SET_FOCUS_TARGETMODEL:
      // console.log('121 red', state, action.data); 
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
    case SET_FOCUS_OBJECTVIEW: 
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusObjectview: action.data
        }
      }
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
    case SET_GOJS_METAMODELPALETTE:
      // console.log('219 SET_GOJS_METAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodelPalette: action.gojsMetamodelPalette
        }
      }
    case SET_GOJS_METAMODELMODEL:
      // console.log('210 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodelModel: action.gojsMetamodelModel
        }
      }
    case SET_GOJS_TARGETMETAMODEL:
      console.log('229 SET_GOJS_TARGETMETAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsTargetMetamodel: action.gojsTargetMetamodel
        }
      }
    case SET_GOJS_METAMODEL:
      console.log('219 SET_GOJS_METAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodel: action.gojsMetamodel
        }
      }
    case SET_GOJS_MODEL:
      console.log('255 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModel: action.gojsModel
        }
      }
    case SET_GOJS_TARGETMODEL:
      console.log('210 SET_GOJS_TARGETMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsTargetModel: action.gojsTargetModel
        }
      }
    case SET_GOJS_MODELOBJECTS:
      // console.log('210 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModelObjects: action.gojsModelObjects
        }
      }
    // case SET_MYMETIS_METAMODEL:
        //   console.log('269 SET_MYMETIS_METAMODEL', action);
        //   return {
        //     ...state,
        //     phMymetis: {
        //       ...state.phMymetis,
        //       myMetis: action.myMetis
        //     }
        //   }
      case SET_MYMETIS_MODEL:
      console.log('228 SET_MYMETIS_MODEL', action);
      return {
        ...state,
        phMymetis: {
          ...state.phMymetis,
          myMetis: action.myMetis
        }
      }
    case SET_MYMETIS_PARAMETER:
      console.log('221 SET_MYMETIS_PARAMETER', action.data);
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
      // console.log('220 SET_MY_GOMODEL', action);
      return {
        ...state,
        phMyGoModel: {
          ...state.phMyGoModel,
          myGoModel: action.myGoModel
        }
      }
    case SET_MY_GOMETAMODEL:
      // console.log('220 SET_MY_GOMODEL', action);
      return {
        ...state,
        phMyGoMetamodel: {
          ...state.phMyGoMetamodel,
          myGoMetamodel: action.myGoMetamodel
        }
      }
    case SET_FOCUS_OBJECT:
      // console.log('235 SET_FOCUS_OBJECT', state, action.data);
      // focusSource = (action.data.focusObject && action.data.focusObject.focusSource) ? {
      //   focusSource: {
      //     id: action.data.focusSource.id,
      //     name: action.data.focusSource.name
      //   }
      // }
      //   : state.phFocus.focusSource

      // focusModelview = (action.data.focusObject && action.data.focusObject.focusModelview)
      //   ? {
      //     focusModelview: {
      //       id: action.data.focusSource.id,
      //       name: action.data.focusSource.name
      //     }
      //   }
      //   : state.phFocus.focusModelview
      return {
        ...state,
        ...{
          phFocus: {
            ...state.phFocus,
            focusObject: action.data
            // focusObject: {
            //   ...action.data.focusObject,
            //   status: {
            //     ...state.phFocus,
            //     focusObject: {
            //       id: state.phFocus.focusObject.id,
            //       name: state.phFocus.focusObject.name
            //     },
            //     focusSource: {
            //       id: state.phFocus.focusSource.id,
            //       name: state.phFocus.focusSource.name
            //     }
            //   },
            //   focusSource: focusSource,
            //   focusModelview: focusModelview
            // },
          }
        }
      }
    case SET_FOCUS_PROJ:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusProj: action.data
        }
      }
    case SET_FOCUS_ORG:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusOrg: action.data
        }
      }
    case SET_FOCUS_ROLE:
      // console.log('350 role', action);   
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
      // console.log('367 task', action);   
      // console.log('104', action.data);

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

    case SET_FOCUS_SOURCE:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusSource: action.data
        }
      }

    case UPDATE_MODEL_PROPERTIES:
      console.log('429 UPDATE_MODEL_PROPERTIES', action);
      const curmindex1 = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      // let curmindex1 = state.phData?.metis?.models?.findIndex(m => m.id === action.data?.id) // current model index
      // console.log('431 reducer', curmindex1)
      // if (curmindex1 < 0) {curmindex1 = state.phData.metis.models.length}
      // console.log('433 reducer', curmindex1)
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              models: [
                ...state.phData.metis.models.slice(0,curmindex1),
                {
                  ...state.phData.metis.models[curmindex1],
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description, 
                    templateModelRef: action.data.templateModelRef,
                    targetMetamodelRef: action.data.targetMetamodelRef,
                    sourceModelRef: action.data.sourceModelRef,
                    targetModelRef: action.data.targetModelRef,
                    modelviews: action.data.modelviews,
                    objects: action.data.objects,
                    relships: action.data.relships,
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                    pasteViewsOnly: action.data.pasteViewsOnly,    
                    deleteViewsOnly: action.data.deleteViewsOnly,    
                },      
                ...state.phData.metis.models.slice(curmindex1 + 1),
              ]
            },
          },
        }
    case UPDATE_TARGETMODEL_PROPERTIES:
      console.log('472 UPDATE_TARGETMODEL_PROPERTIES', action);
      // const curmindex12 = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      let curmindex12 = state.phData?.metis?.models?.findIndex(m => m.id === action.data?.targetModelRef) // target model index
      console.log('464 reducer', state.phData.metis.models, curmindex12)

      if (curmindex12 < 0) {curmindex12 = state.phData.metis.models.length}
      console.log('466 reducer', curmindex12)
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              models: [
                ...state.phData.metis.models.slice(0,curmindex12),
                {
                  ...state.phData.metis.models[curmindex12],
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description, 
                    sourceMetamodelRef: action.data.sourceMetamodelRef,
                    targetMetamodelRef: action.data.targetMetamodelRef,
                    sourceModelRef: action.data.sourceModelRef,
                    targetModelRef: action.data.targetModelRef,
                    modelviews: action.data.modelviews,
                    objects: action.data.objects,
                    relships: action.data.relships,
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                },      
                ...state.phData.metis.models.slice(curmindex12 + 1, state.phData.metis.models.length),
              ]
            },
          },
        }

    case UPDATE_MODELVIEW_PROPERTIES:
      console.log('385 UPDATE_MODELVIEW_PROPERTIES', action);
      const curmmv2     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindex2 = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      const curmv2  = curmmv2?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id) //current modelview
      const curmvindex2  = curmmv2?.modelviews?.findIndex(mv => mv.id === state.phFocus?.focusModelview?.id) // curretn modelview index
 
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              models: [
                ...state.phData.metis.models.slice(0,curmindex2),
                {
                  ...state.phData.metis.models[curmindex2],
                  modelviews: [
                    ...curmmv2?.modelviews?.slice(0, curmvindex2),
                    {
                      ...curmmv2?.modelviews[curmvindex2],
                          id: action.data.id,           
                          name: action.data.name,
                          description: action.data.description,
                          deleted: action.data.deleted,
                          modified: action.data.modified,    
                    },
                    ...curmmv2?.modelviews?.slice(curmvindex2 + 1),
                  ]
                },
                ...state.phData.metis.models.slice(curmindex2 + 1),
              ]
            },
          },
        }

    case UPDATE_OBJECTVIEW_PROPERTIES:
      console.log('357 UPDATE_OBJECTVIEW_PROPERTIES', action);
      const curm = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindex = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      const curmv = curm?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id) //current modelview
      const curmvindex = curm?.modelviews?.findIndex(mv => mv.id === state.phFocus?.focusModelview?.id) // curretn modelview index
      // console.log('371 curmindex', curmindex);
      // console.log('372 curmvindex', curmvindex);

      const curov = curmv?.objectviews?.find(ov => ov.id === action?.data?.id) // current objectview
      // console.log('409 curov', curov);
      const ovlength = curmv?.objectviews.length
      let ovindex = curmv?.objectviews?.findIndex(ov => ov.id === curov?.id) // current objectview index
      if (ovindex < 0) { ovindex = ovlength } // ovindex = -1, i.e.  not fond, which means adding a new objectview
      const curo = curm?.objects?.find(o => o.id === curov?.objectRef) //current Object
      const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef) // curretn objectindex
      // console.log('506  reduser', curm);

      return (curmv) && {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curmindex),
              {
                ...state.phData.metis.models[curmindex],
                modelviews: [
                  ...curm?.modelviews?.slice(0, curmvindex),
                  {
                    ...curm?.modelviews[curmvindex],
                    objectviews: [
                      ...curmv?.objectviews?.slice(0, ovindex),
                      {
                        ...curmv.objectviews[ovindex],
                        id: action.data.id,
                        name: action.data.name,
                        description: action.data.description,
                        objectRef: action.data.objectRef,
                        typeviewRef: action.data.typeviewRef,
                        group: action.data.group,
                        isGroup: action.data.isGroup,
                        loc: action.data.loc,
                        size: action.data.size,
                        deleted: action.data.deleted,
                        modified: action.data.modified,
                      },
                      ...curmv?.objectviews?.slice(ovindex + 1)
                    ]
                  },
                  ...curm?.modelviews?.slice(curmvindex + 1),
                ],
                // objects: [
                //   ...curm.objects.slice(0, curoindex),
                //   {
                //     ...curo,                 
                //     name: action.data.name,
                //     description: action.data.desctription,
                //     typeRef: action.data.typeviewRef,
                //     // ...curopropertyValues: [
                //     //   ...curo.propertyValues
                //     // ]
                //   },
                //   ...curm.objects.slice(curoindex + 1)  
                // ]
              },
              ...state.phData.metis.models.slice(curmindex + 1),
            ]
          },
        },
      }
    case UPDATE_RELSHIPVIEW_PROPERTIES:
      console.log('504 UPDATE_RELSHIPVIEW_PROPERTIES', action);
      const curmrv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindexrv = state.phData?.metis?.models?.findIndex(m => m.id === curmrv?.id) // current model index
      const curmvrv = curmrv?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id) //current modelview
      const curmindexvrv = curmrv?.modelviews?.findIndex(mv => mv.id === curmvrv?.id) // curretn modelview index
      const currvlength =  curmvrv?.relshipviews?.length
      const currv =     curmvrv?.relshipviews?.find(rv => rv.id === action?.data?.id) // current relshipview
      let currvindex =     curmvrv?.relshipviews?.findIndex(rv => rv.id === currv?.id) // current relshipview index
      if (currvindex < 0) { currvindex = currvlength } // rvindex = -1, i.e.  not fond, which means adding a new relshipview
 
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              models: [
                ...state.phData.metis.models.slice(0,curmindexrv),
                {
                  ...state.phData.metis.models[curmindexrv],
                  modelviews: [
                    ...curmrv?.modelviews.slice(0, curmindexvrv),
                    {
                      ...curmrv?.modelviews[curmindexvrv],
                      relshipviews: [
                        ...curmvrv?.relshipviews?.slice(0, currvindex),
                        {
                          ...curmvrv?.relshipviews[currvindex],  
                          id: action.data.id,           
                          name: action.data.name,
                          description: action.data.description,
                          relshipRef: action.data.relshipRef,
                          typeviewRef: action.data.typeviewRef,
                          fromobjviewRef: action.data.fromobjviewRef,
                          toobjviewRef: action.data.toobjviewRef,
                          deleted: action.data.deleted,
                          modified: action.data.modified,    
                        },
                        ...curmvrv?.relshipviews.slice(currvindex + 1)
                      ]
                    },
                    ...curmrv?.modelviews.slice(curmindexvrv + 1),
                  ],
                },
                ...state.phData.metis.models.slice(curmindexrv + 1),
              ]
            },
          },
        }
      
    case UPDATE_OBJECTTYPE_PROPERTIES:
      console.log('501 UPDATE_OBJECTTYPE_PROPERTIES', action);
      const curmodot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmot    = state.phData?.metis?.metamodels?.find(m => m.id === curmodot.metamodelRef)
      const curmmindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodot.metamodelRef) 
      const curot = curmmot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthot = curmmot?.objecttypes.length
      let indexot = curmmot?.objecttypes?.findIndex(ot => ot.id === curot?.id)
      if (indexot < 0) {indexot = lengthot} 
      // console.log('607 reducer', lengthot, indexot);
      
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
                      id: action.data.id,           
                      name: action.data.name,
                      description: action.data.description,
                      typeviewRef: action.data.typeviewRef,
                      viewkind: action.data.viewkind,
                      abstract: action.data.abstract,
                      deleted: action.data.deleted,
                      modified: action.data.modified,    
                    },
                    ...curmmot?.objecttypes.slice(indexot + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindexot + 1),
              ]
            },
         },
      }


    case UPDATE_METAMODEL_PROPERTIES:
      console.log('766 UPDATE_METAMODEL_PROPERTIES', action);
      const curm_mm = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmm_mm = state.phData?.metis?.metamodels?.find(mm => mm.id === curm_mm.metamodelRef) //current meta model
      const curmmindex_mm = state.phData?.metis?.metamodels?.find(mm => mm.id === curm_mm.metamodelRef)  // current metamodel index
      if (curmmindex_mm <0) curmmindex_mm = state.phData.metis.metamodels.length
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
                id: action.data.id,
                name: action.data.name,
                description: action.data.description,
                datatypes: action.data.datatypes,
                objecttypes: action.data.objecttypes,
                objecttypeviews: action.data.objecttypeviews,
                objecttypegeos: action.data.objecttypegeos,
                properties: action.data.properties,
                relshiptypes: action.data.relshiptypes,
                relshiptypeviews: action.data.relshiptypeviews,
                unittypes: action.data.unittypes,
                deleted: action.data.deleted,
                modified: action.data.modified,
              },
              ...state.phData.metis.metamodels.slice(curmmindex_mm + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }

    case UPDATE_TARGETMETAMODEL_PROPERTIES:
      console.log('567 UPDATE_TARGEMETAMODEL_PROPERTIES', action);
      const curm_tmm = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmm_tmm = state.phData?.metis?.metamodels?.find(mm => mm.id === curm_tmm.targetMetamodelRef) //current meta model
      const curmmindex_tmm = state.phData?.metis?.metamodels?.findIndex(mm => mm.id === curm_tmm.targetMetamodelRef)  // current metamodel index
      if (curmmindex_tmm <0) curmmindex_tmm = state.phData.metis.metamodels.length
      console.log('775 curmm_tmm', curmm_tmm, curmmindex_tmm)
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
                id: action.data.id,
                name: action.data.name,
                description: action.data.description,
                datatypes: action.data.datatypes,
                objecttypes: action.data.objecttypes,
                objecttypeviews: action.data.objecttypeviews,
                objecttypegeos: action.data.objecttypegeos,
                properties: action.data.properties,
                relshiptypes: action.data.relshiptypes,
                relshiptypeviews: action.data.relshiptypeviews,
                unittypes: action.data.unittypes,
                deleted: action.data.deleted,
                modified: action.data.modified,
              },
              ...state.phData.metis.metamodels.slice(curmmindex_tmm + 1, state.phData.metis.metamodels.length),
            ]
          },
        },
      }
    case UPDATE_TARGETOBJECTTYPE_PROPERTIES:
      console.log('687 UPDATE_TARGETOBJECTTYPE_PROPERTIES', action);
      const curmodtot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtot    = state.phData?.metis?.metamodels?.find(m => m.id === curmodtot.targetMetamodelRef)
      console.log('690 UPDATE_TARGETOBJECTTYPE_PROPERTIES', curmodtot.targetMetamodelRef, curmmtot);
      if (!curmmtot) return state;
      const curmmindextot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtot.targetMetamodelRef) 
      const curtot = curmmtot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthtot = curmmtot?.objecttypes.length
      let indextot = curmmtot?.objecttypes?.findIndex(ot => ot.id === curtot?.id)
      if (indextot < 0) {indextot = lengthtot} 
       console.log('607 reducer', lengthtot, indextot);
      
      return {
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
                    ...curmmtot?.objecttypes.slice(0, indexot),
                    {
                      ...curmmtot?.objecttypes[indexot],  
                      id: action.data.id,           
                      name: action.data.name,
                      description: action.data.description,
                      properties: action.data.properties,
                      typeviewRef: action.data.typeviewRef,
                      viewkind: action.data.viewkind,
                      abstract: action.data.abstract,
                      deleted: action.data.deleted,
                      modified: action.data.modified,    
                    },
                    ...curmmtot?.objecttypes.slice(indexot + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindextot + 1),
              ]
            },
         },
      }
    case UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES:
      console.log('882 UPDATE_TARGETOBJECTTYPEVIEW_PROPERTIES', action);
      const curmodtotv     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtotv    = state.phData?.metis?.metamodels?.find(m => m.id === curmodtotv.targetMetamodelRef)
      const curmmindextotv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtotv.targetMetamodelRef) 
      const curtotv = curmmtotv?.objecttypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthtotv = curmmtotv?.objecttypeviews.length
      let indextotv = curmmtotv?.objecttypeviews?.findIndex(ot => ot.id === curtotv?.id)
      if (indextotv < 0) {indextotv = lengthtotv} 
      // console.log('411 ovindex', ovindex, ovlength);
      // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
      return {
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
                    ...curmmtotv?.objecttypeviews.slice(0, indexotv),
                    {
                      ...curmmtotv?.objecttypeviews[indexotv],  
                      id: action.data.id,           
                      // name: action.data.name,
                      description: action.data.description,
                      typeRef: action.data.typeRef,
                      isGroup: action.data.isGroup,
                      viewkind: action.data.viewkind,
                      figure: action.data.figure,
                      fillcolor: action.data.fillcolor,
                      strokecolor: action.data.strokecolor,
                      strokewidth: action.data.strokewidth,
                      icon: action.data.icon,
                      deleted: action.data.deleted,
                      modified: action.data.modified,    
                    },
                    ...curmmtotv?.objecttypeviews.slice(indexotv + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindextotv + 1),
              ]
            },
          },
      }
      case UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES:
        console.log('930 UPDATE_TARGETOBJECTTYPEGEOS_PROPERTIES', action);
        const curmodt     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
        const curmmt     = state.phData?.metis?.metamodels?.find(m => m.id === curmodt.targetMetamodelRef)
        const curmmtindex = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodt.targetMetamodelRef) 
        const otcurt  = curmmt?.objtypegeos?.find(ot => ot.id === action?.data?.id)
        const ottlength = curmmt?.objtypegeos?.length
        let ottindex = curmmt?.objtypegeos?.findIndex(ot => ot.id === otcurt?.id)
        if (ottindex < 0) {ottindex = ottlength} 
        console.log('905 curmmt', curmmt.objtypegeos, ottindex);
        return {
          ...state,
          phData: {
            ...state.phData,
              metis: {
                ...state.phData.metis,
                metamodels: [
                  ...state.phData.metis.metamodels.slice(0,curmmtindex),
                  {
                    ...state.phData.metis.metamodels[curmmtindex],
                    objtypegeos: [
                      ...curmmt?.objtypegeos?.slice(0, ottindex),
                      {
                        ...curmmt?.objtypegeos[ottindex],  
                        id: action.data.id,           
                        name: action.data.name,
                        description: action.data.description,
                        typeRef: action.data.typeRef,
                        metamodelRef: action.data.metamodelRef,
                        loc: action.data.loc,
                        size: action.data.size,
                        deleted: action.data.deleted, 
                        modified: action.data.modified,                         
                      },
                      ...curmmt?.objtypegeos?.slice(ottindex + 1)
                    ]
                  },
                  ...state.phData.metis.metamodels.slice(curmmtindex + 1),
                ]
              },
          },
        }
    case UPDATE_TARGETPROPERTY_PROPERTIES:
      console.log('900 UPDATE_TARGETPROPERTY_PROPERTIES', action);
      const curmotpot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtpot    = state.phData?.metis?.metamodels?.find(m => m.id === curmotpot.targetMetamodelRef)
      if (curmmtpot) {
        const curmmtpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmotpot.targetMetamodelRef) 
        const curtpot = curmmtpot?.properties?.find(ot => ot.id === action?.data?.id)
        const lengthottp = curmmtpot?.properties.length
        let indextpot = curmmtpot?.properties?.findIndex(ot => ot.id === curtpot?.id)
        console.log('911 UPDATE_TARGETPROPERTY_PROPERTIES', indextpot, lengthottp)//, curmotpot, curmmtpot);   
        if (indextpot < 0) {indextpot = lengthottp} 
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
                      id: action.data.id,           
                      name: action.data.name,
                      description: action.data.description,
                      datatypeRef: action.data.datatypeRef,
                      unitCategoryRef: action.data.unitCategoryRef,
                      deleted: action.data.deleted,
                      modified: action.data.modified,    
                    },
                    ...curmmtpot?.properties.slice(indextpot + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmtpindexot + 1),
              ]
            },
          },
        }
      }     
      case UPDATE_TARGETRELSHIPTYPE_PROPERTIES:
      console.log('501 UPDATE_TARGETRELSHIPTYPE_PROPERTIES', action);
      const curmodtrt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtrt = state.phData?.metis?.metamodels?.find(m => m.id === curmodtrt.targetMetamodelRef)
      const curmmindextrt = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtrt.targetMetamodelRef)
      const curtrt = curmmtrt?.relshiptypes?.find(ot => ot.id === action?.data?.id)
      const lengthtrt = curmmtrt?.relshiptypes?.length
      let indextrt = curmmtrt?.relshiptypes?.findIndex(ot => ot.id === curtrt?.id)
      if (indextrt < 0) { indextrt = lengthtrt }
      console.log('619 indexrt', curmmtrt, indexrt, lengthtrt);
      // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
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
                  ...curmmtrt?.relshiptypes?.slice(0, indexrt),
                  {
                    ...curmmttrt?.relshiptypes[indexrt],
                    id: action.data.id,
                    name: action.data.name,
                    description: action.data.description,
                    typeviewRef: action.data.typeviewRef,
                    isGroup: action.data.isGroup,
                    relshipkind: action.data.relshipkind,
                    viewkind: action.data.viewkind,
                    fromobjtypeRef: action.data.fromobjtypeRef,
                    toobjtypeRef: action.data.toobjtypeRef,
                    // properties: {
                    //   ...curmmrt.relshiptypes[indexrt]?.properties,
                    //   properties: action.data.properties,
                    // },             
                    deleted: action.data.deleted,  
                    modified: action.data.modified,       
                  },
                  ...curmmtrt?.relshiptypes?.slice(indexrt + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindextrt + 1),
            ]
          },
        },
      }
      case UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES:
        console.log('501 UPDATE_TARGETRELSHIPTYPEVIEW_PROPERTIES', action);
        const curmodtrtv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
        const curmmtrtv = state.phData?.metis?.metamodels?.find(m => m.id === curmodtrtv.metamodelRef)
        const curmmindextrtv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmtrtv.id)
        const curtrtv = curmmtrtv?.relshiptypeviews?.find(ot => ot.id === action?.data?.id)
        const lengthtrtv = curmmtrtv?.relshiptypeviews.length
        let indextrtv = curmmtrtv?.relshiptypeviews?.findIndex(ot => ot.id === curtrtv?.id)
        if (indextrtv < 0) { indextrtv = lengthtrtv }
        console.log('669 ovindex', curmmtrtv, curmmindextrtv, curtrtv);
        console.log('670 ovindex', lengthtrtv, indextrtv);
        // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
        // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
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
                      id: action.data.id,
                      // name: action.data.name,
                      description: action.data.description,
                      typeRef: action.data.typeRef,
                      strokecolor: action.data.strokecolor,
                      strokewidth: action.data.strokewidth,
                      dash: action.data.dash,
                      fromArrow: action.data.fromArrow,
                      toArrow: action.data.toArrow,
                      fromArrowColor: action.data.fromArrowColor,
                      toArrowColor: action.data.toArrowColor,
                      deleted: action.data.deleted,              
                      modified: action.data.modified,              
                    },
                    ...curmmtrtv?.relshiptypeviews.slice(indextrtv + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindextrtv + 1),
              ]
            },
          },
        }
    case UPDATE_TARGETDATATYPE_PROPERTIES:
      console.log('501 UPDATE_TARGETDATATYPE_PROPERTIES', action);
      const curmodtdtot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      console.log('765', curmodtdtot)
      const curmmdtdot    = state.phData?.metis?.metamodels?.find(m => m.id === curmodtdtot.targetMetamodelRef)
      const curmmdtdindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodtdtot.targetMetamodelRef) 
      const curdtdot = curmmdtdot?.datatypes?.find(ot => ot.id === action?.data?.id)
      const lengthotdtd = curmmdtdot?.datatypes.length
      let indexdtdot = curmmdtdot?.datatypes?.findIndex(ot => ot.id === curdtdot?.id)
      if (indexdtdot < 0) {indexdtdot = lengthotdtd} 
      console.log('607 reducer', lengthotdtd, indexdtdot);   
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
                  ...curmmdtdot?.datatypes.slice(0, indexddtot),
                  {
                    ...curmmdtdot?.datatypes[indexdtdot],  
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description,
                    datatypeRef: action.data.datatypeRef,
                    defaultValue: action.data.defaultValue,
                    allowedValues: action.data.allowedValues,
                    abstract: action.data.abstract,
                    modified: action.data.modified,    
                  },
                  ...curmmdtdot?.datatypes.slice(indexdtdot + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmdtdindexot + 1),
            ]
          },
        },
      }
    case UPDATE_TARGETVALUE_PROPERTIES:
      // console.log('501 UPDATE_TARGETVALUE_PROPERTIES', action);
      const curmotvptot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmtvpot    = state.phData?.metis?.metamodels?.find(m => m.id === curmotvptot.metamodelRef)
      const curmmtvpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmotvptot.metamodelRef) 
      const curtvpot = curmmtvpot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthottvp = curmmtvpot?.objecttypes.length
      let indextvpot = curmmtvpot?.objecttypes?.findIndex(ot => ot.id === curtvpot?.id)
      if (indextvpot < 0) {indextvpot = lengthottvp} 
      // console.log('607 reducer', lengthot, indexot);   
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
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description,
                    typeviewRef: action.data.typeviewRef,
                    viewkind: action.data.viewkind,
                    abstract: action.data.abstract,
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                  },
                  ...curmmtvpot?.objecttypes.slice(indextvpot + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmtvpindexot + 1),
            ]
          },
        },
      }
    case UPDATE_OBJECTTYPEVIEW_PROPERTIES:
      console.log('501 UPDATE_OBJECTTYPEVIEW_PROPERTIES', action);
      const curmodotv     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmotv    = state.phData?.metis?.metamodels?.find(m => m.id === curmodotv.metamodelRef)
      const curmmindexotv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodotv.metamodelRef) 
      const curotv = curmmotv?.objecttypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthotv = curmmotv?.objecttypeviews.length
      let indexotv = curmmotv?.objecttypeviews?.findIndex(ot => ot.id === curotv?.id)
      if (indexotv < 0) {indexotv = lengthotv} 
      // console.log('411 ovindex', ovindex, ovlength);
      // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
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
                      id: action.data.id,           
                      // name: action.data.name,
                      description: action.data.description,
                      typeRef: action.data.typeRef,
                      isGroup: action.data.isGroup,
                      viewkind: action.data.viewkind,
                      figure: action.data.figure,
                      fillcolor: action.data.fillcolor,
                      strokecolor: action.data.strokecolor,
                      strokewidth: action.data.strokewidth,
                      icon: action.data.icon,
                      deleted: action.data.deleted,
                      modified: action.data.modified,    
                    },
                    ...curmmotv?.objecttypeviews.slice(indexotv + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindexotv + 1),
              ]
            },
         },
      }
    case UPDATE_OBJECTTYPEGEOS_PROPERTIES:
      console.log('501 UPDATE_OBJECTTYPEGEOS_PROPERTIES', action);
      const curmod     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmm     = state.phData?.metis?.metamodels?.find(m => m.id === curmod.metamodelRef)
      const curmmindex = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmod.metamodelRef) 
      const otcur  = curmm?.objtypegeos?.find(ot => ot.id === action?.data?.id)
      const otlength = curmm?.objtypegeos.length
      let otindex = curmm?.objtypegeos?.findIndex(ot => ot.id === otcur?.id)
      if (otindex < 0) {otindex = otlength} 
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              metamodels: [
                ...state.phData.metis.metamodels.slice(0,curmmindex),
                {
                  ...state.phData.metis.metamodels[curmmindex],
                  objtypegeos: [
                    ...curmm?.objtypegeos.slice(0, otindex),
                    {
                      ...curmm?.objtypegeos[otindex],  
                      id: action.data.id,           
                      name: action.data.name,
                      description: action.data.description,
                      typeRef: action.data.typeRef,
                      metamodelRef: action.data.metamodelRef,
                      loc: action.data.loc,
                      size: action.data.size,
                      deleted: action.data.deleted, 
                      modified: action.data.modified,                         
                    },
                    ...curmm?.objtypegeos.slice(otindex + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindex + 1),
              ]
            },
         },
      }
    case UPDATE_DATATYPE_PROPERTIES:
      console.log('501 UPDATE_DATATYPE_PROPERTIES', action);
      const curmoddtot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      console.log('765', curmoddtot)
      const curmmddot    = state.phData?.metis?.metamodels?.find(m => m.id === curmoddtot.targetMetamodelRef)
      const curmmddindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmoddtot.targetMetamodelRef) 
      const curddot = curmmddot?.datatypes?.find(ot => ot.id === action?.data?.id)
      const lengthotdd = curmmddot?.datatypes.length
      let indexddot = curmmddot?.datatypes?.findIndex(ot => ot.id === curddot?.id)
      if (indexddot < 0) {indexddot = lengthotdd} 
      console.log('607 reducer', lengthotdd, indexddot);   
      return {
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
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description,
                    datatypeRef: action.data.datatypeRef,
                    defaultValue: action.data.defaultValue,
                    allowedValues: action.data.allowedValues,
                    abstract: action.data.abstract,
                    modified: action.data.modified,    
                  },
                  ...curmmddot?.datatypes.slice(indexddot + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmddindexot + 1),
            ]
          },
        },
      }
    case UPDATE_PROPERTY_PROPERTIES:
      // console.log('501 UPDATE_PROPERTY_PROPERTIES', action);
      const curmopot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmpot    = state.phData?.metis?.metamodels?.find(m => m.id === curmopot.metamodelRef)
      const curmmpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmopot.metamodelRef) 
      const curpot = curmmpot?.properties?.find(ot => ot.id === action?.data?.id)
      const lengthotp = curmmpot?.properties.length
      let indexpot = curmmpot?.properties?.findIndex(ot => ot.id === curpot?.id)
      if (indexpot < 0) {indexpot = lengthotp} 
      // console.log('607 reducer', lengthot, indexot);   
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
                  ...curmmpot?.properties.slice(0, indexpot),
                  {
                    ...curmmpot?.properties[indexpot],  
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description,
                    datatypeRef: action.data.datatypeRef,
                    unitCategoryRef: action.data.unitCategoryRef,
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                  },
                  ...curmmpot?.properties.slice(indexpot + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmpindexot + 1),
            ]
          },
        },
      }

    case UPDATE_VALUE_PROPERTIES:
      // console.log('501 UPDATE_VALUE_PROPERTIES', action);
      const curmovptot     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmvpot    = state.phData?.metis?.metamodels?.find(m => m.id === curmovptot.metamodelRef)
      const curmmvpindexot = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmovptot.metamodelRef) 
      const curvpot = curmmvpot?.objecttypes?.find(ot => ot.id === action?.data?.id)
      const lengthotvp = curmmvpot?.objecttypes.length
      let indexvpot = curmmvpot?.objecttypes?.findIndex(ot => ot.id === curvpot?.id)
      if (indexvpot < 0) {indexvpot = lengthotvp} 
      // console.log('607 reducer', lengthot, indexot);   
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
                    id: action.data.id,           
                    name: action.data.name,
                    description: action.data.description,
                    typeviewRef: action.data.typeviewRef,
                    viewkind: action.data.viewkind,
                    abstract: action.data.abstract,
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                  },
                  ...curmmvpot?.objecttypes.slice(indexvvpot + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmvpindexot + 1),
            ]
          },
        },
      }
        
    case UPDATE_RELSHIPTYPE_PROPERTIES:
      console.log('501 UPDATE_RELSHIPTYPE_PROPERTIES', action);
      const curmodrt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmrt = state.phData?.metis?.metamodels?.find(m => m.id === curmodrt.metamodelRef)
      const curmmindexrt = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmodrt.metamodelRef)
      const currt = curmmrt?.relshiptypes?.find(ot => ot.id === action?.data?.id)
      const lengthrt = curmmrt?.relshiptypes?.length
      let indexrt = curmmrt?.relshiptypes?.findIndex(ot => ot.id === currt?.id)
      if (indexrt < 0) { indexrt = lengthrt }
      console.log('619 indexrt', curmmrt, indexrt, lengthrt);
      // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
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
                    id: action.data.id,
                    name: action.data.name,
                    description: action.data.description,
                    typeviewRef: action.data.typeviewRef,
                    isGroup: action.data.isGroup,
                    relshipkind: action.data.relshipkind,
                    viewkind: action.data.viewkind,
                    fromobjtypeRef: action.data.fromobjtypeRef,
                    toobjtypeRef: action.data.toobjtypeRef,
                    // properties: {
                    //   ...curmmrt.relshiptypes[indexrt]?.properties,
                    //   properties: action.data.properties,
                    // },             
                    deleted: action.data.deleted,  
                    modified: action.data.modified,       
                  },
                  ...curmmrt?.relshiptypes?.slice(indexrt + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexrt + 1),
            ]
          },
        },
      }

    case UPDATE_RELSHIPTYPEVIEW_PROPERTIES:
      console.log('501 UPDATE_RELSHIPTYPEVIEW_PROPERTIES', action);
      const curmodrtv = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmrtv = state.phData?.metis?.metamodels?.find(m => m.id === curmodrtv.metamodelRef)
      const curmmindexrtv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmrtv.id)
      const currtv = curmmrtv?.relshiptypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthrtv = curmmrtv?.relshiptypeviews.length
      let indexrtv = curmmrtv?.relshiptypeviews?.findIndex(ot => ot.id === currtv?.id)
      if (indexrtv < 0) { indexrtv = lengthrtv }
      console.log('669 ovindex', curmmrtv, curmmindexrtv, currtv);
      console.log('670 ovindex', lengthrtv, indexrtv);
      // const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      // const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
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
                    id: action.data.id,
                    // name: action.data.name,
                    description: action.data.description,
                    typeRef: action.data.typeRef,
                    strokecolor: action.data.strokecolor,
                    strokewidth: action.data.strokewidth,
                    dash: action.data.dash,
                    fromArrow: action.data.fromArrow,
                    toArrow: action.data.toArrow,
                    fromArrowColor: action.data.fromArrowColor,
                    toArrowColor: action.data.toArrowColor,
                    deleted: action.data.deleted,              
                    modified: action.data.modified,              
                  },
                  ...curmmrtv?.relshiptypeviews.slice(indexrtv + 1)
                ]
              },
              ...state.phData.metis.metamodels.slice(curmmindexrtv + 1),
            ]
          },
        },
      }

    case UPDATE_OBJECT_PROPERTIES:
      console.log('618 UPDATE_OBJECT_PROPERTIES', action);     
      const curmo = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindexo = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      const curoo = (curmo) && curmo?.objects?.find(o => o.id === action.data.id) //current Object
      let curoindexo = (curmo) && curmo.objects?.findIndex(o => o.id === curoo?.id) // curretn objectindex
      // console.log('828', curoindexo);

      const lengtho = curmo?.objects.length
      if (curoindexo < 0) { curoindexo = lengtho } // ovindex = -1, i.e.  not fond, which means adding a new objectview
      
      // const { id, ...rest } = (action.data)
      // const propValues = (rest && rest.propertyValues) ? { ...rest } : curmo.objects[index]?.propertyValues

    return {
      ...state,
      phData: {
        ...state.phData,
        metis: {
          ...state.phData.metis,
          models: [
            ...state.phData.metis.models.slice(0, curmindexo),
            {
              ...state.phData.metis.models[curmindexo],
              objects: [
                ...curmo.objects.slice(0, curoindexo),
                {
                  ...curmo.objects[curoindexo],  
                  id: action.data.id,
                  name: action.data.name,
                  description: action.data.description,
                  typeRef: action.data.typeRef,
                  // propertyValues: {
                  //   ...curmo.objects[curoindexo]?.propertyValues,
                  //   propertyValues: action.data.propertyValues,
                  // },
                  deleted: action.data.deleted,
                  modified: action.data.modified,    
                },
                ...curmo.objects.slice(curoindexo + 1)
              ],
              ...state.phData.metis.models.slice(curmindexo + 1),
            },
          ],
        },
      }
    }

    case UPDATE_RELSHIP_PROPERTIES:
      console.log('697 UPDATE_RELSHIP_PROPERTIES', action);
      const curmr = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindexr = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index

      const curr = curmr.relships?.find(rv => rv.id === action?.data?.id) // current relview
      // console.log('409 curov', curov);
      const r2length = curmr?.relships.length
      let r2index = curmr?.relships?.findIndex(r => r.id === curr?.id) // current relview index
      if (r2index < 0) { r2index = r2length } // ovindex = -1, i.e.  not fond, which means adding a new relview
      // console.log('411 ovindex', ovindex, ovlength);
      const curr2 = curmr?.relships?.find(r => r.id === curr?.relshipRef)
      const currindex = curmr?.relships?.findIndex(r => r.id === curr2?.objectRef)

      return {
        ...state,
        phData: {
          ...state.phData,
          metis: {
            ...state.phData.metis,
            models: [
              ...state.phData.metis.models.slice(0, curmindexr),
              {
                ...state.phData.metis.models[curmindexr],
                relships: [
                  ...curmr.relships.slice(0, r2index),
                  {
                    ...curmr.relships[r2index],
                    id: action.data.id,
                    name: action.data.name,
                    description: action.data.description,
                    typeRef: action.data.typeRef,
                    fromobjectRef: action.data.fromobjectRef,
                    toobjectRef: action.data.toobjectRef,
                    // propvalues: {
                    //   ...curmv.relships[r2index].propvalues,
                    // }
                    deleted: action.data.deleted,
                    modified: action.data.modified,    
                  },
                  ...curmr.relships.slice(r2index + 1)
                ]
              },
              ...state.phData.metis.models.slice(curmindexr + 1),
            ]
          },
        },
      }

    case UPDATE_OBJECTVIEW_NAME:
      // name and shortName
      let ovIndex, objvs3
      // console.log('299', action);
      // console.log('300',
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
            ...objvs2.slice(ovIndex + 1),
          ]
        objvs2 = objvs3
      })

      // console.log('316'.newOvs);

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
    default:
      return state
  }
}

export default reducer
