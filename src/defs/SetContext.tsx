import SelectContext from '../components/SelectContext'
import SelectSource from '../components/SelectSource'

const SetContext = (props: any) =>  {

  const phF = props.phFocus;
  // console.log('6', phF);
  return (
    <>
    <div className="context-list border-bottom border-dark">Context :
      Model:<strong>{ phF?.focusModel?.name }</strong> |
      Modelview:<strong>{phF?.focusModelview?.name}</strong> |
      Object:<strong>{phF?.focusObject?.name}</strong> |
      Org:<strong>{phF?.focusOrg?.name}</strong> |
      Proj:<strong>{phF?.focusProj?.name}</strong> |
      Role:<strong>{phF?.focusRole?.name}</strong> |
      Task:<strong>{phF?.focusTask?.name}</strong> |
      <SelectContext buttonLabel='Set Context' className='ContextModal' phFocus={phF}  /> 
      <SelectSource buttonLabel='Save / Load' className='ContextModal' phFocus={phF}  /> 
    </div>
    </>
    )
}
          
export default SetContext