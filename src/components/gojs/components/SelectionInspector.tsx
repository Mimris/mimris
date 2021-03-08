// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
import { InspectorRow } from './InspectorRow';
const toHex = require('colornames');
const convert = require('color-convert');
// import './Inspector.css';
import * as uic from '../../../akmm/ui_common';

const debug = false;
interface SelectionInspectorProps {
  myMetis: any;
  selectedData: any;
  context: any;
  onInputChange: (id: string, value: string, fieldType: string, selectedData: any, context: any, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {

  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (debug) console.log('102 selObj', selObj, myMetis);
    let inst, instview, typeview, item;
    if (selObj.type === 'GraphLinksModel') {
      return;
    } else if (category === 'Object') {
      inst = selObj.object;
      if (debug) console.log('108 inst', inst);
      inst = myMetis.findObject(inst?.id);
      if (debug) console.log('110 inst', inst);
      // instview = selObj.objectview;
      // instview = myMetis.findObjectView(instview?.id);
      instview = selObj;
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
    if (debug) console.log('122 inst, instview', inst, instview);
    if (inst == undefined)
      return;
    const type = inst.type;
    const properties = type?.properties;
    for (let i=0; i<properties?.length; i++) {
      const prop = properties[i];
      const v = inst[prop.name];
      if (!v) inst[prop.name] = "";  // Sets empty string if undefined
    }
    if (debug) console.log('132 inst', properties, inst, selObj);
    const dets = [];
    let hideNameAndDescr = false;
    let useColor = false;
    let useItem = false;
    switch (modalContext?.what) {
      // case 'editProject':
      //   item = modalContext.gojsModel?.nodes[0];
      //   useItem = true;
      //   break;
      // case 'editModel':
      //   item = myMetis.currentModel;
      //   useItem = true;
      //   break;
      // case 'editModelview':
      //   item = myMetis.currentModelview;
      //   useItem = true;
      //   break;
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
    if (!debug) console.log('177 item', inst, item);
    for (const k in item) {
      let row;
      let fieldType = 'text';
      let readonly = false;
      let disabled = false;
      let checked  = false;
      let pattern  = "";
      let required = false;
      if (k) {
        let val = item[k]; 
        if (typeof(val) === 'object') continue;
        if (typeof(val) === 'function') continue;
        if (!uic.isPropIncluded(k, type)) 
          continue;
        if (hideNameAndDescr) {
          if (k === 'name' || k === 'description') continue;
        }
        if (k === 'typeName' || k === 'typename')
          disabled = true;
        if (properties?.length > 0) {
          if (debug) console.log('191 properties: ', properties);
          for (let i=0; i<properties.length; i++) {
            const prop = properties[i];
            if (prop.name === k) {
              const dtypeRef = prop.datatypeRef;
              const dtype = myMetis.findDatatype(dtypeRef);
              if (dtype) {
                fieldType = dtype.fieldType;
                pattern = dtype.inputPattern;
              }
            }
            if (debug) console.log('198 prop, dtype, fieldType: ', prop, fieldType);
          }
        }
        if (debug) console.log('211 k, val', k, val);
        val = (item.id === inst.id) ? item[k] : selObj[k];
        if (debug) console.log('213 k, val', k, val);
        if (useItem) val = item[k];
        if (useColor && (k === 'fillcolor' || k === 'strokecolor')){
          if (debug) console.log('203 val', val);
          fieldType = 'color';
          if (val?.substr(0,4) === 'rgb(') {
            if (debug) console.log('206 val', val);
            let color = '#'+val.match(/\d+/g).map(function(x){
              x = parseInt(x).toString(16);
              return (x.length==1) ? "0"+x : x;
            }).join("");
            if (debug) console.log('211 color', color);
            val = color.toUpperCase();
          }
          if ((val) && val[0] !== '#') {
            // Convert colorname to hex
            val = toHex(val); 
          }         
          if (debug) console.log('218 color', val);
        }
        if (k === 'strokecolor1')
          val = item['strokecolor'];
        if (fieldType === 'checkbox') {
          if (debug) console.log('171 val', val);
          checked = (item.id === inst.id) ? item[k] : selObj[k];
          if (checked === "") checked = val = "false";
          if (debug) console.log('172 checked, val', checked, val);
        }
        if (debug) console.log('233 selObj, item:', selObj, item);
        if (!val) val = "";
        if (debug) console.log('235 id, value:', k, val);
        row  = <InspectorRow
          key={k}
          id={k}
          type={fieldType}
          value={val}
          readonly={readonly}
          disabled={disabled}
          required={required}
          checked={checked}
          pattern={pattern}
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
    if (debug) console.log('255 SelectionInspector ', dets);
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
