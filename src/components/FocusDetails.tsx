// @ts-nocheck
// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef, useContext, useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'
import { FaPlaneArrival, FaCompass } from 'react-icons/fa';

import { ObjDetailTable } from './forms/ObjDetailTable';
import ObjectDetails from './forms/ObjectDetails';
import Selector from './utils/Selector'
import 'react-tabs/style/react-tabs.css';

const debug = false

const FocusDetails = ({ ph, reportType, modelInFocusId, edit }: { ph: any, reportType: any, modelInFocusId: any, edit: any }) => {
  if (debug) console.log('17 FocusDetails', ph, reportType, modelInFocusId)

  const dispatch = useDispatch()

  // const ph = props.props.props
  // console.log('24 FocusDetails', ph, ph?.phData?.metis?.models)
  // const reportType = props.props?.reportType
  // const modelInFocusId = props.props?.modelInFocusId
  // const modelviewInFocusId = props.modelviewInFocusId
  // Remove empty if statements Context:', reportType, modelInFocusId, ph?.phData);
  if (debug) console.log('28 Context:', ph?.phFocus?.focusModel.id);

  const models = ph?.phData?.metis?.models  // selecting the models array
  let curmod: any
  (reportType === 'task') ? curmod = models?.find((m: any) => m?.id === modelInFocusId) : curmod = models?.find((m: any) => m?.id === ph?.phFocus.focusModel.id)   // selecting the models array current model or task model (generated from model)
  // console.log('32 FocusDetail:', curmod, models, modelInFocusId, ph?.phFocus?.focusModelview.id)
  const metamodels = ph?.phData?.metis?.metamodels  // selecting the models array
  const curmm = metamodels?.find((mm: any) => mm?.id === curmod?.metamodelRef)

  // const modelviews = curmod?.modelviews //.map((mv: any) => mv)
  const curmodview = curmod.modelviews.find((mv: any) => mv.id === ph?.phFocus.focusModelview.id)
  const objects = curmod?.objects //.map((o: any) => o)
  const focusModel = (reportType === 'task') ? models.find((m: any) => m.id === modelInFocusId) : models.find((m: any) => m.id === ph?.phFocus.focusModel)    // selecting the models array current model or task model (generated from model)
  const focusUser = ph?.phUser?.focusUser
  const focusModelview = ph?.phFocus?.focusModelview // if task we use the first modelview (it should be generated with the generatedFrom)
  const focusObjectview = ph?.phFocus?.focusObjectview
  const focusTask = ph?.phFocus?.focusTask
  const focusObject = (reportType === 'task') ? ph?.phFocus.focusTask : ph?.phFocus?.focusObject
  if (debug) console.log('45 FocusDetail:', focusObjectview, focusObject)
  // const [model, setModel] = useState(focusModel)
  if (debug) console.log('47 FocusDetail:', focusModel, focusTask, models, ph?.reportType);

  let curobject = (reportType === 'task') ? objects?.find((o: any) => o.id === focusTask?.id) : objects?.find((o: any) => o.id === focusObject?.id)
  if (!curobject) curobject = curmodview// if no object selected then use the modelview
  let curobjectview = curmod.modelviews?.find((mv: any) => mv.id === focusModelview?.id)?.objectviews?.find((ov: any) => ov.id === focusObjectview?.id)
  if (!curobjectview) curobjectview = curmodview
  const curobjectviews = curmod.modelviews?.find((mv: any) => mv.id === focusModelview?.id)?.objectviews
  const currelshipviews = curmod.modelviews?.find((mv: any) => mv.id === focusModelview?.id)?.relshipviews
  const currelationships = curmod?.relships.filter((r: any) => currelshipviews?.find((crv: any) => crv.relshipRef === r.id))
  const parentobjectview = curmodview.objectviews?.find((ov: any) => ov.id === curobjectview?.group) || curmodview

  const [selectedId, setSelectedId] = useState(null);
  const [value, setValue] = useState("");
  // const [visibleContext, setVisibleContext] = useState(true);
  const [formValues, setFormValues] = useState<null | object>(null);
  const [formValuesObjectview, setFormValuesObjectview] = useState<{ [key: string]: any }>({});
  const [formValuesObjecttype, setFormValuesObjecttype] = useState<{ [key: string]: any }>({});
  const [formValuesObjecttypeview, setFormValuesObjecttypeview] = useState<{ [key: string]: any }>({});
  const [activeTab, setActiveTab] = useState(0);
  const [activeTab2, setActiveTab2] = useState(0);

  useEffect(() => {
    setFormValues(curobject);
    setFormValuesObjectview(curobjectview);
    // setFormValuesObjecttype(curobjecttype);
    // setFormValuesObjecttypeview(curobjtypeview);
  }, [curobject, curobjectview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (debug) console.log('78 Context :', name, value, e);
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debug) console.log('79 Context :', formValues, e);
    if (formValues) {
      const modifiedFields: { [key: string]: any } = {};
      for (const key in formValues) {
        if (formValues.hasOwnProperty(key) && formValues[key] !== (curobject as { [key: string]: any })[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      if ((formValues as { id: string })['id'] === curmodview.id) {
        const objData = { id: (formValues as { id: string })['id'], ...modifiedFields, modifiedDate: new Date().toISOString() };
        // const objvData = { id: focusObjectview.id, name: formValues['name'], modifiedDate: new Date().toISOString() };
        dispatch({ type: 'UPDATE_MODELVIEW_PROPERTIES', data: objData })
      } else {
        const objData = { id: (formValues as { id: string })['id'], ...modifiedFields, modifiedDate: new Date().toISOString() };
        const objvData = { id: focusObjectview.id, name: formValues['name'], modifiedDate: new Date().toISOString() };

        if (debug) console.log('93 Context :', objData, objvData);
        dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData })
        dispatch({ type: 'UPDATE_OBJECT_PROPERTIES', data: objData })
        dispatch({ type: 'SET_FOCUS_REFRESH', data: { id: Math.random().toString(36).substring(7), name: 'name' } })
        if (debug) console.log('105 Context ', formValues, objData, objvData);
      }
    }
  };

  const handleSubmitObjectview = (e: React.FormEvent) => {
    e.preventDefault();
    if (debug) console.log('70 Context ', formValues, e);
    if (formValues) {
      const modifiedFields = {};
      for (const key in formValues) {
        if (formValues.hasOwnProperty(key) && formValues[key] !== curobject[key]) {
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      // const objvData = modifiedFields
      const objvData = { id: focusObjectview.id, name: formValues['name'], modifiedDate: new Date().toISOString() };
      dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data: objvData })
    }
  };

  const handleSubmitObjecttype = (e: React.FormEvent) => {
    e.preventDefault();
    if (debug) console.log('70 Context ', formValues, e);
    if (formValues) {
      const modifiedFields: { [key: string]: any } = {}; // Add index signature to allow indexing with a string
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
  const handleSubmitObjecttypeview = (e: React.FormEvent) => {
    e.preventDefault();
    if (debug) console.log('70 Context ', formValues, e);
    if (formValues) {
      const modifiedFields: { [key: string]: any } = {}; // Add index signature to allow indexing with a string
      for (const key in formValues) {
        if (formValues.hasOwnProperty(key) && formValues[key] !== (curobject as { [key: string]: any })[key]) { // Add type assertion to curobject
          modifiedFields[key] = formValues[key];
        }
      }
      // const objData = { id: formValues['id'], ...modifiedFields };
      const otvData = modifiedFields;
      dispatch({ type: 'UPDATE_OBJECTTYPEVIEW_PROPERTIES', data: otvData });
    }
  };

  useEffect(() => {
    if (selectedId) {
      setSelectedId(null);
    }

  }, []);

  if (!ph?.phData?.metis?.models) return <></>

  // const MDEditor = dynamic(
  //   () => import("@uiw/react-md-editor"),
  //   { ssr: false }
  // );

  // remove duplicate objects
  const curobjModelviews = curmod.modelviews.filter((cmv: any) => cmv.objectviews?.find(cmvo => (cmvo)) && ({ id: cmv.id, name: cmv.name }))
  let parentobject = objects?.find((o: any) => o.id === parentobjectview?.objectRef) || null
  if (debug) console.log('173 Context', parentobjectview);
  if (debug) console.log('174 Context', parentobject);

  // functions to find objects and objectviews etc ----------------------------------------------------------------------
  function findObjectviewsWithCurrentObjectviewAsParent(objectviews: any[], currentObjectviewId: string): any[] {
    return objectviews?.filter((objectview) => objectview.group === currentObjectviewId) || [];
  }

  function findObjectsForObjectviews(objectviews: any[], objects: any[]): any[] {
    return objectviews?.map((objectview) => objects?.find((object) => object.id === objectview.objectRef)) || [];
  }

  function findObjectTypesForObjectviews(objectviews: any[], objects: any[], metamodels: any[], curmod: any): any[] {
    return objectviews?.map((objectview) => {
      const object = objects?.find((object) => object.id === objectview.objectRef)
      const metamodel = metamodels.find((mm) => mm.id === curmod.metamodelRef)
      const objecttype = metamodel.objecttypes.find((ot: any) => ot.id === object?.typeRef)
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

  let objectviewChildren = (curobjectview && curobject.id !== curmodview.id) ? findObjectviewsWithCurrentObjectviewAsParent(curobjectviews, curobjectview?.id) : curmodview?.objectviews;
  let objectChildren = findObjectsForObjectviews(objectviewChildren, objects);
  if (debug) console.log('227 Context', curobjectview, curmodview?.objectviews);
  if (debug) console.log('228 Context', objectviewChildren);
  if (debug) console.log('229 Context', objectChildren);

  // find related objects
  const curRelatedFromObectRels = currelationships?.filter((r: any) => r?.fromobjectRef === curobject?.id)
  const curRelatedToObectRels = currelationships?.filter((r: any) => r?.toobjectRef === curobject?.id)
  if (debug) console.log('211 Context', curRelatedFromObectRels, curRelatedToObectRels);

  const curobjecttype = findObjectTypesForObjectviews(curobjectviews, objects, metamodels, curmod).find(ot => ot?.id === curobject?.typeRef)
  if (debug) console.log('216 Context', curobjecttype);
  const curobjtypeview = findTypeviewForcurrentObjecttype(curobjecttype, curmm.objecttypeviews)
  if (debug) console.log('237 Context', curobjtypeview, curobjecttype, curmm);

  const setObjview = (o: any) => {
    let ovdata = (o) ? curobjectviews.find((ov: any) => ov?.objectRef === o?.id) : { id: '', name: 'no objectview selected' }
    let odata = (o) ? { id: o.id, name: o.name } : { id: '', name: 'no object selected' }
    if (debug) console.log('246 setObjview', ovdata, odata)
    dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: ovdata })
    dispatch({ type: 'SET_FOCUS_OBJECT', data: odata })
  }

  const includedKeysAllTypeview = (curobjtypeview) && Object.keys(curobjtypeview).reduce((a, b) => a.concat(b), [])
  const includedKeysAllObjType = (curobjecttype) && Object.keys(curobjecttype).reduce((a, b) => a.concat(b), [])
  const includedKeysAllObjview = (curobjectview) && Object.keys(curobjectview).reduce((a, b) => a.concat(b), [])
  const includedKeysAllExept = (curobjectview) && Object.keys(curobjectview).filter(key => !['name', 'description', 'typeName', 'typeDescription', 'objectRef',].includes(key))
  const includedKeysMain = ['id', 'name', 'description', '$id', '$schema', '$ref', 'x-osdu-license', 'x-osdu-review-status', 'x-osdu-schema-source',
    '----', 'externalID', 'groupType', 'osduId', 'osduType', 'proposedType',
    'fillcolor', 'fillcolor2', 'strokecolor', 'icon', 'image'
  ];
  // const includedKeysMain = ['id', 'name', 'description', 'proposedType', 'typeName', 'typeDescription'];
  // , $id, $schema, $ref, externalID, groupType, osduId, osduType, x-osdu-license, x-osdu-review-status, x-osdu-schema-source

  const objectPropertiesMain = (curobject) && Object.keys(curobject).filter(key => includedKeysMain.includes(key)).sort((a, b) => includedKeysMain.indexOf(a) - includedKeysMain.indexOf(b));

  const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'ports', 'propertyValues', 'valueset',
    'markedAsDeleted', 'modified', 'sourceUri', 'relshipkind', 'Associationvalueset', 'copiedFromId', 'typeRef']

  const objectPropertiesMore = (curobject) && Object.keys(curobject).filter(key => includedKeysMore.includes(key));

  // const ovChildrenProperties = ovChildrenPropertiesList.reduce((a, b) => a.concat(b), [])
  // const objectProperties = Object.entries(curobject);


  const tabsDiv = (
    <Tabs onSelect={index => setActiveTab(index)}>
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
          curmod={curmod}
          curmodview={curmodview}
          curmm={curmm}
          curobject={curobject}
          objectPropertiesMain={objectPropertiesMain}
          formValues={formValues}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          curobjModelviews={curobjModelviews}
          setObjview={setObjview}
          parentobject={parentobject}
          edit={edit}
        />
        {(reportType === 'object') &&
          <Tabs onSelect={index => setActiveTab2(index)} style={{ overflow: '' }}>
            <TabList>
              <Tab>Children</Tab>
              <Tab>Relationship from and to Objects</Tab>
              <Tab>Modelviews</Tab>
            </TabList>
            <TabPanel > {/* Children */}
              <ObjDetailTable
                title="Children"
                curRelatedObjsRels={objectChildren}
                curmodview={curmodview}
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
                curmodview={curmodview}
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
                curmodview={curmodview}
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
                    <th className="th">Value <span style={{ float: "right" }}>🟢 = Modelview</span></th>
                  </tr>
                </thead>
                <tbody>
                  {curobjModelviews.map(comv => (
                    <tr className="tr" key={comv.id}>
                      <td className="td">Modelview</td>
                      {(comv.id === curmodview?.id)
                        ? <td className="td">{comv.name} <span style={{ float: "right" }}>🟢</span></td>
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
          <TabPanel className='additional-properties' style={{ overflow: 'auto' }}>
            <ObjectDetails
              curmod={curmod}
              curmodview={curmodview}
              curmm={curmm}
              curobject={curobject}
              objectPropertiesMain={objectPropertiesMore}
              formValues={formValues}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              curobjModelviews={curobjModelviews}
              setObjview={setObjview}
              parentobject={parentobject}
              edit={edit}
            />
          </TabPanel>
          <TabPanel className='objectview' style={{ overflow: 'auto' }}>
            <ObjectDetails
              curmod={curmod}
              curmodview={curmodview}
              curmm={curmm}
              curobject={curobjectview}
              objectPropertiesMain={includedKeysAllExept}
              formValues={formValuesObjectview}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              curobjModelviews={curobjModelviews}
              setObjview={setObjview}
              parentobject={parentobject}
              edit={edit}
            />
          </TabPanel>
          <TabPanel className='objectype' style={{ overflow: 'auto' }}>
            <ObjectDetails
              curmod={curmod}
              curmodview={curmodview}
              curmm={curmm}
              curobject={curobjecttype}
              objectPropertiesMain={includedKeysAllObjType}
              formValues={formValuesObjecttype}
              handleChange={handleChange}
              handleSubmit={handleSubmitObjecttype}
              curobjModelviews={curobjModelviews}
              setObjview={setObjview}
              parentobject={parentobject}
              edit={false}
            />
          </TabPanel>
          <TabPanel className='typeview' style={{ overflowY: 'scroll' }}>
            <ObjectDetails
              curmod={curmod}
              curmodview={curmodview}
              curmm={curmm}
              curobject={curobjtypeview}
              objectPropertiesMain={includedKeysAllTypeview}
              formValues={formValuesObjecttypeview}
              handleChange={handleChange}
              handleSubmit={handleSubmitObjecttypeview}
              curobjModelviews={curobjModelviews}
              setObjview={setObjview}
              parentobject={parentobject}
              edit={false}
            />
          </TabPanel>
        </>
      }
    </Tabs>
  )

  return (
    <div className="context m-0" style={{ maxHeight: '78vh', minWidth: '686px', maxWidth: '800px', width: 'auto', height: '78vh', overflowY: 'auto' }} >
      <div className="context-tabs border border-dark rounded bg-transparent mx-1" style={{ height: 'auto' }}>
        {tabsDiv}
      </div>
    </div>
  )
}
export default FocusDetails
