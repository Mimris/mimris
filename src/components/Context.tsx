import React, { useRef,useContext, useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";

import {ObjDetailTable} from './forms/ObjDetailTable';

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';

import Selector from './utils/Selector'

import 'react-tabs/style/react-tabs.css';

const debug = false

const Context = (props) => {

    console.log('20 context', props)
    // let props.= useSelector((props.any) => props. // Selecting the whole redux store
    const ph = props.ph

    console.log('24 context', ph.phData)

    if (!ph.phData?.metis?.models) return <></>



    const dispatch = useDispatch()
    const [selectedId, setSelectedId] = useState(null);
    const [value, setValue] = useState("");
    // const [visibleContext, setVisibleContext] = useState(true);


    useEffect(() => {
      if (selectedId) {
        setSelectedId(null);
      }
    }, []);
    
  
    const MDEditor = dynamic(
      () => import("@uiw/react-md-editor"),
      { ssr: false }
    );

  
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
    if (!debug) console.log('51 Context', focusModelview?.id, curobjectviews,  modelviews,  modelviews?.find(mv => mv.id === focusModelview?.id),currelshipviews, currelationships, curobjectviews, focusModelview.id, modelviews);
    const curmodelview = modelviews?.find(mv => mv.id === focusModelview?.id)
    // if (debug) console.log('25 Sel', curmodel, modelviews, objects, objectviews);
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
    
    let curobject = objects?.find(o => o.id === focusObject?.id) 
    console.log('81 curobject', curobject)
    // if (!curobject) curobject = curmodelview
    const curobjModelviews = curmodel.modelviews.filter(cmv => cmv.objectviews?.find(cmvo => (cmvo)) &&  ({id: cmv.id, name: cmv.name}))
    console.log('115 Context',  curobjModelviews);
    // const curobjviewModelviews = curmodel.modelviews.filter(cmv => cmv.objectRef === curobject.id).map(vmv => ({id: vmv.id, name: vmv.name}))
    // find parent object


    let relatedObjects = []
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (debug) console.log('58 Context', curRelatedFromObectRels, curRelatedToObectRels);
  
  
   
    const curobjectview = curobjectviews?.find(ov => ov.id === focusObjectview?.id) //|| modelviews.find(mv => mv.id === focusModelview?.id)
    console.log('58 Context', curobjectview, curobjectviews, focusObjectview, focusModelview);
    const parentobjectview = curobjectviews?.find(ov => ov.id === curobjectview?.group) || null
    let parentobject =  objects?.find(o => o.id === parentobjectview?.objectRef)
    parentobject = objects?.find(o => o.id === parentobjectview?.objectRef)
    if (debug) console.log('58 Context', parentobjectview);
    if (debug) console.log('58 Context', parentobject);

    let objectviewChildren = []
    let objectChildren = []
    console.log('116 Context',  curobjectview?.name, curobject?.name);
    if (!curobject) { 
      console.log(`116 objectview for ${focusObjectview.id} - ${focusObjectview.name} not found`);
    } else { // find children
        console.log('117 Context',  curobjectview?.name, curobjectviews);
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
      console.log('99 setObjview', ovdata, odata )
      dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: ovdata })
      dispatch({ type: 'SET_FOCUS_OBJECT', data: odata })
    }

    const includedKeysMain = ['id', 'name', 'description', 'propertyValues', 'valueset'];
    const objectPropertiesMain = (curobject) &&  Object.keys(curobject).filter(key => includedKeysMain.includes(key));

    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'typeRef', 'typeName', 'typeDescription','leftPorts', 
    'rightPorts','topPorts', 'bottomPorts', 'markedAsDeleted', 'modified',  'sourceUri',  'relshipkind','Associationvalueset','copiedFromId']

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

    const [activeTab, setActiveTab] = useState(0);

  console.log('173 ',  objectChildren )
  console.log('174 ',   curRelatedFromObectRels )
  console.log('175 ',  curRelatedToObectRels)
    console.log('176 Context',  curobject, curmm, objects, curobjectviews, curmodelview, curmodel )
    

    const tabsDiv = (
      <Tabs  onSelect={index => setActiveTab(index)}>
        <TabList>
          <Tab>Main</Tab>
          <Tab >Additional</Tab>
          <Tab>Markdown</Tab>
          {/* <Tab><FaPlaneArrival />Main</Tab>
          <Tab ><FaCompass /></Tab> */}
        </TabList>
        <TabPanel>
          <h4 className="px-2">{curobject?.name}                              
            <span style={{ flex: 1, textAlign: 'right', float: "right" }}>({curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name || ('Modelview')})
            { (curmm.objecttypes.find(ot => ot.id ===curobject?.typeRef)?.name) && <span > <button onClick={() => setObjview(parentobject)} > ⬆️</button> </span>}
            </span>
          </h4>      
          <table className='w-100'> {/* Current object properties */}
            <thead className="thead">
              <tr className="tr">
                <th className="th">Property</th>
                <th className="th">Value</th>
              </tr>
            </thead>
            <tbody>
              {objectPropertiesMain?.map(key => (
                <tr className="tr" key={key}>
                  <td className="td">{key}</td>
                  <td className="td">{curobject[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <table >
            <thead className="thead">
              <tr className="tr">
                <th className="th">Property</th>
                <th className="th">Value</th>
              </tr>
            </thead>
            <tbody>
              {objectPropertiesMore?.map(key => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{curobject[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabPanel>
        <TabPanel>
          {/* <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} /> */}
          {/* <div className="my-1" style={{ minHeight: 'h', width: '40vh' }} > */}
            {/* <h3>{focusObject.name}</h3> */}                
            <MDEditor 
              value={markdownString} 
              onChange={setValue} 
              height={1030}
              // preview="preview"
            />
            {/* <MDEditor
            onChange={(newValue = "") => setValue(newValue)}
            textareaProps={{
              placeholder: "Please enter Markdown text"
            }}
            height={500}
            value={value}
            // previewOptions={{
            //   components: {
            //     code: Code
            //   }
            // }}
          /> */}
          {/* </div> */}
        </TabPanel>
      </Tabs>
    )

    return (
      <>
        <div style={{ padding: "2px",border: '4px solid gray', minWidth: '700px', maxWidth: '800px', width: 'auto' }} >
          <div style={{ marginBottom: "-28px", display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
            {/* <button className="btn-sm m-0 px-1" onClick={() => dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !visible }) setVisible(!visible)}>X</button> */}
            <button className="btn-sm m-0 px-1" onClick={() => { dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !ph.phUser?.appSkin.visibleContext }) }}>X</button>
          </div>
          {/* <h1>{curobject.name}</h1> */}
          {/* {tabsDiv} */}
          {ph.refresh ? <> {tabsDiv} </> : <>{tabsDiv} {ph.refresh}</>}
    
        </div>
        <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} />
      </>
    )


}
export default Context  
