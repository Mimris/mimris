
//@ts-nocheck
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector, useDispatch } from 'react-redux'
import { mainModule } from 'process';
import FieldDiv from './FieldDiv'
import SelectColor from './SelectColor'
import { colorOptions } from './data';
// import { update_objecttypeview_properties } from '../actions/actions'
// import { loadData, setFocusObject, setfocusSource, setFocusOrg, setFocusProj, setFocusRole, setFocusTask } from '../../actions/actions'

const EditProperties = (props) => {
  const debug = false
  if (debug) console.log('8 EditProperties', props);
  const dispatch = useDispatch()
  let edititem = props.item
  // console.log('27', edititem);

  const { register, handleSubmit, errors } = useForm()
  const [colorvalue, setColorvalue] = useState(props.item.fillcolor)
  const [strokecolorvalue, setStrokecolorvalue] = useState(props.item.strokecolor)
  const [strokewidthvalue, setStrokewidthvalue] = useState(props.item.strokewidth)
  const [iconvalue, setIconvalue] = useState(props.item.icon)
  // const otype = pprops.item.typeRef
  // console.log('25 EditProperties', props.item);
  // console.log('26 EditProperties', props.item.fillcolor, colorvalue);
  
  // let collection
  // if (!props.collection || !props.collection.length) {
  //   collection = [objects[1]]
  //   // console.log('27', collection);
  // } else {
  //   collection = props.collection
  // }

  useEffect((colorvalue) => {
    setColorvalue(colorvalue)
  }, [colorvalue]);

  const onSubmit = (e) => {
    
    const data = { ...edititem, ...e }
    if (debug) console.log('41 EditProperties', data, props.type);
    if (data && data.id) {
      dispatch({ type: props.type, data })
    }
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
  }
  const handleChangesc = (event) => {
    const scolor = event.target.value
    setStrokecolorvalue(scolor)
  }
  const handleChangesw = (event) => {
    const strw = event.target.value
    setStrokewidthvalue(strw)
  }
  const handleChangesicon = (event) => {
    const iconvalue= event.target.value
    // console.log('66 EditProperties', iconvalue); 
    setIconvalue(iconvalue)
  }

  function fieldDiv(p, curitem) {
    switch (p) {
      case 'fillcolor':
        return (
          <>
            <div key={curitem.id + p} className="field" >
              <label className="label mt-1" htmlFor="name">
                fillcolor
                <select className="sel ml-2" value={colorvalue} onChange={handleChangefc} >
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
                </select>
              </label>
              <span className="ml-1">colorcode :</span>
              <input className="input pt-1 float-right " onChange={handleChangefc} style={{backgroundColor: `${colorvalue}`}}
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                value={colorvalue}
                ref={register({ required: false })}
              />
            </div>
          </>
      )
      case 'strokecolor':
        return (
          <>
            <div key={curitem.id + p} className="field" >
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
                </select>
              </label>
              <span className="ml-0">color :</span>
              <input className="input pt-1 float-right " onChange={handleChangesc} style={{ backgroundColor: `${strokecolorvalue}` }}
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
            <div key={curitem.id + p} className="field" >
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
                </select>
              </label>
              <span className="ml-0">width :</span>
              <input className="input pt-1 float-right " onChange={handleChangesw}
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
        return (
          <>
            <div key={curitem.id + p} className="field" >
              <label className="label mt-1" htmlFor="name">
                {/* icon //: Currentvalue = {props.item.icon} <br/> */}
                icon
                <select className="selectpicker ml-2 float-right" value={iconvalue} onChange={handleChangesicon} >
                  {/* <option value={`${iconvalue}`}>Current</option> */}
                  <option value="https://img.icons8.com/color/2x/object.png">Object</option>
                  <option value="https://img.icons8.com/clouds/2x/services.png">Services</option>
                  <option value="https://img.icons8.com/color/2x/important-property.png">Important-property</option>
                  <option value="https://img.icons8.com/color/2x/urgent-property.png">Urgent-property</option>
                  <option value="https://img.icons8.com/color/2x/add-property-1.png">Property</option>
                  <option value="https://img.icons8.com/color/2x/information.png">Info</option>
                  <option value="https://img.icons8.com/color/2x/admin-settings-male.png">Role</option>
                  <option value="https://img.icons8.com/color/2x/task.png">Task</option>
                  <option value="https://img.icons8.com/color/2x/view-file.png">View</option>
                  <option value="https://img.icons8.com/cotton/72/tear-off-calendar.png">Event</option>
                  <option value="https://img.icons8.com/color/2x/rules-book.png">Rule</option>
                  <option value="https://img.icons8.com/color/2x/approve.png">Decision</option>
                  <option value="https://img.icons8.com/color/2x/energy-meter.png">Unittype</option>
                  <option value="https://img.icons8.com/color/2x/data-.png">Datatype</option>
                  <option value="https://img.icons8.com/color/2x/variable.png">Datavalue</option>
                  <option value="https://img.icons8.com/color/2x/person-male.png">Person</option>
                  <option value="https://img.icons8.com/color/search">Search</option>
                  <option value="analyse.png">Analyse.png</option>
                  <option value="automated.jfif">Inclusive.png</option>
                  <option value="book.png">Book.png</option>
                  <option value="car.png">Car.png</option>
                  <option value="default.png">Default.png</option>
                  <option value="exclusive.png">Exclusive.png</option>
                  <option value="inclusive.png">Inclusive.png</option>
                  <option value="info.svg">Info.svg</option>
                  <option value="parallel.png">Parallel.png</option>
                  <option value="task1.jfif">Task1.jfif</option>
                  <option value="tiger.svg">tiger.svg</option>
                </select>
              </label>
              <span className="ml-4">Url :</span>
              <input className="input pt-1 float-right" onChange={handleChangesicon}
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                value={iconvalue}
                ref={register({ required: false })}
                />
            </div>
            {/* <div><img src={iconvalue}/></div> */}
          </>
      )
    
        break; 
      default:
        return <FieldDiv key={curitem.id + p} p={p} curitem={curitem} register={register} errors={errors} />
        break;
      }
  }

  const fields = listAllProperties(edititem).map(p => // remove js prototype properties
    ((p.substring(0, 2) !== '__') && (p !== 'constructor') && (p !== 'hasOwnProperty') && (p !== 'isPrototypeOf') &&
      (p !== 'propertyIsEnumerable') && (p !== 'toString') && (p !== 'valueOf') && (p !== 'toLocaleString') && (p !== 'id') &&
      (p !== 'group') && (p !== 'isGroup') && (p !== 'propertyValues') && (p !== 'size') && (p !== 'properties') && 
      (p !== 'deleted') && (p !== 'modified') && (p !== 'objects') && (p !== 'relships') && (p !== 'modelviews') && (p !== 'objectviews') && 
      (p !== 'objecttypeviews') && (p !== 'relshiptypeviews') && (p !== 'pasteViewsOnly') && (p !== 'deleteViewsOnly') &&
      (p !== 'datatypes') && (p !== 'relshiptypes') && (p !== 'inputrels') &&(p !== 'outputrels') &&
      (p.slice(-3) !== 'Ref') &&
      (p !== 'unittypes') && (p !== 'objtypegeos') ) &&
      //  (p !== 'viewkind') && 
      (p !== 'relshipviews') && (p !== 'objecttypes')
      && p
  ).filter(Boolean)

  const fieldsDiv = fields?.map(f => (f) && fieldDiv(f, edititem))
  // console.log('223 EditProperties', fieldsDiv);

  const previewIcon =  (iconvalue) && (iconvalue.substring(0, 4) === 'http')
    ? <div className="ml-2"><img src={iconvalue} /></div>
    // : (iconvalue.includes('/')
    //   ? <div><img src={iconvalue} /></div>
      : <div><img src={`./../images/${iconvalue}`}/></div>

  return (
    <div className="edit bg-light">
      <div className="edit-dialog" >
        <form onSubmit={handleSubmit(onSubmit)}>
          {fieldsDiv}
          {previewIcon}
          <button className="btn-primary" type="submit">Save</button>
        </form>
      </div>
      <style jsx>{`
        .edit {
          font - family: sans-serif;
        }
          .field {
            display: flex;
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
            width: 70%;
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