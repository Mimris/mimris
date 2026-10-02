// EditProperties.tsx

// Gets all attributes on an selected objectview passed as "props.item" 
// and dispatch the edited values to "props.type" in phData

//@ts-nocheck
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector, useDispatch, useStore } from 'react-redux'
// import { mainModule } from 'process';
import FieldDiv from './FieldDiv'
import { selectIcons } from './selectIcons'
import { selectSharedUniverseState } from '../../sharedUniverse'
import { persistMemoryState } from '../utils/memoryStateStorage'
import * as uit from '../../akmm/ui_templates'
// import SelectColor from './SelectColor'
// import { colorOptions } from './data';

const EditProperties = (props) => {

  const debug = true // Temporarily enable debug for relshipview investigation
  if (debug) console.log('19 EditProperties', props);
  const dispatch = useDispatch()
  const store = useStore()
  let edititem = props.item
  // console.log('27', edititem);

  const { register, handleSubmit, errors, setValue } = useForm()
  const [colorvalue, setColorvalue] = useState(props.item.fillcolor)
  const [strokecolorvalue, setStrokecolorvalue] = useState(props.item.strokecolor)
  const [strokewidthvalue, setStrokewidthvalue] = useState(props.item.strokewidth)
  const [iconvalue, setIconvalue] = useState(props.item.icon)

  useEffect(() => {
    setColorvalue(props.item.fillcolor)
    setStrokecolorvalue(props.item.strokecolor)
    setStrokewidthvalue(props.item.strokewidth)
    setIconvalue(props.item.icon)
  }, [props.item])

  const onSubmit = (e) => { // dispatch the edititem to phData
    if (debug) console.log('[EditProperties] onSubmit called! e:', e, 'edititem:', edititem);
    // const data = e 
    if (debug) console.log('36 EditProperties', edititem, e, props.item);
    const data = { ...edititem, ...e }
    
    // Use state values if event doesn't contain them (event 'e' has the latest form values)
    // Prefer event values over state to avoid React state batching delays
    if (Object.prototype.hasOwnProperty.call(edititem, 'fillcolor')) {
      data.fillcolor = e.fillcolor !== undefined ? e.fillcolor : colorvalue;
    }
    if (Object.prototype.hasOwnProperty.call(edititem, 'strokecolor')) {
      data.strokecolor = e.strokecolor !== undefined ? e.strokecolor : strokecolorvalue;
    }
    if (Object.prototype.hasOwnProperty.call(edititem, 'strokewidth')) {
      data.strokewidth = e.strokewidth !== undefined ? e.strokewidth : strokewidthvalue;
    }
    if (Object.prototype.hasOwnProperty.call(edititem, 'icon')) {
      data.icon = e.icon !== undefined ? e.icon : iconvalue;
    }
    
    if (debug) console.log('[EditProperties] data after merge:', data, 'strokecolor:', data.strokecolor);
    if (debug) console.log('38 EditProperties', props, data);
    
    // CRITICAL: Update myMetis directly BEFORE dispatching (like "Set Objectview Colors" does)
    // This ensures both myMetis and Redux stay in sync, triggering immediate visual updates
    if (props.myMetis && (props.type === 'UPDATE_OBJECTVIEW_PROPERTIES' || props.type === 'UPDATE_RELSHIPVIEW_PROPERTIES')) {
      try {
        if (props.type === 'UPDATE_OBJECTVIEW_PROPERTIES') {
          const objview = props.myMetis.findObjectView(data.id);
          if (objview) {
            if (debug) console.log('[EditProperties] Updating myMetis objectview:', data.id, 'fillcolor:', data.fillcolor);
            if (data.fillcolor !== undefined) objview.fillcolor = data.fillcolor;
            if (data.strokecolor !== undefined) objview.strokecolor = data.strokecolor;
            if (data.strokewidth !== undefined) objview.strokewidth = data.strokewidth;
            if (data.icon !== undefined) objview.icon = data.icon;
            if (data.name !== undefined) objview.name = data.name;
            if (data.description !== undefined) objview.description = data.description;
            
            // Update corresponding GoJS model node if it exists
            if (props.myMetis.gojsModel && props.myMetis.gojsModel.nodes) {
              const node = props.myMetis.gojsModel.nodes.find((n: any) => 
                n.id === data.id || n.key === data.id || n.objviewRef === data.id
              );
              if (node) {
                if (data.fillcolor !== undefined) node.fillcolor = data.fillcolor;
                if (data.strokecolor !== undefined) node.strokecolor = data.strokecolor;
                if (data.strokewidth !== undefined) node.strokewidth = data.strokewidth;
                if (data.icon !== undefined) node.icon = data.icon;
              }
            }

            // The custom model and the live GoJS diagram are separate objects.
            // Updating only the former leaves the rendered ObjectView unchanged
            // until the model is rebuilt (for example, after a reload).
            const diagram = props.myMetis.myDiagram;
            if (diagram && data.icon !== undefined) {
              const diagramNodes: any[] = [];
              const addDiagramNode = (part: any) => {
                if (part && !diagramNodes.includes(part)) diagramNodes.push(part);
              };
              addDiagramNode(diagram.findNodeForKey?.(data.id));
              if (diagram.nodes?.each) {
                diagram.nodes.each((part: any) => {
                  const partData = part?.data;
                  if (
                    partData?.id === data.id ||
                    partData?.key === data.id ||
                    partData?.objviewRef === data.id ||
                    partData?.objectview?.id === data.id
                  ) addDiagramNode(part);
                });
              }

              // The focused ObjectView is the selected node in the properties
              // dialog. Use it when the generated key is unrelated to its id.
              if (diagramNodes.length === 0 && diagram.selection?.each) {
                diagram.selection.each((part: any) => {
                  if (part?.data?.category === 'Object' || part?.data?.objectview || part?.data?.objviewRef) {
                    addDiagramNode(part);
                  }
                });
              }
              if (diagramNodes.length === 0) {
                addDiagramNode(diagram.findPartForKey?.(props.myMetis.currentNode?.key));
              }

              diagramNodes.forEach((diagramNode) => {
                const diagramData = diagramNode?.data;
                if (!diagramData || !diagram.model?.setDataProperty) return;
                diagram.model.setDataProperty(diagramData, 'icon', data.icon);
                if (diagramData.objectview) diagramData.objectview.icon = data.icon;
                diagramNode.updateTargetBindings?.();
              });
              if (diagramNodes.length > 0) {
                diagram.updateAllTargetBindings?.('icon');
                uit.forceUpdateAllIconSources?.(diagram);
                diagram.requestUpdate?.();
              }
            }
          }
        } else if (props.type === 'UPDATE_RELSHIPVIEW_PROPERTIES') {
          const relview = props.myMetis.findRelshipView(data.id);
          console.log('[EditProperties] ==================== RELSHIPVIEW DISPATCH ====================');
          console.log('[EditProperties] data.id:', data.id);
          console.log('[EditProperties] data.strokecolor:', data.strokecolor);
          console.log('[EditProperties] Found relview:', !!relview);
          if (relview) {
            console.log('[EditProperties] Relview details:', { id: relview.id, name: relview.name, strokecolor: relview.strokecolor });
          }
          if (relview) {
            if (debug) console.log('[EditProperties] Updating myMetis relshipview:', data.id);
            if (data.strokecolor !== undefined) relview.strokecolor = data.strokecolor;
            if (data.strokewidth !== undefined) relview.strokewidth = data.strokewidth;
            if (data.name !== undefined) relview.name = data.name;
            if (data.description !== undefined) relview.description = data.description;
            
            // Update corresponding GoJS model link if it exists
            if (props.myMetis.gojsModel && props.myMetis.gojsModel.links) {
              const link = props.myMetis.gojsModel.links.find((l: any) => 
                l.id === data.id || l.key === data.id || l.relviewRef === data.id
              );
              console.log('[EditProperties] Searching gojsModel.links for link with id:', data.id);
              console.log('[EditProperties] Found link in gojsModel:', !!link);
              if (link) {
                console.log('[EditProperties] Link details:', { key: link.key, id: link.id, relviewRef: link.relviewRef, category: link.category });
                if (data.strokecolor !== undefined) link.strokecolor = data.strokecolor;
                if (data.strokewidth !== undefined) link.strokewidth = data.strokewidth;
              }
            }
          }
        }
      } catch (err) {
        console.error('[EditProperties] Error updating myMetis:', err);
      }
    }
    
    // Use diagram's wrapped dispatch if available (for immediate visual updates), otherwise use Redux dispatch
    const diagramDispatch = props.myMetis?.myDiagram?.dispatch;
    const dispatchToUse = diagramDispatch || dispatch;
    
    console.log('[EditProperties] Dispatching:', props.type, 'data.id:', data.id, 'data.strokecolor:', data.strokecolor, 'using:', diagramDispatch ? 'diagram.dispatch (wrapped)' : 'Redux dispatch (direct)');
    dispatchToUse({ type: props.type, data })
    
    // CRITICAL: Save to localStorage AFTER Redux reducer has time to update
    // Use setTimeout to ensure we capture the UPDATED state, not the old state
    setTimeout(() => {
      try {
        const state = selectSharedUniverseState(store.getState() as any)
        const persistedState = {
          phData: {
            domain: state.world.worldDefinition.domain,
            metis: state.world.worldModel.metis,
            documents: state.compatibility.documents,
          },
          phFocus: state.world.focus,
          phUser: state.user,
          phSource: state.source,
        }
        persistMemoryState(persistedState)
      } catch (_) {}
    }, 100); // Small delay allows Redux reducer to complete
  }

  function listAllProperties(o) { // list all obj properties incl prototype properties
    var objectToInspect;
    var result = [];
    for (objectToInspect = o; objectToInspect !== null;
      objectToInspect = Object.getPrototypeOf(objectToInspect)) {
      result = result.concat(
        Object.getOwnPropertyNames(objectToInspect)
      );
    }
    return result;
  }

  const handleChangefc = (event) => {
    const color = event.target.value
    setColorvalue(color)
    setValue('fillcolor', color)  // Update react-hook-form immediately
  }
  const handleChangesc = (event) => {
    const scolor = event.target.value
    setStrokecolorvalue(scolor)
    setValue('strokecolor', scolor)  // Update react-hook-form immediately
  }
  const handleChangesw = (event) => {
    const strw = event.target.value
    setStrokewidthvalue(strw)
    setValue('strokewidth', strw)  // Update react-hook-form immediately
  }
  const handleChangesicon = (event) => {
    const iconvalue= event.target.value
    setIconvalue(iconvalue)
    setValue('icon', iconvalue)  // Update react-hook-form immediately
  }

  const fields1 = listAllProperties(edititem).map(p => // filter away js prototype properties and some others
    ( (p.substring(0, 2) !== '__') && (p !== 'constructor') && (p !== 'hasOwnProperty') && (p !== 'isPrototypeOf') &&
      (p !== 'propertyIsEnumerable') && (p !== 'toString') && (p !== 'valueOf') && (p !== 'toLocaleString') && 
      // (p !== 'id') &&
      (p !== 'group') && (p !== 'isGroup') && (p !== 'propertyValues') && (p !== 'size') && (p !== 'properties') && 
      // (p !== 'deleted') && (p !== 'modified') && 
      (p !== 'objects') && (p !== 'relships') && (p !== 'modelviews') && (p !== 'objectviews') && 
      (p !== 'objecttypeviews') && (p !== 'relshiptypeviews') && (p !== 'pasteViewsOnly') && (p !== 'deleteViewsOnly') &&
      (p !== 'datatypes') && (p !== 'relshiptypes') && (p !== 'inputrels') &&(p !== 'outputrels') &&
      // (p.slice(-3) !== 'Ref') &&
      (p !== 'unittypes') && (p !== 'objtypegeos') ) &&
      //  (p !== 'viewkind') && 
      (p !== 'relshipviews') && (p !== 'objecttypes')
      && p // and return the rest
    ).filter(Boolean)

    const fields = fields1.map(f => {
      if (f.slice(-3) === 'Ref') {
        return props.curobj?.models?.find(m => m.name && (m.id === f))
      } else {
        return f
      }
    }).filter(Boolean)

  const fieldsDiv = fields?.map(f => (f) && fieldDiv(f, edititem))
  if (debug) console.log('100 EditProperties',  props.item, edititem, fields1, fields,  fieldsDiv);

  function fieldDiv(p, curitem) {
    switch (p) {
      case 'fillcolor':
        return (
          <div >
            <div key={curitem.id + p} className="field d-flex mr-1 float-right" >
              <label className="label mt-1" htmlFor="name">
                fillcolor
                <select className="input ml-3" value={colorvalue} onChange={handleChangefc} >
                  <option value={`${colorvalue}`}>Select ...</option>
                  <option value="transparent">transparent</option>
                  <option value="lightgray">Gray</option>
                  <option value="white">White</option>
                  <option value="#ffaaaa">Red</option>
                  <option value="lightblue">Blue</option>
                  <option value="lightgreen">Green</option>
                  <option value="lightyellow">Yellow</option>
                  <option value="#D58181">Brown</option>
                  <option value="#e8bfd3">Purple</option>
                  <option value="orange">Orange</option>
                </select> colorcode :
              </label>     
              <input className="input pt-0 mt-1 mb-3" onChange={handleChangefc} style={{backgroundColor: `${colorvalue}`}}
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                value={colorvalue}
                ref={register({ required: false })}
              />
            </div>
          </div>
      )
      case 'strokecolor':
        return (
          <>
            <div key={curitem.id + p} className="field d-flex mr-1 float-right"  >
              <label className="label mt-1" htmlFor="name">
                strokecolor
                <select className="sel ml-2" value={strokecolorvalue} onChange={handleChangesc} >
                  <option value={`${strokecolorvalue}`}>Select ...</option>
                  <option value="transparent">transparent</option>
                  <option value="gray">Gray</option>
                  <option value="white">White</option>
                  <option value="#ff0000">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="#D58181">Brown</option>
                  <option value="#e8bfd3">Purple</option>
                  <option value="orange">Orange</option>
                </select> color :
              </label>
              <input className="input pt-0 mt-1 mb-3" onChange={handleChangesc} style={{ backgroundColor: `${strokecolorvalue}` }}
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                // defaltValue={colorvalue}
                value={strokecolorvalue}
                ref={register({ required: false })}
              />
            </div>
          </>
      )
      case 'strokewidth':
        return (
          <>
            <div key={curitem.id + p} className="field d-flex mr-1 float-right"  >
              <label className="label mt-1" htmlFor="name">
                strokewidth
                <select className="sel ml-2" value={strokewidthvalue} onChange={handleChangesw} >
                  <option value={strokewidthvalue}>Current</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={7}>7</option>
                </select> width :
              </label>

              <input className="input pt-0 mt-1 mb-3" onChange={handleChangesw}
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                // defaltValue={colorvalue}
                value={strokewidthvalue}
                ref={register({ required: false })}
              />
            </div>
          </>
      )
      case 'icon':

        if (debug) console.log('188',
         selectIcons(curitem, p, iconvalue, register, handleChangesicon)
         );
        return (selectIcons(curitem, p, iconvalue, register, handleChangesicon))
        break; 
      default:
        return <FieldDiv key={curitem.id + p} p={p} curitem={curitem} register={register} errors={errors} />
        break;
      }
  }

  const previewIcon =  (iconvalue) && (iconvalue.substring(0, 4) === 'http') // preview choosen icon can be localserver-icon or link
    ? <div className="ml-2"><img src={iconvalue} /></div>
    // : (iconvalue.includes('/')
    // ? <div><img src={iconvalue} /></div>
    : <div ><img src={`./../images/${iconvalue}`}/></div>

  return (
    <div className="edit bg-light">
      <div className="edit-dialog" >
        <form onSubmit={handleSubmit(onSubmit)}>
          {fieldsDiv}
          <span  className="img float-left">{previewIcon}</span>
          <button className="btn-primary bg-secondary" type="submit">Save</button>
        </form>
      </div>
      <style jsx>{`
        .edit {
          font - family: sans-serif;
        }
        .field {
          align-items: center;
          // margin-bottom: 5px;
          width: 100%;
        }
        .field label {
          // color: green;
          display: inline-block;
          width: 25%;
          text-align: right;
          margin-right: 3px;
          margin-top: 3px;
        }
        .field input {
          // color: green;
          display: inline-block;
          width: 75%;
          hight: 10px;
          margin-left: 2px;
          margin-right: 3px;
          padding-top: 0px;
        }
        .field .error {
          color: red;
          margin-left: 3px;
          font-size: 0.8em;
          width: 100px;
        }
        form button[type="submit"] {  
          margin-top: 5px;
          // margin-left: 2px;
          width: 100%;
        }

        form button.add {
          margin: 0px 0px 10px 73px;
        }

        form button.remove {
          margin-left: 5px;
        }
      `}</style>
    </div>
  )
}

export default EditProperties



//   < form onSubmit = { handleSubmit(onSubmit) } >
//     <table className="table bg-muted">
//       <tbody>

//         <tr><td>Name</td>
//           <td className="input-id w-5 ">
//             <input className="input float-right"
//               style={{ width: "100%" }}
//               type="text"
//               placeholder={name}
//               // value={name}
//               name="name"
//               ref={register({ required: true, minLength: { value: 4, message: 'Too short' } })}
//             />
//           </td>
//         </tr>
//         {/* <td className="input-comments ">{description}
//                 <textarea className="input" style={{ width: "100%" }} rows="2" cols="25" type="text" placeholder="description" name="description" ref={register({ maxLength: 255 })} />
//               </td> */}
//         <tr><td className="longline" colSpan="2"> <span style={{ fontSize: "0.8em" }}>{id}</span></td></tr>
//         {/* <tr><td>External id:</td><td>{externalID}</td></tr> */}
//         {/* <span>JournalID: {journalID}</span>  <br /> */}
//         <tr><td>Id:</td>
//           <td className="input-id w-5 ">
//             <input className="input float-right"
//               style={{ width: "100%" }}
//               type="text"
//               placeholder='id'
//               value={id}
//               name="id"
//               ref={register({ required: true, minLength: { value: 8, message: 'Too short' } })}
//             />
//           </td>
//         </tr>
//       </tbody>
//     </table>
// { errors.id && <p>{errors.id.message}</p> }
// <p></p>
//   <input className="btn text-light bg-dark" type="submit" style={{ width: "100%" }} />
//         </form >








//@ts-snocheck
// import { useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { useSelector, useDispatch } from 'react-redux'
// import { mainModule } from 'process';
// import FieldDiv from './FieldDiv'
// // import { update_objecttypeview_properties } from '../actions/actions'
// // import { loadData, setFocusObject, setfocusSource, setFocusOrg, setFocusProj, setFocusRole, setFocusTask } from '../../actions/actions'

// const EditProperties = (props) => {

//   const dispatch = useDispatch()
//   let edititem = props.item
//   console.log('27 EditProperties', props, edititem);

//   const { register, handleSubmit, errors } = useForm()

//   // let collection
//   // if (!props.collection || !props.collection.length) {
//   //   collection = [objects[1]]
//   //   // console.log('27', collection);
//   // } else {
//   //   collection = props.collection
//   // }

//   const onSubmit = (e) => {
//     // console.log('29 EditProperties', e);
//     const data = { ...edititem, ...e }
//     console.log('31 EditProperties', e, props.type, data);
//     if (data && data.id) {
//       // console.log('49', props.type);
//       dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data })
//     }
//   }

//   function listAllProperties(o) { // list all obj properties incl prototype properties
//     var objectToInspect;
//     var result = [];
//     for (objectToInspect = o; objectToInspect !== null;
//       objectToInspect = Object.getPrototypeOf(objectToInspect)) {
//       result = result.concat(
//         Object.getOwnPropertyNames(objectToInspect)
//       );
//     }
//     return result;
//   }

//   // function fieldDiv(p, curitem) {
//   //   console.log('51 EditProperties', p, curitem);
//   //   const fdiv = <FieldDiv p={p} curitem={curitem} register={register} errors={errors} />
//   //   console.log('51 EditProperties', fdiv);
//   //   return fdiv
//   //   // return <FieldDiv p={p} curitem={curitem} curobj={props.curobj} register={register} errors={errors} /> 
//   // }

//   const fields = listAllProperties(edititem).map(p => // remove js prototype properties
//     ((p.slice(-3) !== 'Ref') && (p.substring(0, 2) !== '__') && (p !== 'constructor') && (p !== 'hasOwnProperty') && (p !== 'isPrototypeOf') &&
//       (p !== 'propertyIsEnumerable') && (p !== 'toString') && (p !== 'valueOf') && (p !== 'toLocaleString') && (p !== 'id') &&
//       (p !== 'description') && (p !== 'isGroup') && (p !== 'loc') && (p !== 'deleted')  &&
//       (p !== 'group') && (p !== 'propertyValues') && (p !== 'size')) && p
//   ).filter(Boolean)

//   // const fieldsDiv = fields?.map(f => fieldDiv(f, edititem))
//   // console.log('65 EditProperties', fieldDiv(fields[0], edititem));
//   // console.log('66 EditProperties', fieldsDiv);
//   const fieldsDiv = fields?.map(p =>
//     < form onSubmit = { handleSubmit(onSubmit) } >
//       <div className="field"  >
//         {/* <div className="field" style={{ backgroundColor: "blue" }} > */}
//         <label className="label " htmlFor="name">{`${p}`}</label>
//         <input className="input pt-1 float-right "
//           type="text"
//           id={`${p}`}
//           name={`${p}`}
//           // placeholder={`${props.curitem.p}`}
//           defaultValue={`${edititem.p}`}
//           // defaultValue={`${props.curitem[props.p]}`}
//           ref={props.register({ required: true } )}
//         // style={{ backgroundColor: equal ? "ffcccc" : "white" }}
//         />
//         {props.errors.name && props.errors.name.type === "required" && (
//           <div className="error">Your must enter the name.</div>
//         )}
//         {/* {props.errors.name && props.errors.name.equal === false && (
//           <div className="error">Object name and ObjectView name must be equal.</div>
//         )} */}
//       </div>
//       <button className="btn-primary" type="submit">Save</button>
//         </form >
//   )
//   return (
//     <div className="edit bg-light">
//       <div className="edit-dialog" >
//         {fieldsDiv}
//       </div>
//       <style jsx>{`
//         .edit {
//           font - family: sans-serif;
//         }
//       .field {
//             display: flex;
//             align-items: center;
//             // margin-bottom: 5px;
//             width: 100%;
//           }
//           .field label {
//             // color: green;
//             display: inline-block;
//             width: 25%;
//             text-align: right;
//             margin-right: 3px;
//             margin-top: 3px;
//           }
//           .field input {
//             // color: green;
//             display: inline-block;
//             width: 75%;
//             margin-left: 2px;
//             margin-right: 3px;
//             padding-top: 0px;
//           }
//           .field .error {
//             color: red;
//             margin-left: 3px;
//             font-size: 0.8em;
//             width: 100px;
//           }
//         form button[type="submit"] {
          
//           margin-top: 5px;
//           // margin-left: 2px;
//           width: 100%;
//         }

//         form button.add {
//           margin: 0px 0px 10px 73px;
//         }

//         form button.remove {
//           margin-left: 5px;
//         }
//       `}</style>
//     </div>
//   )
// }

// export default EditProperties



//   < form onSubmit = { handleSubmit(onSubmit) } >
//     <table className="table bg-muted">
//       <tbody>

//         <tr><td>Name</td>
//           <td className="input-id w-5 ">
//             <input className="input float-right"
//               style={{ width: "100%" }}
//               type="text"
//               placeholder={name}
//               // value={name}
//               name="name"
//               ref={register({ required: true, minLength: { value: 4, message: 'Too short' } })}
//             />
//           </td>
//         </tr>
//         {/* <td className="input-comments ">{description}
//                 <textarea className="input" style={{ width: "100%" }} rows="2" cols="25" type="text" placeholder="description" name="description" ref={register({ maxLength: 255 })} />
//               </td> */}
//         <tr><td className="longline" colSpan="2"> <span style={{ fontSize: "0.8em" }}>{id}</span></td></tr>
//         {/* <tr><td>External id:</td><td>{externalID}</td></tr> */}
//         {/* <span>JournalID: {journalID}</span>  <br /> */}
//         <tr><td>Id:</td>
//           <td className="input-id w-5 ">
//             <input className="input float-right"
//               style={{ width: "100%" }}
//               type="text"
//               placeholder='id'
//               value={id}
//               name="id"
//               ref={register({ required: true, minLength: { value: 8, message: 'Too short' } })}
//             />
//           </td>
//         </tr>
//       </tbody>
//     </table>
// { errors.id && <p>{errors.id.message}</p> }
// <p></p>
//   <input className="btn text-light bg-dark" type="submit" style={{ width: "100%" }} />
//         </form >
