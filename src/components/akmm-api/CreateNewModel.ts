import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { SaveAllToFile } from '../utils/SaveModelToFile';
import { v4 as uuidv4 } from 'uuid';

const CreateNewModel = (props: any) => {
  console.log('8 SaveNewModel props', props);

  // const dispatch = useDispatch();
  

  
  // const { buttonLabel, className } = props;
  // const [modal, setModal] = useState(true);
  // const toggle = () => setModal(!modal);

  const ph = props
  const models = ph?.phData?.metis?.models
  const metamodels = ph?.phData?.metis?.metamodels
  const curmodel = models?.find(m => m.id === ph?.phFocus?.focusModel?.id)
  const curmodelview = curmodel?.modelviews?.find(mv => mv.id === ph?.phFocus?.focusModelview?.id)
  const curMetamodel = metamodels?.find(m => m.id === curmodel?.metamodelRef)
  console.log('23 CreateNewModel', curmodel, curmodelview, curMetamodel)
  const metamodelobjects = curmodel?.objects?.filter(o => o.typeName === 'Metamodel' )
  const metamodelObjectview =  curmodelview?.objectviews.find(ov => (ov.objectRef === metamodelobjects?.find(o => o.id === ov.objectRef))) 

   console.log('28 CreateNewModel', metamodelObjectview)

  const metamodelGenerated = metamodels?.find(m => m.name === metamodelObjectview?.name)
  console.log('31 CreateNewModel',  metamodelGenerated)

  const createNewModelJson = (props: any) => {



    const submodels = [curmodel]
    const submetamodels = metamodels?.filter(smm => smm.name === 'AKM-Core_MM' && smm.id !== metamodelGenerated?.id)
    // const submetamodels = metamodels.filter(m => submodels.find(sm => sm.metamodelRef === m.id))
    // create an empty model object with an empty modelview all with uuids
    console.log('45 CreateNewModel', submodels, submetamodels)


    const newmodel = {
      id: uuidv4(),
      name: 'New-Model',
      description: 'New Model to start modelling',
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

    console.log('75 CreateNewModel', newmodel)
    const adminmodel = models.find(m => m.name === '_ADMIN_MODEL')
    const adminMetamodel = metamodels.find(m => m.id === adminmodel?.metamodelRef)

    const data = {
      phData: { 
        metis: {
          ...ph.phData.metis,
          models: 
            [newmodel, adminmodel],
          metamodels:[
            {
              ...metamodelGenerated, 
              subMetamodelRefs: [submetamodels[0].id],
              subModelRefs: [submodels[0].id],
              submodels: submodels,
              submetamodels: submetamodels,
            },
            adminMetamodel
          ], 
          name: 'New-Project', 
          description: 'New Project to start modelling',
          },
      },
      phFocus: {
        ...ph.phFocus,
        focusModel: {id: newmodel.id, name: newmodel.name},
        focusModelview: {id: newmodel.modelviews[0].id, name: newmodel.modelviews[0].name},
        focusObject: {id: '', name: ''},
        focusRelship: {id: '', name: ''},
        focusObjectview: {id: '', name: ''},
        focusRelshipview: {id: '', name: ''},
      },
      phUser: ph.phUser,
      phSource: 'New Project Template',
      lastUpdate: new Date().toISOString()
    }
    console.log('112 CreateNewModel', data) 
    return data
  }

  const modelJson = createNewModelJson(props);
  console.log('116 CreateNewModel', modelJson)

  return modelJson ;
};

export default CreateNewModel;

