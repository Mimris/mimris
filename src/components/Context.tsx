
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
    
    const curobjectview = curobjectviews.find(ov => ov.id === focusObjectview?.id)
    let objectviewChildren = []
    let objectChildren = []
    if (!curobjectview) { 
      console.log(`objectview for ${focusObjectview.id} - ${focusObjectview.name} not found`);
    } else { // find children
      objectviewChildren = curobjectviews.filter(ov => ov.group === curobjectview.id)
      objectChildren = objectviewChildren.map(ov => objects.find(o => o.id === ov.objectRef))
      if (!debug) console.log('51 Context', curobjectview, objectviewChildren);
    }
    // find objectchildren

    const curobject = objects?.find(o => o.id === focusObject?.id)  // find focusObject in objects 
    console.log('81 curobject', curobject)
    
    if (!curobject) return <>no current object</>
    // find parent object
    const parent = objects?.find(o => o.id === curobject?.parentRef)

    let relatedObjects = []
    const curRelatedFromObects = currelationships?.filter(r => r?.fromobjectRef === curobject?.id)
    if (!debug) console.log('58 Context', curRelatedFromObects);

    const curRelatedToObects = currelationships?.filter(r => r?.toobjectRef === curobject?.id)
        

    const includedKeysMain = ['id', 'name', 'description', 'propertyValues', 'valueset', 'typeName', 'typeDescription'];
    const objectPropertiesMain = Object.keys(curobject).filter(key => includedKeysMain.includes(key));

    const includedKeysMore = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'typeRef', 'leftPorts',	
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
    // console.log('114 ', objectviewChildren)
    // objectviewChildren.map(ov => (
    //   Object.keys(ov).filter(key => includedKeysMain.includes(key)).map(pv => (
    //     console.log('', pv,  ov[pv])
    //   ))
    // ))

    // console.log('123 ',objectviewChildren.map(ov => (
    //   objects.find(o => (o.id === ov.objectRef) && o)
    // )))

    // const tableDiv = (obj) => {

    //   return (
    //     <table > {/* From relships */}
    //       <tbody>
    //         <tr>
    //           <th> </th>
    //           <th>Relship</th>
    //           <th>To</th>

    //         </tr>
    //         {obj.map(r => (
    //           <tr key={r.id}>
    //             <td>{objects.find(o => o.id === r.fromobjectRef)?.name}</td>
    //             <td>{r.name}</td>
    //             <td>{objects.find(o => o.id === r.toobjectRef)?.name}</td>
    //           </tr>
    //         ))}
    //       </tbody>
    //     </table>
    //   )
    // }

        

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
                  <h3>{curobject.name}</h3>
                  <table >
                    <thead>
                      <tr>
                        <th >Property</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objectPropertiesMain.map(key => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{curobject[key]}</td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                  <table > {/*Children */}
                    <thead>
                      <tr>
                        <th >Children</th>
                        {/* <th>Value</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      { objectChildren.map(obj => (
                        <tr key={obj.id}>
                          <details key={obj.id}   open={obj.id === selectedId}  onToggle={() =>  setSelectedId(obj.id) }>
                            <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'inline-block', width: '1.5em' }}>{obj.id === selectedId ? '▼' : '▶'}</span>
                              <span style={{ flex: 1, textAlign: 'left' }}>{obj.name}</span>
                              <span style={{ textAlign: 'right' }}>({curmm.objecttypes.find(ot => ot.id === obj.typeRef)?.name})</span>
                            </summary>
                            <table >
                              <thead>
                                <tr>
                                  <th >Property</th>
                                  <th>Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* {Object.keys(ov).filter(key => includedKeysMain.includes(key)).map(pv => ( */}
                                {Object.keys(obj).map(pv => (
                                  (includedKeysMain.includes(pv)) && (
                                  <tr key={pv}>
                                    <td>{pv}</td>
                                    <td>{obj[pv]}</td>
                                  </tr>
                                )))}
                              </tbody>
                            </table>
                          </details>
                        </tr>
                      ))}
                      {/* {tableDiv(curRelatedFromObects)} */}                
                    </tbody>
                  </table>
                  <table > {/* From relships */}
                    <thead>
                      <tr>
                        <th >From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curRelatedFromObects.map(r => (
                        <tr key={r.id}>
                          <details key={r.id}   open={r.id === selectedId}  onToggle={() => setSelectedId(r.id) }  >
              
                            <summary >
                              {/* <span >{r.id === selectedId ? '▼' : '▶'}</span> */}
                              <span >{curobject.name}</span>
                              <span style={{  marginLeft: "16px"}}>{r.name}</span>
                              {/* <span style={{ flex: 1, textAlign: 'left', marginLeft: "6px"}}>({curmm.relshiptypes.find(ot => ot.id === r.typeRef)?.name})</span> */}
                              <span style={{  marginLeft: "16px"}}>{objects.find(o => o.id === r.toobjectRef)?.name}</span>
                            </summary>
                            <thead>
                              <tr>
                                <th >Property</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* {Object.keys(ov).filter(key => includedKeysMain.includes(key)).map(pv => ( */}
                              {Object.keys(r).map(pv => (
                                (includedKeysMain.includes(pv)) && (
                                <tr key={pv}>
                                  <td>{pv}</td>
                                  <td>{r[pv]}</td>
                                </tr>
                              )))}
                            </tbody>
                          </details>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <table > {/* To relships */}
                    <thead>
                      <tr>
                        <th >To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curRelatedToObects.map(obj => (
                        <tr key={obj.id}>
                        <details key={obj.id}   open={obj.id === selectedId}  onToggle={() =>  setSelectedId(obj.id) }>
                          <summary>
                            {/* <span style={{ display: 'inline-block', width: '1.5em' }}>{obj.id === selectedId ? '▼' : '▶'}</span> */}
                            <span >{curobject.name}</span>
                            <span style={{ marginLeft: "16px"}} >{obj.name}</span>
                            <span style={{ marginLeft: "16px"}}>{objects.find(o => o.id === obj.fromobjectRef)?.name}</span>
             
                          </summary>

                          <table >
                            <thead>
                              <tr>
                                <th >Property</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* {Object.keys(ov).filter(key => includedKeysMain.includes(key)).map(pv => ( */}
                              {Object.keys(obj).map(pv => (
                                (includedKeysMain.includes(pv)) && (
                                <tr key={pv}>
                                  <td>{pv}</td>
                                  <td>{obj[pv]}</td>
                                </tr>
                              )))}
                       </tbody>
                       
                     </table>
                     
                   </details>
                 </tr>
                 ))}
                    </tbody>
                  </table>
                  
                </TabPanel>
                <TabPanel>
                <table >
                    <thead>
                      <tr>
                        <th >Property</th>
                        <th>Value</th>
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
            table {
              border-collapse: collapse;
              width: 99%;
              font-family: Arial, Helvetica, sans-serif;
              margin: 4px;
              padding: 4px;
            }

            tbody {
              margin: 4px;
              padding: 4px;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              vertical-align: top;
              width: auto;
            }
            
            th {
              background-color: #f2f2f2;
            }
          `}
          </style>
        </>
      )
    } else {
      return <></>
    }

}
export default Context  