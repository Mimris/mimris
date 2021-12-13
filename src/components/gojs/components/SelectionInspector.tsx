// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
import { InspectorRow } from './InspectorRow';
const toHex = require('colornames');
const convert = require('color-convert');
const printf = require('printf');
// import './Inspector.css';
import * as uic from '../../../akmm/ui_common';
import * as ui_mtd from '../../../akmm/ui_methods';
import * as uit from '../../../akmm/ui_templates';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';

const debug = false;
interface SelectionInspectorProps {
  myMetis: any;
  selectedData: any;
  context: any;
  activeTab: "0";
  onInputChange: (props: any, value: string, isBlur: boolean) => void;
}
const arrowheads = ['None', 
                    'Standard', 'Backward', 
                    'OpenTriangle', 'Triangle', 
                    'BackwardOpenTriangle', 'BackwardTriangle',
                    'Diamond', 'StretchedDiamond', 
                    'Fork', 'BackwardFork', 
                    'LineFork', 'BackwardLineFork', 
                    'Circle', 'Block'];

const colornames = ['black', 'white', 
                    'red', 'pink', 
                    'green', 'lightgreen', 'darkgreen', 'seagreen',
                    'blue', 'lightblue', 'darkblue', 'skyblue', 
                    'grey', 'lightgrey', 'darkgrey',
                    'yellow', 'yellowgreen', 'orange', 
                    'brown', 'purple', 
                    'violet', 'turquoise'
                   ];

const strokewidths = ['1', '2', '3', '4', '5'];

const includeRelshipkind = false;

const useTabs = true;

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis;
    const activeTab = this.props.activeTab;
    if (debug) console.log('58 activeTab', activeTab);
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = myMetis.currentModel;
    const allowsMetamodeling = myModel.includeSystemtypes;
    if (debug) console.log('33 allowsMetamodeling', myModel, allowsMetamodeling);
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (debug) console.log('37 selObj', selObj, myMetamodel);
    if (selObj.type === 'GraphLinksModel') {
      return;
    } 
    let inst, inst1, instview, type, typeview, item, chosenType, nameFieldtype, description, currentType;
    if (category === constants.gojs.C_OBJECT || category === constants.gojs.C_OBJECTTYPE) {
      instview = selObj.objectview;
      instview = myMetis.findObjectView(instview?.id);
      inst = selObj.object;
      if (debug) console.log('75 inst', inst, selObj);
      if (!inst) inst = instview?.object;
      inst = myMetis.findObject(inst?.id);   
      inst1 = inst; 
      type = inst?.type;
      if (!type) type = selObj.objecttype;
      type = myMetis.findObjectType(type.id);
      typeview = instview?.typeview;
    } else if (category === constants.gojs.C_RELATIONSHIP || category === constants.gojs.C_RELSHIPTYPE) {
      instview = selObj.relshipview;
      instview = myMetis.findRelationshipView(instview?.id);
      inst = selObj.relship;
      if (debug) console.log('103 inst', inst, selObj);
      if (!inst) inst = instview?.relship;
      inst = myMetis.findRelationship(inst?.id);
      type = inst?.type;
      if (!type) type = selObj.relshiptype;
      typeview = instview?.typeview;
    }

    if (category === constants.gojs.C_OBJECT) {
      if (type.name === 'Method') {
         chosenType = null;
      } else {
        currentType = inst1?.type;
        let namelist = ['All'];
        if (debug) console.log('100 inst1', inst1);
        if (useTabs && modalContext?.what === 'editObject') {
          const inheritedTypes = inst1?.getInheritedTypes();
          inheritedTypes.push(currentType);
          inheritedTypes.reverse();
          namelist = inst1.getInheritedTypeNames();
          namelist.push(inst1.type.name);
          namelist.reverse();
          namelist.push('All');
          let typename = namelist[activeTab];
          if (namelist.length > 1 && typename !== 'Element' && typename !== 'All') {
            for (let i=0; i<inheritedTypes.length; i++) {
              const tname = inheritedTypes[i]?.name;
              if (tname === typename) {
                type = inheritedTypes[i];
                chosenType = type;
                if (debug) console.log('105 type', type);
              }
            }
          } 
          if (debug) console.log('120 typename', typename);
          if (typename === 'All') {
            chosenType = null;
            if (debug) console.log('123 type', type);
          }  
        }
        if (!inst1?.hasInheritedProperties())
          chosenType = null;
      }
      if (debug) console.log('129 inst1, chosenType', inst1, chosenType);
      instview = selObj;
      typeview = instview?.typeview;      
    } else if (category === constants.gojs.C_RELATIONSHIP) {
      instview = selObj.relshipview;
      instview = myMetis.findRelationshipView(instview?.id);
      inst = selObj.relship;
      if (debug) console.log('103 inst', inst, selObj);
      if (!inst) inst = instview?.relship;
      inst = myMetis.findRelationship(inst?.id);
      // type = inst.type;
      type = inst?.type;
      if (!type) type = selObj.relshiptype;
      typeview = instview?.typeview;
    } else if (category === constants.gojs.C_OBJECTTYPE) {
      inst = selObj.objecttype;
      if (debug) console.log('145 inst', inst);
      inst = myMetis.findObjectType(inst?.id);
      if (debug) console.log('147 inst', inst);
      type = inst;
      instview = null;
    } else if (category === constants.gojs.C_RELSHIPTYPE) {
      inst = selObj.reltype;
      if (debug) console.log('119 inst', inst);
      inst = myMetis.findRelationshipType(inst?.id);
      if (debug) console.log('121 inst', inst);
      type = inst;
      instview = null;
    } else if (category === constants.gojs.C_METIS) {
      inst = selObj;
    } else if (category === constants.gojs.C_MODELVIEW) {
      inst = selObj;
    }
    if (debug) console.log('162 inst, instview', inst, instview);
    if (inst == undefined)
      return;
    if (typeof(type) !== 'object')
      return;
    if (debug) console.log('167 type', type);
    let props;
    if (chosenType) {
      props = chosenType.getProperties(false);
      if (debug) console.log('172 chosenType, props', chosenType, properties);
    } 
    else if (type.name === 'Method') {
      inst = myMetis.findObject(inst.id);
      props = inst.setAndGetAllProperties(myMetis);
    }
    else {
      let flag = false;
      props = type?.getProperties(flag);
      if (debug) console.log('181 props', props);
    }
    let properties = props;
    if (debug) console.log('184 props', properties);
    for (let i=0; i<properties?.length; i++) {
      const prop = properties[i];
      if (!prop) 
        continue;
      const v = inst[prop.name];
      if (debug) console.log('190 prop.name, inst', prop.name, inst);
      if (!v) inst[prop.name] = "";  // Sets empty string if undefined
    }
    if (debug) console.log('193 properties, inst, selObj', properties, inst, selObj);
    const dets = [];
    let hideNameAndDescr = false;
    let useColor = false;
    let useItem = false;
    let isLabel = false;
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
        // item = inst.objecttype;
        item = type;
        break;
      case "editObject":
        item = inst;
        if (type.name === 'Label')
          isLabel = true;
        break;
      case "editRelationshipType":
        item = inst.reltype;
        item = type;
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
        // if (instview) 
        //   item = instview.typeview?.data;
        if (selObj.category === constants.gojs.C_RELATIONSHIP) {
          item = inst.type.typeview;
        } else if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
          item = inst.typeview;
          // for (const prop in item.data) {
          //   item[prop] = item.data[prop];
          // }
        } else if (selObj.category === constants.gojs.C_OBJECT) {
          item = inst.type.typeview;
        } else if (selObj.category === constants.gojs.C_OBJECTTYPE) {
          item = inst.typeview;
        }

        hideNameAndDescr = true;
        if (debug) console.log('219 inst, item', inst, item);
        break;  
      default:
        item = inst;
    }
    if (debug) console.log('224 inst, item, selObj', inst, item, selObj);
    for (let k in item) {
      if (k === 'abstract') {
        if (!(category === constants.gojs.C_OBJECT || 
              category === constants.gojs.C_OBJECTTYPE)) 
          continue;
      }
      if (k === 'viewkind') {
        if (!(category === constants.gojs.C_OBJECT || 
              category === constants.gojs.C_OBJECTTYPE))
          continue;
      }
      if (k === 'relshipkind') {
        if (!includeRelshipkind)
          continue;
        if (!(category === constants.gojs.C_RELATIONSHIP || 
              category === constants.gojs.C_RELSHIPTYPE))
          continue;
      }
      if (k === 'text') {
        if (!isLabel)
          continue;
      }

      if (chosenType) {
        let found = false;
        for (let n = 0; n<properties.length; n++) {
          const p = properties[n];
          if (p.name === k) {
            found = true;
            break;
          }
        }
        switch (chosenType.name) {
          case 'EntityType':
            if ((k === 'id') || (k === 'name') || (k === 'description') 
                || (k === 'typeName') 
                || (k === 'abstract') || (k === 'viewkind')
                )
              found = true;
            break;
          case 'All':
              found = true;
              break;
          default:
            if ((k === 'id') || (k === 'name') || (k === 'description'))
              found = true;
            break;
          }
        if (!found) continue;
      }
      if (debug) console.log('296 props', properties);

      let row;
      description = "";
      if (k) {
        let fieldType = 'text';
        let viewFormat = "";
        let readonly = false;
        let disabled = false;
        let checked  = false;
        let pattern  = "";
        let required = false;
        let defValue = "";
        let values   = [];
        let val      = item[k]; 
        if (k === 'dash') {
          if (typeof(val) === 'object') {
            val = val.valueOf();
            if (typeof(val) !== 'string')
              continue;
          }
        }
        if (typeof(val) === 'object') continue;        
        if (typeof(val) === 'function') continue;
        
        if (k !== 'markedAsDeleted') {
          if (!uic.isPropIncluded(k, type)) 
            continue;
        } else if (!val) {          
            continue;
        }
        if (hideNameAndDescr) {
          if (k === 'name' || k === 'description' || k === 'title') continue; 
        }
        if (debug) console.log('302 k, item[k], selObj[k]: ', k, item[k], selObj[k]);
        switch (what) {
          case 'editObjectType':
          case 'editRelationshipType':
          case 'editObjectview':
          case 'editRelshipview':
            val = selObj[k]; // item[k];
            break;
          case 'editTypeview':
            const tview = item;
            if (tview?.category === constants.gojs.C_OBJECTTYPEVIEW) {
              val = tview.data[k];
            } else 
              val = item[k];
            if (tview?.category === constants.gojs.C_RELSHIPTYPEVIEW) {
              val = tview.data[k];
            } else 
              val = item[k];
            break;
          case 'editObject':
          case 'editRelationship':
            if (selObj[k]) {
              if (debug) console.log('352 k, selObj, item', k, selObj, item);
              item[k] = selObj[k];
            }
            if (item.id === inst.id) {
              val = item[k];
            } else {
              val = selObj[k];
            }
            break;
          default:
            val = (item.id === inst.id) ? item[k] : selObj[k] ? selObj[k] : item[k];
            break;
        }
        if (debug) console.log('334 k, val, item[k], selObj[k]: ', k, val, item[k], selObj[k]);
        if (properties?.length > 0) {
          if (debug) console.log('338 properties: ', properties);
          for (let i=0; i<properties.length; i++) {
            const prop = properties[i];
            if (prop && prop.name === k) {
              let dtype = prop.datatype;
              const dtypeRef = prop.datatypeRef;
              if (!dtype) dtype = myMetis.findDatatype(dtypeRef);
              if (dtype) {
                fieldType   = dtype.fieldType;
                viewFormat  = dtype.viewFormat
                pattern     = dtype.inputPattern;
                defValue    = dtype.defaultValue;
                values      = dtype.allowedValues;
                description = prop.description;
              }
              const mtdRef = prop.methodRef;
              if (mtdRef) {
                disabled = true;
                if (inst.category === constants.gojs.C_OBJECT) {
                  const obj = myMetis.findObject(inst.id);
                  if (obj) inst = obj;
                } else if (inst.category === constants.gojs.C_RELATIONSHIP) {
                  const rel = myMetis.findRelationship(inst.id);
                  if (rel) inst = rel;
                }
                if (debug) console.log('403 inst, prop', inst, prop);
                try {
                  val = inst.getPropertyValue(prop, myMetis);
                } catch {
                  // Do nothing
                }
                if (debug) console.log('412 inst, prop, val', inst, prop, val);
              }
            }
            if (debug) console.log('415 prop, fieldType: ', prop, fieldType);
          }
        }
        if (debug) console.log('417 k, val', k, val, item[k], selObj[k]);
        if (useItem) val = item[k];
        if (useColor && (k === 'fillcolor' || k === 'strokecolor')) {
          if (debug) console.log('356 val', val);
          fieldType = 'color';
          if (val?.substr(0,4) === 'rgb(') {
            if (debug) console.log('359 val', val);
            let color = '#'+val.match(/\d+/g).map(function(x){
              x = parseInt(x).toString(16);
              return (x.length==1) ? "0"+x : x;
            }).join("");
            if (debug) console.log('364 color', color);
            val = color.toUpperCase();
          }
          if ((val) && val[0] !== '#') {
            // Convert colorname to hex
            val = toHex(val); 
          }         
          if (debug) console.log('371 color', val);
        }
        if (debug) console.log('386 k, val', k, val, item[k], selObj[k]);
        let dtype;
        switch(k) {
          case 'description':
          case 'geometry':
            fieldType = 'textarea';
            break;
          case 'cardinalityFrom':
          case 'cardinalityTo':
            dtype = myMetamodel.findDatatypeByName('cardinality');
            if (dtype) {
              fieldType   = 'select' // dtype.fieldType;
              viewFormat  = dtype.viewFormat
              pattern     = dtype.inputPattern;
              defValue    = dtype.defaultValue;
              values      = dtype.allowedValues;
            }
            if (!allowsMetamodeling) disabled = true;
            break;
          case 'fieldType':
          case 'viewkind':
          case 'relshipkind':
            dtype = myMetamodel.findDatatypeByName(k);
            if (debug) console.log('396 dtype', dtype);
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
          case 'methodtype':
            const methodTypes = myMetamodel.methodtypes;
            if (methodTypes) {
              values = methodTypes.map(mm => mm && mm.name);
              fieldType = 'radio';
            }
            break;
          case 'dash':
            values = ['None', 'Dashed', 'Dotted'];
            defValue = 'None';
            fieldType = 'radio';
            break;
          case 'template':
            if (!item.isGroup) {
              values = uit.getNodeTemplateNames();
              defValue = '';
              fieldType = 'select';
            } else {
              values = uit.getGroupTemplateNames();
              defValue = '';
              fieldType = 'select';
            }
            break;
          case 'fromArrow':
          case 'toArrow': {
            values = arrowheads;
            defValue = 'None';
            fieldType = 'select';
          }
          break;
          case 'fillcolor':
            if (!useColor) {
              values = colornames;
              defValue = 'white';
              fieldType = 'select';
            }
            break;
          case 'strokecolor':
            if (!useColor) {
              values = colornames;
              defValue = 'black';
              fieldType = 'select';
            }
            break;
          case 'textcolor':
          case 'fromArrowColor':
          case 'toArrowColor':
              values = colornames;
              defValue = 'black';
              fieldType = 'select';            
            break;
        }
        // Handle fieldtypes
        if (fieldType === 'checkbox') {
          if (debug) console.log('464 val', val);
          checked = val;
          if (debug) console.log('466 checked, val', checked, val);
        }
        if (fieldType === 'radio') {
          if (debug) console.log('469 values, defValue', values, defValue);
          fieldType = 'select';
          const p1 = "^(";
          const p2 = ")$";
          let p = "";
          let cnt = 0;
          for (let i=0; i<values?.length; i++) {
            const value = values[i];
            if (debug) console.log('477 value', i, value);
            if (p === "") {
              p = value;
            } else {
              p += "|" + value;
            }
          }
          pattern = p1 + p + p2;
          if (debug) console.log('485 pattern', pattern);
        }
        if (fieldType === 'select') {
          if (debug) console.log('488 values, defValue', values, defValue);
          if (val === "")
            val = defValue;
        }
        if (k === 'name') {
          fieldType = 'text' // nameFieldtype;
        }
        if (viewFormat) {
          if (utils.isNumeric(val))
            val = printf(viewFormat, Number(val));
        }
        // Handle disabled
        switch(k) {
          case 'id':
            val = item[k];
            description = 'Unique identifier';
          case "typename":
          case "typeName":
          case "loc":
          case "size":
          case "markedAsDeleted":
            disabled = true;
            break;
        }
        if (debug) console.log('509 selObj, item:', selObj, item);
        if (debug) console.log('510 k, value, disabled:', k, val, disabled);
        if (debug && k==='name') console.log('511 k, fieldType', k, fieldType, defValue, values);
        if (isLabel) {
          if (k === 'viewkind')
            continue;
          switch(k) {
            default:
              disabled = true;
              break;
          }
        }
        row  = <InspectorRow
          key={k}
          id={k}
          type={fieldType}
          value={val}
          values={values}
          description={description}
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
    if (debug) console.log('545 SelectionInspector ', dets);
    return dets;
  }
  
  public render() {
    if (debug) console.log('550 SelectionInspector ', this.renderObjectDetails());
    const modalContext = this.props.context;
    if (!modalContext)
      return null;
    return (
      <div id='myInspectorDiv' className='inspector'>
        <table>
          <tbody className="table-body">
            {this.renderObjectDetails()}
          </tbody>
        </table>
      </div>
    )
  }
}
