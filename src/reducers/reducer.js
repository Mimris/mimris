import {
  FAILURE,
  LOAD_DATA,
  LOAD_DATA_SUCCESS,
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
  EDIT_OBJECT_PROPERTIES,
  UPDATE_OBJECTVIEW_NAME
} from '../actions/types';
// import EditModal from '../components/EditModal';

export const InitialState = {
  phData: null,
  phMymetis: null,
  phMyGoModel: null,
  phUser: null,
  phFocus: {
    gojsModel: null,
    // {
    // nodeDataArray: [
    //   { key: 0, text: 'AKM', color: 'lightblue', loc: '0 0' },
    //   { key: 1, text: 'AMAP', color: 'lightgreen', loc: '0 -50' },
    // ],
    // linkDataArray: [
    //   { key: -1, from: 0, to: 1 },
    // ],
    // },
    gojsMetamodel: {
      nodeDataArray: [
        { key: 0, text: 'IRTV Type', color: 'lightblue', loc: '0 0' },
        { key: 1, text: 'AMAP Type', color: 'lightred', loc: '0 -80' },
      ],
      linkDataArray: [],
    },
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
      return {
        ...state,
        ...{ phData: action.data }
      }
    case SET_FOCUS_PHFOCUS:
      console.log('121 red', action.data);
      // Object.assign(state, action);    
      return {
        ...state,
        phFocus: action.data
      }
    case SET_FOCUS_USER:
      console.log('121 red', action.data);
      // Object.assign(state, action);    
      return {
        ...state,
        phUser: {
          ...state.phUser,
          focusUser: action.data
        }
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
      console.log('149 reducer', action);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          gojsModel: action.gojsModel
        }
      }
    case SET_MYMETIS_MODEL:
      console.log('149 reducer', action);
      return {
        ...state,
        phMymetis: {
          ...state.phMymetis,
          myMetis: action.myMetis
        }
      }
    case SET_MY_GOMODEL:
      console.log('149 reducer', action);
      return {
        ...state,
        phMyGoModel: {
          ...state.phMyGoModel,
          myGoModel: action.myGoModel
        }
      }
    case SET_GOJS_METAMODEL:
      console.log('157 reducer', action);
      return {
        ...state,
        phFocus: {
          ...state.phFocus,
          gojsMetamodel: action.gojsMetamodel
        }
      }
    case SET_FOCUS_OBJECT:
      console.log('157 red', state, action.data);
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
