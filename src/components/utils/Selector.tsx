import { useDispatch } from 'react-redux'
const debug = false
const Selector = ( props: any ) => {

  if (debug) console.log('8 selector', props); 
  const dispatch = useDispatch()

  const refresh = props.refresh
  const setRefresh = props.setRefresh
  function toggleRefresh() { setRefresh(!refresh); }

  const type = props.type
  let selArray = props.selArray
  if (debug) console.log('14 Selector', props);
  
  // if (selArray.length === 1) selArray = [...selArray,...selArray]g
  const handleChange = (event: any) => {
    if (debug) console.log('18 Selector', event);
    const id = JSON.parse(event.value).id
    const name = JSON.parse(event.value).name
    const selObj = selArray.find( (obj: any) => obj.id === id ) 
    // const workOnTypes = selObj.workOnTypes
    // const focustype = { id: id, name: name, workOnTypes: workOnTypes }
    const data = (selObj) ? { id: id, name: name, selObj } : { id: id, name: name, selObj }
    if (!debug) console.log('22 selector', JSON.parse(event.value), data, type);
    dispatch({ type: type, data: selObj })
    // setRefresh(!refresh)
  }
  // console.log('25 selector', selArray, props.selName, props.focusModel?.name, props.focusModelview?.name );

  let focus = 'Model' 
    switch (props.selName) {
      case 'Model':
        focus = props.focusModel?.name
        break;
      case 'Modelview':
        focus = props.focusModelview?.name
        break;
      case 'Task':
        focus = props.focusTask?.name
        break;
      default:
        focus = ''
        break;
    }

        
  
  const options = selArray && ( //sf TODO:  modelview is mapped 2 times
    (focus !== '') 
      ? [
        <option  key={focus}  value={`${focus}...`} > {selArray[0]?.name} </option>,
        selArray.map((m: any, index) => (m) && (m.name !== 'Select '+props.selName+'...') &&
        // selArray.map((m: any) => (m.name !== focus && m.name !== 'Select '+ props.selName+'...') &&
        <option key={m.id+index} value={JSON.stringify({id: m.id, name: m.name, type})} > {m.name} </option>)]
      : [
        <option key={focus+1} value={`${focus}...`} >{selArray[0]?.name}</option>,
        // <option key={focus+1} value={`${focus}...`} >Select {props.selName}... </option>,
        selArray.map((m: any) => (m) && (m.name !== 'Select '+props.selName+'...') &&
        // selArray.map((m: any) => (m.name !== focus && m.name !== 'Select '+ props.selName+'...') &&
        <option key={m.id} value={JSON.stringify({id: m.id, name: m.name, type})}>{m.name}</option>)]
    )

  if (!debug) console.log('38 selector', focus, options);
  const selectDiv = 
    ((props.selName === 'Model') || (props.selName === 'Modelviews'))
    ? (props.selName === 'Model') 
      ?
      <div className="mod-modview w-25 float-right">
        <div key={props.type} className="select w-100" >
            <span className="title mx-0 float-left ">{props.selName} :</span>
            <select key={focus} className="list-obj mx-2 w-75" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
              onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
              {options}
            </select>
        </div>
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
    <div className="mod-modview">
      <div key={props.type} className="select" >
        <div  className="title float-left mr-1 "> {props.selName}:</div>
        <select key={focus} className="list-obj w-100" defaultValue={`Select ${props.selName} ...`} style={{ width: "68%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
          onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
          {options}
        </select>
      </div>
    </div>

  return (
    // <div className="mod-modview w-25 float-right">
    <div>
      {selectDiv}
    </div>
  )
}

export default Selector
