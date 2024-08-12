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

const colornames = [
  'lightsalmon', '#87CEFE', 'turquoise', '#FFD701',
  'black', 'white',
  'red', 'darkred', 'pink',
  'green', 'palegreen', 'lightgreen', 'darkgreen', 'seagreen',
  'blue', 'lightblue', 'darkblue', 'skyblue',
  'grey', 'lightgrey', 'darkgrey',
  'yellow', 'lightyellow', 'yellowgreen', 'orange',
  'brown', 'purple',
  'violet',
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
    const context1 = this.props.context;
    const what = context1.what;
    let dets = [];
    if (what === 'editObject' || what === 'editRelationship') {
      // Edit object
      return this.renderObjectDetails1(dets);
    } else {
      // Edit object view
      return this.renderObjectDetails2(dets);
    }
  }

  private renderObjectDetails1(dets) {  // Handle objects and relationships
    let row = null;
    let namelist = "";
    const activeTab = this.props.activeTab;
    if (debug) console.log('62 SelectionInspector: myMetis', this.props);
    const context1 = this.props.context;
    const myMetis = this.props.myMetis as akm.cxMetis;
    const modalContext = context1.myContext;
    const myMetamodel: akm.cxMetaModel = modalContext.metamodel;
    const myModel: akm.cxModel = modalContext.model;
    const myModelview: akm.cxModelView = modalContext.modelview;
    let myObject: akm.cxObject = modalContext.object;
    let myObjectType: akm.cxObjectType = modalContext.objecttype;
    let mySupertypes: akm.cxObjectType[] = modalContext.supertypes;
    let myRelationship: akm.cxRelationship = modalContext.relship;
    let myRelationshipType: akm.cxRelationshipType = modalContext.relshiptype;
    if (myObjectType?.name === constants.types.AKM_ENTITY_TYPE) {
      myObjectType.properties = [];
    }
    const allowsMetamodeling = myModel?.includeSystemtypes;
    let k =0;
    let readOnly = false;
    myMetis.submodels = [];
    myMetis.submetamodels = [];
    if (debug) console.log('64 SelectionInspector: myMetis', myMetis);
    if (debug) console.log('66 activeTab', activeTab);
    let selObj = this.props.selectedData; // node
    let category = selObj?.category;
    if (selObj?.type === 'GraphLinksModel') {
      return;
    }
    if (!myObjectType) {
      myObjectType = myMetis.findObjectType(selObj?.objtypeRef) as akm.cxObjectType;
    }
    if (!myRelationshipType) {
      myRelationshipType = myMetis.findRelationshipType(selObj?.reltypeRef) as akm.cxRelationshipType;
    }
    let inst: akm.cxObject | akm.cxRelationship;
    let inst1: akm.cxObject | akm.cxRelationship;
    let type: akm.cxObjectType | akm.cxRelationshipType;
    let type1: akm.cxObjectType | akm.cxRelationshipType;
    let currentType: akm.cxObjectType | akm.cxRelationshipType;
    let chosenInst: akm.cxObject | akm.cxRelationship;
    let properties: akm.cxProperty[];
    let chosenType: akm.cxObjectType | akm.cxRelationshipType;
    let item, description;
    let typename = "";
    let typedescription = "";
    switch (category) {
      case constants.gojs.C_OBJECT:
        inst1 = myObject;
        if (inst1)
          inst = inst1;
        type = myObjectType;
        break;
      case constants.gojs.C_RELATIONSHIP:
        let relship = myRelationship;
        let reltype = myRelationshipType;
        inst = relship;
        inst1 = inst;
        type = reltype;
        type1 = type;
        break;
    }
    if (inst.parentModelRef !== myModel.id) {
      readOnly = true;
    }
    // Set chosenType
    let includeInherited = false;
    let includeConnected = false;
    let context = {
      myMetis: myMetis,
      includeConnected: false,
      includeInherited: false,
    }
    let tabIndex = 0;
    {
      let inheritedTypes = [];
      if (category === constants.gojs.C_OBJECT) {
        if (type?.name === 'Method') {
          chosenType =  myObjectType as akm.cxObjectType;
        } else {
          currentType = myObjectType as akm.cxObjectType;
          chosenType = currentType;
          chosenInst = inst;
          typename = currentType?.name;
          typedescription = currentType?.description;
        
          if (useTabs && context1?.what === 'editObject') {
            inheritedTypes = mySupertypes;
            if (inheritedTypes?.length > 0) {
              context.includeInherited = true;
            }
            const connectedObjects: akm.cxObject[] = inst?.getConnectedObjects2(myMetis);
            if (connectedObjects?.length > 0) {
              context.includeConnected = true;
            }
          }
        }
        namelist = uic.getNameList(inst, context, true);
        typename = namelist[activeTab];            
        if (namelist.length > 2 && typename !== 'Element' && typename !== 'Default') {
          for (let i = 0; i < mySupertypes.length; i++) {
            const tname = mySupertypes[i]?.name;
            if (tname === typename) {
              type = inheritedTypes[i];
              chosenType = type as akm.cxObjectType;
            }
          }
        }        
      } else if (category === constants.gojs.C_RELATIONSHIP) {
        currentType = type as akm.cxRelationshipType;
        chosenType = currentType;
        chosenInst = inst1;
        typename = currentType.name;
        typedescription = currentType.description;
        if (useTabs && context1.what === 'editRelationship') {
          let inheritedTypes = inst1?.getInheritedTypes();
          inheritedTypes.push(currentType);
          inheritedTypes = [...new Set(inheritedTypes)];
          if (inst1?.hasInheritedProperties(myModel))
            includeInherited = true;
          context = {
            myMetis: myMetis,
            myModel: myModel,
            myMetamodel: myMetamodel,
            activeTab: activeTab,
            includeConnected: false,
            includeInherited: includeInherited,
          }
          let namelist = uic.getNameList(inst1, context, true);
          if (namelist.length > 1) {
            for (let i = 0; i < inheritedTypes.length; i++) {
              const tname = inheritedTypes[i]?.name;
              if (tname === typename) {
                type = inheritedTypes[i];
                chosenType = type as akm.cxObjectType;
                break;
              }
            }
          }
          if (!inst1?.hasInheritedProperties(myModel)) {
            chosenType = currentType;
            type = currentType;
          }
        }
      }
    }
    if (typeof (type) !== 'object')
      return;

    let useFillColor = false;
    let useStrokeColor = false;
    let isLabel = false;
    const what = context1.what;
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
        if (type?.name === 'Method') {
          const inst1 = myMetis.findObject(inst.id) as akm.cxObject;
          if (inst1) inst = inst1;
          properties = inst.setAndGetAllProperties(myMetis) as akm.cxProperty[];
          chosenInst = inst;
        } else {
          let includeInherited = false;
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
          // Sets empty string if undefined:
          if (!v) chosenInst[prop.name] = "";  
        }
      }
    }
    // For each 'what' set correct item 
    switch (what) {
      case "editObject":
        if (type?.name === constants.types.AKM_LABEL)
          isLabel = true;
        item = chosenInst;
        break;
      case "editRelationship":
        item = chosenInst;
        break;
      default:
        item = inst;
        break;
    }     
    // Now build the proplist  
    let propNo = 0;
    let proplist = [];
    for (let k in chosenType) {
      // Filter some system attributes
      if (!uic.isPropIncluded(k, chosenType)) 
        continue;
      if (k === 'viewkind')
        continue;
      {
        if (k === 'grabIsAllowed') {
          if (what !== 'editObjectview' && what !== 'editTypeview') continue;
          if (item['viewkind'] !== 'Container') continue;
        }
        if (k === 'abstract') {
          if (what === "editObject") {
            if (type && type.name !== constants.types.AKM_ENTITY_TYPE)
              continue;
          }
          else if (what !== 'editObjectType')
            continue;
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
        if (typeof (k) === 'object') 
          continue;
      }
      propNo++;
      let propIdent = new akm.cxIdent(propNo, k);
      proplist.push(propIdent);      
    }    
    if (debug) console.log('proplist', proplist);
    if (namelist.length > 1) {
      if (typename === 'Default') {
        properties = [];
      } 
    }
    // Then extend the proplist with properties
    for (let n = 0; n < properties?.length; n++) {
      const p = properties[n];
      let found = false;
      propNo++;
      let propIdent = new akm.cxIdent(propNo, p.name);
      proplist.push(propIdent);
    }                    
    // Now build the rows
    for (let n = 0; n < proplist?.length; n++) {
      let val = "";
      let fieldType = 'text';
      let viewFormat = "";
      let readonly = readOnly;
      let disabled = false;
      let checked = false;
      let pattern = ".";
      let required = false;
      let defValue = "";
      let values = [];

      const k = proplist[n].name;
      // Get property values
      if (properties?.length > 0) {
        for (let i = 0; i < properties.length; i++) {
          let prop: akm.cxProperty = properties[i];
          if (prop) {
            let myProp = myMetamodel.findProperty(prop.id);
            if (!myProp) {
              myProp = new akm.cxProperty(prop.id, prop.name, prop.description);
              myProp.methodRef = prop.methodRef;
              myProp.datatypeRef = prop.datatypeRef;
              prop = myProp;
            }
            if (prop.name !== k)
              continue;
            if (prop.readOnly) {
              readonly = true;
            }
            if (prop.isRequired) {
              required = true;
            }
            // prop = myMetamodel.findProperty(prop.id);
            let dtype = prop.datatype as akm.cxDatatype;
            if (!dtype) {
              const dtypeRef = prop.datatypeRef;
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
              if (inst?.category === constants.gojs.C_OBJECT) {
                const obj = myMetis.findObject(inst.id);
                if (obj) inst = obj;
              } else if (inst?.category === constants.gojs.C_RELATIONSHIP) {
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
            if (inst?.category === constants.gojs.C_OBJECT) {
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
      if (what === 'editObject') {
        if (includeConnected) {
          if (k === "name") {
            val = chosenInst.getName();
            break;
          }
        }
        if (k === 'typename') {
          val = chosenInst.type?.name;
        } else if (k === 'typedescription') {
          val = chosenInst.type?.description;
        } else
          val = chosenInst[k];
      } else if (what === 'editRelationship') {
        // Check if k should NOT be included in the modal
        if (!uic.isPropIncluded(k, type)) {
            continue;
        }
        if (k === 'typename') {
          if (activeTab !== "0") 
            continue
          val = chosenInst.type?.name;
        } else if (k === 'typedescription') {
          if (activeTab !== "0") 
            continue
          val = chosenInst.type?.description;
        } else 
          val = chosenInst[k];
      }
      if (k) {
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
            if (val?.substring(0, 3) === 'rgb(') {
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
            case 'typedescription':
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
            case 'grabIsAllowed':
              fieldType = 'checkbox';
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
        // Handle fieldtypes
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
          // Handle viewFormat
          if (k === 'name') {
            fieldType = 'text';
          }
          if (viewFormat) {
            if (utils.isNumeric(val) && fieldType !== 'time') {
              val = printf(viewFormat, Number(val));
            }
          }
        }
        if (debug) console.log('918 k, val, readonly, disabled', k, val, readonly, disabled);
        if (readonly) {
          disabled = true;
        }
        if (namelist.length > 2) {
           if (namelist[activeTab] !== 'Default') {
             if (k === 'id' || k === 'typename' || k === 'typedescription' || k === 'name' || k === 'description') 
                continue;
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

  private renderObjectDetails2(dets) { // Handle object and relationship views
    const activeTab = this.props.activeTab;
    if (debug) console.log('62 SelectionInspector: myMetis', this.props);
    // remove recursive references from myMetis
    const context1 = this.props.context;
    const what = context1.what;
    const myMetis = this.props.myMetis as akm.cxMetis;
    const modalContext = context1.myContext;
    const myMetamodel: akm.cxMetaModel = modalContext.metamodel;
    const myModel: akm.cxModel = modalContext.model;
    let myObject: akm.cxObject = modalContext.object;
    let myObjectView: akm.cxObjectView = modalContext.objectview;
    let myObjectType: akm.cxObjectType = modalContext.objecttype;
    let myObjectTypeView: akm.cxObjectTypeView = modalContext.objecttypeview;
    let myRelationship: akm.cxRelationship = modalContext.relship;
    let myRelationshipView: akm.cxRelationshipView = modalContext.relshipview;
    let myRelationshipType: akm.cxRelationshipType = modalContext.relshiptype;
    let myRelationshipTypeView: akm.cxRelationshipTypeView = modalContext.relshiptypeview;

    const allowsMetamodeling = myModel?.includeSystemtypes;
    let k =0;
    myMetis.submodels = [];
    myMetis.submetamodels = [];
    if (debug) console.log('64 SelectionInspector: myMetis', myMetis);
    if (debug) console.log('66 activeTab', activeTab);
    let selObj = this.props.selectedData; // node
    let category = selObj?.category;
    if (selObj?.type === 'GraphLinksModel') {
      return;
    }
    if (!myObjectType) {
      myObjectType = myMetis.findObjectType(selObj?.objtypeRef) as akm.cxObjectType;
      myObjectTypeView = myObjectType?.typeview;
    }
    if (myObjectTypeView)
      myObjectTypeView.viewkind = myObjectTypeView.data.viewkind;
    if (!myRelationshipType) {
      myRelationshipType = myMetis.findRelationshipType(selObj?.reltypeRef) as akm.cxRelationshipType;
      myRelationshipTypeView = myRelationshipType?.typeview;
    }
    let inst: akm.cxObject | akm.cxRelationship;
    let instview: akm.cxObjectView | akm.cxRelationshipView;
    let inst1: akm.cxObject | akm.cxRelationship;
    let instview1: akm.cxObjectView | akm.cxRelationshipView;
    let type: akm.cxObjectType | akm.cxRelationshipType;
    let type1: akm.cxObjectType | akm.cxRelationshipType;
    let typeview: akm.cxObjectTypeView | akm.cxRelationshipTypeView;
    let objtypeview: akm.cxObjectTypeView;
    let reltypeview: akm.cxRelationshipTypeView;
    let chosenInst: akm.cxObject | akm.cxRelationship;
    let item, description;
    switch (category) {
      case constants.gojs.C_OBJECT:
        instview1 = myObjectView;
        if (!myObject) myObject = myObjectView?.object;
        inst1 = myObject;
        if (instview1)
          instview = instview1;
        if (inst1)
          inst = inst1;
        type = myObjectType;
        objtypeview = myObjectTypeView;
        typeview = objtypeview;
        console.log('96', type, type1, objtypeview, typeview);
        break;
      case constants.gojs.C_OBJECTTYPE:
        type = myObjectType;
        objtypeview = myObjectTypeView;
        typeview = objtypeview;
        break;
      case constants.gojs.C_RELATIONSHIP:
        let relship = myRelationship;
        let relview = myRelationshipView;
        let reltype = myRelationshipType;
        instview = relview as akm.cxRelationshipView;
        inst = relship;
        inst1 = inst;
        type = reltype;
        type1 = type;
        typeview = myRelationshipTypeView;
        break;
      case constants.gojs.C_RELSHIPTYPE:
        type = myRelationshipType;
        typeview = myRelationshipTypeView;
        break;
    }
    // Set chosenType
    let includeConnected = false;
    let tabIndex = 0;
    if (typeof (type) !== 'object')
      return;

    let useFillColor = false;
    let useStrokeColor = false;
    let useItem = false;
    let isLabel = false;
    let test = null;
    // For each 'what' set correct item 
    switch (what) {
      case "editModelview":
        item = modelview;
        test = item;
        break;
      case "editObjectview":
      case "editRelshipview":
      case "editTypeview":
        if (selObj.category === constants.gojs.C_RELATIONSHIP) {
          item = instview;
          if (what === "editTypeview") {
            item = reltypeview;
          }
        } else if (selObj.category === constants.gojs.C_RELSHIPTYPE) {
          item = reltypeview?.data;
          item = reltypeview?.data;
        } else if (selObj.category === constants.gojs.C_OBJECT) {
          item = instview;
          if (what === "editTypeview") {
            item = objtypeview;
          }
        } else if (selObj.category === constants.gojs.C_OBJECTTYPE) {
          item = objtypeview?.data;
          item = objtypeview;
        }
        if (!item) item = inst;
        let hideNameAndDescr = true;
        if (what === "editObjectview") {
          if (type?.name !== constants.types.AKM_PORT)
            useFillColor = false;
        } else if (what === "editRelshipview" || what === "editTypeview") {
          useStrokeColor = false;
        }
        test = typeview?.data;
        break;
      default:
        item = inst;
        break;
    }
    for (let k in test) {
      let row;
      // Filter some system attributes
      {
        if (!uic.isPropIncluded(k, type)) 
          continue;
        if (k === 'grabIsAllowed') {
          if (what !== 'editObjectview' && what !== 'editTypeview') continue;
          if (item['viewkind'] !== 'Container') continue;
        }
        if (k === 'abstract') {
          if (what !== 'editObjectType')
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

        description = "";
        if (k) {
          let fieldType = 'text';
          let viewFormat = "";
          let readonly = false;
          let disabled = false;
          let checked = false;
          let pattern = ".";
          let required = false;
          let defValue = "";
          let values = [];
          let val = selObj[k];
          // Handle attributes not to be included in modal
          {
            if (k === 'dash') {
              if (typeof (val) === 'object') {
                val = val.valueOf();
              }
            }
          }
          // Get field value (val)
          {
            switch (what) {
              case 'editTypeview':
                if (objtypeview) {
                  val = selObj[k];
                  break;
                } else if (reltypeview) {
                  val = item[k];
                }
                break;
              case 'editObjectview':
                if (k === 'grabIsAllowed') {
                  val = selObj[k];
                  break;
                }
              case 'editRelshipview':
                // val = selObj[k]; // instview[k];
                break;
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
              if (val?.substring(0, 3) === 'rgb(') {
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
              case 'typedescription':
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
              case 'grabIsAllowed':
                fieldType = 'checkbox';
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
          // Handle fieldtypes
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

            // Handle viewFormat
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
          if (debug) console.log('918 k, val, readonly, disabled', k, val, readonly, disabled);

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
