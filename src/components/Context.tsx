
import React, { useRef,useContext, useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";

import { FaPlaneArrival, FaCompass } from 'react-icons/fa';

import Selector from './utils/Selector'

import 'react-tabs/style/react-tabs.css';

const debug = false

const Context = (props) => {

    let state = useSelector((state:any) => state) // Selecting the whole redux store

    console.log('19 context', props, state)

    if (!state.phData?.metis?.models) return <></>



    const dispatch = useDispatch()
    const [selectedId, setSelectedId] = useState(null);
    const [value, setValue] = useState("");

    useEffect(() => {
      if (selectedId) {
        setSelectedId(null);
      }
    }, []);
  
    const MDEditor = dynamic(
      () => import("@uiw/react-md-editor"),
      { ssr: false }
    );

  
    // if no state then exit
    const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
    const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
    const focusUser = useSelector(focusUser => state.phUser?.focusUser)
    const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview)
    const focusObjectview = useSelector(focusObjectview => state.phFocus?.focusObjectview)
    const focusObject = useSelector(focusObject => state.phFocus?.focusObject)

    const models = useSelector(models =>  state.phData?.metis?.models)  // selecting the models array
  
    // const [model, setModel] = useState(focusModel)
    if (!debug) console.log('47 Context', focusObject, focusModel, models);
    
    const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
    const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
    const objects = curmodel?.objects //.map((o: any) => o)
    const curobjectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews 
    const currelshipviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.relshipviews 
    const currelationships = curmodel?.relships.filter(r => currelshipviews?.find(crv => crv.relshipRef === r.id))
    if (!debug) console.log('51 Context',  currelshipviews, currelationships);
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
    
    const curobjectview = curobjectviews.find(ov => ov.id === focusObjectview?.id) || modelviews.find(mv => mv.id === focusModelview?.id)
    let objectviewChildren = []
    let objectChildren = []
    if (!curobjectview) { 
      console.log(`objectview for ${focusObjectview.id} - ${focusObjectview.name} not found`);
    } else { // find children
      objectviewChildren = curobjectviews.filter(ov => ov.group === curobjectview.id) || curobjectviews
      objectChildren = objectviewChildren.map(ov => objects.find(o => o.id === ov.objectRef))
      if (!debug) console.log('51 Context', curobjectview, objectviewChildren);
    }

    const setObjview = (o) => {
      if (o) {
        let ov =curobjectviews.find(ov => ov.objectRef === o?.id) 
        console.log('99 setObjview', o?.id, ov, curobjectviews)
        dispatch({ type: 'SET_FOCUS_OBJECTVIEW', data: {id: ov.id, name: ov.name} })
        dispatch({ type: 'SET_FOCUS_OBJECT', data: {id: o.id, name: o.name} })
      } else {
        alert('No object to focus on')
      }
    }


    let curobject = objects?.find(o => o.id === focusObject?.id) 
    console.log('81 curobject', curobject)
    
    if (!curobject) curobject = curmodelview
    // find parent object
    const parentobjectview = curobjectviews?.find(ov => ov.id === curobjectview?.group) || null
    const parentobject = objects?.find(o => o.id === parentobjectview?.objectRef) || null
    if (!debug) console.log('58 Context', parentobjectview?.name, parentobject);

    let relatedObjects = []
    const curRelatedFromObectRels = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    const curRelatedToObectRels = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
    if (!debug) console.log('58 Context', curRelatedFromObectRels, curRelatedToObectRels);
        

    const includedKeysMain = ['id', 'name', 'description', 'propertyValues', 'valueset'];
    const objectPropertiesMain = Object.keys(curobject).filter(key => includedKeysMain.includes(key));

    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'typeRef', 'typeName', 'typeDescription','leftPorts',	
    'rightPorts','topPorts', 'bottomPorts', 'markedAsDeleted', 'modified',	'sourceUri',	'relshipkind','Associationvalueset','copiedFromId']

    const objectPropertiesMore = Object.keys(curobject).filter(key => includedKeysMore.includes(key));

    // const ovChildrenProperties = ovChildrenPropertiesList.reduce((a, b) => a.concat(b), [])
    // const objectProperties = Object.entries(curobject);

    let markdownString = ''
    markdownString += `### ${curobject.name}\n\n `
    markdownString += '**Name:**' + curobject.name + ' \n\n'
    markdownString += 'Description:  ***' + curobject.description + '*** \n\n'
    markdownString += objectPropertiesMain.map(key => (  
        `- ${key}:  ${curobject[key]} \n`
        // `| ${key}: | ${value} |\n`
        )).join('');
    markdownString += `\n\n <!-- ${JSON.stringify(curobject)} -->\n\n`

    const [activeTab, setActiveTab] = useState(0);

    const ObjDetailTable = ({ title, curRelatedObjsRels, selectedId, setSelectedId, curobject, objects, includedKeys, setObjview }) => {
      // curRelatedObjsRels are object for children or parents and relationships for to and from objects
      return (
        <>
        <table className="table w-100">
          <thead className="thead">
            <tr className="tr">
              <th className="th bg-light">{title}</th>
            </tr>
          </thead>
          <tbody>
            {curRelatedObjsRels.map(objrel => (
              <tr key={objrel.id}>
                <details key={objrel.id} open={objrel.id === selectedId} onToggle={() => setSelectedId(objrel.id)}>
                  <summary style={{ display: 'flex' }}>  
                    <span style={{ display: 'inline-block', width: '1.5em' }}>{objrel.id === selectedId ? '▼' : '▶'}</span>
                    { (title==='Children') 
                      ? <>
                          <span style={{ marginLeft: "6px" }}>{objrel.name}</span>
                          <span style={{ marginLeft: "126px" }}> </span>    
                          <span style={{ flex: 1, textAlign: 'right' }}>({curmm.objecttypes.find(ot => ot.id === objrel.typeRef)?.name})</span> 
                          <button style={{ marginLeft: "10px", border: "none", backgroundColor: "transparent", float: "right" }} onClick={() => setObjview(objects.find(o => o.id === objrel.id && o)) }>⤴️</button>


                        </>
                      : (title==='Related From') 
                        ? <>
                            <span>{curobject.name}</span>
                            <span style={{ marginLeft: "16px", marginRight: "16px" }}>{objrel.name}</span>
                            <span style={{ flex: 1, textAlign: 'right' }}>{objects.find(o => (o.id === objrel.toobjectRef)).name}</span>{/*  this is the relationships name  */}  
                            <span style={{ flex: 1, textAlign: 'right' }}>({curmm.objecttypes.find(ot => ot.id === objects.find(o => (o.id === objrel.toobjectRef)).typeRef)?.name})</span>            
                            <button style={{ marginLeft: "10px", border: "none", backgroundColor: "transparent", float: "right" }} onClick={() => setObjview(objects.find(o => o.id === objrel.toobjectRef && o)) }>⤴️</button>
                          </>
                        : <>
                            <span>{curobject.name}</span>
                            <span style={{ marginLeft: "16px", marginRight: "16px" }}>{objrel.name}</span>
                            <span style={{ flex: 1, textAlign: 'right' }}>{objects.find(o => (o.id === objrel.fromobjectRef) && o).name}</span>{/*  this is the relationships name  */}  
                            <span style={{ flex: 1, textAlign: 'right' }}>({curmm.objecttypes.find(ot => ot.id === objects.find(o => (o.id === objrel.toobjectRef)).typeRef)?.name})</span>            
   
                            <button style={{ marginLeft: "10px", border: "none", backgroundColor: "transparent", float: "right" }} onClick={() => setObjview(objects.find(o => o.id === objrel.fromobjectRef && o)) }>⤴️</button>
                          </> 
                    }
                  </summary>

                  {/* <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: '1.5em' }}>{obj.id === selectedId ? '▼' : '▶'}</span>
                          <span style={{ flex: 1, textAlign: 'left' }}>{obj.name}</span>
                          <span style={{ textAlign: 'right' }}>({curmm.relshiptypes.find(ot => ot.id === obj.typeRef)?.name})</span> 
                      </summary> */}
                  <table className="table w-100">
                    <thead className="thead"> 
                      <tr className="tr">
                        <th className="th">Property</th>
                        <th className="th">Value </th>
                        {/* <th className="th">Value {obj.name} - {curobject.name} -- {(objects.find(o => (curRelatedObjsRels.find(r => r.id === obj.fromobjectRef)).toobjectRef === o.id))}</th> */}
                        {/* <th className="th">
                          <span className="d-flex justify-content-end">
                            <button onClick={() => setObjview(objects.find(o => curRelatedObjsRels.find(r => r.id === o.toobjectRef && o))) }>⤴️</button>
                          </span>
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="tbody">
                      {Object.keys(objrel).map(
                        pv =>
                          includedKeys.includes(pv) && (
                            <tr className="tr" key={pv}>
                              <td className="td">{pv}</td>
                              <td className="td">{objrel[pv]}</td>
                              <td className="td"></td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </details>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      );
    };
  
    if (!state?.phUser?.appSkin?.visibleContext) {
      return (
        <>
            <div style={{ padding: "2px",border: '4px solid gray', width: '50vh' }} >
              <div style={{ marginBottom: "-28px", display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
                <button className="btn-sm m-0 px-1" onClick={() => dispatch({ type: 'SET_VISIBLE_CONTEXT', data: !state?.phUser?.appSkin?.visibleContext })}>X</button>
              </div>
              {/* <h1>{curobject.name}</h1> */}
              <Tabs  onSelect={index => setActiveTab(index)}>
                <TabList>
                  <Tab>Main</Tab>
                  <Tab >Additional</Tab>
                  {/* <Tab><FaPlaneArrival />Main</Tab>
                  <Tab ><FaCompass /></Tab> */}
                  <Tab>Markdown</Tab>
                </TabList>
                <TabPanel>
                  <h4 className="px-2">{curobject.name}                              
                    <span style={{ flex: 1, textAlign: 'right', float: "right" }}>({curmm.objecttypes.find(ot => ot.id ===curobject.typeRef)?.name})
                    {(parentobject) && <span > <button onClick={() => setObjview(parentobject)} > ⬆️</button> </span>}
                    </span>
                  </h4>      

                  <table className='w-100'>
                    <thead className="thead">
                      <tr className="tr">
                        <th className="th">Property</th>
                        <th className="th">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objectPropertiesMain.map(key => (
                        <tr className="tr" key={key}>
                          <td className="td">{key}</td>
                          <td className="td">{curobject[key]}</td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
    
                  <ObjDetailTable
                    title="Children"
                    curRelatedObjsRels={objectChildren}
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
                      {objectPropertiesMore.map(key => (
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
            </div>
          <hr style={{ backgroundColor: "#ccc", padding: "2px", marginTop: "2px", marginBottom: "0px" }} />
          <style jsx>{`
            // table {
            //   border-collapse: collapse;
            //   font-family: Arial, Helvetica, sans-serif;
            //   margin: 4px;
            //   padding: 4px;
            // }
            // table-fromto {
            //   display: flex;
            //   border-collapse: collapse;
            //   font-family: Arial, Helvetica, sans-serif;
            //   margin: 4px;
            //   padding: 4px;
            // }
            // thead{
            //   margin: 4px;
            //   padding: 4px;
            // }
            // tbody {
            //   margin: 4px;
            //   padding: 4px;
            // }  
            // th, td {
            //   border: 1px solid #ddd;
            //   padding: 8px;
            //   text-align: left;
            //   vertical-align: top;
            //   width: fit-content;
            // }

            // th  {
            //   background-color: #f2f2f2;
            // }

          `}
          </style>
        </>
      )
    } else {
      return <></>
    }

}
export default Context  