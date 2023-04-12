// This is a React component that displays details of a selected object in a tabbed interface.
// It allows the user to edit the object's properties and view related objects.
import React, { useRef,useContext, useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
// import dynamic from "next/dynamic";

import {ObjDetailTable} from './forms/ObjDetailTable';
import ObjectDetails from './forms/ObjectDetails';
import MarkdownEditor from './forms/MarkdownEditor';
import ObjDetailToMarkdown from './forms/MdFocusObject';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';
import Selector from './utils/Selector'
import 'react-tabs/style/react-tabs.css';

const debug = false

const Context = (props) => {
    console.log('20 context', props, props.props)
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const ph = props.props

    if (!ph.phData?.metis?.models) return <></>
    const dispatch = useDispatch()
    const [selectedId, setSelectedId] = useState(null);
    const [value, setValue] = useState("");
    // const [visibleContext, setVisibleContext] = useState(true);
    const [formValues, setFormValues] = useState({});

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

    // const [mdString, setMdString] = useState("");


    // const setMdValue = (value) => {
    //   setMdString(value);
    // };
    // const mdString = markdownString
// 
    let curobject = objects?.find(o => o.id === focusObject?.id) 
    if (debug) console.log('81 curobject', curobject)

    useEffect(() => {
      setFormValues(curobject);
    }, [curobject]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormValues({ ...formValues, [name]: value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('70 Context ',formValues);
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
    if (!debug) console.log('115 Context',  curobjModelviews, curmodel.modelviews, curobjectviews, curobject);
    // const curobjviewModelviews = curmodel.modelviews.filter(cmv => cmv.objectRef === curobject.id).map(vmv => ({id: vmv.id, name: vmv.name}))
    // find parent object


    let relatedObjects = []
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (debug) console.log('58 Context', curRelatedFromObectRels, curRelatedToObectRels);
  
  
   
    const curobjectview = curobjectviews?.find(ov => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
    if (debug) console.log('123 Context', curobjectview, curobjectviews, focusObjectview, focusModelview);
    const parentobjectview = curobjectviews?.find(ov => ov.id === curobjectview?.group) || null
    let parentobject =  objects?.find(o => o.id === parentobjectview?.objectRef)
    parentobject = objects?.find(o => o.id === parentobjectview?.objectRef)
    if (debug) console.log('58 Context', parentobjectview);
    if (debug) console.log('58 Context', parentobject);

    let objectviewChildren = []
    let objectChildren = []
    if (debug) console.log('116 Context',  curobjectview?.name, curobject?.name);
    if (!curobject) { 
      objectviewChildren = curobjectviews
      objectChildren = objectviewChildren?.map(ov => objects.find(o => o.id === ov.objectRef)) || null

      console.log(`116 objectview for ${focusObjectview?.id} - ${focusObjectview?.name} not found`);
    } else { // find children
        if (debug) console.log('117 Context',  curobjectview?.name, curobjectviews);
        objectviewChildren = curobjectviews?.filter(ov => ov.group === curobjectview?.id) || null
        objectChildren = objectviewChildren?.map(ov => objects.find(o => o.id === ov.objectRef)) || null
      // }
    } 


    // if (!curobjectview) { // use modelviews as parent
    //   console.log('121 Context', parentobject);
    //       objectviewChildren = curobjectviews?.filter(ov => ov.group === '')
    //       objectChildren = objects.filter(o => objectviewChildren?.find(ov => ov.objectRef === o.id))
    // }
    if (debug) console.log('94 Context', objectviewChildren);
    if (debug) console.log('95 Context', objectChildren);



    const setObjview = (o) => {
      let ovdata =  (o) ? curobjectviews.find(ov => ov.objectRef === o?.id) : {id: '', name: 'no objectview selected'}
      let odata = (o) ? {id: o.id, name: o.name} : {id: '', name: 'no object selected'}
      if (debug) console.log('99 setObjview', ovdata, odata )
      dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: ovdata })
      dispatch({ type: 'SET_FOCUS_OBJECT', data: odata })
    }

    const includedKeysMain = ['id', 'name', 'description', 'typeName', 'typeDescription'];
    const objectPropertiesMain = (curobject) &&  Object.keys(curobject).filter(key => includedKeysMain.includes(key));

    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract',  'leftPorts', 'propertyValues', 'valueset',
    'rightPorts','topPorts', 'bottomPorts', 'markedAsDeleted', 'modified',  'sourceUri',  'relshipkind','Associationvalueset','copiedFromId', 'typeRef','typeName', 'typeDescription']

    const objectPropertiesMore = (curobject) && Object.keys(curobject).filter(key => includedKeysMore.includes(key));

    // const ovChildrenProperties = ovChildrenPropertiesList.reduce((a, b) => a.concat(b), [])
    // const objectProperties = Object.entries(curobject);

    let markdownString = ''
    markdownString += `### ${curobject?.name}\n\n `
    markdownString += '**Name:**' + curobject?.name + ' \n\n'
    markdownString += 'Description:  ***' + curobject?.description + '*** \n\n'
    markdownString += objectPropertiesMain?.map(key => (  
        `- ${key}:  ${curobject[key]} \n`
        // `| ${key}: | ${value} |\n`
        )).join('');
    markdownString += `\n\n <!-- ${JSON.stringify(curobject)} -->\n\n`



    // const mdString =  markdownString
        const [mdString, setMdString] = useState("");

    const handleMdChange = (value: string) => {
      setMdString(value);
    };

    const [activeTab, setActiveTab] = useState(0);



    const tabsDiv = (
      <Tabs  onSelect={index => setActiveTab(index)}>
        <TabList>
          <Tab>Object main props</Tab>
          <Tab >Additional Properties</Tab>
          <Tab>Objectview</Tab>
          {/* <Tab><FaPlaneArrival />Main</Tab>
          <Tab ><FaCompass /></Tab> */}
        </TabList>
        <TabPanel className="">
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
          <table className='w-100'>
            <thead className="thead">
              <tr className="tr">
                <th className="th">Current object shown in:</th>
                <th className="th">Value <span style={{float: "right"}}>🟢 = in current Modelview</span></th>
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
        <TabPanel>
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
        </TabPanel>
        <TabPanel>
        </TabPanel>
      </Tabs>
    )

    return (
      <>
        <div className="m-0 " style={{ minWidth: '686px', maxWidth: '800px', width: 'auto' }} >
          {/* <div style={{ marginBottom: "-36px", display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-sm px-1 me-4 mt-2 rounded" onClick={() => { dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !ph.phUser?.appSkin.visibleContext }) }}>X</button>
          </div> */}
          {/* <h1>{curobject.name}</h1> */}
          {/* {tabsDiv} */}
          <div className=""  >
           {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>}
          </div>
        </div>

        {/* <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} /> */}
      </>
    )


}
export default Context  
