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
  'lightsalmon', 'lightsteelblue',
  'red', 'darkred', 'pink',
  'green', 'palegreen', 'lightgreen', 'darkgreen', 'seagreen',
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
    let myMetis = this.props.myMetis as akm.cxMetis;
    if (debug) console.log('62 SelectionInspector: myMetis', this.props);
    // remove recurcive references from myMetis
    myMetis.submodels = [];
    myMetis.submetamodels = [];

    if (debug) console.log('64 SelectionInspector: myMetis', myMetis);
    const activeTab = this.props.activeTab;
    if (debug) console.log('66 activeTab', activeTab);
    const myMetamodel = myMetis?.currentMetamodel as akm.cxMetamodel;
    const myModel = myMetis?.currentModel as akm.cxModel;
    const allowsMetamodeling = myModel?.includeSystemtypes;
    let selObj = this.props.selectedData; // node
    const modalContext = this.props.context;
    let category = selObj?.category;
    if (selObj?.type === 'GraphLinksModel') {
      return;
    }
    // let adminModel = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    let inst: akm.cxObject | akm.cxRelationship;
    let inst1: akm.cxObject | akm.cxRelationship;
    let instview: akm.cxObjectView | akm.cxRelationshipView;
    let instview1: akm.cxObjectView | akm.cxRelationshipView;
    let type: akm.cxObjectType | akm.cxRelationshipType;
    let type1: akm.cxObjectType | akm.cxRelationshipType;
    let typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView;
    let objtypeview: akm.cxObjectTypeView;
    let reltypeview: akm.cxRelationshipTypeView;
    let currentType: akm.cxObjectType | akm.cxRelationshipType;
    let chosenInst: akm.cxObject | akm.cxRelationship;
    let properties: akm.cxProperty[];
    let chosenType: akm.cxObjectType | akm.cxRelationshipType;
    let item, description;
    let typename = "";
    let typedescription = "";
    switch (category) {
      case constants.gojs.C_OBJECT:
        inst = selObj.object;
        //  from sf edited 2024-04-17
        // inst1 = myMetis.findObject(inst?.id);
        instview1 = myMetis.findObjectView(selObj?.key);
        inst1 = myMetis.findObject(instview1.object.id);
        if (inst1) inst = inst1;
        instview = null //selObj.objectview as akm.cxObjectView;
        // instview1 = myMetis.findObjectView(instview?.id) as akm.cxObjectView;
        if (instview1) instview = instview1;
        type = inst1.type as akm.cxObjectType;
        // type1 = myMetis.findObjectType(type?.id) as akm.cxObjectType;
        // to sf edited 2024-04-17
        type1 = myMetis.findObjectType(type?.id) as akm.cxObjectType;
        if (debug) console.log('104 type1', selObj, instview1, inst1, instview, instview1, type, type1);
        if (debug) console.log('105 myMetis', myMetis);
        if (type1) type = type1;
        objtypeview = type1?.typeview as akm.cxObjectTypeView;
        objtypeview = myMetis.findObjectTypeView(objtypeview?.id) as akm.cxObjectTypeView;
        typeview = objtypeview;
        type.typeview = objtypeview;
        inst.type = type;
        break;
      case constants.gojs.C_OBJECTTYPE:
        type = selObj.objecttype;
        type1 = myMetis.findObjectType(type?.id);
        if (type1) type = type1;
        objtypeview = type1?.typeview;
        objtypeview = myMetis.findObjectTypeView(objtypeview?.id);
        typeview = objtypeview;
        break;
      case constants.gojs.C_RELATIONSHIP:
        inst = selObj.relship;
        inst1 = myMetis.findRelationship(inst?.id);
        if (inst1) inst = inst1;
        instview = selObj.relshipview as akm.cxRelationshipView;
        instview1 = myMetis.findRelationshipView(instview?.id) as akm.cxRelationshipView;
        if (instview1) instview = instview1;
        type = selObj.relshiptype as akm.cxRelationshipType;
        type1 = myMetis.findRelationshipType(type?.id) as akm.cxRelationshipType;
        if (type1) type = type1;
        reltypeview = type?.typeview;
        reltypeview = myMetis.findRelationshipTypeView(reltypeview?.id);
        typeview = reltypeview;
        type.typeview = reltypeview;
        inst.type = type;
        selObj = inst1;
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
            const connectedObjects: akm.cxObject[] = inst?.getConnectedObjects2(myMetis);
            if (connectedObjects?.length > 0)
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
              const objs = inst.getInheritanceObjects(myModel) as akm.cxObject[];
              for (let i = 0; i < objs.length; i++) {
                if (objs[i].type.name === typename) {
                  chosenType = objs[i].type;
                  chosenInst = objs[i];
                  break;
                }
              }
            }
            if (context.includeConnected) {
              const objname = namelist[activeTab];
              for (let i = 0; i < connectedObjects.length; i++) {
                if (connectedObjects[i].name === objname) {
                  const connectedObj = connectedObjects[i];
                  type = connectedObj.type as akm.cxObjectType;
                  typename = type.name;
                  typedescription = type.description;
                  chosenType = type as akm.cxObjectType;
                  chosenInst = connectedObj;
                  tabIndex = i + 1;
                  // break;
                }
              }
            }
            if (namelist.length > 1 && typename !== 'Element') {
              for (let i = 0; i < inheritedTypes.length; i++) {
                const tname = inheritedTypes[i]?.name;
                if (tname === typename) {
                  type = inheritedTypes[i];
                  chosenType = type as akm.cxObjectType;
                }
              }
            }
            if (!inst?.hasInheritedProperties(myModel)) {
              chosenType = null;
            }
          }
        }
      } else if (category === constants.gojs.C_RELATIONSHIP) {
        currentType = inst.type as akm.cxRelationshipType;
        chosenType = currentType;
        chosenInst = inst;
        typename = currentType.name;
        typedescription = currentType.description;
        if (useTabs && modalContext?.what === 'editRelationship') {
          let inheritedTypes = inst?.getInheritedTypes();
          inheritedTypes.push(currentType);
          inheritedTypes = [...new Set(inheritedTypes)];
          if (inst?.hasInheritedProperties(myModel))
            includeInherited = true;
          const context = {
            myMetis: myMetis,
            myModel: myModel,
            myMetamodel: myMetamodel,
            includeConnected: false,
            includeInherited: includeInherited,
          }
          let namelist = uic.getNameList(inst, context, true);
          if (context.includeInherited) {
            typename = namelist[activeTab];
            const objs = inst.getInheritanceObjects(myModel) as akm.cxObject[];
            for (let i = 0; i < objs.length; i++) {
              if (objs[i].type.name === typename) {
                chosenType = objs[i].type;
                chosenInst = objs[i];
                break;
              }
            }
          }
          if (namelist.length > 1 && typename !== 'Element') {
            for (let i = 0; i < inheritedTypes.length; i++) {
              const tname = inheritedTypes[i]?.name;
              if (tname === typename) {
                type = inheritedTypes[i];
                chosenType = type as akm.cxObjectType;
              }
            }
          }
          if (!inst?.hasInheritedProperties(myModel)) {
            chosenType = null;
          }
        }
      }
    }
    if (typeof (type) !== 'object')
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
          if (debug) console.log('237 chosenType, properties: ', chosenType, properties);
        }
        else if (type?.name === 'Method') {
          const inst1 = myMetis.findObject(inst.id) as akm.cxObject;
          if (inst1) inst = inst1;
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
            if (inheritedProps?.length > 0)
              properties = typeProps.concat(inheritedProps);
            else
              properties = typeProps;
          } catch {
            // Do nothing
          }
          if (debug) console.log('259 chosenType, properties: ', chosenType, properties);
        }
      }
      else if (category === constants.gojs.C_RELATIONSHIP) {
        let includeInherited = true;
        if (chosenType) {
          try {
            properties = chosenType.getProperties(includeInherited);
            // pointerProps = chosenType.getPointerProperties(false);
          } catch {
            // Do nothing
          }
          if (debug) console.log('237 chosenType, properties: ', chosenType, properties);
        }
        else {
          let includeInherited = true;
          inst = myMetis.findRelationship(inst.id);
          type = myMetis.findRelationshipType(type.id);
          try {
            const typeProps = type?.getProperties(includeInherited);
            const inheritedProps = inst?.getInheritedProperties(myModel);
            if (inheritedProps?.length > 0)
              properties = typeProps.concat(inheritedProps);
            else
              properties = typeProps;
          } catch {
            // Do nothing
          }
          if (debug) console.log('259 chosenType, properties: ', chosenType, properties);
        }
      }
      else if (category === constants.gojs.C_RELSHIPTYPE) {

      }
      // Handle property values that are undefined
      for (let i = 0; i < properties?.length; i++) {
        const prop = properties[i];
        if (!prop)
          continue;
        if (chosenInst) {
          const v = chosenInst[prop.name];
          // Sets empty string if undefined:
          if (!v) chosenInst[prop.name] = "";
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
        if (type?.name === constants.types.AKM_LABEL)
          isLabel = true;
        item = chosenInst;
        test = item as akm.cxObject;
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
            useFillColor = false;
        } else if (what === "editRelshipview" || what === "editTypeview")
          useStrokeColor = false;
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
        // if (k === 'relshipkind') {
        //   if (what !== 'editRelationshipType') {
        //     if (!myModel.includeRelshipkind)
        //       continue;
        //     if (what !== 'editRelationship')
        //       continue;
        //   }
        // }
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
          for (let n = 0; n < properties.length; n++) {
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
        let checked = false;
        let pattern = "";
        let required = false;
        let defValue = "";
        let values = [];
        let val = item[k];
        // Handle attributes not to be included in modal
        {
          if (what !== 'editObjectview' && what !== 'editTypeview' && what !== 'editRelshipview') {
            if (k !== 'markedAsDeleted') {
              // Check if k is a member of properties
              let found = false;
              for (let n = 0; n < properties?.length; n++) {
                const p = properties[n];
                if (p.name === k) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                // Check if k should NOT be included in the modal
                if (!uic.isPropIncluded(k, type)) {
                  if (!uic.isOsduAttribute(k))
                    continue;
                }
              }
            }
          }
          if (k === 'dash') {
            if (typeof (val) === 'object') {
              val = val.valueOf();
              if (typeof (val) !== 'string')
                continue;
            }
          }
          if (typeof (val) === 'object') continue;
          if (typeof (val) === 'function') continue;
          if (hideNameAndDescr) {
            if (k === 'name' || k === 'description' || k === 'title') continue;
          }
        }
        // if (k === 'isLayoutPositioned') {
        //   if (val == "")
        //     val = "false";
        // }

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
        }

        // Get property values
        if (properties?.length > 0) {
          for (let i = 0; i < properties.length; i++) {
            let prop = properties[i] as akm.cxProperty;
            if (prop) {
              if (prop.name !== k)
                continue;
              if (prop.readOnly) {
                readonly = true;
              }
              if (prop.isRequired) {
                required = true;
              }
              prop = myMetamodel.findProperty(prop.id);
              let dtype = prop?.getDatatype() as akm.cxDatatype;
              if (!dtype) {
                const dtypeRef = prop?.getDatatypeRef();
                if (dtypeRef) {
                  dtype = myMetamodel.findDatatype(dtypeRef);
                }
              }
              if (dtype) {
                const dtype1 = dtype.getIsOfDatatype();
                if (dtype1) {
                  dtype = dtype1;
                }
              }
              if (dtype) {
                fieldType = dtype.fieldType;
                viewFormat = dtype.viewFormat
                pattern = dtype.inputPattern;
                defValue = dtype.defaultValue;
                values = dtype.allowedValues;
                description = prop.description;
              }
              // Handle methodRef
              const mtdRef = prop?.methodRef;
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
                for (let i = 0; i < objs?.length; i++) {
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
            if (val?.substr(0, 4) === 'rgb(') {
              let color = '#' + val.match(/\d+/g).map(function (x) {
                x = parseInt(x).toString(16);
                return (x.length == 1) ? "0" + x : x;
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
          switch (k) {
            case 'description':
            case 'typeDescription':
            case 'geometry':
              fieldType = 'textarea';
              break;
            case 'cardinalityFrom':
            case 'cardinalityTo':
              dtype = myMetamodel.findDatatypeByName('cardinality');
              if (dtype) {
                fieldType = 'select' // dtype.fieldType;
                viewFormat = dtype.viewFormat
                pattern = dtype.inputPattern;
                defValue = dtype.defaultValue;
                values = dtype.allowedValues;
              }
              if (!allowsMetamodeling) disabled = true;
              break;
            case 'fieldType':
            case 'viewkind':
              dtype = myMetamodel.findDatatypeByName(k);
              if (dtype) {
                fieldType = dtype.fieldType;
                pattern = dtype.inputPattern;
                defValue = dtype.defaultValue;
                values = dtype.allowedValues;
              }
              if (!allowsMetamodeling) disabled = true;
              break;
            case 'relshipkind':
              fieldType = 'select';
              defValue = 'Association';
              values = ['Association', 'Generalization', 'Composition', 'Aggregation'];
              break;
            // case 'isLayoutPositioned':
            case 'abstract':
              dtype = myMetis.findDatatypeByName('boolean');
              if (booleanAsCheckbox)
                fieldType = 'checkbox';
              else {
                fieldType = 'radio';
                defValue = 'false';
                values = ['false', 'true'];
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
            case 'textcolor2':
            case 'fromArrowColor':
            case 'toArrowColor':
              values = colornames;
              defValue = 'black';
              fieldType = 'select';
              break;
            default:
              if (!fieldType)
                fieldType = 'textarea';
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
            for (let i = 0; i < values?.length; i++) {
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
              val = d.toISOString().slice(0, 10);
            }
            if (readonly) {
              disabled = true;
            }
          }
          if (fieldType === 'time') {
            pattern = "";
            if (val === "") {
              const d = new Date();
              val = d.getTime();
            }
            if (readonly) {
              disabled = true;
            }
          }
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
            if (tabIndex > 0)
              disabled = true;
          }
          switch (k) {
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
        row = <InspectorRow
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
          obj={selObj}
          context={modalContext}
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
    if (debug) console.log('950 SelectionInspector: modalContext', modalContext);
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
