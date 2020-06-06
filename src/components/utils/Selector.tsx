import { useDispatch } from 'react-redux'

const Selector = ( props: any ) => {

  const dispatch = useDispatch()

  const handleChange = (event: any) => {
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
        key={991012} 
        value={`Select ${props.selName} ...`} 
      > 
        Select {props.selName}  ...
      </option>,
         props.selArray.map((m: any) => 
          <option key={m.id} value={JSON.stringify(m)}  > 
            {m.name} 
          </option>)]

  return (
    <>
      {/* <div className="select" style={{ paddingTop: "4px" }}>*/}
          <span className="title m-2 w-25" > {props.selName} : </span>
          <select className="list-obj mx-2" defaultValue={`Select ${props.selName} ...`} //style={{ width: "70%" }} //style={{ whiteSpace: "wrap", minWidth: "100%" }}
          onChange={(event) => handleChange({ value: event.target.value })} name={`Focus ${props.selName} ...`}>
          {options}
        </select>
      {/* </div> */}
    </>
  )
}

export default Selector
