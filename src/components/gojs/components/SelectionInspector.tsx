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

const booleanAsCheckbox = true;

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis as akm.cxMetis;
    const activeTab = this.props.activeTab;
    if (debug) console.log('60 activeTab, myMetis', activeTab, myMetis);
    if (debug) console.log('61 this.props', this.props);
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
    let item, chosenType, chosenInst, description, currentType, properties, pointerProps;
    if (debug) console.log('75 selObj', selObj);
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
        if (debug) console.log('119 inst, instview, type, reltypeview', inst, instview, type, reltypeview);
        break;
      case constants.gojs.C_RELSHIPTYPE:
        type = selObj.reltype;
        type1 = myMetis.findRelationshipType(type?.id);
        if (type1) type = type1;
        reltypeview = type?.typeview;
        reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
        break;       
    }
    if (debug) console.log('123 inst, type', inst, type);
    if (debug) console.log('121 selObj, this.props, inst, type', selObj, this.props, inst, type);
    // Set chosenType
    let typename = "";
    let typedescription = "";
    let includeInherited = false;
    let includeConnected = false;
    let tabIndex = 0;
    {
      if (category === constants.gojs.C_OBJECT) {
        if (debug) console.log('128 type', type);
        if (type?.name === 'Method') {
          chosenType = null;
        } else {
          currentType = inst.type;
          chosenType = currentType;
          chosenInst = inst;
          typename = currentType.name;
          typedescription = currentType.description;
          if (debug) console.log('138 inst', inst);
          if (useTabs && modalContext?.what === 'editObject') {
            let inheritedTypes = inst?.getInheritedTypes();
            inheritedTypes.push(currentType);
            inheritedTypes = [...new Set(inheritedTypes)];
            if (debug) console.log('143 inheritedTypes', inheritedTypes);
            if (inst?.hasInheritedProperties(myModel)) 
              includeInherited = true;
            const connectedObjects = inst?.getConnectedObjects2(myMetis);
            if (debug) console.log('147 connectedObjects', connectedObjects);
            if (connectedObjects?.length>0) 
              includeConnected = true;
            if (debug) console.log('150 includeInherited', includeInherited);
            const context = {
              myMetis: myMetis,
              myModel: myModel,
              myMetamodel: myMetamodel,
              includeConnected: includeConnected,
              includeInherited: includeInherited,
            }
            let namelist = uic.getNameList(inst, context, true); 
            if (debug) console.log('159 context, inst, namelist', context, inst, namelist);
            if (context.includeInherited) {
              typename = namelist[activeTab];
              const objs = inst.getInheritanceObjects(myModel);
              for (let i=0; i<objs.length; i++) {
                if (objs[i].type.name === typename) {
                  chosenType = objs[i].type;
                  chosenInst = objs[i];
                  break;
                }
              }
            }
            if (context.includeConnected) {
              const objname = namelist[activeTab];
              for (let i=0; i<connectedObjects.length; i++) {
                if (connectedObjects[i].name === objname) {
                  const connectedObj = connectedObjects[i];
                  type = connectedObj.type;
                  typename = type.name;
                  typedescription = type.description;
                  chosenType = type;
                  chosenInst = connectedObj;
                  tabIndex = i+1;
                  // break;
                }
              }
            }
            if (debug) console.log('185 typename, chosenType, chosenInst, inheritedTypes', typename, chosenType, chosenInst, inheritedTypes);
            if (debug) console.log('186 chosenType, namelist, inheritedTypes', chosenType, namelist, inheritedTypes);
            if (namelist.length > 1 && typename !== 'Element' && typename !== 'All') {
              for (let i=0; i<inheritedTypes.length; i++) {
                const tname = inheritedTypes[i]?.name;
                if (tname === typename) {
                  type = inheritedTypes[i];
                  chosenType = type;
                  if (debug) console.log('193 tname, chosenType', tname, chosenType);
                }
              }
            } 
            if (debug) console.log('197 typename, chosenType, chosenInst', typename, chosenType, chosenInst);
            if (debug) console.log('198 typename, chosenType', typename, chosenType);
            if (typename === 'All') {
              chosenType = null;
            }  
            if (!inst?.hasInheritedProperties(myModel)) {
              chosenType = null;
            }
          }
          if (debug) console.log('206 myModel', myModel);
        }
        if (debug) console.log('208 inst, inst1, selObj, chosenType', inst, inst1, selObj, chosenType);
        if (debug) console.log('209 instview, typeview', instview, typeview);
      }
    }
    if (typeof(type) !== 'object')
      return;
    if (debug) console.log('214 myMetis', myMetis);

    // Get properties, and handle empty property values
    {
      if (category === constants.gojs.C_OBJECT) {
        if (debug) console.log('219 chosenType', chosenType);
        if (chosenType) {
          properties = chosenType.getProperties(false);
          if (debug) console.log('221 typename, chosenType, properties, chosenInst', typename, chosenType, properties, chosenInst);
          // pointerProps = chosenType.getPointerProperties(false);
        } 
        else if (type?.name === 'Method') {
          inst = myMetis.findObject(inst.id);
          properties = inst.setAndGetAllProperties(myMetis);
          chosenInst = inst;
          if (debug) console.log('229 chosenInst, properties', chosenInst, properties);
        } else {
          let includeInherited = false;
          let includeConnected = false;
          inst = myMetis.findObject(inst.id);
          type = myMetis.findObjectType(type.id);
          const typeProps = type?.getProperties(includeInherited);
          const inheritedProps = inst?.getInheritedProperties(myModel);
          if (inheritedProps?.length>0)
            properties = typeProps.concat(inheritedProps);
          else
            properties = typeProps;
        }
        if (debug) console.log('238 typename, chosenInst, chosenType, properties', typename, chosenInst, chosenType, properties);
      }
      else if (category === constants.gojs.C_RELATIONSHIP) {
        let flag = false;
        const typeProps = type?.getProperties(flag);
        properties = typeProps;
      }
      else if (category === constants.gojs.C_RELSHIPTYPE) {

      }
      if (debug) console.log('248 type, properties', type, properties);

      // Handle property values that are undefined
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        if (!prop) 
          continue;
        if (chosenInst) { 
          const v = chosenInst[prop.name];
          if (debug) console.log('256 prop.name, chosenInst', prop.name, chosenInst);
          if (!v) chosenInst[prop.name] = "";  // Sets empty string if undefined
        }
      }
      if (debug) console.log('259 properties, chosenInst, selObj', properties, chosenInst, selObj);
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
        item = chosenInst;
        if (type?.name === constants.types.AKM_LABEL)
          isLabel = true;
        break;
      case "editRelationshipType":
        item = type;
        break;
      case "editRelationship":
        item = inst;
        break;
      case "editModelview":
        item = modelview;
        break;
      case "editObjectview":
      case "editRelshipview":
      case "editTypeview":
        chosenType = null;
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
    if (debug) console.log('309 myMetis', myMetis);
    if (debug) console.log('310 item, inst, selObj, chosenInst, type', item, inst, selObj, chosenInst, type);

    if (false) {
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
    }
    
    for (let k in item) {
      if (debug) console.log('333 k in item', k);
      // Filter some system attributes
      {
        if (k === 'abstract') {
          if (what !== 'editObject' && what !== 'editObjectType')
                continue;
        }      
        if (k === 'viewkind') {
          if (what !== 'editObjectview' && what !== 'editTypeview' && what !== 'editObjectType')
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
      if (debug) console.log('360 k, chosenType', k, chosenType);
      if (chosenType) {
        // Filter attributes to show in a given tab
        {
          if (debug) console.log('364 properties', properties);
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
                  || (k === 'typeName') || (k === 'typeDescription') 
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
      if (debug) console.log('392 k', k);

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
              if (includeConnected) {
                if (k === "name") {
                  val = chosenInst.getName();
                  break;
                }
              }
              if (k === 'typeDescription') {
                if (chosenInst)  // Object
                  val = chosenInst.type.description;
                else // Object type
                  val = selObj[k];
                break;
              } else {
                val = selObj[k];
                  if (!val) val = item[k];
                  break;
              }
          }
        
          if (debug) console.log('457 k, val, item[k], selObj[k]: ', k, val, item[k], selObj[k]);
          // Get property values
          if (properties?.length > 0) {
            if (debug) console.log('460 properties: ', properties);
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
                  if (debug) console.log('486 item, prop', item, prop);
                  try {
                    val = item.getPropertyValue(prop, myMetis);
                  } catch {
                    // Do nothing
                  }
                  if (debug) console.log('492 item, prop, val', item, prop, val);
                }
                // Handle connected objects
                const objs = chosenInst.getConnectedObjects1(prop, myMetis);
                if (debug) console.log('496 prop, chosenInst, objs', prop, chosenInst, objs);
                if (objs?.length > 1)
                  val = '';
                for (let i=0; i<objs?.length; i++) {
                  const obj = objs[i];
                  if (obj) {
                    if (i == 0)
                      val = obj.name;
                    else
                      val += ' | ' + obj.name;
                  }
                }
                // if (objs?.length > 1) {
                //   val += ', ...';
                // }
              }
              if (debug) console.log('495 prop, fieldType: ', prop, fieldType);
            }
          }
          if (debug) console.log('498 k, val, item[k], selObj[k]: ', k, val, item[k], selObj[k]);
        }
        // Handle color values
        {
          if (
            (useFillColor && k === 'fillcolor') ||
            (useFillColor && k === 'fillcolor2') ||
            (useStrokeColor && k === 'strokecolor') ||
            (useStrokeColor && k === 'strokecolor2')
          ) {
            if (val === "" && what === "editObjectview") {
              val = instview.typeview.fillcolor;
            }
            if (debug) console.log('507 instview, val', instview, val);

            fieldType = 'color';
            if (val?.substr(0,4) === 'rgb(') {
              if (debug) console.log('511 val', val);
              let color = '#'+val.match(/\d+/g).map(function(x){
                x = parseInt(x).toString(16);
                return (x.length==1) ? "0"+x : x;
              }).join("");
              if (debug) console.log('516 color', color);
              val = color.toUpperCase();
            }
            if ((val) && val[0] !== '#') {
              // Convert colorname to hex
              val = toHex(val); 
            }         
            if (debug) console.log('523 color', val);
          }
        }
        if (debug) console.log('526 k, val', k, val, item[k], selObj[k]);
        // Handle datatypes and fieldtypes
        {
          let dtype;
          switch(k) {
            case 'description':
            case 'typeDescription':
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
              if (selObj.isGroup) {
                if(debug) console.log('595 selObj', selObj);
                if (selObj.viewkind === 'Container') {
                  values = uit.getGroupTemplateNames();
                  defValue = '';
                  fieldType = 'radio';    
                }             
              } else {
                if (selObj.category === constants.gojs.C_RELATIONSHIP) {
                  values = uit.getLinkTemplateNames();
                  defValue = '';
                  fieldType = 'radio';
                } else if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
                  values = uit.getLinkTemplateNames();
                  defValue = '';
                  fieldType = 'radio';
                } else if (selObj.category === constants.gojs.C_OBJECT || selObj.category === constants.gojs.C_OBJECTTYPE) {
                  if (selObj.viewkind === 'Object') {             
                    values = uit.getNodeTemplateNames();
                    defValue = '';
                    fieldType = 'radio';
                  } else if (selObj.viewkind === 'Container') {             
                    values = uit.getGroupTemplateNames();
                    defValue = '';
                    fieldType = 'radio';
                  }
                }
              }
              break;
            case 'figure':
                if (selObj.category === constants.gojs.C_OBJECT || selObj.category === constants.gojs.C_OBJECTTYPE) {
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
            case 'fillcolor2':
              if (!useFillColor) {
                values = colornames;
                defValue = 'white';
                fieldType = 'select';
              }
              break;
            case 'strokecolor':
            case 'strokecolor2':
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
          if (includeConnected) {
            if (tabIndex >0) 
              disabled = true;
            if (debug) console.log('699 tabIndex, disabled', tabIndex, disabled);
          }
          switch(k) {
            case 'id':
              description = 'Unique identifier';
            case "typename":
            case "typeName":
            case "typedescription":
            case "typeDescription":
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
        if (debug) console.log('720 selObj, item:', selObj, item);
        if (debug) console.log('721 k, value, disabled:', k, val, disabled);
        if (debug && k==='name') console.log('722 k, fieldType', k, fieldType, defValue, values);
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
    if (debug) console.log('748 SelectionInspector ', dets);
    if (debug) console.log('749 myMetis', myMetis);
    return dets;
  }
  
  public render() {
    if (debug) console.log('754 SelectionInspector ', this.renderObjectDetails());
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
