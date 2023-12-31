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

  const createNewModelJson = () => {

    const submodels = [curmodel]
    const submetamodels = metamodels?.filter(smm => smm.name === 'AKM-Core_MM' && smm.id !== metamodelGenerated?.id)

    // const submetamodels = metamodels.filter(m => submodels.find(sm => sm.metamodelRef === m.id))
    // create an empty model object with an empty modelview all with uuids
    if (debug) console.log('45 CreateNewModel', submodels, submetamodels)

    const newModelName = (metamodelGenerated.name === 'AKM-Core_MM') ? 'New-Model_TD' : 'New-Model_CM'
    const newModelDesc = (metamodelGenerated.name === 'AKM-Core_MM') ? 'Typedefinition Model, modelling with the AKM-Core Metamodel' : 'Concept Model, modelling with the AKM-IRTV Metamodel'

    const newmodel = {
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
    // const additionalmetamodel = (coremetamodel?.name !== metamodelGenerated?.name) ? coremetamodel : irtvmetamodel
    if (debug) console.log('73 CreateNewModel', metamodelGenerated, adminmetamodel, coremetamodel, irtvmetamodel, metamodels)
    if (debug) console.log('74 CreateNewModel', metamodelGenerated?.name, adminmetamodel?.name, coremetamodel?.name)

    const data = {
      phData: {
        metis: {
          ...ph.phData.metis,
          models:
            [newmodel, adminmodel], // add admin to the new model
          metamodels: [
            {
              ...metamodelGenerated,
              // subMetamodelRefs: [submetamodels[0]?.id],
              // subModelRefs: [submodels[0]?.id],
              // subModels: submodels,
              // subMetamodels: submetamodels,
            },
            adminmetamodel,
            (coremetamodel !== metamodelGenerated) && coremetamodel,
            (irtvmetamodel !== metamodelGenerated) && irtvmetamodel,
          ],
          name: `<New ${metamodelGenerated?.name.slice(0, -3)} Modelproject>`,
          description: 'New Project to start modelling',
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
      },
      phUser: ph.phUser,
      phSource: 'New Project Template',
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

