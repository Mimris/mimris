// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
import { InspectorRow } from './InspectorRow';
const toHex = require('colornames');
const printf = require('printf');
import * as akm from '../../../akmm/metamodeller';
import * as uic from '../../../akmm/ui_common';
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
                    'red', 'darkred', 'pink', 
                    'green', 'lightgreen', 'darkgreen', 'seagreen',
                    'blue', 'lightblue', 'darkblue', 'skyblue', 
                    'grey', 'lightgrey', 'darkgrey',
                    'yellow', 'lightyellow', 'yellowgreen', 'orange', 
                    'brown', 'purple', 
                    'violet', 'turquoise',
                    'transparent'
                   ];

const strokewidths = ['1', '2', '3', '4', '5'];

const routings = ['Normal', 'Orthogonal', 'AvoidsNodes', 'OrthogonalAvoidsNodes'];

const curves = ['None', 'Bezier', 'JumpOver', 'JumpGap'];

const useTabs = true;

const booleanAsCheckbox = true;

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  /**
   * Render the object data, passing down property keys and values.
   */
  private renderObjectDetails() {
    const myMetis = this.props.myMetis as akm.cxMetis;
    const activeTab = this.props.activeTab;
    const myMetamodel = myMetis.currentMetamodel;
    const myModel = myMetis.currentModel;
    const allowsMetamodeling = myModel.includeSystemtypes;
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (selObj?.type === 'GraphLinksModel') {
      return;
    } 
    let adminModel = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    let inst, inst1, instview, instview1, type, type1, typeview, objtypeview, reltypeview;
    let item, chosenInst, description, currentType, properties, pointerProps;
    let chosenType = null as akm.cxObjectType;
    let typename = "";
    let typedescription = "";
    switch(category) {
      case constants.gojs.C_OBJECT:
        inst = selObj.object;
        inst1 = myMetis.findObject(inst?.id);   
        if (inst1) inst = inst1;
        instview = selObj.objectview;
        instview1 = myMetis.findObjectView(instview?.id);
        if (instview1) instview = instview1;
        type = selObj.objecttype;
        type1 = myMetis.findObjectType(type?.id);
        if (type1) type = type1;
        objtypeview = type?.typeview;
        objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
        typeview = objtypeview;
        break;
      case constants.gojs.C_OBJECTTYPE:
        type = selObj.objecttype;
        type1 = myMetis.findObjectType(type?.id);
        if (type1) type = type1;
        objtypeview = type?.typeview;
        objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
        typeview = objtypeview;
        break;
      case constants.gojs.C_RELATIONSHIP:
        inst = selObj.relship;
        inst1 = myMetis.findRelationship(inst?.id);   
        if (inst1) inst = inst1;
        currentType = inst.type as akm.cxObjectType;
        chosenType = currentType as akm.cxObjectType;
        chosenInst = inst;
        typename = currentType?.name;
        typedescription = currentType?.description;
        instview = selObj.relshipview;
        instview1 = myMetis.findRelationshipView(instview?.id);
        if (instview1) instview = instview1;
        type = selObj.relshiptype;
        type1 = myMetis.findRelationshipType(type?.id);
        if (type1) type = type1;
        reltypeview = type?.typeview;
        reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
        typeview = reltypeview;
        break;
      case constants.gojs.C_RELSHIPTYPE:
        type = selObj.reltype;
        type1 = myMetis.findRelationshipType(type?.id);
        if (type1) type = type1;
        reltypeview = type?.typeview;
        reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
        typeview = reltypeview;
        break;       
    }
    // Set chosenType
    let includeInherited = false;
    let includeConnected = false;
    let tabIndex = 0;
    {
      if (category === constants.gojs.C_OBJECT) {
        if (type?.name === 'Method') {
          chosenType = null;
        } else {
          currentType = inst.type as akm.cxObjectType;
          chosenType = currentType;
          chosenInst = inst;
          typename = currentType.name;
          typedescription = currentType.description;
          if (useTabs && modalContext?.what === 'editObject') {
            let inheritedTypes = inst?.getInheritedTypes();
            inheritedTypes.push(currentType);
            inheritedTypes = [...new Set(inheritedTypes)];
            if (inst?.hasInheritedProperties(myModel)) 
              includeInherited = true;
            const connectedObjects = inst?.getConnectedObjects2(myMetis);
            if (connectedObjects?.length>0) 
              includeConnected = true;
            const context = {
              myMetis: myMetis,
              myModel: myModel,
              myMetamodel: myMetamodel,
              includeConnected: includeConnected,
              includeInherited: includeInherited,
            }
            let namelist = uic.getNameList(inst, context, true); 
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
                  type = connectedObj.type as akm.cxObjectType;
                  typename = type.name;
                  typedescription = type.description;
                  chosenType = type as akm.cxObjectType;
                  chosenInst = connectedObj;
                  tabIndex = i+1;
                  // break;
                }
              }
            }
            // if (namelist.length > 1 && 
            //     typename !== constants.types.AKM_ELEMENT && typename !== 'All') {
            if (namelist.length > 1 && typename !== 'Element' && typename !== 'All') {
              for (let i=0; i<inheritedTypes.length; i++) {
                const tname = inheritedTypes[i]?.name;
                if (tname === typename) {
                  type = inheritedTypes[i];
                  chosenType = type as akm.cxObjectType;
                }
              }
            } 
            if (typename === 'All') {
              chosenType = null;
            }  
            if (!inst?.hasInheritedProperties(myModel)) {
              chosenType = null;
            }
          }
        }
      }
    }
    if (typeof(type) !== 'object')
      return;

    // Get properties, and handle empty property values
    {
      if (category === constants.gojs.C_OBJECT) {
        if (chosenType) {
          try {
          properties = chosenType.getProperties(false);
          // pointerProps = chosenType.getPointerProperties(false);
          } catch {
            // Do nothing
          }
        } 
        else if (type?.name === 'Method') {
          inst = myMetis.findObject(inst.id);
          properties = inst.setAndGetAllProperties(myMetis) as akm.cxProperty[];
          chosenInst = inst;
        } else {
          let includeInherited = true;
          let includeConnected = false;
          inst = myMetis.findObject(inst.id);
          type = myMetis.findObjectType(type.id);
          try {
            const typeProps = type?.getProperties(includeInherited);
            const inheritedProps = inst?.getInheritedProperties(myModel);
            if (inheritedProps?.length>0)
              properties = typeProps.concat(inheritedProps);
            else
              properties = typeProps;
          } catch {
            // Do nothing
          }
        }
      }
      else if (category === constants.gojs.C_RELATIONSHIP) {
        let flag = false;
        const typeProps = type?.getProperties(flag);
        properties = inst.setAndGetAllProperties(myMetis) as akm.cxProperty[];
        properties = typeProps;
      }
      else if (category === constants.gojs.C_RELSHIPTYPE) {

      }

      // Handle property values that are undefined
      for (let i=0; i<properties?.length; i++) {
        const prop = properties[i];
        if (!prop) 
          continue;
        if (chosenInst) { 
          const v = chosenInst[prop.name];
          if (!v) chosenInst[prop.name] = "";  // Sets empty string if undefined
        }
      }
    }

    const dets = [];
    let hideNameAndDescr = false;
    let useFillColor = false;
    let useStrokeColor = false;
    let useItem = false;
    let isLabel = false;
    let test = null;
    const what = modalContext?.what;
    // For each 'what' set correct item 
    switch (what) {
      case "editObjectType":
        item = type;
        test = item;
        break;
      case "editObject":
        item = chosenInst;
        if (type?.name === constants.types.AKM_LABEL)
          isLabel = true;
        test = item;
        break;
      case "editRelationshipType":
        item = type;
        test = item;
        break;
      case "editRelationship":
        item = inst;
        test = item;
        break;
      case "editModelview":
        item = modelview;
        test = item;
        break;
      case "editObjectview":
      case "editRelshipview":
      case "editTypeview":
        chosenType = null;
        if (selObj.category === constants.gojs.C_RELATIONSHIP) {
          item = instview;
          // item = reltypeview?.data;
        } else if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
          item = reltypeview?.data;
          item = reltypeview?.data;
        } else if (selObj.category === constants.gojs.C_OBJECT) {
          item = instview;
          // item = objtypeview?.data;
        } else if (selObj.category === constants.gojs.C_OBJECTTYPE) {
          item = objtypeview?.data;
          item = objtypeview;
        }
        if (!item) item = inst;
        hideNameAndDescr = true;
        if (what === "editObjectview") {
          if (type.name !== constants.types.AKM_PORT) 
            useFillColor = true;
        } else if (what === "editRelshipview")
          useStrokeColor = true;
        test = typeview?.data;
        break;
      default:
        item = inst;
        break;
    }

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
    }
    for (let k in test) {
      // Filter some system attributes
      {
        if (k === 'abstract') {
          if (what === "editObject") {
            if (type && type.name !== constants.types.AKM_ENTITY_TYPE)
              continue;
          }
          else if (what !== 'editObjectType')
            continue;
          if (item.category === constants.gojs.C_OBJECTTYPE) {
            switch (item.name) {
              case 'Property':
              case 'Datatype':
              case 'Method':
              case 'MethodType':
              case 'Value':
              case 'FieldType':
              case 'ViewFormat':
              case 'InputPattern':
              case 'undefined':
                continue;
            }   
          } 
        }
        if (k === 'viewkind') {
          if (what !== 'editObjectview' && what !== 'editTypeview' && what !== 'editObjectType')
            continue;
          if (isLabel)
            continue;
          }
        if (k === 'relshipkind') {
          if (what !== 'editRelationshipType') {
            if (!myModel.includeRelshipkind)
              continue;
            if (what !== 'editRelationship')
              continue;
          }
        }
        if (k === 'text') {
          if (!isLabel)
            continue;
        }
        if (k === 'copiedFromId') {
          continue;
        }
        if (k === 'markedAsDeleted') {
          continue;
        }
        // Hack
        // if (k === 'memberscale') {
        //   continue;
        // }
        // End hack
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
          if (what !== 'editObjectview' && what !== 'editTypeview' && what !== 'editRelshipview') {
            if (k !== 'markedAsDeleted') {
              // Check if k is a member of properties
              let found = false;
              for (let n = 0; n<properties?.length; n++) {
                const p = properties[n];
                if (p.name === k) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                // Check if k should NOT be included in the modal
                if (!uic.isPropIncluded(k, type)) {
                  continue;
                }
              }
            } 
          } 
          if (k === 'fs_collection') 
            continue;
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

        // Get field value (val)
        {
          switch (what) {
            case 'editTypeview':
              if (objtypeview) {
                val = objtypeview.data[k];
              } else if (reltypeview) {
                val = reltypeview.data[k];
              }
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
                  val = chosenInst.type?.description;
                else // Object type
                  val = selObj[k];
                break;
              } else {
                val = selObj[k];
                if (!val) 
                  val = item[k];
                break;
              }
          }
        
          // Get property values
          if (properties?.length > 0) {
            for (let i=0; i<properties.length; i++) {
              let p = properties[i];
              let prop = myMetis.findProperty(p.id);
              if (!prop) {
                prop = new akm.cxProperty(utils.createGuid(), p.name, p.description);
                myMetis.addProperty(prop);
              }
              properties[i] = prop;
              if (prop  && prop.name === k) {
                let dtype = prop.getDatatype();
                if (!dtype) {
                  const dtypeRef = prop.getDatatypeRef();
                  if (dtypeRef) {
                    dtype = myMetis.findDatatype(dtypeRef);
                  }
                }
                if (dtype) {
                  const dtype1 = dtype.getIsOfDatatype();
                  if (dtype1) {
                    dtype = dtype1;
                  }
                }
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
                  try {
                    val = item.getPropertyValue(prop, myMetis);
                  } catch {
                    // Do nothing
                  }
                }
                // Handle connected objects
                if (inst.category === constants.gojs.C_OBJECT) {
                  const objs = chosenInst.getConnectedObjects1(prop, myMetis);
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
                }
              }
            }
          }
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
              val = typeview.fillcolor;
            }

            fieldType = 'color';
            if (val?.substr(0,4) === 'rgb(') {
              let color = '#'+val.match(/\d+/g).map(function(x){
                x = parseInt(x).toString(16);
                return (x.length==1) ? "0"+x : x;
              }).join("");
              val = color.toUpperCase();
            }
            if ((val) && val[0] !== '#') {
              // Convert colorname to hex
              val = toHex(val); 
            }         
          }
        }
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
              dtype = myMetamodel.findDatatypeByName(k);
              if (dtype) {
                fieldType = dtype.fieldType;
                pattern   = dtype.inputPattern;
                defValue  = dtype.defaultValue;
                values    = dtype.allowedValues;
              }
              if (!allowsMetamodeling) disabled = true;
              break;
            case 'relshipkind':
              fieldType = 'select';
              defValue    = 'Association';
              values = ['Association', 'Generalization', 'Composition', 'Aggregation'];
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
            case 'routing':
              values = ['Normal', 'Orthogonal', 'AvoidsNodes'];
              defValue = 'None';
              fieldType = 'radio';
              break;
            case 'curve':
              values = ['None', 'Bezier', 'JumpOver', 'JumpGap'];
              defValue = 'None';
              fieldType = 'radio';
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
            fieldType = 'select';
            const p1 = "^(";
            const p2 = ")$";
            let p = "";
            let cnt = 0;
            for (let i=0; i<values?.length; i++) {
              const value = values[i];
              if (p === "") {
                p = value;
              } else {
                p += "|" + value;
              }
            }
            pattern = p1 + p + p2;
          }
          if (fieldType === 'select') {
            if (val === "")
              val = defValue;
          }
          if (fieldType === 'date') {
            if (debug) console.log('771 prop', prop);
            pattern = "";
            if (val === "") {
              const d = new Date();
              val = d.toISOString().slice(0,10);
            }
          }
          // if (fieldType === 'time') {
          //   pattern = "";
          //   const isNow = (val === "now");
          //   if (val === "" || isNow) {
          //     const d = new Date();
          //     val = d.getTime();
          //     if (isNow)
          //       disabled = true;
          //   }
          // }
          if (k === 'name') {
            fieldType = 'text';
          }
          if (viewFormat) {
            if (utils.isNumeric(val) && fieldType !== 'time') {
              val = printf(viewFormat, Number(val));
            }
          }
        }
        // Handle disabled
        {
          if (includeConnected) {
            if (tabIndex >0) 
              disabled = true;
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
    return dets;
  }
  
  public render() {
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
