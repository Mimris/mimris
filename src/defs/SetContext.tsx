import SelectContext from '../components/SelectContext'
import SelectSource from '../components/SelectSource'

const SetContext = (props: any) =>  {

  const phFocus = props.phFocus;
  // console.log('6', phFocus);
  return (
    <>
    <div className="context-list border-bottom border-dark">Context :
      Model: <strong>{ phFocus?.focusModel?.name }</strong> |
      Modelview: <strong>{phFocus?.focusModelview?.name}</strong> |
      Object: <strong>{phFocus?.focusObject?.name}</strong> |
      Org: <strong>{phFocus?.focusOrg?.name}</strong> |
      Proj: <strong>{phFocus?.focusProj?.name}</strong> |
      Role: <strong>{phFocus?.focusRole?.name}</strong> |
      Task: <strong>{phFocus?.focusTask?.name}</strong> |
      <SelectContext buttonLabel='Set Context' className='ContextModal' phFocusocus={phFocus} /> |
      <SelectSource buttonLabel='Save / Load Model' className='ContextModal' phFocusocus={phFocus} /> 
    </div>
    </>
    )
}
          
export default SetContext