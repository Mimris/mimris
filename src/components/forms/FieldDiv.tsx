

const FieldDiv = (props) => {

  // console.log('4', props);
  // const equal = (props.p ==='name' && props.curitem.p === props.curobj?.name) || (props.p ==='description' && props.curitem.p === props.curobj?.description)
  // const equal = true
  // console.log('6', props.curitem?.typeviewRef);
  // const defaultvalue = (props.curitem?.typeviewRef !== undefined) //its not an objectview
  //   ? (props.p === 'name') ?  props.curobj?.name : props.curitem[props.p]
  //     && (props.p === 'description') ? props.curobj?.description : props.curitem[props.p]  
  // : props.curitem[props.p] 
  
  // console.log('12', defaultvalue);
  return (
    <div>
      <>
        <div className="field"  >
        {/* <div className="field" style={{ backgroundColor: "blue" }} > */}
          <label className="label " htmlFor="name">{`${props.p}`}</label>
          <input className="input pt-1 float-right "
            type="text"
            id={`${props.curitem.id}+${props.p}`}
            // id={`${props.p}`}
            name={`${props.p}`}
            // placeholder={`${props.curitem[props.p]}`}
            defaultValue={`${props.curitem[props.p]}`}
            // defaultValue={`${props.curitem[props.p]}`}
            ref={props.register({ required: true } )}
            // ref={props.register({ required: true, equal: true } )}
            // style={{ backgroundColor: equal ? "ffcccc" : "white" }}
          />
          {props.errors.name && props.errors.name.type === "required" && (
            <div className="error">Your must enter the name.</div>
          )}
          {props.errors.name && props.errors.name.equal === false && (
            <div className="error">Object name and ObjectView name must be equal.</div>
          )}
        </div>
        {/* <button className="btn-primary" type="submit">Save</button> */}
        <style jsx>{`
          .field {
            display: flex;
            align-items: center;
            // margin-bottom: 5px;
            width: 100%;
          }
          .field label {
            // color: green;
            display: inline-block;
            width: 25%;
            text-align: right;
            margin-right: 3px;
            margin-top: 3px;
          }
          .field input {
            // color: green;
            display: inline-block;
            width: 75%;
            margin-left: 2px;
            margin-right: 3px;
            padding-top: 0px;
          }
          .field .error {
            color: red;
            margin-left: 3px;
            font-size: 0.8em;
            width: 100px;
          }
        `}</style>
      </>
    </div>
  );
}

export default FieldDiv;
