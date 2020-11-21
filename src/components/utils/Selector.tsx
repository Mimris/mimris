import { useDispatch } from 'react-redux'

const Selector = ( props: any ) => {

  // console.log('8 selector', props); 
  const dispatch = useDispatch()

  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const type = props.type
  let selArray = props.selArray
  // console.log('14 Selector', props);
  
  // if (selArray.length === 1) selArray = [...selArray,...selArray]g
  const handleChange = (event: any) => {
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const focustype = { id: id, name: name }
    const data = focustype
    // console.log('22 selector', data, type);
    dispatch({ type: type, data })
    // setRefresh(!refresh)
  }
  // console.log('25 selector', selArray, props.selName, props.focusModel?.name, props.focusModelview?.name );
  const focus = (props.selName === 'Model') ? props.focusModel?.name : props.focusModelview?.name
  
  const options = selArray && ( //sf TODO:  modelview is mapped 2 times
    (focus) 
      ? [
        <option  key={focus}  value={`${focus}...`} > {focus} </option>,
        selArray.map((m: any, index) => (m) && (m.name !== 'Select '+props.selName+'...') &&
        // selArray.map((m: any) => (m.name !== focus && m.name !== 'Select '+ props.selName+'...') &&
        <option key={m.id+index} value={JSON.stringify({id: m.id, name: m.name, type})} > {m.name} </option>)]
      : [
        <option key={focus+1} value={`${focus}...`} >Select {props.selName}... </option>,
        selArray.map((m: any) => (m) && (m.name !== 'Select '+props.selName+'...') &&
        // selArray.map((m: any) => (m.name !== focus && m.name !== 'Select '+ props.selName+'...') &&
        <option key={m.id} value={JSON.stringify({id: m.id, name: m.name, type})}>{m.name}</option>)]
    )
    
    

  // console.log('38 selector', options);
  const selectDiv = 
    ((props.selName === 'Model') || (props.selName === 'Modelviews'))
    ? (props.selName === 'Model') 
      ?
      <div key={props.type} className="select" >
          <span className="title mx-2 ">{props.selName}:</span>
          <select key={focus} className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
          onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
            {options}
          </select>
          </div>
      :
      <div key={props.type} className="select" >
          <span  className="title mx-2 ">{props.selName}:</span>
            <select key={props.type} className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
            onChange={(event) => {handleChange({ value: event.target.value });  toggleRefresh()}} name={`Focus ${props.selName} ...`}>
              {options}
            </select>
            </div>
      :
        <div key={props.type} className="select" >
          <div  className="title "> {props.selName}:</div>
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
