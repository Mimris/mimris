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
  onInputChange: (id: string, value: string, selectedData: any, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    if (!debug) console.log('24  myMetis', myMetis);
    const selObj = this.props.selectedData;
    if (!selObj)
      return;
    const category = selObj.category;
    let inst, instview, fields;
    if (category === 'Object') {
      inst = selObj.object;
      inst = myMetis.findObject(inst?.id);
      instview = selObj.objectview;
      instview = myMetis.findObjectView(instview?.id);
    } else if (category === 'Relationship') {
      inst = selObj.relship;
      inst = myMetis.findRelationship(inst?.id);
      instview = selObj.relshipview;
      instview = myMetis.findRelationshipView(instview?.id);
    }
    if (!inst)
      return;
    const type = inst.type;
    const props = type.properties;
    for (let i=0; i<props?.length; i++) {
      const prop = props[i];
      inst[prop.name] = "";
    }
    if (!debug) console.log('46 inst', inst);
    const dets = [];
    for (const k in inst) {
      let row;
      if (k ) {
        let val = selObj[k]; 
        if (debug) console.log('52 SelectionInspector: k, val, selObj', k, val, selObj);
        if (true) { // Filter values
          if (typeof(val) === 'object') continue;
          if (k === 'class') continue;
          if (k === 'category') continue;
          if (k === 'nameId') continue;
          if (k === 'fs_collection') continue;
          if (k === 'type') continue;
          if (k === 'typeRef') continue;
          // if (k === 'typeName') continue;
          if (k === 'typeviewRef') continue;
          if (k === 'fromObject') continue;
          if (k === 'toObject') continue;
          if (k === 'fromobjectRef') continue;
          if (k === 'toobjectRef') continue;
          if (k === 'relshipkind') continue;
          if (k === 'viewkind') continue;
          if (k === 'valueset') continue;
          if (k === 'inputrels') continue;
          if (k === 'outputrels') continue;
          if (k === 'allProperties') continue;
          if (k === 'objectviews') continue;
          if (k === 'relshipviews') continue;
          if (k === 'deleted') continue;
          if (k === 'modified') continue;
        }
        if (k === 'id') {
          val = inst.id;
        } else if (k === 'typename') {
          val = inst.type.name;
        } else if (k === 'name') {
          val = inst.name;
        } else if (k === 'description') {
          val = inst.description;
          if (!val) val = "";
        } else {
          val = inst.getStringValue2(k);
          if (!val) val = "";
        }
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
    if (!debug) console.log('108 SelectionInspector ', dets);
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
