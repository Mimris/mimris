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
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';

const debug = false;
interface SelectionInspectorProps {
  myMetis: any;
  selectedData: any;
  context: any;
  onInputChange: (props: any, value: string, isBlur: boolean) => void;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {

  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = myMetis.currentModel;
    const allowsMetamodeling = myModel.includeSystemtypes;
    if (debug) console.log('33 allowsMetamodeling', myModel, allowsMetamodeling);
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (debug) console.log('102 selObj', selObj, myMetamodel);
    let inst, instview, typeview, item;
    if (selObj.type === 'GraphLinksModel') {
      return;
    } else if (category === constants.gojs.C_OBJECT) {
      inst = selObj.object;
      if (debug) console.log('108 inst', inst);
      inst = myMetis.findObject(inst?.id);
      if (debug) console.log('110 inst', inst);
      instview = selObj;
      typeview = instview?.typeview;
    } else if (category === constants.gojs.C_RELATIONSHIP) {
      instview = selObj.relshipview;
      instview = myMetis.findRelationshipView(instview?.id);
      inst = selObj.relship;
      if (!inst) inst = instview?.relship;
      inst = myMetis.findRelationship(inst?.id);
      typeview = instview?.typeview;
    } else if (category === constants.gojs.C_OBJECTTYPE) {
      inst = selObj;
      instview = null;
    } else if (category === constants.gojs.C_RELSHIPTYPE) {
      inst = selObj;
      instview = null;
    } else if (category === constants.gojs.C_METIS) {
      inst = selObj;
    } else if (category === constants.gojs.C_MODELVIEW) {
      inst = selObj;
    }
    if (debug) console.log('63 inst, instview', inst, instview);
    if (inst == undefined)
      return;
    let type = inst.type;
    if (!type) type = selObj.objecttype;
    const properties = type?.properties;
    for (let i=0; i<properties?.length; i++) {
      const prop = properties[i];
      const v = inst[prop.name];
      if (!v) inst[prop.name] = "";  // Sets empty string if undefined
    }
    if (debug) console.log('72 inst', properties, inst, selObj);
    const dets = [];
    let hideNameAndDescr = false;
    let useColor = false;
    let useItem = false;
    const what = modalContext?.what;
    switch (what) {
      case "toBeDefined":
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
      break;
      case "editObjectType":
        item = inst.objecttype;
        break;
      case "editObject":
        item = inst;
        break;
      case "editRelationshipType":
        item = inst.reltype;
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
        if (debug) console.log('117 item', item);
        break;  
      default:
        item = inst;
    }
    if (debug) console.log('122 item', inst, item);
    for (let k in item) {
      if (k === 'abstract') {
        if (!(category === constants.gojs.C_OBJECT || category === constants.gojs.C_OBJECTTYPE))
          continue;
      }
      if (k === 'viewkind') {
        if (!(category === constants.gojs.C_OBJECT || category === constants.gojs.C_OBJECTTYPE))
          continue;
      }
      if (k === 'relshipkind') {
        if (!(category === constants.gojs.C_RELATIONSHIP || category === constants.gojs.C_RELSHIPTYPE))
          continue;
      }
      let row;
      if (k) {
        let fieldType = 'text';
        let readonly = false;
        let disabled = false;
        let checked  = false;
        let pattern  = "";
        let required = false;
        let defValue = "";
        let values   = [];
        let val      = item[k]; 
        if (typeof(val) === 'object') continue;
        if (typeof(val) === 'function') continue;
        if (k !== 'markedAsDeleted') {
          if (!uic.isPropIncluded(k, type)) 
            continue;
        } else if (!val) {          
            continue;
        }
        if (hideNameAndDescr) {
          if (k === 'name' || k === 'description') continue; 
        }
        if (properties?.length > 0) {
          if (debug) console.log('191 properties: ', properties);
          for (let i=0; i<properties.length; i++) {
            const prop = properties[i];
            if (prop.name === k) {
              const dtypeRef = prop.datatypeRef;
              const dtype = myMetis.findDatatype(dtypeRef);
              if (dtype) {
                fieldType = dtype.fieldType;
                pattern   = dtype.inputPattern;
                defValue  = dtype.defaultValue;
                values    = dtype.allowedValues;
              }
            }
            if (debug) console.log('198 prop, dtype, fieldType: ', prop, fieldType);
          }
        }
        if (debug) console.log('169 k, val', k, item[k], selObj[k]);
        val = (item.id === inst.id) ? item[k] : selObj[k];
        if ((what === 'editObjectType') || (what === 'editRelationshipType')) {
          val = item[k];
        }
        if (debug) console.log('179 k, val', k, val, item[k], selObj[k]);
        if (useItem) val = item[k];
        if (useColor && (k === 'fillcolor' || k === 'strokecolor')) {
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

        let dtype;
        switch(k) {
          case 'cardinalityFrom':
          case 'cardinalityTo':
            dtype = myMetamodel.findDatatypeByName('cardinality');
            if (dtype) {
              fieldType = dtype.fieldType;
              pattern   = dtype.inputPattern;
              defValue  = dtype.defaultValue;
              values    = dtype.allowedValues;
            }
            if (!allowsMetamodeling) disabled = true;
            break;
          case 'fieldType':
          case 'viewkind':
          case 'relshipkind':
            dtype = myMetamodel.findDatatypeByName(k);
            if (debug) console.log('220 dtype', dtype);
            if (dtype) {
              fieldType = dtype.fieldType;
              pattern   = dtype.inputPattern;
              defValue  = dtype.defaultValue;
              values    = dtype.allowedValues;
            }
            if (!allowsMetamodeling) disabled = true;
            break;
          case 'abstract':
            dtype = myMetis.findDatatypeByName('boolean');
            fieldType = 'checkbox';
            if (!allowsMetamodeling) disabled = true;
            break;
        }

        if (fieldType === 'checkbox') {
          if (debug) console.log('171 val', val);
          checked = val;
          if (debug) console.log('174 checked, val', checked, val);
        }

        if (fieldType === 'radio') {
          if (debug) console.log('238 values, defValue', values, defValue);
          fieldType = 'select';
          const p1 = "^(";
          const p2 = ")$";
          let p = "";
          let cnt = 0;
          for (let i=0; i<values?.length; i++) {
            const value = values[i];
            if (debug) console.log('246 value', i, value);
            if (p === "") {
              p = value;
            } else {
              p += "|" + value;
            }
          }
          pattern = p1 + p + p2;
          if (debug) console.log('254 pattern', pattern);
        }

        if (fieldType === 'select') {
          if (debug) console.log('258 values, defValue', values, defValue);
          if (val === "")
            val = defValue;
        }

        switch(k) {
          case "typename":
          case "typeName":
            name = "Type name";
            disabled = true;
            break;
          case "markedAsDeleted":
            name = "Is deleted";
            disabled = true;
            break;
          case "loc":
          case "id":
            disabled = true;
            break;
          default:
            name = utils.capitalizeFirstLetter(k);
            break;
        }

        if (debug) console.log('274 selObj, item:', selObj, item);
        if (debug) console.log('275 id, value, disabled:', k, val, disabled);
        if (debug) console.log('276 k, fieldType', k, fieldType, defValue, values);
        row  = <InspectorRow
          key={k}
          id={k}
          type={fieldType}
          value={val}
          values={values}
          default={defValue}
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
    if (debug) console.log('306 SelectionInspector ', dets);
    return dets;
  }
  
  public render() {
    if (debug) console.log('311 SelectionInspector ', this.renderObjectDetails());
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
