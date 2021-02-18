// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
import { InspectorRow } from './InspectorRow';
const toHex = require('colornames');
const convert = require('color-convert');
// import './Inspector.css';

const debug = false;
interface SelectionInspectorProps {
  myMetis: any;
  selectedData: any;
  context: any;
  onInputChange: (id: string, value: string, valuetype: string, selectedData: any, context: any, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    if (debug) console.log('24  myMetis', this.props, this.props.selectedData);
    let selObj = this.props.selectedData;
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (debug) console.log('30 modalContext', modalContext, typeof(selObj), selObj);
    let inst, instview, typeview, item;
    if (selObj.type === 'GraphLinksModel') {
      return;
    }
    else if (category === 'Object') {
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
    } else if (category = 'Object type') {
      inst = selObj;
      instview = null;
    }
    if (debug) console.log('48 inst', inst);
    if (inst == undefined)
      return;
    const type = inst.type;
    const properties = type?.properties;
    for (let i=0; i<properties?.length; i++) {
      const prop = properties[i];
      const v = inst[prop.name];
      if (!v) inst[prop.name] = "";
    }
    if (debug) console.log('56 inst', properties, inst, selObj);
    const dets = [];
    let hideNameAndDescr = false;
    let useColor = false;
    switch (modalContext?.what) {
      case 'editProject':
        item = myMetis;
        break;
      case "editObject":
        item = inst;
        break;
      case "editRelationship":
        item = inst;
        break;
      case "editObjectview":
        item = instview;
        hideNameAndDescr = true;
        useColor = true;
        break;
      case "editRelshipview":
        item = instview;
        hideNameAndDescr = true;
        useColor = true;
        break;
      case "editTypeview":
        if (instview) item = instview.typeview?.data;
        else item = inst;
        hideNameAndDescr = true;
        if (debug) console.log('86 item', item);
        break;  
      default:
        item = inst;
    }
    if (debug) console.log('71 item', inst, item);
    for (const k in item) {
      let row;
      if (k) {
        let val = item[k]; 
        let valuetype = 'text';
        if (true) { // Filter values
          if (typeof(val) === 'object') continue;
          if (typeof(val) === 'function') continue;
          if (k === 'id') continue;
          if (k === 'key') continue;
          if (k === '__gohashid') continue;
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
          if (k === 'loc') continue;
          if (k === 'size') continue;
          if (k === 'objectRef') continue;
          if (k === 'fromObject') continue;
          if (k === 'toObject') continue;
          if (k === 'fromobjectRef') continue;
          if (k === 'toobjectRef') continue;
          if (k === 'toobjectRef') continue;
          if (k === 'relshipRef') continue;
          if (k === 'toObjviewRef') continue;
          if (k === 'fromObjviewRef') continue;
          if (k === 'viewkind') continue;
          if (k === 'relshipkind') continue;
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
          if (k === 'defaultValue') continue;
          if (k === 'allowedValues') continue;
         if (type?.name !== 'ViewFormat') {
            if (k === 'viewFormat') continue;
          }
          if (type?.name !== 'InputPattern') {
            if (k === 'inputPattern') continue;
          }
          if (hideNameAndDescr) {
            if (k === 'name' || k === 'description') continue;
          }
        }
        val = (item.id === inst.id) ? item[k] : selObj[k];
        if (useColor && (k === 'fillcolor' || k === 'strokecolor')){
          if (debug) console.log('156 val', val);
          valuetype = 'color';
          if (val.substr(0,4) === 'rgb(') {
            if (debug) console.log('159 val', val);
            let color = '#'+val.match(/\d+/g).map(function(x){
              x = parseInt(x).toString(16);
              return (x.length==1) ? "0"+x : x;
            }).join("");
            if (debug) console.log('164 color', color);
            val = color.toUpperCase();
          }
          if (val[0] !== '#') {
            // Convert colorname to hex
            val = toHex(val); 
          }         
          if (debug) console.log('166 color', val);
        }
        if (k === 'strokecolor1')
          val = item['strokecolor'];
        if (k === 'icon') {
          valuetype = 'file';
          val = "";
        }
        if (debug) console.log('174 SelectionInspector: k, val', k, val);
        if (!val) val = "";
        if (debug) console.log('176 propname, value:', val, k, item[k], valuetype, selObj);
        row  = <InspectorRow
          key={k}
          id={k}
          type={valuetype}
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
    if (debug) console.log('193 SelectionInspector ', dets);
    return dets;
  }
  
  public render() {
    if (debug) console.log('198 SelectionInspector ', this.renderObjectDetails());
    const modalContext = this.props.context;
    if (!modalContext)
      return null;
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
