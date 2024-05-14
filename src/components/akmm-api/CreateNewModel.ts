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
  const curmodel = models?.find(m => m.id === ph?.phFocus?.focusModel?.id);
  const curmodelview = curmodel?.modelviews?.find(mv => mv.id === ph?.phFocus?.focusModelview?.id);
  const curMetamodel = metamodels?.find(m => m.id === curmodel?.metamodelRef);
  console.log('23 CreateNewModel', curmodel, curmodelview, curMetamodel);
  const modelobjectsoftypemetamodel = curmodel?.objects?.filter(o => o.typeName === 'Metamodel');
  const objectviewoftypemetamodel = curmodelview?.objectviews.find(ov => modelobjectsoftypemetamodel?.map(o => o.id).includes(ov.objectRef)); //?? maybe find the one with contains relationship
  console.log('28 CreateNewModel', objectviewoftypemetamodel)
  const metamodelGenerated = metamodels?.find(m => m.name === objectviewoftypemetamodel?.name)
  console.log('31 CreateNewModel', metamodelGenerated)

  if (!metamodelGenerated) return null;

  const createNewModelJson = () => {

    const newProjectName = (metamodelGenerated?.name === 'AKM-Core_MM')
      ? `${metamodelGenerated?.name.slice(0, -3)}-Metamodelling-Template`
      : (metamodelGenerated.name === 'AKM-IRTV_MM')
        ? `${metamodelGenerated?.name.slice(0, -3)}-Conceptmodelling-Template`
        : (metamodelGenerated.name === 'AKM-OSDU_MM')
          ? `${metamodelGenerated?.name.slice(0, -3)}-Schemamodelling-Template`
          : `${metamodelGenerated?.name.slice(0, -3)}-Modelling-Template`

    const newModelName = (metamodelGenerated?.name === 'AKM-Core_MM')
      ? 'Typedefinitionmodel_TD'
      : (metamodelGenerated.name === 'AKM-IRTV_MM')
        ? 'Conceptmodel_CM'
        : (metamodelGenerated.name === 'AKM-OSDU_MM')
          ? 'OSDU-Schema-model_TD'
          : 'Model_' + metamodelGenerated.name

    const newModelDesc = (metamodelGenerated?.name === 'AKM-Core_MM')
      ? 'Type Definition Model, modeling with the EntityTypes'
      : (metamodelGenerated?.name === 'AKM-IRTV_MM')
        ? 'Concept Model, modeling based on AKM-IRTV_MM Metamodel'
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
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    if (debug) console.log('69 CreateNewModel', newmodel)
    const adminmodel = models.find(m => m.name === '_ADMIN_MODEL')
    const adminmetamodel = metamodels.find(m => m.id === adminmodel?.metamodelRef)
    const coremetamodel = metamodels.find(m => m.name === 'AKM-Core_MM')
    const irtvmetamodel = metamodels.find(m => m.name === 'AKM-IRTV_MM')
    const repo = (metamodelGenerated?.name.includes('AKM-OSDU_MM')) ? 'osdu-akm-models' : 'kavca-akm-models'
    const projNo = (metamodelGenerated?.name.includes('AKM-OSDU_MM')) ? 3 : 1  // hardcoded for now
    // const additionalmetamodel = (coremetamodel?.name !== metamodelGenerated?.name) ? coremetamodel : irtvmetamodel
    if (debug) console.log('73 CreateNewModel', metamodelGenerated, adminmetamodel, coremetamodel, irtvmetamodel, metamodels)
    if (debug) console.log('74 CreateNewModel', metamodelGenerated?.name, adminmetamodel?.name, coremetamodel?.name)

    const irtvmodel = (metamodelGenerated) && {
      id: uuidv4(),
      name: 'OSDU-Concept-Model_CM',
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
          description: 'Main OSDU Concepts View,  with Information defining the concepts and relationships between them. It may also include Views, Tasks, and Roles.', 
          objectviews: [],
          relshipviews: []
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    const data = {
      phData: {
        metis: {
          ...ph.phData.metis,
          models:
            [
              (irtvmetamodel !== metamodelGenerated) && irtvmodel, 
              newmodel, 
              adminmodel
            ], // add admin to the new model
          metamodels: [
            {
              ...metamodelGenerated,
              subMetamodels: [],
            },
            adminmetamodel,
            (coremetamodel !== metamodelGenerated) && coremetamodel,
            (irtvmetamodel !== metamodelGenerated) && irtvmetamodel,
          ],
          name: newProjectName,
          description: 'Modelling Project',
          currentModelRef: newmodel.id,
          currentModelviewRef: newmodel.modelviews[0].id,
          currentMetamodelRef: metamodelGenerated?.id,
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

