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
} from '../actions/types';

export const InitialState = {
  phSource: 'no source loaded',
  phData: null,
  phMymetis: null,
  phMyGoModel: null,
  phUser: {
    focusUser: {
      id: 1,
      name: 'Not logged in',
      email: '',
      session: null
    }
  },
  phGojs: {
    // gojsModel: {
    //   nodeDataArray: [
    //     { key: 0, text: 'AKM', color: 'lightblue', loc: '0 0' },
    //     { key: 1, text: 'AMAP', color: 'lightgreen', loc: '0 -50' },
    //   ],
    //   linkDataArray: [
    //     { key: -1, from: 0, to: 1 },
    //   ],
    // },
    gojsModel: {
      nodeDataArray: [
        { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
        { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
      ],
      linkDataArray: [],
    },
    gojsMetamodel: {
      nodeDataArray: [
        { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
        { key: 1, text: 'AKM Type', color: 'lightred', loc: '0 -80' },
      ],
      linkDataArray: [],
    },
  },
  phFocus: {
    focusModel: {
      id: 'null',
      name: 'null'
    },
    focusObject: {
      id: 'UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656',
      name: 'Default',
      sourceName: 'test',
      status: null
    },
    focusModelview: {
      id: 'UUID4_BFE65BE1-77D3-42CF-B622-3B6F2B58A386',
      name: 'WP'
    },
    focusOrg: {
      id: 0,
      name: 'Default'
    },
    focusProj: {
      id: 0,
      name: 'Default'
    },
    focusRole: {
      id: 'UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF',
      name: 'Default'
    },
    focusCollection: null,
    focusTask: {
      id: "UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656",
      name: "Default",
      focus: {
        focusObject: {
          id: "UUID4_A416FE57-F1A3-4D56-A534-E43C87508465",
          name: "Default"
        },
        focusSource: {
          id: 999,
          name: "traversed"
        },
        focusCollection: []
      }
    },
    // focusTask: {
    //   id: 'UUID4_A07E7E67-102D-43A4-84E1-89E40DCCCD22',
    //   name: 'Calculate NPV',
    //   role: 'test',
    //   focus: {
    //     focusSource: {
    //       id: 4,
    //       name: 'modelviews'
    //     },
    //     focusOrg: 'Equinor',
    //     focusProj: 'AMAP',
    //     focusRole: 'PTEC',
    //     focusModelview: {
    //       id: 'UUID4_308887A7-44B7-4973-A7EF-60AC766A598E',
    //       name: 'Workplace'
    //     },
    //     focusObject: {
    //       id: 'UUID4_49FFA121-7644-40C5-9468-4B14DD975748',
    //       name: 'Reservoir Evaluation'
    //     }
    //   },
    //   worksOn: {
    //     focusSource: 1,
    //     focusObject: 1
    //   },
    // },
    focusSource: {
      id: 8,
      name: 'objectviews'
    },
    focusModelview: {
      id: null,
      name: null
    }
  }
}

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
      console.log('190 SET_FOCUS_USER', action.data);
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
    case SET_GOJS_MODEL:
      // console.log('210 SET_GOJS_MODEL', action);
      return {
        ...state,
        phGojs: {
          ...state.phGojs,
          gojsModel: action.gojsModel
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
    case SET_FOCUS_OBJECT:
      // console.log('229 SET_FOCUS_OBJECT', state, action.data);
      focusSource = (action.data.focusObject && action.data.focusObject.focusSource) ? {
        focusSource: {
          id: action.data.focusSource.id,
          name: action.data.focusSource.name
        }
      }
        : state.phFocus.focusSource

      focusModelview = (action.data.focusObject && action.data.focusObject.focusModelview)
        ? {
          focusModelview: {
            id: action.data.focusSource.id,
            name: action.data.focusSource.name
          }
        }
        : state.phFocus.focusModelview
      return {
        ...state,
        ...{
          phFocus: {
            ...state.phFocus,
            focusObject: {
              ...action.data.focusObject,
              status: {
                ...state.phFocus,
                focusObject: {
                  id: state.phFocus.focusObject.id,
                  name: state.phFocus.focusObject.name
                },
                focusSource: {
                  id: state.phFocus.focusSource.id,
                  name: state.phFocus.focusSource.name
                }
              },
              focusSource: focusSource,
              focusModelview: focusModelview
            },
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
      // console.log('150 role', action);   
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
      // console.log('104', action.data);

      focusTask = action.data.focusTask
      focusObject = (action.data.focusTask.focus.focusObject) ? action.data.focusTask.focus.focusObject : state.phFocus.focusObject
      focusSource = (action.data.focusTask.focus.focusSource) ? action.data.focusTask.focus.focusSource : state.phFocus.focusSource
      focusModelview = (action.data.focusTask.focus.focusModelview) ? action.data.focusTask.focus.focusModelview : state.phFocus.focusModelview
      focusOrg = (action.data.focusTask.focus.focusOrg) ? action.data.focusTask.focus.focusOrg : state.phFocus.focusOrg
      focusProj = (action.data.focusTask.focus.focusProj) ? action.data.focusTask.focus.focusProj : state.phFocus.focusProj
      focusRole = (action.data.focusTask.focus.focusRole) ? action.data.focusTask.focus.focusRole : state.phFocus.focusRole
      focusCollection = (action.data.focusTask.focus.focusCollection) ? action.data.focusTask.focus.focusCollection : state.phFocus.focusCollection

      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          focusTask: focusTask,
          focusObject: focusObject,
          focusSource: focusSource,
          focusModelview: focusModelview,
          focusOrg: focusOrg,
          focusProj: focusProj,
          focusRole: focusRole,
          focusCollection: focusCollection
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
      const curm     = state.phData?.metis?.models?.find(m => m.id === state.phFocus?.focusModel?.id)
      const curmindex = state.phData?.metis?.models?.findIndex(m => m.id === state.phFocus?.focusModel?.id)
      const curmv  = curm?.modelviews?.find(mv => mv.id === state.phFocus?.focusModelview?.id)
      const curmvindex  = curm?.modelviews?.findIndex(mv => mv.id === state.phFocus?.focusModelview?.id)
      console.log('371 curmindex', curmindex);
      console.log('372 curmvindex', curmvindex);
      
      const curov  = curmv?.objectviews?.find(ov => ov.id === action?.data?.id)
      const ovindex = curmv?.objectviews?.findIndex(ov => ov.id === curov.id)
      console.log('376 ovindex', ovindex);
      const curo = curm?.objects?.find(o => o.id === curov?.objectRef)
      const curoindex = curm?.objects?.findIndex(o => o.id === curov?.objectRef)
      console.log('275 reducer', 
      {
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
                    ...curm.modelviews.slice(0, curmvindex),
                    {
                      ...curm.modelviews[curmvindex],
                      objectviews: [
                        ...curmv.objectviews.slice(0, ovindex),
                        {
                          ...curmv.objectviews[ovindex],
                          name: action.data.name,
                          description: action.data.desctription,
                          objectRef: action.data.objectRef,
                          // typeviewRef: action.data.typeviewRef,
                          // group: action.data.group,
                          // isGroup: action.data.isGroup,
                          loc: action.data.loc,
                          size: action.data.size
                        },
                        ...curmv.objectviews.slice(ovindex + 1)
                      ]
                    },
                    ...curm.modelviews.slice(curmvindex + 1),
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
      )
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
                    ...curm.modelviews.slice(0, curmvindex),
                    {
                      ...curm.modelviews[curmvindex],
                      objectviews: [
                        ...curmv.objectviews.slice(0, ovindex),
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
                          size: action.data.size
                        },
                        ...curmv.objectviews.slice(ovindex + 1)
                      ]
                    },
                    ...curm.modelviews.slice(curmvindex + 1),
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
      

    case EDIT_OBJECT_PROPERTIES:
      // console.log('236', action);
      // console.log('238',
      //   state.phData.model.metis.models[0].model.objects.find(obj => obj.id === action.data.id)
      // );
      const index = state.phData.model.metis.models[0].model.objects.findIndex(obj => obj.id === action.data.id)
      // console.log('239', index);
      const { id, ...rest } = (action.data)
      // console.log('245', id, rest.integerSet);

      const oid = action.data.id
      const intSet = (rest.integerSet) ? { ...rest } : state.phData.model.metis.models[0].model.objects[index].integerSet
      const propSet = (rest && rest.propertySet) ? { ...rest } : state.phData.model.metis.models[0].model.objects[index].propertySet
      // action.data.propertySet
      // const {id, propertySet, integerSet } = action.data
      // const integerSetRest = action.data.integerSet
      // console.log('246', oid, propSet, intSet);

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
                    objects: [
                      ...state.phData.model.metis.models[0].model.objects.slice(0, index),
                      {
                        ...state.phData.model.metis.models[0].model.objects[index],
                        id: oid,
                        propertySet: {
                          ...state.phData.model.metis.models[0].model.objects[index].propertySet,
                          ...propSet.propertySet,
                          // name: action.data.name,
                          // value: action.data.value,
                          // unit: action.data.unit,
                          // tolerance: action.data.tolerance,
                        },
                        integerSet: {
                          ...state.phData.model.metis.models[0].model.objects[index].integerSet,
                          ...intSet.integerSet,
                          // textFitFlag: !state.phData.model.metis.models[0].model.objects[index].integerSet.textFitFlag
                        }
                      },
                      ...state.phData.model.metis.models[0].model.objects.slice(index + 1),
                    ],
                  },
                },
              ],
            },
          },
        }
      }

    case UPDATE_OBJECTVIEW_NAME:
      // name and shortName
      let ovIndex, objvs3
      console.log('299', action);
      console.log('300',
        state.phData.model.metis.models[0].model.objectviews.filter(ovs => ovs.objectRef === "#" + action.data.id)
      );
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

      console.log('316'.newOvs);

      return {
        //   ...state,
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
