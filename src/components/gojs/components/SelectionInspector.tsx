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
import * as akm from '../../../akmm/metamodeller';
import * as uic from '../../../akmm/ui_common';
import * as ui_mtd from '../../../akmm/ui_methods';
import * as uit from '../../../akmm/ui_templates';
import * as utils from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
import { editObjectview } from '../../../akmm/ui_diagram';

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

const useTabs = true;

const booleanAsCheckbox = false;

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis as akm.cxMetis;
    const activeTab = this.props.activeTab;
    if (debug) console.log('59 myMetis', myMetis);
    if (debug) console.log('60 this.props', this.props);
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = myMetis.currentModel;
    const allowsMetamodeling = myModel.includeSystemtypes;
    if (debug) console.log('64 allowsMetamodeling', myModel, allowsMetamodeling);
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (selObj?.type === 'GraphLinksModel') {
      return;
    } 
    let adminModel = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    let inst, inst1, instview, type, type1, typeview, objtypeview, reltypeview;
    let item, chosenType, description, currentType, properties, pointerProps;
    if (myMetis.isAdminType(selObj?.type)) {
      inst = selObj;
      type = inst.type;
    } else {
      switch(category) {
        case constants.gojs.C_OBJECT:
          inst = selObj.object;
          inst1 = myMetis.findObject(inst?.id);   
          if (inst1) inst = inst1;
          instview = selObj.objectview;
          instview = myMetis.findObjectView(instview?.id);
          type = selObj.objecttype;
          type1 = myMetis.findObjectType(type?.id);
          if (type1) type = type1;
          objtypeview = type?.typeview;
          objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
          break;
        case constants.gojs.C_OBJECTTYPE:
          type = selObj.objecttype;
          type1 = myMetis.findObjectType(type?.id);
          if (type1) type = type1;
          objtypeview = type?.typeview;
          objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
          break;
        case constants.gojs.C_RELATIONSHIP:
          inst = selObj.relship;
          inst1 = myMetis.findRelationship(inst?.id);   
          if (inst1) inst = inst1;
          instview = selObj.relshipview;
          instview = myMetis.findRelationshipView(instview?.id);
          type = selObj.relshiptype;
          type1 = myMetis.findRelationshipType(type?.id);
          if (type1) type = type1;
          reltypeview = type?.typeview;
          reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
          break;
        case constants.gojs.C_RELSHIPTYPE:
          type = selObj.reltype;
          type1 = myMetis.findRelationshipType(type?.id);
          if (type1) type = type1;
          reltypeview = type?.typeview;
          reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
          break;       
      }
    }
    // Set chosenType
    {
      if (category === constants.gojs.C_OBJECT) {
        if (debug) console.log('122 type', type);
        if (type?.name === 'Method') {
          chosenType = null;
        } else if (myMetis.isAdminType(type)) {
          chosenType = null;
        } else {
          currentType = inst.type;
          if (debug) console.log('128 inst', inst);
          if (useTabs && modalContext?.what === 'editObject') {
            const inheritedTypes = inst?.getInheritedTypes();
            inheritedTypes.push(currentType);

            let namelist = uic.getNameList(myModel, inst, true); 
            if (debug) console.log('135 namelist', namelist);
            let typename = namelist[activeTab];
            if (debug) console.log('116 typename, namelist, inheritedTypes', typename, namelist, inheritedTypes);
            if (namelist.length > 1 && typename !== 'Element' && typename !== 'All') {
              for (let i=0; i<inheritedTypes.length; i++) {
                const tname = inheritedTypes[i]?.name;
                if (tname === typename) {
                  type = inheritedTypes[i];
                  chosenType = type;
                  if (debug) console.log('124 chosenType', chosenType);
                }
              }
            } 
            if (debug) console.log('148 typename, chosenType', typename, chosenType);
            if (typename === 'All') {
              chosenType = null;
            }  
            if (!inst?.hasInheritedProperties(myModel)) {
              chosenType = null;
            }
          }
          if (debug) console.log('156 myModel', myModel);
        }
        if (debug) console.log('158 inst, inst1, selObj, chosenType', inst, inst1, selObj, chosenType);
        if (debug) console.log('159 instview, typeview', instview, typeview);
      }
    }
    if (typeof(type) !== 'object')
      return;
    if (debug) console.log('164 myMetis', myMetis);

    // Get properties, and handle empty property values
    {
      if (category === constants.gojs.C_OBJECT) {
        if (debug) console.log('167 chosenType', chosenType);
        if (chosenType) {
          properties = chosenType.getProperties(false);
          // if (debug) console.log('172 chosenType, properties', chosenType, properties);
          // pointerProps = chosenType.getPointerProperties(false);
        } 
        else if (type?.name === 'Method') {
          inst = myMetis.findObject(inst.id);
          properties = inst.setAndGetAllProperties(myMetis);
        } else {
          let flag = false;
          const typeProps = type?.getProperties(flag);
          const inheritedProps = inst?.getInheritedProperties(myModel);
          if (inheritedProps?.length>0)
            properties = typeProps.concat(inheritedProps);
          else
            properties = typeProps;
          if (debug) console.log('181 properties', properties);
        }
      }
      else if (category === constants.gojs.C_RELATIONSHIP) {
        let flag = false;
        const typeProps = type?.getProperties(flag);
        properties = typeProps;
      }
      if (debug) console.log('184 type, properties', type, properties);

      // Handle property values that are undefined
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        if (!prop) 
          continue;
        const v = inst[prop.name];
        if (debug) console.log('190 prop.name, inst', prop.name, inst);
        if (!v) inst[prop.name] = "";  // Sets empty string if undefined
      }
      if (debug) console.log('193 properties, inst, selObj', properties, inst, selObj);
    }

    const dets = [];
    let hideNameAndDescr = false;
    let useFillColor = false;
    let useStrokeColor = false;
    let useItem = false;
    let isLabel = false;
    const what = modalContext?.what;
    // For each 'what' set correct item 
    switch (what) {
      case "editObjectType":
        item = type;
        break;
      case "editObject":
        item = inst;
        if (type?.name === 'Label')
          isLabel = true;
        break;
      case "editRelationshipType":
        item = type;
        break;
      case "editRelationship":
        item = inst;
        break;
      case "editObjectview":
      case "editRelshipview":
      case "editTypeview":
        if (selObj.category === constants.gojs.C_RELATIONSHIP) {
          item = reltypeview?.data;
        } else if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
          item = reltypeview?.data;
        } else if (selObj.category === constants.gojs.C_OBJECT) {
          item = objtypeview?.data;
        } else if (selObj.category === constants.gojs.C_OBJECTTYPE) {
          item = objtypeview?.data;
        }
        if (!item) item = inst;
        hideNameAndDescr = true;
        if (debug) console.log('219 inst, item', inst, item);
        if (what === "editObjectview")
          useFillColor = true;
        else if (what === "editRelshipview")
          useStrokeColor = true;
        break;
      default:
        item = inst;
        break;
    }
    if (debug) console.log('253 myMetis', myMetis);
    if (debug) console.log('249 inst, selObj, type', inst, selObj, type);

    // // Check if item has pointer properties
    // const pvalues = [];
    // for (let j= 0; j<pointerProps?.length; j++) {
    //   const prop = pointerProps[j];
    //   const dtype = prop.getDatatype() as akm.cxDatatype;
    //   if (dtype) {
    //     const ptype = dtype.getPointerType();
    //     const pcrit = dtype.getPointerCriteria();
    //     // Search for the instances of the pointer type
    //     const pinstances = myModel.getObjectsByType(ptype, true);
    //     for (let k=0; k<pinstances?.length; k++) {
    //       const pinst = pinstances[k];
    //       pvalues.push(pinst.getName());
    //     }
    //   }
    // }
    // if (debug) console.log('278 pvalues', pvalues);
    
    for (let k in item) {
      // Filter some system attributes
      {
        if (k === 'abstract') {
          if (what !== 'editObject' && what !== 'editObjectType')
                continue;
        }      
        if (k === 'viewkind') {
          if (what !== 'editObjectview' && what !== 'editTypeview')
            continue;
          if (isLabel)
            continue;
          }
        if (k === 'relshipkind') {
          if (!myModel.includeRelshipkind)
            continue;
          if (what !== 'editRelationship' && what !== 'editRelationshipType')
            continue;
        }
        if (k === 'text') {
          if (!isLabel)
            continue;
        }
        if (k === 'copiedFromId') {
          continue;
        }
      }
      if (chosenType) {
        // Filter attributes to show in a given tab
        {
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
      }
      if (debug) console.log('304 k', k);

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

        // Handle attributes not to be included in modal
        {
          if (k !== 'markedAsDeleted') {
            if (!uic.isPropIncluded(k, type)) 
              continue;
          } 
          if (k === 'dash') {
            if (typeof(val) === 'object') {
              val = val.valueOf();
              if (typeof(val) !== 'string')
                continue;
            }
          }
          if (typeof(val) === 'object') continue;        
          if (typeof(val) === 'function') continue;
          
          if (hideNameAndDescr) {
            if (k === 'name' || k === 'description' || k === 'title') continue; 
          }
        }
        if (debug) console.log('331 k, item[k], instview: ', k, item[k], instview);

        // Get field value (val)
        {
          switch (what) {
            case 'editTypeview':
              if (objtypeview) {
                val = objtypeview.data[k];
              } else if (reltypeview) {
                val = reltypeview.data[k];
              }
              val = selObj[k];
              break;
            case 'editObjectview':
            case 'editRelshipview':
              val = instview[k];
              break;
            default:
              val = selObj[k];
              if (!val) val = item[k];
              break;
          }
        
          if (debug) console.log('366 k, val, item[k], selObj[k]: ', k, val, item[k], selObj[k]);
          // Get property values
          if (properties?.length > 0) {
            if (debug) console.log('369 properties: ', properties);
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
                // Handle methodRef
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
                  if (debug) console.log('395 item, prop', item, prop);
                  try {
                    val = item.getPropertyValue(prop, myMetis);
                  } catch {
                    // Do nothing
                  }
                  if (debug) console.log('401 item, prop, val', item, prop, val);
                }
              }
              if (debug) console.log('404 prop, fieldType: ', prop, fieldType);
            }
          }
          if (debug) console.log('407 k, val, item[k], selObj[k]: ', k, val, item[k], selObj[k]);
        }
        // Handle color values
        {
          if ((useFillColor && k === 'fillcolor') ||
             (useStrokeColor && k === 'strokecolor')) {
            if (val === "" && what === "editObjectview") {
              val = instview.typeview.fillcolor;
            }
            if (debug) console.log('416 instview, val', instview, val);

            fieldType = 'color';
            if (val?.substr(0,4) === 'rgb(') {
              if (debug) console.log('420 val', val);
              let color = '#'+val.match(/\d+/g).map(function(x){
                x = parseInt(x).toString(16);
                return (x.length==1) ? "0"+x : x;
              }).join("");
              if (debug) console.log('425 color', color);
              val = color.toUpperCase();
            }
            if ((val) && val[0] !== '#') {
              // Convert colorname to hex
              val = toHex(val); 
            }         
            if (debug) console.log('432 color', val);
          }
        }
        if (debug) console.log('435 k, val', k, val, item[k], selObj[k]);
        // Handle datatypes and fieldtypes
        {
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
              if (booleanAsCheckbox)
                fieldType = 'checkbox';
              else {
                fieldType   = 'radio';
                defValue    = 'false';
                values      = ['false', 'true'];
              }
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
              if (!selObj.isGroup) {
                if (selObj.viewkind === 'Container') {
                  values = uit.getGroupTemplateNames();
                  defValue = '';
                  fieldType = 'radio';                
                } else if (selObj.category === 'Relationship') {
                  values = uit.getLinkTemplateNames();
                  defValue = '';
                  fieldType = 'radio';
                } else {             
                  values = uit.getNodeTemplateNames();
                  defValue = '';
                  fieldType = 'radio';
                }
              }
              break;
            case 'figure':
                if (selObj.category === 'Object') {
                  values = uit.getFigureNames();
                  defValue = '';
                  fieldType = 'radio';
                }
                break;                
            case 'fromArrow':
              values = arrowheads;
              defValue = 'None';
              fieldType = 'select';
              break;
            case 'toArrow': 
              values = arrowheads;
              defValue = 'OpenTriangle';
              fieldType = 'select';
              break;
            case 'fillcolor':
              if (!useFillColor) {
                values = colornames;
                defValue = 'white';
                fieldType = 'select';
              }
              break;
            case 'strokecolor':
              if (!useStrokeColor) {
                values = colornames;
                defValue = 'black';
                fieldType = 'select';
              }
              break;
            case 'strokewidth': 
              values = strokewidths;
              defValue = '1';
              fieldType = 'select';
              break;
            case 'textcolor':
            case 'fromArrowColor':
            case 'toArrowColor':
                values = colornames;
                defValue = 'black';
                fieldType = 'select';            
              break;
          }
        }
          // Handle fieldtypes and viewformats
        {
          if (fieldType === 'checkbox') {
            checked = val;
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
            fieldType = 'text';
          }
          if (viewFormat) {
            if (utils.isNumeric(val))
              val = printf(viewFormat, Number(val));
          }
        }
        // Handle disabled
        {
          switch(k) {
            case 'id':
              description = 'Unique identifier';
            case "typename":
            case "typeName":
            case "loc":
            case "size":
            case "markedAsDeleted":
            case "modelId":
            case "metamodelId":
            case "modelviewId":
              disabled = true;
              break;
          }
          if (isLabel) {
            if (k !== 'text')
              disabled = true;
          }
        }
        if (debug) console.log('509 selObj, item:', selObj, item);
        if (debug) console.log('510 k, value, disabled:', k, val, disabled);
        if (debug && k==='name') console.log('511 k, fieldType', k, fieldType, defValue, values);
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
    if (debug) console.log('641 SelectionInspector ', dets);
    if (debug) console.log('628 myMetis', myMetis);
    return dets;
  }
  
  public render() {
    if (debug) console.log('633 SelectionInspector ', this.renderObjectDetails());
    const modalContext = this.props.context;
    if (!modalContext)
      return null;
    return (
      <div id='myInspectorDiv' className='inspector w-100'>
        <table className="w-100">
          <tbody className="table-body">
            {this.renderObjectDetails()}
          </tbody>
        </table>
      </div>
    )
  }
}
