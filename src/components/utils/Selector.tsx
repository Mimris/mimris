import { useDispatch } from 'react-redux'

const Selector = ( props: any ) => {

  const dispatch = useDispatch()

  const handleChange = (event: any) => {
    console.log('8 selector', event);
    
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focustype = { id: id, name: name }
    const data = focustype
    console.log('56 sel', data);
    dispatch({ type: props.type, data })
  }
  // console.log('15 selector', props);
  const options = props.selArray && [
      <option 
        key={'Select ${props.selName} ...'} 
        value={`Select ${props.selName} ...`} 
      > 
        Select {props.selName}  ...
      </option>,
         props.selArray.map((m: any) => 
          <option key={m.id} value={JSON.stringify(m)}  > 
            {m.name} 
          </option>)]

   const selectDiv =
     ((props.selName === 'Model') || (props.selName === 'Modelviews'))
      ?
       <>
         <span key={props.type} className="title mx-2 "> {props.selName} : </span>
          <select key={props.selName+'1'} className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
        </>
      :
        <div key={props.type} className="select" ><hr />
         <span key={props.type} className="title mx-2 "> {props.selName} : </span>
          <select key={props.selName+'2'} className="list-obj mx-2 float-right" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
        </div>

  return (
    <>
      {selectDiv}
    </>
  )
}

export default Selector
