export const InitialState = {
  phData: null, //metis model
  phSources:[{
    sourceUri: 'localhost:8080/metismodels',
    // phData: phData,
  }],
  user: {
    id: '1',
    name: 'Per Person'
    roles: [
      {id: '1', name: 'PTEC Team'},
      {id: '2', name: 'D&W Team'},
      {id: '3', name: 'GEOPS Team'},
    ]
  },
  phWorkspace: {
    workPlace: {
      model: {
        modelId: '_002ashm00rbb9rrrqvi3', //phData.metis.models.find(m => "#"+m.id === focusModel.id)
        modelView: {
          id: 'UUID4_308887A7-44B7-4973-A7EF-60AC766A598E',
          name: 'Workplace',
          workplace: {
            workareaContext: { id: '', name: '' },
            workareaFocus: { id: '', name: '' },
            workarea: { id: '', name: '' },
            workareaTasks: { 
              role: '', //phFocus.focusRole
              activeTasks: '', //phFocus.focusTask
              viewtasks: {
                ongoing: '', // 
                ready: '',
                waiting: '',
                completed: '',
                noStatus: '',
              },
            },
          },
        },    
      }
    }
  }
  phContext; {
    focusOrg: {
      id: 0,
      name: 'test'
    },
    focusProj: {
      id: 0,
      name: 'test'
    },
    focusRole: {
      id: 'UUID4_E600F217-7809-4749-A5A6-D340DC251DEF',
      name: 'Geops Team'
    },
  }
  phFocus: {
    focusModel: {
      id: '',
      name: '',
    }
    focusObject: {
      id: 'UUID4_DC296C9D-A834-4AC1-81D5-E1038CD16DB6',
      name: 'GEOPS',
      sourceName: 'test',
      status: null
    },
    focusModelview: {
      id: 'UUID4_308887A7-44B7-4973-A7EF-60AC766A598E',
      name: 'Workplace'
    },

    focusTask: {
      id: 'UUID4_714AEBB4-8CC1-4CD7-A4CB-A0AB7843AFBF',
      name: 'Establish Static Model',
      role: 'test',
      focus: {
        focusSource: {
          id: 4,
          name: 'modelviews'
        },
        focusOrg: 'Equinor',
        focusProj: 'AMAP',
        focusRole: 'PTEC',
        focusModelview: {
          id: 'UUID4_B4A06515-DF6E-4E92-B9C3-00061E0F7524',
          name: 'Workplace'
        },
        focusObject: {
          id: 'UUID4_DC296C9D-A834-4AC1-81D5-E1038CD16DB6',
          name: 'Reservoir Evaluation'
        }
      },
      worksOn: {
        focusSource: 1,
        focusObject: 1
      },
    },
    focusSource: {
      id: 8,
      name: 'objectviews'
    },
    focusModelview: {
      id: 'UUID4_308887A7-44B7-4973-A7EF-60AC766A598E',
      name: 'Workplace'
    }
  }
}