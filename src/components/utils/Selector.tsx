import { useDispatch } from 'react-redux'

const Selector = ( props: any ) => {

  const dispatch = useDispatch()
  const type = props.type
  const handleChange = (event: any) => {
    // console.log('8 selector', event); 
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focustype = { id: id, name: name }
    const data = focustype
    // console.log('13 selector', data, type);
    dispatch({ type: type, data })
  }
  // console.log('15 selector', props);

  const options = props.selArray && [
      <option 
        key={'Select ...'} 
        value={`Select ${props.selName} ...`} 
      > 
        Select {props.selName}...
      </option>,
      props.selArray.map((m: any) => 
      <option key={m.id} value={JSON.stringify({id: m.id, name: m.name, type})}  > 
        {m.name} 
      </option>)]

   const selectDiv =
     ((props.selName === 'Model') || (props.selName === 'Modelviews'))
      ?
       <>
         <span className="title mx-2 ">{props.selName}:</span>
          <select className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
        </>
      :
        <div key={props.type} className="select" ><hr />
         <div className="title "> {props.selName}:</div>
         <select className="list-obj " defaultValue={`Select ${props.selName} ...`} style={{ width: "98%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
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
