import SelectContext from '../components/SelectContext'

const SetContext = (props: any) =>  {

  const phF = props.phF;
  
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
      <SelectContext buttonLabel='Set Context' className='ContextModal' /> 
    </div>
    </>
    )
}
          
export default SetContext