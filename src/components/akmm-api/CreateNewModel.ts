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
  const objectviewoftypemetamodel = curmodelview?.objectviews.find(ov => modelobjectsoftypemetamodel?.map(o => o.id).includes(ov.objectRef));
   console.log('28 CreateNewModel', objectviewoftypemetamodel)

  const metamodelGenerated = metamodels?.find(m => m.name === objectviewoftypemetamodel?.name)
  console.log('31 CreateNewModel', metamodelGenerated)

  const createNewModelJson = () => {

    const submodels = [curmodel]
    const submetamodels = metamodels?.filter(smm => smm.name === 'AKM-Core_MM' && smm.id !== metamodelGenerated?.id)

    // const submetamodels = metamodels.filter(m => submodels.find(sm => sm.metamodelRef === m.id))
    // create an empty model object with an empty modelview all with uuids
    if (debug) console.log('39 CreateNewModel', submodels, submetamodels)

    const adminmodel = models.find(m => m.name === '_ADMIN_MODEL')
    const adminmetamodel = metamodels.find(m => m.id === adminmodel?.metamodelRef)
    const coremetamodel = metamodels.find(m => m.name === 'AKM-Core_MM' || m.name === 'AKM-CORE_MM')
    const irtvmetamodel = metamodels.find(m => m.name === 'AKM-IRTV_MM')
    const additionalmetamodel = (coremetamodel?.name !== metamodelGenerated?.name) ? coremetamodel : irtvmetamodel
    console.log('560 CreateNewModel', metamodelGenerated, adminmetamodel, coremetamodel, additionalmetamodel, metamodels)
    console.log('561 CreateNewModel', metamodelGenerated?.name, adminmetamodel?.name, coremetamodel?.name, additionalmetamodel?.name)

    const newmodel = {
      id: uuidv4(),
      name: 'New-Model',
      description: 'New Model to start modelling',
      metamodelRef: metamodelGenerated?.id,
      sourceMetamodelRef: "",
      targetMetamodelRef: "",
      targetModelRef: "",
      includeSystemtypes: false,
      isTemplate: false,
      templates: [],
      objects:     [
          {
            id:     "0200dacc-9f1a-4e44-31cd-181012ac78ff",
            name:     "Roles, Tasks and Views",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "5f1fa0f1-d89f-4a62-5b93-3a433acb833e",
            typeName:     "Container",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     false,
            nameId:     "Container",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            text:     ""
        },
        {
            id:     "9dad716d-7dc3-4fe2-441a-cbcbc2829de9",
            name:     "Information (Product model)",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "5f1fa0f1-d89f-4a62-5b93-3a433acb833e",
            typeName:     "Container",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     false,
            nameId:     "Container",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            text:     ""
        },
        {
            id:     "adf49d65-4c99-45c2-cb03-f953b4dd9e8e",
            name:     "Role 1",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "49ba147f-1d9a-4b9e-9467-7fcc5b830244",
            typeName:     "Role",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     true,
            nameId:     "Role",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            proposedType:     "",
            text:     ""
        },
        {
            id:     "71ade44b-0155-4553-e2f3-49ebed63a1b3",
            name:     "Task 1",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "3979fb2c-71e3-4054-745d-ee062b3689e5",
            typeName:     "Task",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     true,
            nameId:     "Task",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            proposedType:     "",
            text:     ""
        },
        {
            id:     "2a46802c-34ae-4444-8c81-0b87d450dfc7",
            name:     "View 1",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "ba774700-c196-4f6e-c7e2-d742e1449a28",
            typeName:     "View",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     true,
            nameId:     "View",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            Property:     "",
            proposedType:     "",
            text:     ""
        },
        {
            id:     "3b72a8f0-d189-46a6-5365-e24a36e9316f",
            name:     "Information 1",
            description:     "",
            abstract:     false,
            viewkind:     "",
            typeRef:     "ddc75a39-9367-48e4-de12-079bae5362f9",
            typeName:     "Information",
            typeDescription:     "",
            propertyValues:     [],
            ports:     [],
            markedAsDeleted:     false,
            generatedTypeId:     "",
            modified:     true,
            nameId:     "Information",
            category:     "Object",
            sourceUri:     "",
            relshipkind:     "Association",
            valueset:     null,
            copiedFromId:     "",
            proposedType:     "",
            text:     ""
        }
      ],
      relships: [
          {
              id:     "30a72e2c-2fea-458c-6dff-12abe287d0ee",
              name:     "performs",
              description:     "",
              relshipkind:     "Association",
              fromobjectRef:     "adf49d65-4c99-45c2-cb03-f953b4dd9e8e",
              toobjectRef:     "71ade44b-0155-4553-e2f3-49ebed63a1b3",
              typeRef:     "73d06934-f8af-48c5-a344-287d0b725792",
              propvalues:     [],
              cardinality:     "",
              cardinalityFrom:     "",
              cardinalityTo:     "",
              nameFrom:     "",
              nameTo:     "",
              fromPortid:     "",
              toPortid:     "",
              markedAsDeleted:     false,
              generatedTypeId:     "",
              modified:     true
          },
          {
              id:     "973c0a42-16bf-46a5-b9ce-2018d623ba10",
              name:     "worksOn",
              description:     "",
              relshipkind:     "Association",
              fromobjectRef:     "71ade44b-0155-4553-e2f3-49ebed63a1b3",
              toobjectRef:     "2a46802c-34ae-4444-8c81-0b87d450dfc7",
              typeRef:     "66487d8d-c42a-41d4-14f1-b2c2d07af0bb",
              propvalues:     [],
              cardinality:     "",
              cardinalityFrom:     "",
              cardinalityTo:     "",
              nameFrom:     "",
              nameTo:     "",
              fromPortid:     "",
              toPortid:     "",
              markedAsDeleted:     false,
              generatedTypeId:     "",
              modified:     true
          },
          {
              id:     "09c58628-552d-4012-bf3e-46d54c0f8b75",
              name:     "contains",
              description:     "",
              relshipkind:     "Association",
              fromobjectRef:     "2a46802c-34ae-4444-8c81-0b87d450dfc7",
              toobjectRef:     "3b72a8f0-d189-46a6-5365-e24a36e9316f",
              typeRef:     "ab144f63-d2c5-46ff-d96a-5893c6857e74",
              propvalues:     [],
              cardinality:     "",
              cardinalityFrom:     "",
              cardinalityTo:     "",
              nameFrom:     "",
              nameTo:     "",
              fromPortid:     "",
              toPortid:     "",
              markedAsDeleted:     false,
              generatedTypeId:     "",
              modified:     true
          }
      ],
      modelviews: [
        {
          id:     "35d1acf4-e12a-48ec-bbdb-11f937996e00",
          name:     "0-Main",
          objectviews: [
            {
                id:     "8232cc74-3c76-4d1d-a288-c9b6d586726a",
                name:     "Roles, Tasks and Views",
                description:     "",
                objectRef:     "0200dacc-9f1a-4e44-31cd-181012ac78ff",
                typeviewRef:     "a3112875-e4fe-4100-b290-5634d8b8acfc",
                group:     "",
                viewkind:     "Container",
                isGroup:     true,
                isExpanded:     true,
                isSelected:     false,
                loc:     "-830 -310",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "910 630",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            },
            {
                id:     "e857a366-3494-4c35-f9ac-2b3909d7015a",
                name:     "Information (Product model)",
                description:     "",
                objectRef:     "9dad716d-7dc3-4fe2-441a-cbcbc2829de9",
                typeviewRef:     "a3112875-e4fe-4100-b290-5634d8b8acfc",
                group:     "",
                viewkind:     "Container",
                isGroup:     true,
                isExpanded:     true,
                isSelected:     false,
                loc:     "100 -310",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "550 630",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            },
            {
                id:     "c3a41118-224d-4369-380f-c0841769bb9b",
                name:     "Role 1",
                description:     "",
                objectRef:     "adf49d65-4c99-45c2-cb03-f953b4dd9e8e",
                typeviewRef:     "f0a2666b-267a-4ff6-e49a-4b98d27ce60b",
                group:     "8232cc74-3c76-4d1d-a288-c9b6d586726a",
                viewkind:     "Object",
                isGroup:     false,
                isExpanded:     true,
                isSelected:     false,
                loc:     "-790 -220",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "160 70",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            },
            {
                id:     "9c46b0c2-bc15-4da1-ec64-061a097a63bb",
                name:     "Task 1",
                description:     "",
                objectRef:     "71ade44b-0155-4553-e2f3-49ebed63a1b3",
                typeviewRef:     "8297ce90-d5fe-4b91-c558-2c5de3a4f59c",
                group:     "8232cc74-3c76-4d1d-a288-c9b6d586726a",
                viewkind:     "Object",
                isGroup:     false,
                isExpanded:     true,
                isSelected:     false,
                loc:     "-500 -220",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "160 70",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            },
            {
                id:     "c6cd074f-ae5d-42cd-2f51-cf14425e13be",
                name:     "View 1",
                description:     "",
                objectRef:     "2a46802c-34ae-4444-8c81-0b87d450dfc7",
                typeviewRef:     "f33e5d16-b05e-496c-74bb-81871ec226b9",
                group:     "8232cc74-3c76-4d1d-a288-c9b6d586726a",
                viewkind:     "Object",
                isGroup:     false,
                isExpanded:     true,
                isSelected:     false,
                loc:     "-170 -220",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "160 70",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            },
            {
                id:     "c86cbe7f-d94c-49d4-8425-be68b5e87fa1",
                name:     "Information 1",
                description:     "",
                objectRef:     "3b72a8f0-d189-46a6-5365-e24a36e9316f",
                typeviewRef:     "666d8be7-2d5e-473a-0004-cd8be1321588",
                group:     "e857a366-3494-4c35-f9ac-2b3909d7015a",
                viewkind:     "Object",
                isGroup:     false,
                isExpanded:     true,
                isSelected:     false,
                loc:     "260 -220",
                template:     "",
                figure:     "",
                geometry:     "",
                fillcolor:     "",
                fillcolor2:     "",
                strokecolor:     "",
                strokecolor2:     "",
                strokewidth:     "1",
                textcolor:     "",
                icon:     "",
                size:     "160 70",
                scale:     1,
                memberscale:     1,
                textscale:     "1",
                arrowscale:     "1.3",
                markedAsDeleted:     false,
                modified:     true
            }
          ],
          relshipviews: [
            {
                id:     "269718f0-0766-46fe-615c-08b9a3de9870",
                name:     "performs",
                description:     "",
                relshipRef:     "30a72e2c-2fea-458c-6dff-12abe287d0ee",
                typeviewRef:     "3836d753-229d-4847-74e1-0f5ee28c11f9",
                template:     "linkTemplate1",
                arrowscale:     "1.3",
                strokecolor:     "black",
                strokewidth:     "1",
                textcolor:     "black",
                textscale:     "1",
                dash:     "None",
                fromArrow:     "",
                toArrow:     "OpenTriangle",
                fromArrowColor:     "",
                toArrowColor:     "white",
                fromobjviewRef:     "c3a41118-224d-4369-380f-c0841769bb9b",
                toobjviewRef:     "9c46b0c2-bc15-4da1-ec64-061a097a63bb",
                fromPortid:     "",
                toPortid:     "",
                points:     [
                    -589,
                    -184,
                    -499,
                    -184
                ],
                routing:     "Normal",
                curve:     "0",
                corner:     "0",
                markedAsDeleted:     "",
                modified:     true
            },
            {
                id:     "e3238af6-624e-46c2-07b7-2bfd03fc0960",
                name:     "worksOn",
                description:     "",
                relshipRef:     "973c0a42-16bf-46a5-b9ce-2018d623ba10",
                typeviewRef:     "e7b0b7ac-f4a7-4800-266d-689c2489547e",
                template:     "linkTemplate1",
                arrowscale:     "1.3",
                strokecolor:     "black",
                strokewidth:     "1",
                textcolor:     "black",
                textscale:     1,
                dash:     "None",
                fromArrow:     "",
                toArrow:     "OpenTriangle",
                fromArrowColor:     "",
                toArrowColor:     "white",
                fromobjviewRef:     "9c46b0c2-bc15-4da1-ec64-061a097a63bb",
                toobjviewRef:     "c6cd074f-ae5d-42cd-2f51-cf14425e13be",
                fromPortid:     "",
                toPortid:     "",
                points:     [
                    -299,
                    -184,
                    -169,
                    -184
                ],
                routing:     "Normal",
                curve:     "0",
                corner:     "0",
                markedAsDeleted:     "",
                modified:     true
            },
            {
                id:     "6e4ef5b4-ceb7-46c8-721b-44ad76136583",
                name:     "contains",
                description:     "",
                relshipRef:     "09c58628-552d-4012-bf3e-46d54c0f8b75",
                typeviewRef:     "b2d0986e-8689-4e02-b592-170b9a749b31",
                template:     "linkTemplate1",
                arrowscale:     "1.3",
                strokecolor:     "black",
                strokewidth:     "1",
                textcolor:     "black",
                textscale:     1,
                dash:     "None",
                fromArrow:     "",
                toArrow:     "OpenTriangle",
                fromArrowColor:     "",
                toArrowColor:     "white",
                fromobjviewRef:     "c6cd074f-ae5d-42cd-2f51-cf14425e13be",
                toobjviewRef:     "c86cbe7f-d94c-49d4-8425-be68b5e87fa1",
                fromPortid:     "",
                toPortid:     "",
                points:     [
                    31,
                    -184,
                    261,
                    -184
                ],
                routing:     "Normal",
                curve:     "0",
                corner:     "0",
                markedAsDeleted:     "",
                modified:     true
            }
          ],
          description:     "",
          modelRef:     "2b4c7da6-9e64-4eb0-b374-f1c5b1489ab0",
          includeInheritedReltypes:     false,
          UseUMLrelshipkinds:     false,
          objecttypeviews:     [],
          relshiptypeviews:     [],
          markedAsDeleted:     false,
          modified:     false
        }
      ],
      markedAsDeleted: false,
      modified: false,
    }

    console.log('554 CreateNewModel', newmodel)

    const newproject = {  
      id: uuidv4(),
      name: 'New-Project',
      description: 'New Project to start modelling',
      currentModelRef: newmodel.id,
      currentModelviewRef: newmodel.modelviews[0].id,
      currentMetamodelRef: metamodelGenerated?.id,
      models: [newmodel, adminmodel],
      metamodels: [metamodelGenerated, adminmetamodel, additionalmetamodel],
      lastUpdate: new Date().toISOString()
    }

    const data = {
      phData: { 
        ...ph.phData,
        metis: {
          ...ph.phData.metis,
          ...newproject,
        },

      },
      phFocus: {
        ...ph.phFocus,
        focusModel: {id: newmodel.id, name: newmodel.name},
        focusModelview: {id: newmodel.modelviews[0].id, name: newmodel.modelviews[0].name},
        focusProject: {
          ...ph.phFocus.focusProject,
          id: newproject.id, 
          name: newproject.name
        },
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

  const modelJson = createNewModelJson();
  console.log('116 CreateNewModel', modelJson)

  return modelJson ;
};

export default CreateNewModel;

          // ...ph.phData.metis,
          // models: 
          //   [newmodel, adminmodel],
          // metamodels:[
          //   {
          //     ...metamodelGenerated, 
          //     subMetamodelRefs: [submetamodels[0]?.id],
          //     subModelRefs: [submodels[0]?.id],
          //     subModels: submodels,
          //     // subMetamodels: submetamodels,
          //   },
          //   adminmetamodel,
          //   additionalmetamodel,
          // ], 
          // name: 'New-Project', 
          // description: 'New Project to start modelling',
          // currentModelRef: newmodel.id,
          // currentModelviewRef: newmodel.modelviews[0].id,
          // currentMetamodelRef: metamodelGenerated?.id,
          // },