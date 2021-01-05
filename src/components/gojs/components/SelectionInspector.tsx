// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';

import { InspectorRow } from './InspectorRow';

// import './Inspector.css';

const debug = false;
interface SelectionInspectorProps {
  selectedData: any;
  onInputChange: (id: string, value: string, obj: any, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const selObj = this.props.selectedData;
    if (!selObj)
      return;
    const category = selObj.category;
    let inst, instview, fields;
    if (category === 'Object') {
      inst = selObj.object;
      instview = selObj.objectview;
    } else if (category === 'Relationship') {
      inst = selObj.relship;
      instview = selObj.relshipview;
    }
    const dets = [];
    for (const k in inst) {
      let row;
      if (k ) {
        let val = selObj[k]; 
        if (k === 'description' && !val) val = " "; 
        if (debug) console.log('43 k, val', k, val, typeof(val));
        if (true) { // Filter values
          if (typeof(val) === 'object') continue;
          if (k === 'class') continue;
          if (k === 'category') continue;
          if (k === 'nameId') continue;
          if (k === 'fs_collection') continue;
          if (k === 'typeRef') continue;
          //if (k === 'typeName') continue;
          if (k === 'deleted') continue;
          if (k === 'modified') continue;
        }
        if (!val) continue;
        if (!debug) console.log('54 SelectionInspector: k, val', k, val, typeof(val), selObj);
        row  = <InspectorRow
                key={k}
                id={k}
                value={val}
                obj= {selObj}
                onInputChange={this.props.onInputChange} 
               />
      }
      if (k === 'key') {
        dets.unshift(row); // key always at start
      } else {
        dets.push(row);
      }
    }
    if (debug) console.log('70 SelectionInspector ', dets);
    return dets;
  }

  public render() {
    return (
      <div id='myInspectorDiv' className='inspector'>
        <table>
          <tbody>
            {this.renderObjectDetails()}
          </tbody>
        </table>
      </div>
    )
  }
}
