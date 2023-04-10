import React, { useState } from 'react';
import { useDispatch } from 'react-redux';



function FormField(props) {
  const { label, id, value, options, handleEdit, handleSave } = props;

  return (
    <div className="form-group row">
      <label htmlFor={id} className="col-sm-3 col-form-label">{label}:</label>
      <div className="col-sm-8">
        <select className="form-control" id={id} value={value} onChange={(event) => handleEdit(id, event.target.value)}>
          <option value="">Select {label}</option>
          {options?.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>
      <div className="col-sm-1 pt-1 px-0">
        {value && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSave(id)} data-toggle="tooltip" data-placement="top" title="Save">
            <i className="fas fa-save fa-fw"></i>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusParametersForm(props) {
  const [focusModel, setFocusModel] = useState(props.phFocus?.focusModel?.id);
  const [focusModelview, setFocusModelview] = useState(props.phFocus?.focusModelview?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const dispatch = useDispatch();
console.log('20 FocusParametersForm: ', props, focusModel, focusModelview)
  const models = props.models;
  const curmod = models.find((model) => model.id === focusModel);
  const modelOptions = models.map((model) => ({ id: model.id, name: model.name }));
  const modelviews = curmod?.modelviews;
    const modelviewOptions = modelviews?.map((modelview) => ({ id: modelview.id, name: modelview.name }));
  console.log('30 FocusParametersForm: ', props, focusModel, focusModelview, models, curmod, modelviews);

  function handleEdit(fieldName, fieldValue) {
    switch (fieldName) {
      case 'focusModel':
        setFocusModel(fieldValue);
        break;
      case 'focusModelview':
        setFocusModelview(fieldValue);
        break;
      default:
        break;
    }
  }

  function handleSave(fieldName) {
    let fieldValue;
    switch (fieldName) {
      case 'focusModel':
        fieldValue = focusModel;
        break;
      case 'focusModelview':
        fieldValue = focusModelview;
        break;
      default:
        break;
    }
    const actionType = `SET_FOCUS_${fieldName.toUpperCase()}`;
    const actionData = { id: fieldValue, name: props.models.find((model) => model.id === fieldValue)?.name };
    dispatch({ type: actionType, data: actionData });
    setIsEditing(false);
    setEditingField(null);
  }

  function handleEditField(fieldName) {
    setIsEditing(true);
    setEditingField(fieldName);
  }

  return (
    <form>
      <div className="context-list1 border-bottom border-dark">
        <h4>Current Context / Focus:</h4>
        <FormField label="Model" id="focusModel" value={focusModel} handleEdit={handleEdit} handleSave={handleSave} options={modelOptions} />
        <FormField label="Modelview" id="focusModelview" value={focusModelview} handleEdit={handleEdit} handleSave={handleSave} options={modelviewOptions} />
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