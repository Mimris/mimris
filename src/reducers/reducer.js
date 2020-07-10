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
  UPDATE_OBJECTVIEW_PROPERTIES,
  UPDATE_RELSHIPVIEW_PROPERTIES,
  UPDATE_OBJECTTYPE_PROPERTIES,
  UPDATE_OBJECTTYPEVIEW_PROPERTIES,
  UPDATE_OBJECTTYPEGEOS_PROPERTIES,
  UPDATE_RELSHIPTYPE_PROPERTIES,
  UPDATE_RELSHIPTYPEVIEW_PROPERTIES,
  UPDATE_OBJECT_PROPERTIES,
  UPDATE_RELSHIP_PROPERTIES,
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME
} from '../actions/types';

import InitStateJson from './InitialState.json'

const InitState = JSON.parse(JSON.stringify(InitStateJson)) 
console.log('38 InitialState', InitState);

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
  // phSource: 'no source loaded',
  // phData: null,
  // phMymetis: null,
  // phMyGoModel: null,
  // phMyGoMetamodel: null,
  // phUser: {
  //   focusUser: {
  //     id: 1,
  //     name: 'Not logged in',
  //     email: '',
  //     session: null
  //   }
  // },
  // phGojs: {
  //   // gojsModel: {
  //   //   nodeDataArray: [
  //   //     { key: 0, text: 'AKM', color: 'lightblue', loc: '0 0' },
  //   //     { key: 1, text: 'AMAP', color: 'lightgreen', loc: '0 -50' },
  //   //   ],
  //   //   linkDataArray: [
  //   //     { key: -1, from: 0, to: 1 },
  //   //   ],
  //   // },
  //   gojsModel: {
  //     nodeDataArray: [
  //       { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
  //       { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
  //     ],
  //     linkDataArray: [],
  //   },
  //   gojsMetamodel: {
  //     nodeDataArray: [
  //       { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
  //       { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
  //     ],
  //     linkDataArray: [],
  //   },
  //   gojsMetamodelPalette: {
  //     nodeDataArray: [
  //       { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
  //       { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
  //     ],
  //     linkDataArray: [],
  //   },
  //   gojsMetamodelModel: {
  //     nodeDataArray: [
  //       { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
  //       { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
  //     ],
  //     linkDataArray: [],
  //   },
  // },
  // phFocus: {
  //   focusModel: {
  //     id: null,
  //     name: null
  //   },
  //   focusObject: {
  //     id: null,
  //     name: '',
  //     sourceName: '',
  //     status: null
  //   },
  //   focusModelview: {
  //     id: null,
  //     name: ''
  //   },
  //   focusOrg: {
  //     id: null,
  //     name: ''
  //   },
  //   focusProj: {
  //     id: null,
  //     name: ''
  //   },
  //   focusRole: {
  //     id: null,
  //     name: ''
  //   },
  //   focusCollection: null,
  //   focusTask: {
  //     id: null,
  //     name: "",
  //     focus: {
  //       focusObject: {
  //         id: null,
  //         name: ""
  //       },
  //       focusSource: {
  //         id: null,
  //         name: ""
  //       },
  //       focusCollection: []
  //     }
  //   },
  //   // focusTask: {
  //   //   id: 'UUID4_A07E7E67-102D-43A4-84E1-89E40DCCCD22',
  //   //   name: 'Calculate NPV',
  //   //   role: 'test',
  //   //   focus: {
  //   //     focusSource: {
  //   //       id: 4,
  //   //       name: 'modelviews'
  //   //     },
  //   //     focusOrg: 'Equinor',
  //   //     focusProj: 'AMAP',
  //   //     focusRole: 'PTEC',
  //   //     focusModelview: {
  //   //       id: 'UUID4_308887A7-44B7-4973-A7EF-60AC766A598E',
  //   //       name: 'Workplace'
  //   //     },
  //   //     focusObject: {
  //   //       id: 'UUID4_49FFA121-7644-40C5-9468-4B14DD975748',
  //   //       name: 'Reservoir Evaluation'
  //   //     }
  //   //   },
  //   //   worksOn: {
  //   //     focusSource: 1,
  //   //     focusObject: 1
  //   //   },
  //   // },
  //   focusSource: {
  //     id: null,
  //     name: ''
  //   },
  //   focusModelview: {
  //     id: null,
  //     name: null
  //   }
  // }
// }

let focusTask
let focusSource
let focusModelview
let focusObject
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
    case SET_FOCUS_PHDATA:
      // console.log('169 SET_FOCUS_PHDATA', action);
      // Object.assign(state, action);    
      return {
        ...state,
        phData: action.data
      }
    case SET_FOCUS_PHSOURCE:
      // console.log('176 SET_FOCUS_SOURCE', action.data);
      // Object.assign(state, action);    
      return {
        ...state,
        phSource: action.data
      }
    case SET_FOCUS_PHFOCUS:
      // console.log('183 SET_FOCUS_PHFOCUS', action.data);
      // Object.assign(state, action);    
      return {
        ...state,
        phFocus: action.data
      }
    case SET_FOCUS_USER:
      // console.log('190 SET_FOCUS_USER', action.data);
      // Object.assign(state, action);    
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: action.data
        },
      } 
    case SET_FOCUS_MODEL:
      // console.log('121 red', state, action.data); 
      // Object.assign(state, action);    
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModel: action.data
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
    case SET_GOJS_METAMODEL:
      // console.log('219 SET_GOJS_METAMODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsMetamodel: action.gojsMetamodel
        }
      }
    case SET_GOJS_MODEL:
      // console.log('210 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModel: action.gojsModel
        }
      }
    case SET_MYMETIS_MODEL:
      // console.log('228 SET_MYMETIS_MODEL', action);
      return {
        ...state,
        phMymetis: {
          ...state.phMymetis,
          myMetis: action.myMetis
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
      console.log('229 SET_FOCUS_OBJECT', state, action.data);
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
      console.log('350 role', action);   
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
      console.log('367 task', action);   
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
    case SET_FOCUS_MODELVIEW:
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusModelview: action.data
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


    case UPDATE_OBJECTVIEW_PROPERTIES:
      console.log('229 UPDATE_OBJECTVIEW_PROPERTIES', action);
      const curm     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id) //current model
      const curmindex = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id) // current model index
      const curmv  = curm?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id) //current modelview
      const curmvindex  = curm?.modelviews?.findIndex(mv => mv.id === state.phFocus?.focusModelview?.id) // curretn modelview index
      // console.log('371 curmindex', curmindex);
      // console.log('372 curmvindex', curmvindex);
      
      const curov  = curmv?.objectviews?.find(ov => ov.id === action?.data?.id) // current objectview
      // console.log('409 curov', curov);
      const ovlength = curmv?.objectviews.length 
      let ovindex = curmv?.objectviews?.findIndex(ov => ov.id === curov?.id) // current objectview index
      if (ovindex < 0) {ovindex = ovlength} // ovindex = -1, i.e.  not fond, which means adding a new objectview
      // console.log('411 ovindex', ovindex, ovlength);
      const curo = curm?.objects?.find(o => o.id === curov?.objectRef) //current Object
      const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef) // curretn objectindex
 
      return {
        ...state,
        phData: {
          ...state.phData,
            metis: {
              ...state.phData.metis,
              models: [
                ...state.phData.metis.models.slice(0,curmindex),
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
      const curot = curmm?.objtypegeos?.find(ot => ot.id === action?.data?.id)
      const lengthot = curmm?.objtypegeos.length
      let indexot = curmm?.objtypegeos?.findIndex(ot => ot.id === curot?.id)
      if (indexot < 0) {indexot = lengthot} 

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
                    },
                    ...curmmot?.objecttypes.slice(indexot + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindexot + 1),
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
      const lengthotv = curmm?.objecttypeviews.length
      let indexotv = curmm?.objecttypeviews?.findIndex(ot => ot.id === curotv?.id)
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
                    },
                    ...curmm?.objtypegeos.slice(otindex + 1)
                  ]
                },
                ...state.phData.metis.metamodels.slice(curmmindex + 1),
              ]
            },
         },
      }

    case UPDATE_RELSHIPTYPE_PROPERTIES:
      console.log('501 UPDATE_RELSHIPTYPE_PROPERTIES', action);
      const curmodrt = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmmrt = state.phData?.metis?.metamodels?.find(m => m.id === curmodrt.metamodelRef)
      const curmmindexrt = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmrt.metamodelRef)
      const currt = curmmrt?.reshiptypes?.find(ot => ot.id === action?.data?.id)
      const lengthrt = curmmrt?.reshiptypes.length
      let indexrt = curmmrt?.reshiptypes?.findIndex(ot => ot.id === currt?.id)
      if (indexrt < 0) { indexrt = lengthrt }
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
              ...state.phData.metis.metamodels.slice(0, curmmindexrt),
              {
                ...state.phData.metis.metamodels[curmmindexrt],
                relshiptypes: [
                  ...curmmrt?.reshiptypes.slice(0, indexrt),
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
                    properties: {
                      ...curmmrt.relshiptypes[indexrt]?.properties,
                      properties: action.data.properties,
                    },             
                    deleted: action.data.deleted,     
                  },
                  ...curmmrt?.relshiptypes.slice(indexrt + 1)
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
      const curmmindexrtv = state.phData?.metis?.metamodels?.findIndex(m => m.id === curmmrtv.metamodelRef)
      const currtv = curmm?.relshiptypeviews?.find(ot => ot.id === action?.data?.id)
      const lengthrtv = curmm?.relshiptypeviews.length
      let indexrtv = curmm?.relshiptypeviews?.findIndex(ot => ot.id === currtv?.id)
      if (indexrtv < 0) { indexrtv = lengthrtv }
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
              ...state.phData.metis.metamodels.slice(0, curmmindexrtv),
              {
                ...state.phData.metis.metamodels[curmmindexrtv],
                relshiptypeviews: [
                  ...curmm?.relshiptypeviews.slice(0, indexrtv),
                  {
                    ...curmm?.relshiptypeviews[indexrtv],
                    id: action.data.id,
                    name: action.data.name,
                    description: action.data.description,
                    typeviewRef: action.data.typeviewRef,
                    isGroup: action.data.isGroup,
                    relshipkind: action.data.relshipkind,
                    viewkind: action.data.viewkind,
                    fromobjtypeRef: action.data.fromobjtypeRef,
                    toobjtypeRef: action.data.toobjtypeRef,
                    properties: {
                      ...curmm.relshiptypeviews[indexrt]?.properties,
                      properties: action.data.properties,
                    },    
                    deleted: action.data.deleted,              
                  },
                  ...curmm?.relshiptypeviews.slice(indexrtv + 1)
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
      const curoo = curmo?.objects?.find(o => o.id === curov?.objectRef) //current Object
      let curoindexo = curmo?.objects?.findIndex(o => o.id === curov?.objectRef) // curretn objectindex

      const olength = curmo?.objects.length
      if (curoindexo < 0) { curoindexo = olength } // ovindex = -1, i.e.  not fond, which means adding a new objectview
      const { id, ...rest } = (action.data)
      const propValues = (rest && rest.propertyValues) ? { ...rest } : curmo.objects[index]?.propertyValues

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
                    propertyValues: {
                      ...curmo.objects[curoindexo]?.propertyValues,
                      propertyValues: action.data.propertyValues,
                    },
                    deleted: action.data.deleted,
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
      console.log('685 UPDATE_RELSHIP_PROPERTIES', action);
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
