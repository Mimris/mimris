// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';

import { InspectorRow } from './InspectorRow';

// import './Inspector.css';

const debug = false;
interface SelectionInspectorProps {
  myMetis: any;
  selectedData: any;
  context: any;
  onInputChange: (id: string, value: string, selectedData: any, context: any, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    if (!debug) console.log('24  myMetis', this.props, this.props.selectedData);
    const selObj = this.props.selectedData;
    const modalContext = this.props.modalContext;
    if (debug) console.log('29 modalContext', modalContext, selObj);
    if (!selObj)
      return;
    const category = selObj.category;
    let inst, instview, typeview, item;
    if (category === 'Object') {
      inst = selObj.object;
      inst = myMetis.findObject(inst?.id);
      instview = selObj.objectview;
      instview = myMetis.findObjectView(instview?.id);
      typeview = instview?.typeview;
    } else if (category === 'Relationship') {
      inst = selObj.relship;
      inst = myMetis.findRelationship(inst?.id);
      instview = selObj.relshipview;
      instview = myMetis.findRelationshipView(instview?.id);
      typeview = instview?.typeview;
    }
    if (!inst)
      return;
    const type = inst.type;
    const props = type.properties;
    for (let i=0; i<props?.length; i++) {
      const prop = props[i];
      const v = inst[prop.name];
      if (!v) inst[prop.name] = "";
    }
    if (debug) console.log('56 inst', props, inst, selObj);
    const dets = [];
    switch (modalContext?.what) {
      case "editObject":
        item = inst;
        break;
      case "editRelationship":
        item = inst;
        break;
      case "editObjectview":
        item = instview;
        break;
      case "editTypeview":
        item = instview.typeview?.data;
        break;  
      default:
        item = inst;
    }
    if (!debug) console.log('71 item', inst, item);
    for (const k in item) {
      let row;
      if (k) {
        let val = item[k]; 
        if (true) { // Filter values
          if (typeof(val) === 'object') continue;
          if (k === 'id') continue;
          if (k === 'class') continue;
          if (k === 'category') continue;
          if (k === 'abstract') continue;
          if (k === 'nameId') continue;
          if (k === 'fs_collection') continue;
          if (k === 'parent') continue;
          if (k === 'parentModel') continue;
          if (k === 'type') continue;
          if (k === 'typeRef') continue;
          // if (k === 'typeName') continue;
          if (k === 'typeview') continue;
          if (k === 'typeviewRef') continue;
          if (k === 'group') continue;
          if (k === 'isGroup') continue;
          if (k === 'groupLayout') continue;
          if (k === 'objectRef') continue;
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
          if (k === 'propertyValues') continue;
          if (k === 'objectviews') continue;
          if (k === 'relshipviews') continue;
          if (k === 'isCollapsed') continue;
          if (k === 'visible') continue;
          if (k === 'deleted') continue;
          if (k === 'modified') continue;
          if (type.name !== 'ViewFormat' && type.name !== 'Datatype') {
            if (k === 'viewFormat') continue;
          }
          if (type.name !== 'InputPattern' && type.name !== 'Datatype') {
            if (k === 'inputPattern') continue;
          }
        }
        val = (item.id === inst.id) ? item[k] : selObj[k];
        if (debug) console.log('119 SelectionInspector: k, val', k, val);
        if (!val) val = "";
        if (!debug) console.log('121 propname, value:', k, item[k], item);
        row  = <InspectorRow
          key={k}
          id={k}
          value={val}
          obj= {selObj}
          context= {modalContext}
          onInputChange={this.props.onInputChange} 
        />
      }
      if (k === 'key') {
        dets.unshift(row); // key always at start
      } else {
        dets.push(row);
      }
    }
    if (debug) console.log('114 SelectionInspector ', dets);
    return dets;
  }
  
  public render() {
    if (!debug) console.log('113 SelectionInspector ', this.renderObjectDetails());

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
