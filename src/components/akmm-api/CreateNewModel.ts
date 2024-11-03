import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import { v4 as uuidv4 } from 'uuid';
import GenGojsModel from '../GenGojsModel';

const debug = false;

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

  const createNewModelJson = () => {

    const newProjectName = 
      (metamodelGenerated?.name === 'AKM-Core_MM')
        ? `${metamodelGenerated?.name.slice(0, -3)}-Template`
        : (metamodelGenerated.name === 'AKM-IRTV_MM')
          ? `${metamodelGenerated?.name.slice(0, -3)}-Template`
          : (metamodelGenerated.name === 'AKM-POPS_MM')
            ? `${metamodelGenerated?.name.slice(0, -3)}-Template`
            : (metamodelGenerated.name === 'AKM-OSDU_MM')
                ? `${metamodelGenerated?.name.slice(0, -3)}-Template`
                : `${metamodelGenerated?.name.slice(0, -3)}-Modelling-Template`

    const newModelName = (metamodelGenerated?.name === 'AKM-Core_MM')
      ? '03-Typedef_META'
      : (metamodelGenerated.name === 'AKM-IRTV_MM')
        ? '02-Concept_IRTV'
        : (metamodelGenerated.name === 'AKM-POPS_MM')
          ? '01-Overview_POPS'
          : (metamodelGenerated.name === 'AKM-OSDU_MM')
            ? 'OSDU-Typedef_META'
            : 'Basic-Models_META'

    const newModelDesc = (metamodelGenerated?.name === 'AKM-Core_MM')
      ? 'Type Definition Model, modeling with the EntityTypes'
      : (metamodelGenerated?.name === 'AKM-IRTV_MM')
        ? 'Concept Model, modeling based on IRTV (Information, Roles, Tasks, Views)'
        : (metamodelGenerated?.name === 'AKM-POPS_MM')
          ? 'Overview Model, modeling based on POPS (Products, Organisations, Processes, Systems)'
          : (metamodelGenerated?.name === 'AKM-OSDU_MM')
              ? 'OSDU EntityType Model, modeling with the OSDU EntityTypes based on AKM-OSDU_MM Metamodel and OSDU Schema Model'
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
          description: 'Main OSDUType view, with OSDUTypes of master-data, reference-data, work-product-component and abstract as well as Properties, Proxies, Arrays and Items.',
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
    const coremetamodel = metamodels.find((m: { name: string; }) => m.name === 'AKM-Core_MM')
    const irtvmetamodel = metamodels.find((m: { name: string; }) => m.name === 'AKM-IRTV_MM')
    const popsmetamodel = metamodels.find((m: { name: string; }) => m.name === 'AKM-POPS_MM')
    const repo = (metamodelGenerated?.name.includes('AKM-OSDU_MM')) ? 'osdu-akm-models' : 'kavca-akm-models'
    const projNo = (metamodelGenerated?.name.includes('AKM-OSDU_MM')) ? 3 : 1  // hardcoded for now
    // const additionalmetamodel = (coremetamodel?.name !== metamodelGenerated?.name) ? coremetamodel : irtvmetamodel
    if (debug) console.log('73 CreateNewModel', metamodelGenerated, adminmetamodel, coremetamodel, irtvmetamodel, metamodels)
    if (debug) console.log('74 CreateNewModel', metamodelGenerated?.name, adminmetamodel?.name, coremetamodel?.name)

    const irtvmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: '02-Concept_IRTV',
      description: 'Concept model based on AKM-IRTV_MM Metamodel. It includes the Information, Roles, Tasks, and Views. The intention of this model is to define the concepts and relationships between them, as well as the Roles and Tasks operating on Views of this Information.', 
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
      name: '01-Overview_POPS',
      description: 'Overview model based on AKM-POPS_MM Metamodel. It includes the Products, Organisations, Processes, and Systems. The intention of this model is to make an overview model (Citymap).', 
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

    const generated_metamodels = [
            {
              ...metamodelGenerated,
              subMetamodels: [],
            },
            adminmetamodel,
            (coremetamodel !== metamodelGenerated) && coremetamodel,
            (irtvmetamodel !== metamodelGenerated) && irtvmetamodel,
            (popsmetamodel !== metamodelGenerated) && popsmetamodel,
          ].filter((m: any) => m)

    const data = {
      phData: {
        metis: {
          ...ph.phData.metis,
          models:
            [
              (popsmetamodel !== metamodelGenerated) && popsmodel,
              (irtvmetamodel !== metamodelGenerated) && irtvmodel, 
              newmodel, 
              adminmodel
            ], // add admin to the new model
          metamodels: generated_metamodels,
          name: newProjectName,
          description: 'Modelling based on ' + metamodelGenerated?.name + ' Metamodel',
          currentModelRef: newmodel.id,
          currentModelviewRef: newmodel.modelviews[0].id,
          currentMetamodelRef: metamodelGenerated?.id,
        },
      },
      phFocus: {
        ...ph.phFocus,
        focusModel: { id: irtvmodel.id, name: irtvmodel.name },
        focusModelview: { id: irtvmodel.modelviews[0].id, name: irtvmodel.modelviews[0].name },
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
    console.log('112 CreateNewModel', data)
    return data
  }

  const modelJson = createNewModelJson();
  console.log('116 CreateNewModel', modelJson)

  return modelJson;
};

export default CreateNewModel;

