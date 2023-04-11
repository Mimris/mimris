import { useRef, useState } from "react";


const ObjectHeader = ({ curmm, curobject, setObjview, parentobject }) => {
  return (
    <h4 className="px-2">
      {curobject?.name}
      <span style={{ flex: 1, textAlign: 'right', float: 'right' }}>
        ({curmm.objecttypes.find((ot) => ot.id === curobject?.typeRef)?.name || 'Modelview'})
        {curmm.objecttypes.find((ot) => ot.id === curobject?.typeRef)?.name && (
          <span>
            {' '}
            <button className="border-0 bg-transparent" onClick={() => setObjview(curobject)}> ⬆️</button>{' '}
          </span>
        )}
      </span>
    </h4>
  );
};

const ObjectForm = ({ objectPropertiesMain, formValues, curobject, handleChange, handleSubmit }) => {
    const textareaRef = useRef(null);
    const [value, setValue] = useState("");


    const handleInputChange = (event) => {
        // console.log('27', event.target.value)
        // setValue(event.target.value);
        adjustTextareaHeight();
        handleChange(event);
      };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      };



  return (
    <form onSubmit={handleSubmit}>
        <div className="form-group py-2 border border-rounded">
        {objectPropertiesMain?.map((key) => (
            <div className="row" key={key}>
            <label htmlFor={key} className="col-sm-3 col-form-label m-1" >{key}</label>
            <div className="col-sm-9">     
                {key.endsWith('Id' || 'id' || 'Ref') ? ( // if key ends with 'Id' then it is a reference to another object
                <input
                    type="text"
                    className="form-control hover-gra m-1"
                    id={key}
                    name={key}
                    value={formValues[key] || curobject[key]}
                    onChange={handleChange}
                    readOnly
                    style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
                />
                ) : key === 'typeName' || key === 'typeDescription' ? (
                <input
                type="text"
                className="form-control bg-light border-0 "
                id={key}
                name={key}
                value={formValues[key] || curobject[key]}
                onChange={handleChange}
                readOnly
                style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
            />
                ) : (key ==='name') ? (
                <textarea
                    className="form-control hover-white bg-white m-1 "
                    id={key}
                    name={key}
                    value={formValues[key] || curobject[key]}
                    onChange={handleChange}
                    style={{ backgroundColor: '#eee' }}
                    ref={textareaRef}
                    rows= {1} 
                />
                ) : ( key === 'description') ? (
                    <textarea
                        className="form-control hover-white bg-white m-1 "
                        id={key}
                        name={key}
                        value={formValues[key] || curobject[key]}
                        onChange={handleInputChange}
                        style={{ backgroundColor: '#eee' }}
                        ref={textareaRef}
                        rows= {3}
                    />
                ) : (
                <input
                    type="text"
                    className="form-control hover-white bg-white m-1 "
                    id={key}
                    name={key}
                    value={formValues[key] || curobject[key]}
                    onChange={handleChange}
                    style={{ backgroundColor: '#eee' }}
                />
                )}
            </div>
            </div>
        ))}
        <div className="row m-1 pt-1">
            <button type="submit" className="btn btn-sm btn-primary" style={{ float: 'right' }}>
            Submit
            </button>
        </div>
        </div>
        <style jsx>{`
        .hover-gray,
        .hover-white,
        input:focus {
            cursor: text;
        }
        form-control .form-read-only {
            background-color: red;
        }
        .hover-gray:hover,
        .hover-white:hover,
        input:focus:hover {
            background-color: light;
            cursor: text;
        }
    
        input:focus {
            border-color: orange;
        }
    
        input:focus:hover::after {
            border-color: orange;
        }
        `}</style>
    </form>
  );
};

const ObjectTable = ({ curobjModelviews, curmodelview, curmodel }) => {
  return (
    <table className="w-100 border border-rounded ">
      <thead className="thead">
        <tr className="tr">
          <th className="th">Current object shown in:</th>
          <th className="th">
            Value <span style={{ float: 'right' }}>🟢 = in current Modelview</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {curobjModelviews.map((comv) => (
          <tr className="tr" key={comv.id}>
            <td className="td">Modelview</td>
            {comv.id === curmodelview?.id ? (
              <td className="td">
                {comv.name} <span style={{ float: 'right' }}>🟢</span>
              </td>
            ) : (
              <td className="td">{comv.name}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ObjectDetails = ({ curmodel, curmodelview, curmm, curobject, objectPropertiesMain, formValues, handleChange, handleSubmit, curobjModelviews, setObjview, parentobject }) => {
  return (
    <>
      <ObjectHeader curmm={curmm} curobject={curobject} setObjview={setObjview} parentobject={parentobject} />
      <div className=" bg-light">
        <div className="col">
            <ObjectForm
              objectPropertiesMain={objectPropertiesMain}
              formValues={formValues}
              curobject={curobject}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
            />
          </div>
      </div>
    </>
  );
};

export default ObjectDetails;