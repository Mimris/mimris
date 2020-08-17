import { useDispatch } from 'react-redux'

const Selector = ( props: any ) => {

  // console.log('8 selector', props); 
  const dispatch = useDispatch()

  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const type = props.type

  const handleChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focustype = { id: id, name: name }
    const data = focustype
    // console.log('13 selector', data, type);
    dispatch({ type: type, data })
  }
  // console.log('15 selector', props);
  const focus = (props.selName === 'Model') ? props.focusModel?.name : props.focusModelview?.name
  const options = props.selArray && [
      <option 
        key={focus} 
        value={`${focus} ...`} 
        // value={`Select ${props.selName} ...`} 
      > 
        {focus}
        {/* Select {props.selName}... */}
      </option>,
      props.selArray.map((m: any) => 
      <option key={m.id} value={JSON.stringify({id: m.id, name: m.name, type})}  > 
        {m.name} 
      </option>)]

  const selectDiv = 
    ((props.selName === 'Model') || (props.selName === 'Modelviews'))
    ? (props.selName === 'Model') 
      ?
        <>
          <span className="title mx-2 ">{props.selName}:</span>
          <select key={focus} className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
          onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
        </>
      :
        <>
          <span className="title mx-2 ">{props.selName}:</span>
            <select key={focus} className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => {handleChange({ value: event.target.value });  toggleRefresh()}} name={`Focus ${props.selName} ...`}>
              {options}
            </select>
          </>
      :
        <div key={props.type} className="select" ><hr />
          <div className="title "> {props.selName}:</div>
          <select key={focus} className="list-obj " defaultValue={`Select ${props.selName} ...`} style={{ width: "98%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
        </div>

  return (
    <div className="mod-modview float-right">
      {selectDiv}
    </div>
  )
}

export default Selector
