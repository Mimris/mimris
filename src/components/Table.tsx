import React, { useMemo } from 'react';
import { useTable, useSortBy, useRowSelect, useFilters, useGlobalFilter } from 'react-table';
import IndeterminateCheckbox from "./table/IndeterminateCheckbox";
// import { columns, data } from './table/dataSource';

function Table(props) {
  // console.log('6', props);
  
  const models = props.ph.phData?.metis.models
  const focusModelId = props.phFocus?.focusModel.id
  const curmod = models?.find(m => m.i === focusModelId)
  const objects = curmod?.objects
  
  const metamodels = props.ph.phData?.metis.metamodels
  const curmmod = metamodels.find(mm => mm.id === curmod?.metamodelRef)
  
  // console.log('13', props.ph.phData, models, focusModelId, curmod, objects);

  const columns = [
    {
      Header: 'Objects',
      Footer: info => {
        const count = useMemo(
          () => info.rows.length,
          [info.rows]
        )
        return `Count: ${count}`
      },
      columns: [
        {
          Header: 'Name',
          Footer: <hr />,
          accessor: 'name',
          filter: (rows, id, filterType) => rows.filter(row => row.values[id].startsWith(filterType)),

        },
        {
          Header: 'Desc',
          accessor: 'description',
        },
        {
          Header: 'Type',
          accessor: 'type',
        },
        {
          Header: 'Id',
          accessor: 'id',
        },
      ],
    }
 
  ];
  console.log('50', 
    curmmod.objecttypes.find(ot => (ot.id === objects[0].typeRef)).name
  );
  
  const data = 
    objects?.map(o => o &&
      {
        id: o.id,
        name: o.name,
        description: o.description,
        type: curmmod.objecttypes.find(ot => (ot.id === objects[0].typeRef)).name
      } 
    )

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
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr className="bg-light pl-2" {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return <td className="pl-2" {...cell.getCellProps()}>{cell.render("Cell")}</td>;
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
    );
  }
  

export default Table;