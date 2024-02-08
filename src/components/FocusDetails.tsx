// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef,useContext, useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'

import {ObjDetailTable} from './forms/ObjDetailTable';
import ObjectDetails from './forms/ObjectDetails';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import Selector from './utils/Selector'
import 'react-tabs/style/react-tabs.css';

const debug = false

const FocusDetails = (props, edit) => {
    if (!debug) console.log('17 context', props, props.props.reportType, props.props.modelInFocusId)
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const dispatch = useDispatch()

    const ph = props.props.props || props.props
    const reportType = props.props.reportType  // if reportType = 'task' then focusObject is a task focusTask
    const modelInFocusId = props.props.modelInFocusId // if reportType = 'task' then focusObject.id is a focusTask.id
    if (debug) console.log('25 Context:', reportType, modelInFocusId, ph?.phData);

    if (!ph?.phData?.metis?.models) return <></>

    const [selectedId, setSelectedId] = useState(null);
    const [value, setValue] = useState("");
    // const [visibleContext, setVisibleContext] = useState(true);
    const [formValues, setFormValues] = useState({});
    const [formValuesObjectview, setFormValuesObjectview] = useState({});
    const [formValuesObjecttype, setFormValuesObjecttype] = useState({});
    const [formValuesObjecttypeview, setFormValuesObjecttypeview] = useState({});

    const models = ph.phData?.metis?.models  // selecting the models array

    const metamodels = ph.phData?.metis?.metamodels  // selecting the models array

    // const curmodel = modelInFocus
    const curmodel = models?.find((m: any) => m?.id === modelInFocusId)

    if (debug) console.log('53 Context:', curmodel, curmodel.objects)

    const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
    const objects = curmodel?.objects //.map((o: any) => o)

    const focusModel =  (reportType === 'task') ?  models.find(m => m.id === modelInFocusId) :  ph?.phFocus.focusModel    // selecting the models array current model or task model (generated from model)
    const focusUser = ph.phUser?.focusUser
    const focusModelview =  ph.phFocus?.focusModelview // if task we use the first modelview (it should be generated with the generatedFrom)
    const focusObjectview = ph.phFocus?.focusObjectview
    const focusTask = ph.phFocus?.focusTask
    const focusObject = (reportType === 'task') ? ph.phFocus.focusTask :  ph.phFocus?.focusObject
    if (debug) console.log('47 Context:', focusObjectview, focusObject)
    // const [model, setModel] = useState(focusModel)
    if (debug) console.log('47 Context:', focusModel, focusTask, models, props.reportType, props);
    

    const curobjectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews 
    const currelshipviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.relshipviews 
    const currelationships = curmodel?.relships.filter(r => currelshipviews?.find(crv => crv.relshipRef === r.id))
    if (debug) console.log('62 Context:', focusModelview?.id, curobjectviews,  modelviews,  modelviews?.find(mv => mv.id === focusModelview?.id),currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);
    const curmodelview = modelviews?.find(mv => mv.id === focusModelview?.id)
    if (debug) console.log('64 Context:', curmodel, modelviews, objects, curobjectviews, currelshipviews, currelationships, curmodelview, focusModelview?.id, focusModelview, focusObjectview?.id, focusObjectview, focusObject?.id, focusObject, focusTask?.id, focusTask);

    const curobject = objects?.find(o => o.id === focusObject?.id) 
    // const curobject = (props.reportType === 'task') ? objects?.find(o => o.id === focusTask?.id) : objects?.find(o => o.id === focusObject?.id) 
    if (debug) console.log('67 Context:', curobject, objects, focusObject?.id, focusObject, focusTask?.id, focusTask);


    useEffect(() => {
      setFormValues(curobject);
      setFormValuesObjectview(curobjectview);
      setFormValuesObjecttype(curobjecttype);
      setFormValuesObjecttypeview(curobjtypeview);
    }, [curobject]);
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      if (debug) console.log('78 Context :',name, value, e);
      setFormValues({ ...formValues, [name]: value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (debug) console.log('79 Context :',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }

      const objData = { id: formValues['id'], ...modifiedFields , modifiedDate: new Date().toISOString()};
      const objvData = { id: focusObjectview.id, name: formValues['name'], modifiedDate: new Date().toISOString()};

      if (debug) console.log('93 Context :',objData, objvData);
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData }) 
      dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: objData })
      if (debug) console.log('105 Context ',formValues, objData, objvData);
      }
    };

    const handleSubmitObjectview = (e) => {
      e.preventDefault();
      if (debug) console.log('70 Context ',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      // const objvData = modifiedFields
       const objvData = { id: focusObjectview.id, name: formValues['name'], modifiedDate: new Date().toISOString()};
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData })
      }
    };

    const handleSubmitObjecttype = (e) => {
      e.preventDefault();
      if (debug) console.log('70 Context ',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      const objtData = modifiedFields
      dispatch({ type: 'UPDATE_OBJECTTYPE_PROPERTIES', data: objtData })
      }
    };
    const handleSubmitObjecttypeview = (e) => {
      e.preventDefault();
      if (debug) console.log('70 Context ',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      const otvData = modifiedFields
      dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data: otvData })
      }
    };

    useEffect(() => {
      if (selectedId) {
        setSelectedId(null);
      }
    }, []);
    
    // const MDEditor = dynamic(
    //   () => import("@uiw/react-md-editor"),
    //   { ssr: false }
    // );

    // remove duplicate objects
    const uniqueovs = curobjectviews?.filter((ov, index, self) =>
      index === self.findIndex((t) => (
        t.place === ov.place && t.id === ov.id
      ))
    ) || []

    const curmm = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))
    
    // find object with type
    const type = (metamodels, model, objects, curov) => {                                                                                                                                                                                          
      const mmod = metamodels?.find(mm => (mm) && mm.id === model.metamodelRef)
      const o = objects.find(o => o.id === curov.objectRef)
      // if (debug) console.log('37 SelectContext :', curov.objectRef, objects, o, mmod.objecttypes.find(ot => ot.id === o?.typeRef === ot.id));
      const type = mmod?.objecttypes?.find(ot => ot.name && o?.typeRef === ot.id)?.name
      // if (debug) console.log('43 SelectContext', mmod.objecttypes.name, o, type);
      return type
    }
    
    // if (!curobject) curobject = curmodelview
    const curobjModelviews = curmodel.modelviews.filter(cmv => cmv.objectviews?.find(cmvo => (cmvo)) &&  ({id: cmv.id, name: cmv.name}))
    if (debug) console.log('115 Context',  curobjModelviews, curmodel.modelviews, curobjectviews, curobject);
    // const curobjviewModelviews = curmodel.modelviews.filter(cmv => cmv.objectRef === curobject.id).map(vmv => ({id: vmv.id, name: vmv.name}))
    // find parent object

    const curobjectview = curobjectviews?.find(ov => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
    if (debug) console.log('123 Context', curobjectview, curobjectviews, focusObjectview, focusModelview);
    const parentobjectview = curobjectviews?.find(ov => ov.id === curobjectview?.group) || null
    let parentobject =  objects?.find(o => o.id === parentobjectview?.objectRef)
    parentobject = objects?.find(o => o.id === parentobjectview?.objectRef)
    if (debug) console.log('58 Context', parentobjectview);
    if (debug) console.log('58 Context', parentobject);

    // functions to find objects and objectviews etc ----------------------------------------------------------------------
    function findObjectviewsWithCurrentObjectview(objectviews: any[], currentObjectviewId: string): any[] {
      return objectviews?.filter((objectview) => objectview.group === currentObjectviewId) || [];
    }
  
    function findObjectsForObjectviews(objectviews: any[], objects: any[]): any[] {
      return objectviews?.map((objectview) => objects?.find((object) => object.id === objectview.objectRef)) || [];
    }

    function findObjectTypesForObjectviews(objectviews: any[], objects: any[], metamodels: any[], curmodel: any): any[] {
      return objectviews?.map((objectview) => {
        const object = objects?.find((object) => object.id === objectview.objectRef)
        const metamodel = metamodels.find((mm) => mm.id === curmodel.metamodelRef)
        const objecttype = metamodel.objecttypes.find((ot) => ot.id === object?.typeRef)
        return objecttype
      }) || [];
    }

    function findRelationshipsForObjectviews(objectviews: any[], relationships: any[]): any[] {
      return objectviews?.map((objectview) => relationships.find((relationship) => relationship.id === objectview.relationshipRef)) || [];
    }

    function findTypeviewForcurrentObjecttype(objecttype: any, objecttypeviews: any[]): any[] {
      return objecttypeviews?.find((tv) => tv.typeRef === objecttype?.id) || [];
    }

    // function findToobjectsForCurobject(curobject: any, currelationships: any[]): any[] {
    //   return currelationships?.map((relship) => relship.toobjectRef === curobject.id ? relship.fromobjectRef : null) || [];
    // }
    // function findFromobjectsForCurobject(curobject: any, currelationships: any[]): any[] {
    //   return currelationships?.map((relship) => relship.fromobjectRef === curobject.id ? relship.toobjectRef : null) || [];
    // }
  
    let objectviewChildren = (curobjectview) ? findObjectviewsWithCurrentObjectview(curobjectviews, curobjectview?.id) : curmodelview?.objectviews; 
    let objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
    if (debug) console.log('227 Context',  curobjectview, curmodelview?.objectviews);
    if (debug) console.log('228 Context', objectviewChildren);
    if (debug) console.log('229 Context', objectChildren);

    // find related objects
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (debug) console.log('211 Context', curRelatedFromObectRels, curRelatedToObectRels);

    const curobjecttype = findObjectTypesForObjectviews(curobjectviews, objects, metamodels, curmodel).find(ot => ot?.id === curobject?.typeRef)
    if (debug) console.log('216 Context', curobjecttype);
    const curobjtypeview = findTypeviewForcurrentObjecttype(curobjecttype, curmm.objecttypeviews) 
    if (debug) console.log('237 Context', curobjtypeview, curobjecttype, curmm);

    const setObjview = (o) => {
      let ovdata =  (o) ? curobjectviews.find(ov => ov?.objectRef === o?.id) : {id: '', name: 'no objectview selected'}
      let odata = (o) ? {id: o.id, name: o.name} : {id: '', name: 'no object selected'}
      if (debug) console.log('246 setObjview', ovdata, odata )
      dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: ovdata })
      dispatch({ type: 'SET_FOCUS_OBJECT', data: odata })
    }

    const includedKeysAllTypeview = (curobjtypeview) && Object.keys(curobjtypeview).reduce((a, b) => a.concat(b), [])
    const includedKeysAllObjType = (curobjecttype) && Object.keys(curobjecttype).reduce((a, b) => a.concat(b), [])
    const includedKeysAllObjview = (curobjectview) && Object.keys(curobjectview).reduce((a, b) => a.concat(b), [])
    const includedKeysAllExept = (curobjectview) && Object.keys(curobjectview).filter(key => ![ 'name', 'description', 'typeName', 'typeDescription', 'objectRef', ].includes(key))
    const includedKeysMain = [ 'name', 'description', '$id', '$schema', '$ref', 'x-osdu-license', 'x-osdu-review-status', 'x-osdu-schema-source', 
      '----','externalID', 'groupType', 'osduId', 'osduType','id', 'proposedType', 'typeName', 'typeDescription',
      'fillcolor', 'fillcolor2', 'strokecolor','icon', 'image'
    ];
    // const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];
    // , $id, $schema, $ref, externalID, groupType, osduId, osduType, x-osdu-license, x-osdu-review-status, x-osdu-schema-source

    const objectPropertiesMain = (curobject) && Object.keys(curobject).filter(key => includedKeysMain.includes(key)).sort((a, b) => includedKeysMain.indexOf(a) - includedKeysMain.indexOf(b));

    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract',  'ports', 'propertyValues', 'valueset',
    'markedAsDeleted', 'modified',  'sourceUri',  'relshipkind','Associationvalueset','copiedFromId', 'typeRef','typeName', 'typeDescription']

    const objectPropertiesMore = (curobject) && Object.keys(curobject).filter(key => includedKeysMore.includes(key));

    // const ovChildrenProperties = ovChildrenPropertiesList.reduce((a, b) => a.concat(b), [])
    // const objectProperties = Object.entries(curobject);

    const [activeTab, setActiveTab] = useState(0);

    const [activeTab2, setActiveTab2] = useState(0);

    const tabsDiv = (
      <Tabs  onSelect={index => setActiveTab(index)}>
        <TabList>
          <Tab>Details</Tab>
          {(reportType === 'object') && <Tab >Additional info</Tab>}
          {(reportType == 'object') && <Tab>Objectview props</Tab>}
          {(reportType == 'object') && <Tab>Objecttype props</Tab>}
          {(reportType == 'object') && <Tab>Typeview props</Tab>}
          {/* <Tab><FaPlaneArrival />Main</Tab>
          <Tab ><FaCompass /></Tab> */}
        </TabList>
        <TabPanel className="main-properties" > {/* Main properties */}
          {/* <h4 className="px-2">{curobject?.name}
            <span style={{ flex: 1, textAlign: 'right', float: "right" }}>({curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name || ('Modelview')})
            { (curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name) && <span > <button onClick={() => setObjview(parentobject)} > ⬆️</button> </span>}
            </span>
          </h4> */}
          <ObjectDetails
            curmodel={curmodel}
            curmodelview={curmodelview}
            curmm={curmm}
            curobject={curobject}
            objectPropertiesMain={objectPropertiesMain}
            formValues={formValues}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            curobjModelviews={curobjModelviews}
            setObjview={setObjview}
            parentobject={parentobject}
            edit={props.edit}
          />
          {(reportType === 'object') && 
          <Tabs  onSelect={index => setActiveTab2(index)} style={{ overflow: 'auto' }}>
            <TabList>
              <Tab>Children</Tab>
              <Tab>Relationship from and to Objects</Tab>
            </TabList>
            <TabPanel > {/* Children */}
              <ObjDetailTable
                title="Children"
                curRelatedObjsRels={objectChildren}
                curmodelview={curmodelview}
                curmetamodel={curmm}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                curobject={curobject}
                objects={objects}
                includedKeys={includedKeysMain}
                setObjview={setObjview}
              />
            </TabPanel>
            <TabPanel>  {/* Relationship from/to Objects */}
              <ObjDetailTable
                title="Related From"
                curRelatedObjsRels={curRelatedFromObectRels}
                curmodelview={curmodelview}
                curmetamodel={curmm}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                curobject={curobject}
                objects={objects}
                includedKeys={includedKeysMain}
                setObjview={setObjview}
              />
              <ObjDetailTable
                title="Related To"
                curRelatedObjsRels={curRelatedToObectRels}
                curmodelview={curmodelview}
                curmetamodel={curmm}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                curobject={curobject}
                objects={objects}
                includedKeys={includedKeysMain}
                setObjview={setObjview}
              /> 
            </TabPanel>
            <TabPanel> {/* Modelviews */}
              <table className='w-100'>
                <thead className="thead">
                  <tr className="tr">
                    <th className="th">Current object shown in:</th>
                    <th className="th">Value <span style={{float: "right"}}>🟢 = Modelview</span></th>
                  </tr>
                </thead>
                <tbody>
                  {curobjModelviews.map(comv =>  (
                    <tr className="tr" key={comv.id}>
                      <td className="td">Modelview</td>
                    {(comv.id === curmodelview?.id) 
                      ? <td className="td">{comv.name} <span style={{float: "right"}}>🟢</span></td> 
                      : <td className="td">{comv.name}</td>}
                    </tr>
                  ))}
                </tbody>
              </table> 
            </TabPanel>
          </Tabs>}
        </TabPanel>
        {(reportType === 'object') && 
          <>
            <TabPanel className='additional-properties' style={{ overflow: 'auto'}}> 
              <ObjectDetails 
                  curmodel={curmodel}
                  curmodelview={curmodelview}
                  curmm={curmm}
                  curobject={curobject}
                  objectPropertiesMain={objectPropertiesMore}
                  formValues={formValues}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  curobjModelviews={curobjModelviews}
                  setObjview={setObjview}
                  parentobject={parentobject}
                  edit={props.edit}
                />
            </TabPanel>
            <TabPanel className='objectview'  style={{ overflow: 'auto'}}> 
              <ObjectDetails
                curmodel={curmodel}
                curmodelview={curmodelview}
                curmm={curmm}
                curobject={curobjectview}
                objectPropertiesMain={includedKeysAllExept}
                formValues={formValuesObjectview}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                curobjModelviews={curobjModelviews}
                setObjview={setObjview}
                parentobject={parentobject}
                edit={props.edit}
              />
            </TabPanel>
            <TabPanel className='objectype'  style={{ overflow: 'auto'}}> 
              <ObjectDetails
                  curmodel={curmodel}
                  curmodelview={curmodelview}
                  curmm={curmm}
                  curobject={curobjecttype}
                  objectPropertiesMain={includedKeysAllObjType}
                  formValues={formValuesObjecttype}
                  handleChange={handleChange}
                  handleSubmit={handleSubmitObjecttype}
                  curobjModelviews={curobjModelviews}
                  setObjview={setObjview}
                  parentobject={parentobject}
                  edit={props.edit}
                />
            </TabPanel>
            <TabPanel className='typeview'  style={{ overflow: 'auto'}}> 
              <ObjectDetails
                  curmodel={curmodel}
                  curmodelview={curmodelview}
                  curmm={curmm}
                  curobject={curobjtypeview}
                  objectPropertiesMain={includedKeysAllTypeview}
                  formValues={formValuesObjecttypeview}
                  handleChange={handleChange}
                  handleSubmit={handleSubmitObjecttypeview}
                  curobjModelviews={curobjModelviews}
                  setObjview={setObjview}
                  parentobject={parentobject}
                  edit={props.edit}
              />
            </TabPanel>
          </>
        }
      </Tabs>
    )

  

    return (
        <div className="context m-0" style={{ maxHeight: '80vh', minWidth: '686px', maxWidth: '800px', width: 'auto', height: 'auto', overflowY: 'auto' }} >
          <div className="context-tabs border border-dark rounded bg-transparent mx-1" style={{ height: 'auto'}}>
            {tabsDiv} 
          </div>
        </div>
    )
}
export default FocusDetails
