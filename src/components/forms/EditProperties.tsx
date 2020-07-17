
//@ts-nocheck
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector, useDispatch } from 'react-redux'
import { mainModule } from 'process';
import FieldDiv from './FieldDiv'
import SelectColor from './SelectColor'
import { colorOptions } from './data';
// import { update_objecttypeview_properties } from '../actions/actions'
// import { loadData, setFocusObject, setfocusSource, setFocusOrg, setFocusProj, setFocusRole, setFocusTask } from '../../actions/actions'

const EditProperties = (props) => {

  // console.log('8 EditProperties', props);
  const dispatch = useDispatch()
  let edititem = props.item
  // console.log('27', edititem);

  const { register, handleSubmit, errors } = useForm()
  const [colorvalue, setColorvalue] = useState(props.item.fillcolor)
  const [strokecolorvalue, setStrokecolorvalue] = useState(props.item.strokecolor)
  const [strokewidthvalue, setStrokewidthvalue] = useState(props.item.strokewidth)
  const [iconvalue, setIconvalue] = useState(props.item.iconvalue)
  console.log('25 EditProperties', iconvalue);
  
  // let collection
  // if (!props.collection || !props.collection.length) {
  //   collection = [objects[1]]
  //   // console.log('27', collection);
  // } else {
  //   collection = props.collection
  // }

  const onSubmit = (e) => {
    const data = { ...edititem, ...e }
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
    const strokewidth = event.target.value
    setStrokewidthvalue(strokewidth)
  }
  const handleChangesicon = (event) => {
    const iconvalue= event.target.value
    console.log('66 EditProperties', iconvalue);
    
    setIconvalue(iconvalue)
  }

  function fieldDiv(p, curitem) {
    switch (p) {
      case 'snorre':

      case 'fillcolor':
        return (
          <>
            <div className="field" >
              <label className="label ml-5" htmlFor="name">
                fillcolor
                <select className="sel ml-2" value={colorvalue} onChange={handleChangefc} >
                  <option value={`${colorvalue}`}>Current</option>
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
              <input className="input pt-1 float-right "
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                // defaltValue={colorvalue}
                value={colorvalue}
                ref={register({ required: false })}
              />
            </div>
          </>
      )
      case 'strokecolor':
        return (
          <>
            <div className="field" >
              <label className="label ml-5" htmlFor="name">
                strokecolor
                <select className="sel ml-2" value={strokecolorvalue} onChange={handleChangesc} >
                  <option value={`${strokecolorvalue}`}>Current</option>
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
              <input className="input pt-1 float-right "
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
            <div className="field" >
              <label className="label ml-5" htmlFor="name">
                strokewidth
                <select className="sel ml-2" value={strokewidthvalue} onChange={handleChangesw} >
                  <option value={`${strokewidthvalue}`}>Current</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </label>
              <input className="input pt-1 float-right "
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
            <div className="field" >
              <label className="label ml-5" htmlFor="name">
                icon
                <select className="selectpicker ml-2" value={iconvalue} onChange={handleChangesicon} >
                  <option value={`${iconvalue}`}>Current</option>
                  <option value="default.png">Default.png</option>
                  <option value="book.png">Book.png</option>
                  <option value="person.png">Person.png</option>
                  <option value="analyse.png">Analyse.png</option>
                  <option value="task1.jfif">Task1.jfif</option>
                  <option value="parallel.png">Parallel.png</option>
                  <option value="exclusive.png">Exclusive.png</option>
                  <option value="inclusive.png">Inclusive.png</option>
                  <option value="automated.jfif">Inclusive.png</option>
                  <option value="car.png">Car.png</option>
                </select>
              </label>
              <input className="input pt-1 "
                type="text"
                id={`${curitem.id}+${p}`}
                name={`${p}`}
                // defaltValue={colorvalue}
                value={iconvalue}
                ref={register({ required: false })}
              />
            </div>
          </>
      )
    
        break; 
      default:
        return <FieldDiv key={curitem.id + p} p={p} curitem={curitem} register={register} errors={errors} />
        break;
      }
  }

  const fields = listAllProperties(edititem).map(p => // remove js prototype properties
    ((p.slice(-3) !== 'Ref') && (p.substring(0, 2) !== '__') && (p !== 'constructor') && (p !== 'hasOwnProperty') && (p !== 'isPrototypeOf') &&
      (p !== 'propertyIsEnumerable') && (p !== 'toString') && (p !== 'valueOf') && (p !== 'toLocaleString') && (p !== 'id') &&
      (p !== 'group') && (p !== 'propertyValues') && (p !== 'size') && (p !== 'properties') && (p !== 'deleted')) && p
  ).filter(Boolean)

  const fieldsDiv = fields?.map(f => fieldDiv(f, edititem))
  console.log('61 EditProperties', fieldsDiv);

  return (
    <div className="edit bg-light">
      <div className="edit-dialog" >
        <form onSubmit={handleSubmit(onSubmit)}>
          {fieldsDiv}
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
            width: 75%;
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