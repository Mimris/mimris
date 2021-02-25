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

  isPropIncluded(k: string, type: akm.cxType): boolean {
    let retVal = true;
    if (k === 'id') retVal = false;
    if (k === 'class') retVal = false;
    if (k === 'category') retVal = false;
    if (k === 'abstract') retVal = false;
    if (k === 'nameId') retVal = false;
    if (k === 'fs_collection') retVal = false;
    if (k === 'parent') retVal = false;
    if (k === 'parentModel') retVal = false;
    if (k === 'object') retVal = false;
    if (k === 'relship') retVal = false;
    if (k === 'type') retVal = false;
    if (k === 'typeRef') retVal = false;
    if (k === 'typeview') retVal = false;
    if (k === 'typeviewRef') retVal = false;
    if (k === 'group') retVal = false;
    if (k === 'isGroup') retVal = false;
    if (k === 'groupLayout') retVal = false;
    if (k === 'objectRef') retVal = false;
    if (k === 'fromObject') retVal = false;
    if (k === 'toObject') retVal = false;
    if (k === 'fromobjectRef') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'toobjectRef') retVal = false;
    if (k === 'relshipRef') retVal = false;
    if (k === 'toObjviewRef') retVal = false;
    if (k === 'fromObjviewRef') retVal = false;
    if (k === 'toObjview') retVal = false;
    if (k === 'fromObjview') retVal = false;
    if (k === 'viewkind') retVal = false;
    if (k === 'relshipkind') retVal = false;
    if (k === 'valueset') retVal = false;
    if (k === 'inputrels') retVal = false;
    if (k === 'outputrels') retVal = false;
    if (k === 'allProperties') retVal = false;
    if (k === 'propertyValues') retVal = false;
    if (k === 'objectviews') retVal = false;
    if (k === 'relshipviews') retVal = false;
    if (k === 'isCollapsed') retVal = false;
    if (k === 'visible') retVal = false;
    if (k === 'deleted') retVal = false;
    if (k === 'modified') retVal = false;
    if (k === 'defaultValue') retVal = false;
    if (k === 'allowedValues') retVal = false;
    if (k === 'currentTargetModelview') retVal = false;
    if (k === 'pasteViewsOnly') retVal = false;
    if (k === 'deleteViewsOnly') retVal = false;
    if (k === 'layer') retVal = false;
    if (k === 'loc') retVal = false;
    if (k === 'size') retVal = false;
    if (k === 'modeltype') retVal = false;
    if (k === 'metamodelRef') retVal = false;
    if (k === 'targetMetamodelRef') retVal = false;
    if (k === 'sourceModelRef') retVal = false;
    if (k === 'targetModelRef') retVal = false;
    if (k === 'isTemplate') retVal = false;
    if (k === 'isMetamodel') retVal = false;
    if (type?.name !== 'ViewFormat') {
      if (k === 'viewFormat') retVal = false;
    }
    if (type?.name !== 'InputPattern') {
      if (k === 'inputPattern') retVal = false;
    }
    return retVal;
  }
  
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
    } else if (category === 'Object') {
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
    } else if (category === 'Object type') {
      inst = selObj;
      instview = null;
    } else if (category === 'Metis') {
      inst = selObj;
    } else if (category === 'Model view') {
      inst = selObj;
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
    let useItem = false;
    let useFileImg = false;
    switch (modalContext?.what) {
      case 'editProject':
        item = modalContext.gojsModel?.nodes[0];
        useItem = true;
        break;
      case 'editModel':
        item = myMetis.currentModel;
        useItem = true;
        break;
      case 'editModelview':
        item = myMetis.currentModelview;
        useItem = true;
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
        useFileImg = true;
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
    if (debug) console.log('97 item', inst, item);
    for (const k in item) {
      let row;
      if (k) {
        let val = item[k]; 
        let valuetype = 'text';
        if (typeof(val) === 'object') continue;
        if (typeof(val) === 'function') continue;
        if (!this.isPropIncluded(k, type)) 
          continue;
        if (hideNameAndDescr) {
          if (k === 'name' || k === 'description') continue;
        }
        val = (item.id === inst.id) ? item[k] : selObj[k];
        if (useItem) val = item[k];
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
        // if ( k === 'icon') {
        //   // if (useFileImg) { 
        //   //   valuetype = 'file';
        //   //   val = item[k];
        //   // } else {
        //     valuetype = 'text';
        //     val = item[k];
        //   // }
        // }  
        // if (k === 'icon') {
        //   valuetype = 'text';
        //   val = item[k];
        // }
        if (debug) console.log('195 SelectionInspector: k, val', k, val);
        if (!val) val = "";
        if (debug) console.log('197 propname, value:', val, k, item[k], valuetype, selObj);
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
      <div id='myInspectorDiv' className='inspector d-flex justify-content-between  w-100'>
        <table>
          <tbody className="table-body ">
            {this.renderObjectDetails()}
          </tbody>
        </table>
      </div>
    )
  }
}
