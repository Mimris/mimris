import { useRef, useState } from "react";

const debug = false;

const ObjectHeader = ({ curmm, curobject, setObjview, parentobject, curmodelview }) => {
  if (debug) console.log('6 ObjectHeader', curmm.objecttypes.map((ot) => ot.id === curobject?.typeRef), curobject, parentobject);
  return (
    <h4 className="p-2 bg-light mx-1">
      {curobject?.name || curmodelview?.name}
      <span style={{ flex: 1, textAlign: 'right', float: 'right' }}>
        ({curmm.objecttypes.find((ot) => ot.id === curobject?.typeRef)?.name || 'Modelview'}) {/*  || 'Modelview'}) */}
        {(curmm.objecttypes.find((ot) => ot.id === curobject?.typeRef)?.name) && (
          <span>
            {' '}
            <button className="border-0 bg-transparent" onClick={() => (!parentobject) ? setObjview(curmodelview) : setObjview(parentobject)}> ⬆️</button>{' '}
          </span>
        )}
      </span>
    </h4>
  );
};

const ObjectForm = ({ objectPropertiesMain, formValues, curobject, handleChange, handleSubmit, edit }) => {
  const textareaRef = useRef(null);
  // const [value, setValue] = useState("");

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

  if (debug) console.log('42 ObjectForm', objectPropertiesMain, formValues, curobject, edit);
  if (debug) console.log('44 ObjectForm', formValues, curobject);
  return (formValues) && (
    <form onSubmit={handleSubmit}>
      <div className="form-group py-2 border border-rounded">
      <div className='' style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: '66vh' }}>
        {objectPropertiesMain?.map((key) => {
          let inputElement;
          switch (true) {
            case key.endsWith('Id'):
            case key.endsWith('id'):
            case key.endsWith('Ref'):
              inputElement = (
                <input
                  type="text"
                  className="form-control hover-gra m-1"
                  id={key}
                  name={key}
                  value={formValues[key] }
                  onChange={handleChange}
                  readOnly
                  style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
                />
              );
              break;
            case key === 'typeName':
            case key === 'typeDescription':
              inputElement = (
                <input
                  type="text"
                  className="form-control bg-light border-0 "
                  id={key}
                  name={key}
                  value={formValues[key] }
                  onChange={handleChange}
                  readOnly
                  style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
                />
              );
              break;
            case key === 'name':
              inputElement = (
                <textarea
                  className="form-control hover-white bg-white m-1 "
                  id={key}
                  name={key}
                  value={formValues[key] }
                  onChange={handleChange}
                  style={{ backgroundColor: '#eee' }}
                  ref={textareaRef}
                  rows={1}
                />
              );
              break;
            case key === 'description':
              inputElement = (
                <textarea
                  className="form-control hover-white bg-white m-1 "
                  id={key}
                  name={key}
                  value={formValues[key] || curobject[key]}
                  onChange={handleInputChange}
                  style={{ backgroundColor: '#eee' }}
                  ref={textareaRef}
                  rows={15}
                />
              );
              break;
            case key.endsWith('ports'):
              const Ports = formValues[key]?.map((ie, index) => 
                <div key={ie.id} className="d-flex align-items-center">
                  <div
                    style={{ backgroundColor: ie.color }}
                  />
                  {Object.keys(ie).map(ieKey => (ieKey === 'id') ? (
                    <input
                      key={ieKey}
                      className="form-control hover-white bg-light m-1"
                      id={ieKey}
                      name={`${key}[${index}][${ieKey}]`}
                      value={ie[ieKey]}
                      onChange={handleInputChange}
                      style={{ backgroundColor: ie.color }}
                      readOnly
                    />
                  ) : (
                    <input
                      key={ieKey}
                      className="form-control hover-white m-1"
                      id={ieKey}
                      name={`${key}[${index}][${ieKey}]`}
                      value={ie[ieKey]}
                      onChange={handleInputChange}
                      style={{
                        backgroundColor: ieKey === 'color' ? ie.color : '#eee',
                      }}
                    />
                  )
                  )}
                </div>
              );
              inputElement = (
                <div>
                  {Ports}
                </div>
              );
              break;
            default:
              inputElement = (
                <input
                  type="text"
                  className="form-control hover-white bg-white m-1 "
                  id={key}
                  name={key}
                  value={formValues[key] }
                  onChange={handleChange}
                  style={{ backgroundColor: '#eee' }}
                />
              );
          }
          return (
            <div className="row" key={key}>
              <label htmlFor={key} className="col-sm-3 col-form-label m-1">
                {key}
              </label>
              <div className="col-sm-9">{inputElement}</div>
            </div>
          );
        })}
        </div>
        <div className="row m-1 pt-1">
          {(edit === true) && ( 
          <button type="submit" className="btn btn-sm btn-primary" style={{ float: 'right' }}>
            Submit
          </button>
          )}
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
    <table className="w-100 border border-rounded " style={{ overflow: 'auto' }}>
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

const ObjectDetails = ({ curmodel, curmodelview, curmm, curobject, objectPropertiesMain, formValues, handleChange, handleSubmit, curobjModelviews, setObjview, parentobject, edit}) => {
  if (debug) console.log('237 ObjectDetails ', curobject, formValues, edit, objectPropertiesMain);
  return (
    <div className='object-details' style={{ overflow: 'auto' }}>
      <ObjectHeader curmm={curmm} curobject={curobject} setObjview={setObjview} parentobject={parentobject} curmodelview={curmodelview} />
      <div className="object-details--content " >
      {/* <div className="object-details--content " style={{ overflow: 'auto', maxHeight: '700px' }}> */}
        <div className="col">
            <ObjectForm
              objectPropertiesMain={objectPropertiesMain}
              formValues={formValues}
              curobject={curobject}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              edit={edit}
            />
          </div>
      </div>
    </div>
  );
};

export default ObjectDetails;