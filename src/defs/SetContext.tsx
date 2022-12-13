
// import SelectContext from '../components/SelectContext'
// Todo:  change name to ViewContext
const SetContext = (props: any) =>  {
 
  const phFocus = props.ph?.phFocus;
  const phData = props.ph?.phData;
  const repopath = (phData?.repository) ? (phData?.path) ? phData?.repository+'/'+phData?.path : phData?.repository : '';

  return (
    <>
    <span className="context-list  d-flex justify-content-between align-items-center flex-grow-1">Context : 
      <span className="context-item"> Repo: <strong>{repopath}</strong> </span>|
      <span className="context-item"> Proj: <strong>{phData?.metis?.name}</strong> </span>|
      {/* <span className="context-item"> Proj: <strong>{phFocus?.focusProj?.name}</strong> </span>| */}
      <span className="context-item"> Model: <strong>{ phFocus?.focusModel?.name }</strong> </span>|
      <span className="context-item"> Modelview: <strong>{phFocus?.focusModelview?.name}</strong> </span>|
      <span className="context-item"> Objectview: <strong>{phFocus?.focusObjectview?.name}</strong> </span>|
      <span className="context-item"> Object: <strong>{phFocus?.focusObject?.name}</strong> </span>|
      {/* <span className="context-item">Objecttype: <strong>{phFocus?.focusObjecttype?.name}</strong> </span>| */}
      {/* <span className="context-item">Objecttypeview: <strong>{phFocus?.focusObjecttypeview?.name}</strong> </span>| */}
      {/* <span className="context-item">Relshipview: <strong>{phFocus?.focusRelshipview?.name}</strong> </span>| */}
      {/* <span className="context-item">Relship: <strong>{phFocus?.focusRelship?.name}</strong> </span>| */}
      {/* <span className="context-item">Relshiptype: <strong>{phFocus?.focusRelshiptype?.name}</strong> </span>| */}
      <span className="context-item"> Org: <strong>{phData?.organisation}</strong> </span>|
      <span className="context-item"> Role: <strong>{phFocus?.focusRole?.name}</strong> </span>|
      <span className="context-item"> Task: <strong>{phFocus?.focusTask?.name}</strong> </span>|
      {/* <span className="context-item"><SelectContext buttonLabel='Context' className='ContextModal' phFocus={phFocus} /> </span>| */}
      {/* <span className="context-item">FocusModel: <strong>{phFocus?.focusModel?.name}</strong> </span>|
      <span className="context-item">FocusModelview: <strong>{phFocus?.focusModelview?.name}</strong> </span>| */}
      <span className="context-item">Tab: <strong>{phFocus?.focusTab}</strong> </span>|
      {/* <span className="context-item">Template: <strong>{phFocus?.focusTemplateModel?.name}</strong> </span>|
      <span className="context-item">TemplateModelview: <strong>{phFocus?.focusTemplateModelview?.name}</strong> </span>|
      <span className="context-item">TargetModel: <strong>{phFocus?.focusTargetModel?.name}</strong> </span>|
      <span className="context-item">TargetModelview: <strong>{phFocus?.focusTargetModelview?.name}</strong> </span>| */}
    </span>
    </>
    )
}
          
export default SetContext