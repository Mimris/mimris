
// import SelectContext from '../components/SelectContext'

const SetContext = (props: any) =>  {
 
  const phFocus = props.ph?.phFocus;
  return (
    <>
    <span className="context-list  align-self-center flex-grow-1 ">Context :
      Model: <strong>{ phFocus?.focusModel?.name }</strong> |
      Modelview: <strong>{phFocus?.focusModelview?.name}</strong> |
      Objectview: <strong>{phFocus?.focusObjectview?.name}</strong> |
      {/* Object: <strong>{phFocus?.focusObject?.name}</strong> | */}
      Org: <strong>{phFocus?.focusOrg?.name}</strong> |
      Proj: <strong>{phFocus?.focusProj?.name}</strong> |
      Role: <strong>{phFocus?.focusRole?.name}</strong> |
      Task: <strong>{phFocus?.focusTask?.name}</strong> |
      {/* <SelectContext buttonLabel='Context' className='ContextModal' phFocus={phFocus} /> | */}
    </span>
    </>
    )
}
          
export default SetContext