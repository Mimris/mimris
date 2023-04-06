
import React, { useContext, useState } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useSelector, useDispatch } from 'react-redux'

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";


import Selector from './utils/Selector'

import 'react-tabs/style/react-tabs.css';

const debug = false

const Context = (props) => {

    let state = useSelector((state:any) => state) // Selecting the whole redux store

    console.log('19 context', props, state)

    if (!state.phData?.metis?.models) return <></>



    const dispatch = useDispatch()

    const [value, setValue] = useState("");
  
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
    // const objectviews = curmodel?.objectviews //.map((o: any) => o)
    
    // find object with type
    const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews || []
    // if (debug) console.log('25 Sel', curmodel, modelviews, objects, objectviews);
    
    // remove duplicate objects
    const uniqueovs = objectviews?.filter((ov, index, self) =>
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
    
    const curobject = objects?.find(o => o.id === focusObject?.id)  // find focusObject in objects 
    console.log('81 curobject', curobject)
    
    if (!curobject) return <>no current object</>
    // find parent object
    const parent = objects?.find(o => o.id === curobject?.parentRef)

    const excludedKeysMain = ['category', 'generatedTypeId', 'nameId', 'copedFromId', 'abstract', 'typeRef', 'leftPorts',	
      'rightPorts','topPorts', 'bottomPorts', 'markedAsDeleted', 'modified',	'sourceUri',	'relshipkind','Associationvalueset','copiedFromId']
    const objectPropertiesMain = Object.keys(curobject).filter(key => !excludedKeysMain.includes(key));
    const excludedKeysMore = ['description', 'typeName', 'typeDescription', 'proprtyValues', 'valueset']
    const objectPropertiesMore = Object.keys(curobject).filter(key => !excludedKeysMore.includes(key));


    // const objectProperties = Object.entries(curobject);

    // const markdownString = objectProperties.map(([key, value]) => (
    //   `**${key}:** ${value}\n`
    // )).join('');
    let markdownString = ''

    // write the object as json into the markdown comment
    markdownString += `### ${curobject.name}\n\n `
    // markdownString += `| Property | Value |\n `
    // markdownString += `| --- | ----------|\n `
    markdownString += '**Name:**' + curobject.name + ' \n\n'
    markdownString += 'Description:  ***' + curobject.description + '*** \n\n'

    markdownString += objectPropertiesMain.map(key => (  
        `- ${key}:  ${curobject[key]} \n`
        // `| ${key}: | ${value} |\n`
        )).join('');
        
    markdownString += `\n\n <!-- ${JSON.stringify(curobject)} -->\n\n`

        
    const [activeTab, setActiveTab] = useState(0);

    if (!state?.phUser?.appSkin?.visibleContext) {
      return (
        <>
            <div style={{ minHeight: 'h', width: '50vh' }} >
              {/* <h1>{curobject.name}</h1> */}
              <Tabs  onSelect={index => setActiveTab(index)}>
                <TabList>
                  <Tab>Main</Tab>
                  <Tab>More</Tab>
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
              width: 100%;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
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