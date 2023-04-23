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

const Context = (props) => {
    if (debug) console.log('20 context', props, props.props)
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const ph = props.props

    if (!ph.phData?.metis?.models) return <></>
    const dispatch = useDispatch()
    const [selectedId, setSelectedId] = useState(null);
    const [value, setValue] = useState("");
    // const [visibleContext, setVisibleContext] = useState(true);
    const [formValues, setFormValues] = useState({});
    const [formValuesObjectview, setFormValuesObjectview] = useState({});
    const [formValuesObjecttype, setFormValuesObjecttype] = useState({});
    const [formValuesObjecttypeview, setFormValuesObjecttypeview] = useState({});

    // if no props.then exit
    const metamodels = useSelector(metamodels => ph.phData?.metis?.metamodels)  // selecting the models array
    const focusModel = useSelector(focusModel => ph.phFocus?.focusModel) 
    const focusUser = useSelector(focusUser => ph.phUser?.focusUser)
    const focusModelview = useSelector(focusModelview => ph.phFocus?.focusModelview)
    const focusObjectview = useSelector(focusObjectview => ph.phFocus?.focusObjectview)
    const focusObject = useSelector(focusObject => ph.phFocus?.focusObject)
  
    const models = useSelector(models =>  ph.phData?.metis?.models)  // selecting the models array
  
    // const [model, setModel] = useState(focusModel)
    if (debug) console.log('47 Context', focusObject, focusModel, models);
    
    const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
    const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
    const objects = curmodel?.objects //.map((o: any) => o)
    const curobjectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews 
    const currelshipviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.relshipviews 
    const currelationships = curmodel?.relships.filter(r => currelshipviews?.find(crv => crv.relshipRef === r.id))
    if (debug) console.log('51 Context', focusModelview?.id, curobjectviews,  modelviews,  modelviews?.find(mv => mv.id === focusModelview?.id),currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);
    const curmodelview = modelviews?.find(mv => mv.id === focusModelview?.id)
    // if (debug) console.log('25 Sel', curmodel, modelviews, objects, objectviews);

    let curobject = objects?.find(o => o.id === focusObject?.id) 
    if (debug) console.log('81 curobject', curobject)

    useEffect(() => {
      setFormValues(curobject);
      setFormValuesObjectview(curobjectview);
      setFormValuesObjecttype(curobjecttype);
      setFormValuesObjecttypeview(curobjtypeview);
    }, [curobject]);
    
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormValues({ ...formValues, [name]: value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('70 Context ',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }

      const objData = { id: formValues['id'], ...modifiedFields };
      const objvData = { id: focusObjectview.id, name: formValues['name']};
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData })
      dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: objData })
      
      if (modifiedFields['name']) {
        const focobjData = { id: focusObject.id, name: modifiedFields['name'] };
        const focobjvData = { id: focusObjectview.id, name: formValues['name']};
        dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: focobjvData })
        dispatch({ type: 'SET_FOCUS_OBJECT', data: focobjData })
      }
        
        // dispatch(submitForm(formValues));
        console.log('83 Context ',formValues, objData, objvData);
      }
    };

    const handleSubmitObjectview = (e) => {
      e.preventDefault();
      console.log('70 Context ',formValues, e);
      if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) { 
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      const objvData = modifiedFields
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData })
      }
    };

    const handleSubmitObjecttype = (e) => {
      e.preventDefault();
      console.log('70 Context ',formValues, e);
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
      console.log('70 Context ',formValues, e);
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
      return objectviews?.map((objectview) => objects.find((object) => object.id === objectview.objectRef)) || [];
    }

    function findObjectTypesForObjectviews(objectviews: any[], objects: any[], metamodels: any[], curmodel: any): any[] {
      return objectviews?.map((objectview) => {
        const object = objects.find((object) => object.id === objectview.objectRef)
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
  
    let objectviewChildren = (curobjectview) ? findObjectviewsWithCurrentObjectview(curobjectviews, curobjectview?.id) : curmodelview.objectviews; 
    let objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
    if (!debug) console.log('227 Context',  curobjectview, curmodelview.objectviews);
    if (!debug) console.log('228 Context', objectviewChildren);
    if (!debug) console.log('229 Context', objectChildren);

    // find related objects
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (debug) console.log('211 Context', curRelatedFromObectRels, curRelatedToObectRels);

    const curobjecttype = findObjectTypesForObjectviews(curobjectviews, objects, metamodels, curmodel).find(ot => ot?.id === curobject?.typeRef)
    if (!debug) console.log('216 Context', curobjecttype);
    const curobjtypeview = findTypeviewForcurrentObjecttype(curobjecttype, curmm.objecttypeviews) 
    if (!debug) console.log('237 Context', curobjtypeview, curobjecttype, curmm);
    
 

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
    const includedKeysMain = ['id', 'name', 'description', 'draft', 'typeName', 'typeDescription'];
    const objectPropertiesMain = (curobject) && Object.keys(curobject).filter(key => includedKeysMain.includes(key));

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
          <Tab>Main properties</Tab>
          <Tab >Additional Properties</Tab>
          <Tab>Objectview</Tab>
          <Tab>Objecttype</Tab>
          <Tab>Typeview</Tab>
          {/* <Tab><FaPlaneArrival />Main</Tab>
          <Tab ><FaCompass /></Tab> */}
        </TabList>
        <TabPanel className="main-properties" > {/* Main properties */}
          {/* <h4 className="px-2">{curobject?.name}                              
            <span style={{ flex: 1, textAlign: 'right', float: "right" }}>({curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name || ('Modelview')})
            { (curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name) && <span > <button onClick={() => setObjview(parentobject)} > ⬆️</button> </span>}
            </span>
          </h4>       */}
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
          />
          <Tabs  onSelect={index => setActiveTab2(index)} style={{ overflow: 'auto' }}>
            <TabList>
              <Tab>Children</Tab>
              <Tab>Relationship from Objects</Tab>
              <Tab>Relationship To Objects</Tab>
              <Tab>Viewed in Modelview</Tab>
            </TabList>
            <TabPanel> {/* Children */}
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
            <TabPanel>  {/* Relationship from Objects */}
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
            </TabPanel>
            <TabPanel>  {/* Relationship To Objects */}
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
                    <th className="th">Value <span style={{float: "right"}}>🟢 = Current Modelview</span></th>
                  </tr>
                </thead>
                <tbody>
                  {curobjModelviews.map(comv =>  (
                    <tr className="tr" key={comv.id}>
                      <td className="td">Modelview</td>
                    {(comv.id === curmodelview?.id) ? <td className="td">{comv.name} <span style={{float: "right"}}>🟢</span></td> : <td className="td">{comv.name}</td>}
                    </tr>
                  ))}
                </tbody>
              </table> 
            </TabPanel>
          </Tabs>
        </TabPanel>
        <TabPanel className='additional-properties' style={{ overflow: 'auto' }}> 
          {/* <div className="Context-tabs" style={{ overflow: 'auto', maxHeight: '700px' }}> */}
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
            />
        {/* </div> */}
        </TabPanel>
        <TabPanel className='objectview'> 
        <ObjectDetails
            curmodel={curmodel}
            curmodelview={curmodelview}
            curmm={curmm}
            curobject={curobjectview}
            objectPropertiesMain={includedKeysAllExept}
            formValues={formValuesObjectview}
            handleChange={handleChange}
            handleSubmit={handleSubmitObjectview}
            curobjModelviews={curobjModelviews}
            setObjview={setObjview}
            parentobject={parentobject}
          />
        </TabPanel>
        <TabPanel  className='objectype'> 
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
            />
        </TabPanel>
        <TabPanel  className='typeview'> 
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
          />
        </TabPanel>

      </Tabs>
    )

    return (
      <>
        <div className="context m-0 " style={{ minWidth: '686px', maxWidth: '800px', width: 'auto' }} >
          <div className="context-tabs border border-dark rounded bg-white mx-1" style={{ height: 'auto',   borderTop: 'none' }}>
            {tabsDiv} 
            {/* {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>} */}
          </div>
        </div>

        {/* <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} /> */}
      </>
    )


}
export default Context  
