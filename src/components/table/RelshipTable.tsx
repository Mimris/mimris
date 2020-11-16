import React, { useState, useMemo } from 'react';
import { useTable, useSortBy, useRowSelect, useFilters, useGlobalFilter } from 'react-table';
import IndeterminateCheckbox from "./IndeterminateCheckbox";
// import { columns, data } from './table/dataSource';

function RelshipTable(props) {
  // console.log('6', props);

  const [idSelected, setIdSelected] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState(['id']);

  function handleInputChange() {
    setIdSelected( !idSelected );
    (idSelected) ? setHiddenColumns(['id']) : setHiddenColumns(['']) 
  }

  
  const models = props.ph.phData?.metis.models
  const focusModelId = props.phFocus?.focusModel.id
  // const focusModelviewId = props.phFocus?.focusModelview.id
  const curmod = models?.find(m => m.i === focusModelId)
  const modelviews = curmod.modelviews
  // const curmodview = curmod.modelviews?.find(mv => mv.id === focusModelviewId)

  const objects = curmod?.objects
  const relships = curmod?.relships
  
  const metamodels = props.ph.phData?.metis.metamodels
  const curmmod = metamodels.find(mm => mm.id === curmod?.metamodelRef)
  
  // console.log('13', props.ph.phData, models, focusModelId, curmod, objects);
  const edititem = relships[0]

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
      // (p !== 'deleted') && (p !== 'modified') && (p !== 'objects') && (p !== 'relships') && (p !== 'modelviews') && (p !== 'objectviews') && 
    //   (p !== 'objecttypeviews') && (p !== 'relshiptypeviews') && (p !== 'pasteViewsOnly') && (p !== 'deleteViewsOnly') &&
    //   (p !== 'datatypes') && (p !== 'relshiptypes') && 
    // (p !== 'inputrels') &&(p !== 'outputrels') &&
      (idSelected) && (p.slice(-3) !== 'Ref') &&
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

  // const fields1 = array_move(fields0, 2, fields0.length-1) // move id to the end
  // const fields2 = array_move(fields1, 0, fields0.length-1) // move id to the end
  // console.log('78', fields0);

  const fields = [  
    'fromObjName',
    'fromObjType',
    ...fields0.slice(0, 2),
    'type',
    'toObjName',
    'toObjType',
    'modViews',
    ...fields0.slice(2, fields0.length),
  ]
  // console.log('84', fields);

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
  // console.log('95', fieldColumns);
  
  const columns = useMemo(
    () => [
      {
        Header: 'Relationship list',
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
  //   curmmod.relshiptypes.find(rt => (rt.id === relships[0].typeRef)).name
  // );
  
  const data = useMemo( () => 
    relships?.map(r => r &&
      {
        ...r,
        id: r.id,
        fromObjName: curmod.objects.find(o => o.id === r.fromobjectRef).name,
        fromObjType: curmmod.objecttypes.find(ot => (ot.id === curmod.objects.find(o => o.id === r.fromobjectRef).typeRef)).name,
        name: r.name,
        toObjName: curmod.objects.find(o => o.id === r.toobjectRef).name,
        toObjType: curmmod.objecttypes.find(ot => (ot.id === curmod.objects.find(o => o.id === r.toobjectRef).typeRef)).name,
        description: r.description,
        type: curmmod.relshiptypes.find(rt => (rt.id === r.typeRef)).name,
        modViews: modelviews.map(mv => mv.relshipviews.find(ov => ov.relshipRef === r.id) && mv.name+', ').filter(Boolean), 
        // countObjViews: modelviews.filter(mv => mv.objectviews.find(ov => ov.objectRef === o.id)).length 
      } 
    ),[]
  )

  // console.log('156', data[0], idSelected);

    const {
      getTableProps,
      getTableBodyProps,           
      headerGroups,
      footerGroups,
      rows,
      prepareRow,
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

  
    return (
      <>
          <div>
            <label>id </label>
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
      </>
    );
  }
  

export default RelshipTable;