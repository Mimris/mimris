import React, { use, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { faSave } from '@fortawesome/free-solid-svg-icons';




function FormField(props: any) {
  const { label, id, value, options, handleEdit, handleSave } = props; // label is the field name, id is the "focusField" name, value is the focus id and name, options is the list of options(objects) for the field
  // console.log('8 FormField: ', label, id, value, options, props);

  const curfocus = options?.find((option: any) => option?.id === value?.id) || {value};

  console.log('10 FormField: ', label, curfocus, value, options);

  return (
    <div className="form-group row">
      <label htmlFor={id} className="col-sm-3 col-form-label">{label}:</label>
      <div className="col-sm-8">
        {(options?.length > 1) ? (
        <select className="form-control select-with-arrow" id={id} value={value} onChange={(event) => handleEdit(id, event.target.value)}> 
          <option value="">{curfocus?.name}</option>
          {/* <option value="">Select {label}</option> */}
          {options?.map((option: any) => (
            <option key={option?.id} value={option?.id}>{option?.name}</option>
          ))}
        </select>)
        : (
        <input type="text" className="form-control" id={id} value={curfocus?.name} onChange={(event) => handleEdit(id, event.target.value)} />  
        )
        }
      </div>
      <div className="col-sm-1 pt-1 px-0">
        {value && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSave(id, value, options)} data-toggle="tooltip" data-placement="top" title="Save">
            <i className="fas fa-save fa-fw"></i>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusParametersForm(props: any) {

  const [focusModel, setFocusModel] = useState(props.phFocus?.focusModel);
  const [focusModelview, setFocusModelview] = useState(props.phFocus?.focusModelview);
  const [focusObject, setFocusObject] = useState(props.phFocus?.focusObject);
  const [focusObjectview, setFocusObjectview] = useState(props.phFocus?.focusObjectview);
  const [focusOrg, setFocusOrg] = useState(props.phFocus?.focusOrg);
  const [focusProj, setFocusProj] = useState(props.phFocus?.focusProj);
  const [focusRole, setFocusRole] = useState(props.phFocus?.focusRole);
  const [focusTask, setFocusTask] = useState(props.phFocus?.focusTask);
  const [focusIssue, setFocusIssue] = useState(props.phFocus?.focusIssue);

  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const dispatch = useDispatch();
  console.log('20 FocusParametersForm: ', props, focusModel, focusModelview)
  const models = props.models;
  let curmod = models.find((model: any) => model.id === focusModel.id);
  const modelOptions = models.map((model: any) => ({ id: model.id, name: model.name }));
  const modelviews = curmod?.modelviews;
  const curmodelview = modelviews?.find((modelview: any) => modelview.id === focusModelview.id);
  let modelviewOptions = modelviews?.map((modelview: any) => ({ id: modelview.id, name: modelview.name }));
  const objects = curmod?.objects;
  const objectOptions = objects?.map((object: any) => ({ id: object.id, name: object.name }));
  const objectviews = curmodelview?.objectviews;
  const objectviewOptions = objectviews?.map((objectview: any) => ({ id: objectview.id, name: objectview.name }));

  console.log('30 FocusParametersForm: ', models, curmod, objectviews, objectviewOptions, props);

  const curmodRef = useRef(null);

  // const modelviewOptions = useRef<any[]>([]);

  useEffect(() => {
    const curmod = models.find((model: any) => model.id === focusModel.id);
    curmodRef.current = curmod;
    modelviewOptions.current = modelviews?.map((modelview: any) => ({ id: modelview.id, name: modelview.name }));
  }, [focusModel.id, models, modelviewOptions, modelviews]);

  function handleEdit(fieldName: string, fieldValue: any) { //
    console.log('68 handleEdit: ', fieldName, fieldValue);
    switch (fieldName) {
      case 'focusModel':
        setFocusModel(fieldValue);
        // setFocusModelview(null);
        break;
      case 'focusModelview':
        setFocusModelview(fieldValue);
        break;
      case 'focusObject':
        setFocusObject(fieldValue);
        break;
      case 'focusObjectview':
        setFocusObjectview(fieldValue);
        break;
      case 'focusOrg':
        setFocusOrg(fieldValue);
        break;
      case 'focusProj':
        setFocusProj(fieldValue);
        break;
      case 'focusRole':
        setFocusRole(fieldValue);
        break;
      case 'focusTask':
        setFocusTask(fieldValue);
        break;
      case 'focusIssue':
        setFocusIssue(fieldValue);
        break;
      default:
        break;
    }
  }

  function handleSave(fieldName: string, fieldId: any, options: any[]) {
    console.log('103 handleSave: ', fieldName, fieldId, options);
    const oName = options?.find((option) => option.id === fieldId)?.name;
    const actionType = `SET_FOCUS_${fieldName.slice(5,).toUpperCase()}`;
    const actionData = { id: fieldId, name: oName};

    console.log('130 handleSave: ', fieldName, fieldId, actionType, actionData);
    dispatch({ type: actionType, data: actionData });
    setIsEditing(false);
    setEditingField(null);
  }

  // function handleEditField(fieldName: string) {
  //   setIsEditing(true);
  //   setEditingField(fieldName);
  // }

  return (
    <form>
      <div className="context-list1 border-bottom border-dark">
        <h4>Current Context / Focus:</h4>
        <FormField label="Model" id="focusModel" value={focusModel} handleEdit={handleEdit} handleSave={handleSave} options={modelOptions} />
        <FormField label="Modelview" id="focusModelview" value={focusModelview} handleEdit={handleEdit} handleSave={handleSave} options={modelviewOptions} />
        <FormField label="Object" id="focusObject" value={focusObject} handleEdit={handleEdit} handleSave={handleSave} options={objectOptions} />
        <FormField label="Objectview" id="focusObjectview" value={focusObjectview} handleEdit={handleEdit} handleSave={handleSave} options={objectviewOptions} />
        <FormField label="Org" id="focusOrg" value={focusOrg} handleEdit={handleEdit} handleSave={handleSave} options= {[focusOrg]}/>  {/*Todo: options should be orgs (from where?)*/}
        <FormField label="Proj" id="focusProj" value={focusProj} handleEdit={handleEdit} handleSave={handleSave} options= {[focusProj]}/>  {/*Todo: options should be projs (from where?)*/}
        <FormField label="Role" id="focusRole" value={focusRole} handleEdit={handleEdit} handleSave={handleSave} options= {[focusRole]}/>  {/*Todo: options should be roles (from where?)*/}
        <FormField label="Task" id="focusTask" value={focusTask} handleEdit={handleEdit} handleSave={handleSave} options= {[focusTask]}/>  {/*Todo: options should be tasks (from where?)*/}
        <FormField label="Issue" id="focusIssue" value={focusIssue} handleEdit={handleEdit} handleSave={handleSave} options= {[focusIssue]}/>  {/*Todo: options should be issues (from github?)*/}

      </div>
    </form>
  );      
}

export default FocusParametersForm;






// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// // import { updateFormField } from './actions';

// function FormField(props) {
//     const { label, id, value, isEditing, setIsEditing, handleEdit, handleSave, options } = props;
  
//     return (
//       <div className="form-group row">
//         <label htmlFor={id} className="col-sm-3 col-form-label">{label}:</label>
//         <div className="col-sm-8">
//           {!isEditing ? (
//             <select className="form-control" id={id} value={value} onChange={(event) => handleEdit(id, event.target.value)}>
//               <option value="">Select {label}</option>
//               {options.map((option) => (
//                 <option key={option.id} value={option.id}>{option.name}</option>
//               ))}
//             </select>
//           ) : (
//             <input type="text" className="form-control" id={id} value={options.find((option) => option.id === value)?.name} readOnly />
//           )}
//         </div>
//         <div className="col-sm-1 pt-1 px-0">
//           {isEditing ? (
//             <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSave(id)} data-toggle="tooltip" data-placement="top" title="Save">
//               <i className="fas fa-save fa-fw"></i>
//             </button>
//           ) : (
//             <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsEditing(true)} data-toggle="tooltip" data-placement="top" title="Edit">
//               <i className="fas fa-edit fa-fw"></i>
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   }

// function FocusParametersForm(props) {
//     console.log('30 FocusParametersForm: ', props);
//   const [focusModel, setFocusModel] = useState(props.phFocus?.focusModel?.name);
//   const [focusModelview, setFocusModelview] = useState(props.phFocus?.focusModelview?.name);
//   const [focusObject, setFocusObject] = useState(props.phFocus?.focusObject?.name);
//   const [focusObjecttype, setFocusObjecttype] = useState(props.phFocus?.focusObjecttype?.name);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingField, setEditingField] = useState(null);
//   const dispatch = useDispatch();

//     const models = props.models 

//   function handleEdit(fieldName, fieldValue) {
//     switch (fieldName) {
//       case 'focusModel':
//         setFocusModel(fieldValue);
//         break;
//       case 'focusModelview':
//         setFocusModelview(fieldValue);
//         break;
//       case 'focusObject':
//         setFocusObject(fieldValue);
//         break;
//       default:
//         break;
//     }
//   }

//   function handleSave(fieldName) {
//     let fieldValue;
//     switch (fieldName) {
//       case 'focusModel':
//         fieldValue = focusModel;
//         break;
//       case 'focusModelview':
//         fieldValue = focusModelview;
//         break;
//       case 'focusObject':
//         fieldValue = focusObject;
//         break;
//     //   case 'wholeForm':
//     //     const actionData = {
//     //       focusModel: { id: focusModel, name: focusModel },
//     //       focusBrand: { id: focusModelview, name: focusModelview },
//     //     };
//     //     dispatch(updateFormField(actionData));
//     //     setIsEditing(false);
//     //     setEditingField(null);
//     //     return;
//       default:
//         break;
//     }
//     const actionType = `SET_FOCUS_${fieldName.toUpperCase()}`;
//     const actionData = { id: fieldValue, name: fieldValue };
//     dispatch({ type: actionType, data: actionData });
//     setIsEditing(false);
//     setEditingField(null);
//   }

//   function handleEditField(fieldName) {
//     setIsEditing(true);
//     setEditingField(fieldName);
//   }

//   return (
//     <form>
//       <div className="context-list1 border-bottom border-dark">
//         <h4>Current Context / Focus:</h4>
//         <FormField label="Model" id="focusModel" value={focusModel} isEditing={editingField === 'focusModel'} setIsEditing={setIsEditing} handleEdit={handleEdit} handleSave={handleSave} options={models} />
//         {/* <FormField label="Model" id="focusModel" value={focusModel} isEditing={isEditing} setIsEditing={setIsEditing} handleEdit={handleEdit} handleSave={handleSave} />
//         <FormField label="Modelview" id="focusModelview" value={focusModelview} isEditing={isEditing} setIsEditing={setIsEditing} handleEdit={handleEdit} handleSave={handleSave} />
//         <FormField label="Object" id="focusObject" value={focusObject} isEditing={isEditing} setIsEditing={setIsEditing} handleEdit={handleEdit} handleSave={handleSave} />
//         <FormField label="Objecttype" id="focusObjecttype" value={focusObjecttype} isEditing={isEditing} setIsEditing={setIsEditing} handleEdit={handleEdit} handleSave={handleSave} /> */}
//       </div>
//     </form>
//   );
// }

// export default FocusParametersForm;