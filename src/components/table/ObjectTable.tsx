import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTable, useSortBy, useRowSelect, useFilters, useGlobalFilter } from 'react-table';
import IndeterminateCheckbox from "./IndeterminateCheckbox";
// import Selector from '../utils/Selector'
// import { columns, data } from './table/dataSource';


function ObjectTable(props) {  // props = ph = all phData 
  const debug = false
  // console.log('6', props);
  const dispatch = useDispatch();
  const [idSelected, setIdSelected] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState(['id']);

  function handleInputChange() {
    setIdSelected( !idSelected );
    // const data = {}
    // dispatch({ type: 'SET_FOCUS_OBJECT', data });
    (idSelected) ? setHiddenColumns(['id']) : setHiddenColumns(['']) 
  }
  // console.log('15', hiddenColumns);

  const models = props.ph.phData?.metis.models
  const focusModelId = props.phFocus?.focusModel.id
  const modelindex = models?.findIndex((m: any) => m?.id === focusModelId)
  // const focusModelviewId = props.phFocus?.focusModelview.id
  const curmod = models?.find(m => m.i === focusModelId)
  const modelviews = curmod.modelviews
  // const curmodview = curmod.modelviews?.find(mv => mv.id === focusModelviewId)

  
  const objects = curmod?.objects
  
  const metamodels = props.ph.phData?.metis.metamodels
  const curmmod = metamodels.find(mm => mm.id === curmod?.metamodelRef)
  
  // console.log('13', props.ph.phData, models, focusModelId, curmod, objects);
  const edititem = objects[0]

  function listAllProperties(o) { // list all obj properties incl prototype properties
    var objectToInspect;
    var result = [];
    for (objectToInspect = o; objectToInspect !== null;
      objectToInspect = Object.getPrototypeOf(objectToInspect)) {
      result = result.concat(
        Object.getOwnPropertyNames(objectToInspect)
      );
    }
    return result;
  }

  const fields0 = listAllProperties(edititem).map(p => // remove js prototype properties
    (p.substring(0, 2) !== '__') && 
    (p !== 'constructor') && (p !== 'hasOwnProperty') && (p !== 'isPrototypeOf') &&
    (p !== 'propertyIsEnumerable') && (p !== 'toString') && (p !== 'valueOf') && 
    (p !== 'toLocaleString') && 
    //(p !== 'id') &&
    //   (p !== 'group') && (p !== 'isGroup') && (p !== 'propertyValues') && (p !== 'size') && (p !== 'properties') && 
    //   (p !== 'deleted') && (p !== 'modified') && (p !== 'objects') && (p !== 'relships') && (p !== 'modelviews') && (p !== 'objectviews') && 
    //   (p !== 'objecttypeviews') && (p !== 'relshiptypeviews') && (p !== 'pasteViewsOnly') && (p !== 'deleteViewsOnly') &&
    //   (p !== 'datatypes') && (p !== 'relshiptypes') && (p !== 'inputrels') &&(p !== 'outputrels') &&
      (p.slice(-3) !== 'Ref') &&
      // (p !== 'unittypes') && (p !== 'objtypegeos') 
      //  (p !== 'viewkind') && (p !== 'relshipviews') && (p !== 'objecttypes')
    p
  ).filter(Boolean)
  // console.log('64', fields0, fields0.length);
  
  function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
  };
  const fields1 = array_move(fields0, 2, fields0.length-1) // move id to the end
  const fields2 = array_move(fields1, 0, fields0.length-1) // move id to the end
  // console.log('78', fields2);

  const fields = [  
    ...fields2.slice(0, 2),
    'type',
    'modViews',
    ...fields1.slice(2, fields1.length),
  ]
  // console.log('78', fields);

  function properties(p) {
    switch (p) {
      case 'name':
        return (
          {
            Header: p,
            Footer: (p === 'name') ?  <hr /> : <br />,
            accessor: p,
            filter: (p === 'name') ? (rows, id, filterType) => rows.filter(row => row.values[id].startsWith(filterType)) : null,
          }
        )
        break; 
      case 'id':
        return (
          {
            Header: p,
            accessor: p,
            show: idSelected,
          } 
        )
        break; 
      default:
        return (
          {
            Header: p,
            accessor: p,
          }
      )
      break;
    }
  }
  
  const fieldColumns = fields.map(f => properties(f))
  // console.log('120', fieldColumns);
  
  const columns = useMemo(
    () => [
      {
        Header: 'Objects',
        Footer: info => {
          const count = useMemo(
            () => info.rows.length,
            [info.rows]
          )
          return `Count: ${count}`
        },
        columns: 
          fieldColumns
        ,
      }
    ],[]
  )
  // console.log('50', 
  //   curmmod.objecttypes.find(ot => (ot.id === objects[0].typeRef)).name
  // );
  
  const data = useMemo( () => 
    objects?.map(o => o &&
      {
        ...o,
        id: o.id,
        name: o.name,
        description: o.description,
        type: curmmod.objecttypes.find(ot => (ot.id === o.typeRef)).name,
        modViews: modelviews.map(mv => mv.objectviews.find(ov => ov.objectRef === o.id) && mv.name+', ').filter(Boolean), 
        // countObjViews: modelviews.filter(mv => mv.objectviews.find(ov => ov.objectRef === o.id)).length 
        deleted: (o.deleted) && 'deleted',
        modified: (o.modified) && 'modified'
      } 
    ),[]
  )
  
  // const finalData = {data: data0, id: true}
  // const { data, id } = finalData;
  
  if (debug) console.log('149', data);

  // const hiddencolumns = (idSelected) ? ['id'] : ['']

  const {
      getTableProps,
      getTableBodyProps,           
      headerGroups,
      footerGroups,
      rows,
      prepareRow,
      selectedFlatRows,
      state: { selectedRowIds },
    } = useTable(
      {
        columns,
        data,
        initialState: {
          hiddenColumns: hiddenColumns,
          filters: [
            {
              id: "name",
              value: "",
            },
          ],
        },
      },
      useFilters,
      useGlobalFilter,
      useSortBy,
      useRowSelect,
      (hooks) => {
        hooks.visibleColumns.push((columns) => [
          {
            id: "selection",
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            ),
            Cell: ({ row }) => (
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            ),
          },
          ...columns,
        ]);
      }
    );
    
    

    // const selmods = [
    //   models[modelindex],
    //   ...models.slice(0, modelindex),
    //   ...models.slice(modelindex+1, models.length)
    // ]
    // const [refresh, setRefresh] = useState(true)
    // function toggleRefresh() { setRefresh(!refresh); }
    // console.log('36 Modeller', focusModelview, selmods, modelviews);
    // let selmodels = selmods.filter(Boolean) //selmods?.models?.map((m: any) => m)
    // console.log('219', selmodels);
    // const selector = (selmodels) &&
    //   <>
    //     {/* <div className="modeller-selection" > */}
    //       {/* <Selector type='SET_FOCUS_MODELVIEW' selArray={selmodelviews} selName='Modelveiews' focusModelview={props.phFocus?.focusModelview} focustype='focusModelview' refresh={refresh} setRefresh={setRefresh} /> */}
    //       <Selector type='SET_FOCUS_MODEL' selArray={selmodels} selName='Model' focusModel={props.phFocus?.focusModel} focustype='focusModel' refresh={refresh} setRefresh={setRefresh} />
    //     {/* </div>  */}
    //   </>


    useEffect(() => {
      console.log('237 ObjectTable useEffect 1',selectedFlatRows.map(d => d.original.id,)); 
      const selectedrows = selectedFlatRows.map(d => d,)
      const selectedrow = selectedrows[0]
      console.log('240', selectedrows, selectedrow?.original?.id);
      
      const data = (selectedrow) && {id: selectedrow?.original?.id, name: selectedrow?.original?.name}
      // const data = {id: selectedFlatRows.map(d => d.original.id,), name: selectedFlatRows.map(d => d.original.name,)}
      console.log('244 ObjectTable useEffect 1', data); 
      dispatch({ type: 'SET_FOCUS_OBJECT', data });
    }, [Object.keys(selectedRowIds).length])

      console.log('248',  selectedFlatRows.map(d => d.original.id,),);
      

      
    return (
      <>
        {/* <div>
          <h5 className="modeller-heading float-left text-dark m-0 mr-0 clearfix" style={{ margin: "2px", paddingLeft: "2px", paddingRight: "0px", position: "relative", overflow: "hidden" }}>Object instance list</h5>
          {selector}
        </div><br /> */}
        <div>
          <label>id</label>
          <input
            name="id"
            type="checkbox"
            checked={idSelected}
            onChange={() => { handleInputChange() }}
          />
        </div>
        <table style={{borderSpacing: "5px", border: "2px solid gray"}} {...getTableProps()}>
          <thead style={{borderSpacing: "5px", border: "2px solid gray"}}>
            {headerGroups.map((headerGroup) => (
              <tr className="bg-secondary border" {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th className="pl-2" {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render("Header")}
                    <span>
                      {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-primary" {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr className="bg-secondary p-2" {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return <td  {...cell.getCellProps()}
                      className="bg-white pl-1"
                      style={{borderSpacing: "5px", border: "2px solid gray"}}
                    >
                      {cell.render("Cell")}
                    </td>;
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {footerGroups.map((group) => (
              <tr {...group.getFooterGroupProps()}>
                {group.headers.map((column) => (
                  <td {...column.getFooterProps()}>
                    {column.Footer && column.render("Footer")}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>        
        <p>Selected Rows: {Object.keys(selectedRowIds).length} </p>   
        <pre>
          <code>
            {JSON.stringify(
              {
                selectedRowIds: selectedRowIds,
                'selectedFlatRows[].original': selectedFlatRows.map(
                  d => d.original.id,
                ),
              },
              null,
              2
            )}
          </code>
        </pre>
      </>
    );
  }
  

export default ObjectTable;