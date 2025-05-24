import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AppState, DomainData } from '../../types/state';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import GenGojsModel from '../GenGojsModel';

const debug = false;

// interface Relationship {
//   name: string;
//   description: string;
//   nameFrom: string;
//   nameTo: string;
// }

// interface DomainData {
//   name: string;
//   description: string;
//   presentation: string;
//   concepts: { name: string; description: string }[];
//   relationships: Relationship[];
// }
// interface Props {
//   phData: {
//     metis: {
//       models: any[];
//       metamodels: any[];
//       name: string;
//       description: string;
//       currentModelRef: string;
//       currentModelviewRef: string;
//       currentMetamodelRef: string;
//     };
//     domain: DomainData;
//     ontology: {
//       name: string;
//       description: string;
//       presentation: string;
//       concepts: { name: string; description: string }[];
//       relationships: { name: string; description: string; nameFrom: string; nameTo: string }[];
//     };
//   };
//   phFocus: {
//     focusModel: { id: string; name: string };
//     focusModelview: { id: string; name: string };
//     focusObject: { id: string; name: string };
//     focusRelship: { id: string; name: string };     
//     focusObjectview: { id: string; name: string };
//     focusRelshipview: { id: string; name: string };
//     focusProj: {
//       id: string;
//       name: string;
//       projectNumber: number;
//       org: string;
//       repo: string;
//       branch: string;   
//     }
//   };
//   phUser: {
//     focusUser: {
//       id: string;
//       name: string;
//       email: string;
//     };
//   };
//   phTemplate: string;
//   phSource: string;
//   lastUpdate: string;
// }


const CreateNewModel = (props: any) => {
  console.log('8 SaveNewModel props', props);

  // const dispatch = useDispatch();
  // const { buttonLabel, className } = props;
  // const [modal, setModal] = useState(true);
  // const toggle = () => setModal(!modal);

  const ph = props;
  const models = ph?.phData?.metis?.models;
  const metamodels = ph?.phData?.metis?.metamodels;
  const curmodel = models?.find((m: { id: any; }) => m.id === ph?.phFocus?.focusModel?.id);
  const curmodelview = curmodel?.modelviews?.find((mv: { id: any; }) => mv.id === ph?.phFocus?.focusModelview?.id);
  const curMetamodel = metamodels?.find((m: { id: any; }) => m.id === curmodel?.metamodelRef);
  console.log('23 CreateNewModel', curmodel, curmodelview, curMetamodel);
  const modelobjectsoftypemetamodel = curmodel?.objects?.filter((o: { typeName: string; }) => o.typeName === 'Metamodel');
  const objectviewoftypemetamodel = curmodelview?.objectviews.find((ov: { objectRef: any; }) => modelobjectsoftypemetamodel?.map((o: { id: any; }) => o.id).includes(ov.objectRef)); //?? maybe find the one with contains relationship
  console.log('28 CreateNewModel', objectviewoftypemetamodel)
  const metamodelGenerated = metamodels?.find((m: { name: any; }) => m.name === objectviewoftypemetamodel?.name)
  console.log('31 CreateNewModel', metamodelGenerated)

  if (!metamodelGenerated) return null;

  const createNewModelJson = (): any => {
    const newProjectName = 
      (metamodelGenerated?.name === 'CORE_META')
        ? `${metamodelGenerated?.name.slice(0, -5)}-Template`
        : (metamodelGenerated.name === 'IRTV_META')
          ? `${metamodelGenerated?.name.slice(0, -5)}-Template`
          : (metamodelGenerated.name === 'POPS_META')
            ? `${metamodelGenerated?.name.slice(0, -5)}-Template`
            : (metamodelGenerated.name === 'BPMN_META')
              ? `${metamodelGenerated?.name.slice(0, -5)}-Template`
              : (metamodelGenerated.name === 'OSDU_META')
                  ? `${metamodelGenerated?.name.slice(0, -5)}-Template`
                  : `${metamodelGenerated?.name.slice(0, -5)}-Modelling-Template`

    const newModelName = (metamodelGenerated?.name === 'CORE_META')
      ? '01-Typedef_CORE'
      : (metamodelGenerated?.name === 'IRTV_META')
        ? '02-Concept_IRTV'
        : (metamodelGenerated?.name === 'POPS_META')
          ? '03-Overview_POPS'
          : (metamodelGenerated?.name === 'BPMN_META')
            ? '04-Process_BPMN'
            : (metamodelGenerated?.name === 'OSDU_META')
              ? '05-OSDU-Typedef_META'
              : 'Basic-Models_META'

    const newModelDesc = (metamodelGenerated?.name === 'CORE_META')
      ? 'Type Definition Model, modeling with the EntityTypes'
      : (metamodelGenerated?.name === 'IRTV_META')
        ? 'Concept Model, modeling based on IRTV (Information, Roles, Tasks, Views)'
        : (metamodelGenerated?.name === 'POPS_META')
          ? 'Overview Model, modeling based on POPS (Products, Organisations, Processes, Systems)'
          : (metamodelGenerated?.name === 'BPMN_META')
            ? 'Process Model, modeling based on BPMN (Business Process Model and Notation)'
            : (metamodelGenerated?.name === 'OSDU_META')
                ? 'OSDU EntityType Model, modeling with the OSDU EntityTypes based on AKM-OSDU_META Metamodel and OSDU Schema Model'
                : 'Model based on' + metamodelGenerated?.name + ' Metamodel'

    const newmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: newModelName,
      description: newModelDesc,
      metamodelRef: metamodelGenerated?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      // sourceModelRef: curmodel.id,
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects: [],
      relships: [],
      modelviews: [
        {
          id: uuidv4(),
          name: '0-Main',
          description: 'Main view',
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    if (debug) console.log('69 CreateNewModel', newmodel)
    const adminmodel = models.find((m: { name: string; }) => m.name === '_ADMIN_MODEL')
    const adminmetamodel = metamodels.find((m: { id: string; }) => m.id === adminmodel?.metamodelRef)
    const coremetamodel = metamodels.find((m: { name: string; }) => m.name === 'CORE_META')
    const irtvmetamodel = metamodels.find((m: { name: string; }) => m.name === 'IRTV_META')
    const popsmetamodel = metamodels.find((m: { name: string; }) => m.name === 'POPS_META')
    const bpmnmetamodel = metamodels.find((m: { name: string; }) => m.name === 'BPMN_META')
    const repo = (metamodelGenerated?.name.includes('OSDU_META')) ? 'osdu-akm-models' : 'kavca-akm-models'
    const projNo = (metamodelGenerated?.name.includes('OSDU_META')) ? 3 : 1  // hardcoded for now
    // const additionalmetamodel = (coremetamodel?.name !== metamodelGenerated?.name) ? coremetamodel : irtvmetamodel
    if (debug) console.log('73 CreateNewModel', metamodelGenerated, adminmetamodel, coremetamodel, irtvmetamodel, metamodels)
    if (debug) console.log('74 CreateNewModel', metamodelGenerated?.name, adminmetamodel?.name, coremetamodel?.name)

    const coremodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: '01-CORE_TypeDef',
      description: 'Type Definition model based on CORE_META Metamodel. It includes the EntityTypes and Relationships. The intention of this model is to define the types and relationships between them.', 
      metamodelRef: coremetamodel?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      // sourceModelRef: curmodel.id,
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects: [],
      relships: [],
      modelviews: [
        {
          id: uuidv4(),
          name: '0-Main',
          description: 'Main Type Definition View with selected CORE Objects.', 
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    const irtvmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: '02-Concept_IRTV',
      description: 'Concept model based on IRTV_META Metamodel. It includes the Information, Roles, Tasks, and Views. The intention of this model is to define the concepts and relationships between them, as well as the Roles and Tasks operating on Views of this Information.', 
      metamodelRef: irtvmetamodel?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      // sourceModelRef: curmodel.id,
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects: [],
      relships: [],
      modelviews: [
        {
          id: uuidv4(),
          name: '0-Main',
          description: 'Main Concepts View,  with Information defining the concepts and relationships between them. It may also include Views, Tasks, and Roles.', 
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    const popsmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: '03-Overview_POPS',
      description: 'Overview model based on AKM-POPS_META Metamodel. It includes the Products, Organisations, Processes, and Systems. The intention of this model is to make an overview model (Citymap).', 
      metamodelRef: popsmetamodel?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      // sourceModelRef: curmodel.id,
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects: [],
      relships: [],
      modelviews: [
        {
          id: uuidv4(),
          name: '0-Main',
          description: 'Main Overview View with selected POPS Objects.', 
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    const bpmnmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: '04-Process_BPMN',
      description: 'Process model based on AKM-BPMN_META Metamodel. It includes the Business Process Model and Notation. The intention of this model is to define the processes and relationships between them.',
      metamodelRef: bpmnmetamodel?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      // sourceModelRef: curmodel.id,
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects: [],
      relships: [],
      modelviews: [
        {
          id: uuidv4(),
          name: '0-Main',
          description: 'Main Process View with selected BPMN Objects.',
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    const generated_metamodels = [
      {
        ...metamodelGenerated,
        subMetamodels: [],
      },
      (coremetamodel.name !== metamodelGenerated.name) ? coremetamodel : null,
      (irtvmetamodel.name !== metamodelGenerated.name) ? irtvmetamodel : null,
      (popsmetamodel.name !== metamodelGenerated.name) ? popsmetamodel : null,
      (bpmnmetamodel.name !== metamodelGenerated.name) ? bpmnmetamodel : null,
      adminmetamodel,
    ].filter((m: any) => m)
    
    const startmodels = [
      newmodel,
      (coremetamodel.name !== metamodelGenerated.name) ? coremodel : null,
      (irtvmetamodel.name !== metamodelGenerated.name) ? irtvmodel : null,
      (popsmetamodel.name !== metamodelGenerated.name) ? popsmodel : null,
      (bpmnmetamodel?.name !== metamodelGenerated.name) ? bpmnmodel : null,
      adminmodel
    ].filter((m: any) => m)

    const dataAll: AppState = {
      phData: {
        metis: {
          ...ph.phData.metis,
          models: startmodels,
          metamodels: generated_metamodels,
          name: newProjectName,
          description: 'Modelling based on ' + metamodelGenerated?.name + ' Metamodel',
          currentModelRef: newmodel.id,
          currentModelviewRef: newmodel.modelviews[0].id,
          currentMetamodelRef: metamodelGenerated?.id
        },
        domain: '[Describe the domain here]',
        ontology: {
          name: '',
          description: '',
          presentation: '',
          concepts: [],
          relationships: []
        },
      },
      phFocus: {
      ...ph.phFocus,
      focusModel: { id: newmodel.id, name: newmodel.name },
      focusModelview: { id: newmodel.modelviews[0].id, name: newmodel.modelviews[0].name },
      focusObject: { id: '', name: '' },
      focusRelship: { id: '', name: '' },
      focusObjectview: { id: '', name: '' },
      focusRelshipview: { id: '', name: '' },
      focusProj: {
        id: newProjectName,
        name: newProjectName,
        projectNumber: projNo,
        org: "kavca",
        repo: repo,
        branch: "main",
        path: "",
        file: newProjectName + ".json",
      },
      },
      phUser: {
      focusUser: {
        id: "0",
        name: "User",
        email: ""
      },
      },
      phTemplate: newProjectName,
      phSource: newProjectName,
      lastUpdate: new Date().toISOString()
    }

    const data: AppState = {
      phData: {
        metis: {
          ...ph.phData.metis,
          models: [newmodel],
          metamodels: [
            {
            ...metamodelGenerated,
            subMetamodels: [],
            },
            adminmetamodel
        ],
          name: newProjectName,
          description: 'Modelling based on ' + metamodelGenerated?.name + ' Metamodel',
          currentModelRef: newmodel.id,
          currentModelviewRef:  newmodel.modelviews[0].id,
          currentMetamodelRef: metamodelGenerated?.id
        },
        domain: '[Describe the domain here]',
        ontology: {
          name: '',
          description: '',
          presentation: '',
          concepts: [],
          relationships: []
        },
      },
      phFocus: {
        focusProj: { id: '', name: '', projectNumber: 0, org: '', repo: '', branch: '', path: '', file: '' },
        focusObject: { id: '', name: '' },
        focusRelship: { id: '', name: '' },
        focusObjectview: { id: '', name: '' },
        focusRelshipview: { id: '', name: '' },
        focusModel: { id: newmodel.id, name: newmodel.name },
        focusModelview: { id: newmodel.modelviews[0].id, name: newmodel.modelviews[0].name },   
      },
      phUser: {
        focusUser: {
          id: "0",
          name: "User",
          email: ""
        },
      },
      phTemplate: '',
      phSource: '',
      lastUpdate: new Date().toISOString()
    }
    console.log('112 CreateNewModel', data, dataAll)
    return [data, dataAll]
  }

  const modelJson = createNewModelJson();
  console.log('116 CreateNewModel', modelJson)

  return modelJson;
};

export default CreateNewModel;

