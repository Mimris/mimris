// @ts-nocheck
import React from 'react'

// make a jsx component
const debug = false

export const ObjDetailTable = (props) => {
    const {
      title,
      curRelatedObjsRels,
      curmodelview,
      curmetamodel,
      selectedId,
      setSelectedId,
      curobject,
      objects,
      includedKeys,
      setObjview
    } = props;
  
    if (debug) console.log('20 ObjDetailTable: ', title, curRelatedObjsRels, curmodelview, curmetamodel, curobject, objects);
  
    return curRelatedObjsRels && (
      <table className="table m-0">
        <thead className="thead">
          <tr className="tr">
             <th className="th bg-light">{title}</th>
          </tr>
        </thead>
        <tbody>
            {curRelatedObjsRels?.map(objrel => (objrel) && (
            <tr key={objrel.id}>
                <td>
                <details key={objrel.id+'details'} open={objrel?.id === selectedId} onToggle={() => setSelectedId(objrel.id)}> 
                  <summary style={{ display: 'flex' }}>  
                    <span style={{ display: 'inline-block', width: '1.5em' }}>{objrel?.id === selectedId ? '▼' : '▶'}</span>
                    {(title === 'Children' || curobject.id === curmodelview?.id) 
                      ? (
                        <div className="d-flex" >
                          <span style={{ marginLeft: '6px' }}>{objrel?.name}</span>
                          {/* <span style={{ marginLeft: '126px' }}> </span> */}
                          <span className="ms-2" style={{ color: 'lightgray' }}>
                              ({curmetamodel.objecttypes.find((ot) => ot.id === objrel?.typeRef)?.name}){/*{curmodelview.name} {objrel.name}*/}
                          </span>
                          <button
                              style={{ marginLeft: '10px', border: 'none', backgroundColor: 'transparent', float: 'right' }}
                              onClick={() => setObjview(objects.find((o) => o.id === objrel.id))}
                          >
                              ⤴️
                          </button>
                          {/* {(curmodelview.id !== (curmodelview.objectviews.find(cmv => (cmv.id === (curmodelview.objectviews.find(ov => ov.objectRef === objrel.id)?.id)))?.id)) ? (
                            <span style={{ float: 'right', marginLeft: '4px' }}>
                                🟢
                            </span>
                            ) : (
                            <></> */}
                          {/* )} */}

                        </div>
                    ) : title === 'Related From' ? (
                      <div className="d-flex" >
                        <div>{curobject.name}
                          <span className="ms-2" style={{ color: 'lightgray' }}>
                            ({curmetamodel.objecttypes.find((ot) => ot.id === objects.find((o) => o.id === objrel.fromobjectRef).typeRef)?.name})
                          </span>
                        </div>
                        <span style={{ marginLeft: '16px', marginRight: '16px' }}>{objrel.name}</span>
                        <span>
                          {objects.find((o) => o.id === objrel.toobjectRef).name}
                        </span>
                        <span className="ms-2" style={{ color: 'lightgray' }}>
                          ({curmetamodel.objecttypes.find((ot) => ot.id === objects.find((o) => o.id === objrel.toobjectRef).typeRef)?.name})
                        </span>
                        <button
                          style={{ marginLeft: '10px', border: 'none', backgroundColor: 'transparent' }}
                          onClick={() => setObjview(objects.find((o) => o.id === objrel.toobjectRef))}
                        >
                          ⤴️
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex" >
                        <div>{curobject.name} 
                          <span className="ms-2" style={{ color: 'lightgray' }}>
                            ({curmetamodel.objecttypes.find((ot) => ot.id === objects.find((o) => o.id === objrel.fromobjectRef).typeRef)?.name})
                          </span>
                        </div>
                        <span style={{ marginLeft: '16px', marginRight: '16px' }}>{objrel.name}</span>
                        <span>{objects.find((o) => o.id === objrel.fromobjectRef && o).name}</span>
                        <span className="ms-2" style={{ color: 'lightgray' }}>
                          ({curmetamodel.objecttypes.find((ot) => ot.id === objects.find((o) => o.id === objrel.toobjectRef).typeRef)?.name})
                        </span>
                        <button
                          style={{ marginLeft: '10px', border: 'none', backgroundColor: 'transparent' }}
                          onClick={() => setObjview(objects.find((o) => o.id === objrel.fromobjectRef))}
                        >
                          ⤴️
                        </button>
                      </div>
                    )}
                  </summary>
                  {/* <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'inline-block', width: '1.5em' }}>{obj.id === selectedId ? '▼' : '▶'}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{obj.name}</span>
                        <span style={{ textAlign: 'right' }}>({curmetamodel.relshiptypes.find(ot => ot.id === obj.typeRef)?.name})</span> 
                    </summary> */}
                  {/* {(title === 'Children') ? <span className=''>Object Properties</span> : <span  className=''>Relationship Properties</span>} */}
                  <table className="table">
                      <thead className="thead">
                      <tr className="tr">
                          <th className="th">Property</th>
                          <th className="th">Value </th>
                          {/* <th className="th">Object </th> */}
                          {/* <th className="th">Value {obj.name} - {curobject.name} -- {(objects.find(o => (curRelatedObjsRels.find(r => r.id === obj.fromobjectRef)).toobjectRef === o.id))}</th> */}
                          {/* <th className="th">
                          <span className="d-flex justify-content-end">
                              <button onClick={() => setObjview(objects.find(o => curRelatedObjsRels.find(r => r.id === o.toobjectRef && o))) }>⤴️</button>
                          </span>
                          </th> */}
                      </tr>
                      </thead>
                      <tbody className="tbody">
                      {Object.keys(objrel).map(
                          pv =>
                          includedKeys.includes(pv) && (
                              <tr className="tr" key={pv}>
                              <td className="td">{pv}</td>
                              <td className="td">{objrel[pv]}</td>
                              {/* <td className="td"></td> */}
                              </tr>
                          )
                      )}
                      </tbody>
                  </table>
                </details>
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    )
}

