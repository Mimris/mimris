// @ts-nocheck
const debug = false;

import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as jsn from '../akmm/ui_json';
import * as uic from '../akmm/ui_common';

const constants = require('../akmm/constants');

let includeNoType = false;


export function buildGoPalette(metamodel: akm.cxMetaModel, metis: akm.cxMetis): gjs.goModel {
  if (debug) console.log('16 metamodel', metamodel);
  let inheritedTypenames, typenames;
  const modelRef = metamodel?.generatedFromModelRef;
  let model = metis?.findModel(modelRef);
  if (metamodel) {
    const mmtypenames = [];
    const objtypes = metamodel.includeSystemtypes ? metamodel?.objecttypes : metamodel?.objecttypes0;
    if (objtypes) {
      for (let i = 0; i < objtypes.length; i++) {
        const objtype = objtypes[i];
        if (objtype) {
          mmtypenames.push(objtype.name);
        }
      }
    }
    typenames = [...new Set(mmtypenames)];
    if (debug) console.log('32 MM objecttypes', typenames);
  }
  if (model) {
    const mmodel = model.metamodel;
    const objtypenames = [];
    const objtypes = mmodel?.objecttypes;
    if (objtypes) {
      for (let i = 0; i < objtypes.length; i++) {
        const objtype = objtypes[i];
        if (objtype) {
          objtypenames.push(objtype.name);
        }
      }
    }
    inheritedTypenames = [...new Set(objtypenames)];
    if (debug) console.log('47 objecttypes', inheritedTypenames);
  }
  const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
  let objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes0;
  if (objecttypes) {
    objecttypes.sort(utils.compare);
  }
  if (debug) console.log('54 objecttypes', objecttypes);
  if (objecttypes) {
    let includesSystemtypes = false;
    const otypes = new Array();
    for (let i = 0; i < objecttypes.length; i++) {
      const objtype: akm.cxObjectType = objecttypes[i];
      if (debug) console.log('60 objtype', objtype);
      if (!objtype) continue;
      if (objtype.markedAsDeleted) continue;
      if (objtype.abstract) continue;
      if (objtype.nameId === 'Entity0') continue;
      if (objtype.name === 'Datatype') includesSystemtypes = true;
      if (!includesSystemtypes) {
        // Check if objtype is one of typenames
        if (!(typenames && utils.nameExistsInNames(typenames, objtype.name))) {
          // If not:
          if (objtype.name !== 'Generic' && objtype.name !== 'Container' && objtype.name !== 'Label') {
            if (inheritedTypenames && utils.nameExistsInNames(inheritedTypenames, objtype.name))
              continue;
          }
        }
      }
      otypes.push(objtype);
    }
    if (debug) console.log('78 otypes', otypes);
    const noTypes = otypes.length;
    for (let i = 0; i < noTypes; i++) {
      const objtype: akm.cxObjectType = otypes[i];
      if (!includesSystemtypes) {    // Systemtypes are not included
        // Check if objtype is one of typenames
        if (!(typenames && utils.nameExistsInNames(typenames, objtype.name))) {
          // If not:
          if (objtype.name !== 'Generic' && objtype.name !== 'Container' && objtype.name !== 'Label') {
            if (inheritedTypenames && utils.nameExistsInNames(inheritedTypenames, objtype.name))
              continue;
          }
        }
      }
      const id = utils.createGuid();
      const name = objtype.name;
      const obj = new akm.cxObject(id, name, objtype, "");
      if (obj.id === "") obj.id = id;
      if (obj.name === "") obj.name = name;
      if (!obj.type) {
        const otype = metamodel.findObjectType(obj.type.id);
        obj.type = otype;
      }
      if (obj.isDeleted())
        continue;
      if (debug) console.log('103 obj, objtype', obj, objtype);
      const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "", null);
      let typeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
      if (typeview?.data.viewkind === 'Container') {
        objtype.viewkind = 'Container';
      }
      // Hack
      const otype = metis.findObjectTypeByName(objtype.name);
      if (!typeview) {
        if (otype) {
          typeview = otype.getDefaultTypeView() as akm.cxObjectTypeView;
        } else
          typeview = objtype.newDefaultTypeView('Object') as akm.cxObjectTypeView;
      }
      // End hack
      objview.setTypeView(typeview);
      const node = new gjs.goObjectNode(utils.createGuid(), objview);
      node.loadNodeContent(myGoPaletteModel);
      if (debug) console.log('121 node', objtype, objview, node);
      node.isGroup = objtype.isContainer();
      if (node.isGroup)
        node.category = constants.gojs.C_PALETTEGROUP_OBJ;
      myGoPaletteModel.addNode(node);
    }
  }
  if (debug) console.log('128 Objecttype palette', myGoPaletteModel);
  return myGoPaletteModel;
}

export function buildObjectPalette(objects: akm.cxObject[], includeDeleted: boolean = false): gjs.goModel {
  const myGoObjectPalette = new gjs.goModel(utils.createGuid(), "myObjectPalette", null);
  if (debug) console.log('134 ui_buildmodels objects', objects);
  if (objects) {
    // console.log('136 ui_buildmodels objects', objects);
    // objects.sort(utils.compare);
  }
  const nodeArray = new Array();
  for (let i = 0; i < objects?.length; i++) {
    let includeObject = false;
    const obj = objects[i];
    if (debug) console.log('142 obj', obj);
    const objtype = obj?.getObjectType();
    if (!objtype) continue; // added 2022-09-29 sf 
    if (!objtype.getDefaultTypeView) continue; // added 2022-09-29 sf 
    const typeview = objtype?.getDefaultTypeView() as akm.cxObjectTypeView;
    const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "", null);
    objview.setTypeView(typeview);
    if (debug) console.log('147 obj, objview:', obj, objview);
    if (!includeDeleted) {
      if (obj.isDeleted())
        includeObject = false;
    }
    if (includeDeleted) {
      if (obj.markedAsDeleted) {
        objview.strokecolor = "red";
        includeObject = true;
      }
    }
    if (!includeNoType) {
      if (!obj.type) {
        if (debug) console.log('160 obj', obj);
        obj.markedAsDeleted = true;
      }
    }
    if (includeNoType) {
      if (!obj.type) {
        if (debug) console.log('166 obj', obj);
        objview.strokecolor = "green";
        includeObject = true;
      }
    }
    if (!obj.markedAsDeleted && obj.type) {
      includeObject = true;
    }
    if (includeObject) {
      const node = new gjs.goObjectNode(utils.createGuid(), objview);
      node.isGroup = objtype?.isContainer();
      node.category = constants.gojs.C_OBJECT;
      const viewdata: akm.cxObjtypeviewData = typeview?.data;
      const vdata: akm.cxObjtypeviewData = new akm.cxObjtypeviewData();
      for (const prop in viewdata) {
        vdata[prop] = viewdata[prop];
      }
      if (obj.fillcolor !== "" && obj.fillcolor !== undefined)
        vdata.fillcolor = obj.fillcolor;
      node.addData(vdata);
      nodeArray.push(node);
    }
  }
  return nodeArray;
}

export function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView, includeDeleted: boolean, includeNoObject: boolean, showModified: boolean): gjs.goModel {
  if (!model) return;
  if (!modelview) return;
  // model.setMyMetis(metis);
  let showRelshipNames = modelview.showRelshipNames;
  if (showRelshipNames == undefined)
    showRelshipNames = true;
  const guid = modelview.id;
  const myGoModel = new gjs.goModel(guid, "myModel", modelview);
  // load object views
  let objviews = modelview?.getObjectViews() as akm.cxObjectView[];
  if (objviews) {
    const focusObjview = modelview?.focusObjectview;
    for (let i = 0; i < objviews.length; i++) {
      let includeObjview = false;
      let objview = objviews[i] as akm.cxObjectView;
      if (!objview.id)
        continue;
      if (objview.name === objview.id)
        continue;
      const obj = objview.object as akm.cxObject;
      if (!model.findObject(obj?.id))
        continue;
      if (true) {
        if (objview.id === focusObjview?.id)
          objview.isSelected = true;
        else
          objview.isSelected = false;
      }
      let objtype;
      objtype = obj?.type as akm.cxObjectType;
      if (!objtype) {
        includeObjview = true;
        includeNoType = true;
      } else {
        if (obj && obj?.markedAsDeleted == undefined)
          obj.markedAsDeleted = false;
        if (obj?.markedAsDeleted)
          objview.markedAsDeleted = obj?.markedAsDeleted;
        objview.name = obj?.name;
        if (obj?.type?.name === 'Label')
          objview.name = obj.text;
        if (objview.viewkind === constants.viewkinds.CONT)
          objview.isGroup = true;
        // objview.visible = obj?.visible
        if (includeDeleted) {
          if (objview.markedAsDeleted) {
            if (objview.object?.markedAsDeleted) {
              objview.strokecolor = "orange";
              includeObjview = true;
            } else {
              objview.strokecolor = "pink";
              includeObjview = true;
            }
          }
        }
        // added 2023-04-23 sf
        if (showModified) {
          if (objview.modified) {
            if (objview.object?.modified) {
              objview.strokecolor = "green";
              objview.strokewidth = 2;
              includeObjview = true;
            } else {
              // objview.strokecolor = "pink";
              includeObjview = true;
            }
          }
        }
        // end added 2023-04-23 sf
        if (includeNoObject) {
          if (!objview.object) {
            objview.strokecolor = "blue";
            if (!objview.fillcolor) objview.fillcolor = "lightgrey";
            includeObjview = true;
          }
        }
        if (includeNoType) {
          if (!objview.object?.type) {
            if (debug) console.log('262 objview', objview);
            objview.strokecolor = "green";
            if (objview.fillcolor) objview.fillcolor = "lightgrey";
            includeObjview = true;
          }
        }
        if (!objview.markedAsDeleted && objview.object) {
          includeObjview = true;
        }
      }
      // if (!objview.visible) includeObjview = false;
      if (includeObjview) {
        if (!includeDeleted && objview.markedAsDeleted)
          continue;
        if (!includeNoObject && !objview.object)
          continue;
        if (!includeNoType && !objview.object?.type)
          continue;
        const node = new gjs.goObjectNode(utils.createGuid(), objview);
        node.scale = objview.scale1;
        if (node.template === "")
          node.template = 'textAndIcon';
        myGoModel.addNode(node);
        node.name = objview.name;
        if (node.fillcolor === "") {
          node.fillcolor = "lightgrey";
          const object = node.object as akm.cxObject;
          const objtype = object?.type as akm.cxObjectType;
          const typeview = objtype?.getDefaultTypeView() as akm.cxObjectTypeView;
          if (typeview) {
            node.fillcolor = typeview.fillcolor;
          }
        }
      }
    }
    const nodes = myGoModel.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i] as gjs.goObjectNode;
      if (!node.object) continue;
      let objview = node.objectview as akm.cxObjectView;
      objview = modelview.findObjectView(objview.id);
      if (!objview)
        continue;
      if (objview.id === focusObjview?.id) {
        objview.isSelected = true;
        node.isSelected = true;
      }
      let obj = node.object as akm.cxObject;
      obj = model.findObject(obj.id);
      if (!obj)
        continue;
      let objtype = obj.type as akm.cxObjectType;
      if (objtype?.name === 'Label') {
        node.text = objview.name;
      }
      let typeview = objview.typeview;
      if (typeview && typeview instanceof akm.cxObjectTypeView) {
        typeview = metis.findObjectTypeView(typeview.id);
        objview.setTypeView(typeview);
        node.typeview = objview.typeview;
        node.name = objview.name;
        node.loadNodeContent(myGoModel);
        node.name = objview.name;
        if (node.object['proposedType'])
          node.typename = node.object['proposedType'];
        myGoModel.addNode(node);
      } else {
        if (debug) console.log('336 objview, typeview', objview, typeview);
        if (!typeview) {
          typeview = objview.object?.type?.getDefaultTypeView();
          typeview = metis.findObjectTypeView(typeview.id);
          objview.setTypeView(typeview);
          if (debug) console.log('338 typeview', typeview);
        }
      }
    }
  }
  // load relship views
  const relshipviews = [] as akm.cxRelationshipView[];
  let relviews = (modelview) && modelview.getRelationshipViews();
  if (relviews) {
    const modifiedRelviews = [];
    let lng = relviews.length;
    for (let i = 0; i < lng; i++) {
      let includeRelview = false;
      let relview = relviews[i] as akm.cxRelationshipView;
      if (relview?.fromArrow === 'None' || relview?.fromArrow === ' ')
        relview.fromArrow = '';
      if (relview?.toArrow === 'None' || relview?.toArrow === ' ')
        relview.toArrow = '';
      if (relview.points === "")
        relview.points = [];
      let fromObjview = relview.fromObjview as akm.cxObjectView;
      if (!fromObjview || !modelview.findObjectView(fromObjview.id))
        continue;
      let toObjview = relview.toObjview as akm.cxObjectView;
      if (!toObjview || !modelview.findObjectView(toObjview.id))
        continue;
      const rel = relview.relship as akm.cxRelationship;
      if (rel) {
        if (rel.markedAsDeleted == undefined)
          rel.markedAsDeleted = false;
        if (rel.markedAsDeleted)
          relview.markedAsDeleted = rel?.markedAsDeleted;
        relview.name = rel.name;
      }
      let relcolor = "black";
      if (includeDeleted) {
        if (relview.markedAsDeleted && relview.relship?.markedAsDeleted) {
          relcolor = "red";
          includeRelview = true;
        } else if (relview.markedAsDeleted) {
          relcolor = "rgb(220,0,150)"; // pink
          includeRelview = true;
        } else if (relview.relship?.markedAsDeleted) {
          relcolor = "orange";
          includeRelview = true;
        }
      }
      if (includeNoObject) {
        if (!relview.relship) {
          relcolor = "blue";
          includeRelview = true;
        }
      }
      if (relview.visible === false)
        includeRelview = false;
      if (includeNoType) {
        if (!relview.relship?.type) {
          relcolor = "green";
          includeRelview = true;
        }
      }
      if (!relview.markedAsDeleted && relview.relship) {
        includeRelview = true;
      }
      if (!includeDeleted && !includeNoObject && !includeNoType && relview)
        if (relview.strokecolor === "")
          relcolor = relview?.typeview?.strokecolor;
      if (!relcolor) relcolor = 'black';
      if (includeRelview) {
        if (relview.strokewidth === "NaN") relview.strokewidth = "1";
        relview.setFromArrow2(rel?.relshipkind);
        relview.setToArrow2(rel?.relshipkind);
        relview = uic.updateRelationshipView(relview);
        relshipviews.push(relview);
        const jsnRelview = new jsn.jsnRelshipView(relview);
        modifiedRelviews.push(jsnRelview);
        let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
        const name = link.name;
        if (debug) console.log('382 modelview, link:', modelview, link);
        link.loadLinkContent(myGoModel);
        link.name = name;
        // link.corner = relview.corner ? relview.corner : "0";
        link.curve = relview.curve ? relview.curve : "None";
        link.routing = relview.routing ? relview.routing : "Normal";
        if (!showRelshipNames)
          link.name = " ";
        if (includeDeleted || includeNoObject || includeNoType) {
          link.strokecolor = relview.strokecolor ? relview.strokecolor : relview.typeview?.strokecolor;
          link.strokewidth = "1";
        }
        myGoModel.addLink(link);
      }
    }
  }
  modelview.relshipviews = relshipviews;
  // In some cases some of the links were not shown in the goModel (i.e. the modelview), so ...
  uic.repairGoModel(myGoModel, modelview);
  if (debug) console.log('443 myGoModel', myGoModel);
  return myGoModel;
}

export function buildGoMetaPalette() {
  if (debug) console.log('415 buildGoMetaPalette');
  const myGoMetaPalette = new gjs.goModel(utils.createGuid(), 'myMetaPalette', null);
  const nodeArray = new Array();
  const palNode1 = new gjs.paletteNode('01', "objecttype", "Object type", "Object type", "");
  nodeArray.push(palNode1);
  // const palNode2 = new gjs.paletteNode('02', "container", "Container", "Group", "");
  // palNode2.isGroup = true;
  // palNode2.fillcolor = "white";
  // nodeArray.push(palNode2);
  let links = '[]';
  let linkArray = JSON.parse(links);
  myGoMetaPalette.nodes = nodeArray;
  myGoMetaPalette.links = linkArray;
  if (debug) console.log('428 myGoMetaPalette', myGoMetaPalette);
  return myGoMetaPalette;
}

export function buildGoMetaModel(metamodel: akm.cxMetaModel, includeDeleted: boolean, showModified: boolean): gjs.goModel | undefined {
  if (!metamodel)
    return;
  if (debug) console.log('435 metamodel', metamodel);
  metamodel.objecttypes = utils.removeArrayDuplicatesById(metamodel?.objecttypes, "id");
  if (metamodel.objecttypes) {
    if (debug) console.log('438 metamodel', metamodel);
    const myGoMetamodel = new gjs.goModel(utils.createGuid(), "myMetamodel", null);
    const objtypes = metamodel?.getObjectTypes();
    if (objtypes) {
      if (debug) console.log('442 objtypes', objtypes);
      for (let i = 0; i < objtypes.length; i++) {
        let includeObjtype = false;
        const objtype = objtypes[i];
        const outreltypes = objtype.outputreltypes;
        for (let j = 0; j < outreltypes?.length; j++) {
          const reltype = outreltypes[j];
          if (reltype) {
            if (debug) console.log('450 reltype', reltype);
            if (!reltype.fromObjtype) {
              if (reltype.fromobjtypeRef)
                reltype.fromObjtype = metamodel.findObjectType(reltype.fromobjtypeRef);
            }
            if (!reltype.toObjtype) {
              if (reltype.toobjtypeRef)
                reltype.toObjtype = metamodel.findObjectType(reltype.toobjtypeRef);
            }
          }
        }
        let typeview = objtype.typeview as akm.cxObjectTypeView;
        let strokecolor = typeview?.strokecolor;
        let fillcolor = typeview?.fillcolor;
        if (objtype) {
          if (!objtype.markedAsDeleted)
            includeObjtype = true;
          else {
            if (debug) console.log('468 objtype', objtype);
            if (includeDeleted) {
              if (objtype.markedAsDeleted) {
                strokecolor = "orange";
                includeObjtype = true;
                fillcolor = "pink";
              }
            }
          }

          // added 2023-04-24 sf
          if (showModified) {
            if (debug) console.log('493 ui_buildmodels ', showModified, objtype.modified, objtype);
            if (objtype.modified) {
              objtype.strokecolor = "green";
              includeObjtype = true;
            } else {
              objtype.strokewidth = 2;
              // objview.strokecolor = "pink";
              includeObjtype = true;
            }
          }
          // end added 2023-04-24 sf

          if (includeObjtype) {
            if (!objtype.typeview)
              objtype.typeview = objtype.newDefaultTypeView('Object');
            const node = new gjs.goObjectTypeNode(utils.createGuid(), objtype);
            node.loadNodeContent(metamodel);
            node.strokecolor = strokecolor;
            // node.fillcolor = fillcolor;
            if (debug) console.log('484 objtype, node', objtype, node);
            myGoMetamodel.addNode(node);
          }
        }
      }
    }
    // metamodel.relshiptypes = utils.removeArrayDuplicatesById(metamodel?.relshiptypes, "id");
    let relshiptypes = metamodel.relshiptypes;
    if (debug) console.log('491 relshiptypes', relshiptypes);
    if (relshiptypes) {
      for (let i = 0; i < relshiptypes.length; i++) {
        let includeReltype = false;
        let reltype = relshiptypes[i];
        if (reltype.name === 'isRelatedTo')
          reltype.name = 'generic';
        if (reltype.fromArrow === " ")
          reltype.fromArrow = "";
        let strokecolor = reltype.typeview?.strokecolor;
        if (reltype.cardinality.length > 0) {
          reltype.cardinalityFrom = reltype.getCardinalityFrom();
          reltype.cardinalityTo = reltype.getCardinalityTo();
        }
        if (reltype.markedAsDeleted === undefined)
          reltype.markedAsDeleted = false;
        if (reltype && !reltype.markedAsDeleted)
          includeReltype = true;
        else {
          if (includeDeleted) {
            if (reltype.markedAsDeleted) {
              strokecolor = "orange";
              includeReltype = true;
            }
          }
        }
        if (includeReltype) {
          if (debug) console.log('521 reltype', reltype);
          if (!reltype.typeview)
            reltype.typeview = reltype.newDefaultTypeView(reltype.relshipkind);
          if (!reltype.fromObjtype)
            reltype.fromObjtype = metamodel.findObjectType(reltype.fromobjtypeRef);
          if (!reltype.toObjtype)
            reltype.toObjtype = metamodel.findObjectType(reltype.toobjtypeRef);
          if (reltype.typeview.fromArrow === ' ' || reltype.typeview.fromArrow === 'None')
            reltype.typeview.fromArrow = '';
          if (reltype.typeview.toArrow === ' ' || reltype.typeview.toArrow === 'None')
            reltype.typeview.toArrow = '';
          const key = utils.createGuid();
          const link = new gjs.goRelshipTypeLink(key, myGoMetamodel, reltype);
          if (debug) console.log('530 reltype, link', reltype, link);
          let strokewidth = reltype.typeview.strokewidth;
          if (!strokewidth)
            strokewidth = "1";
          if (link.loadLinkContent()) {
            let routing = reltype.typeview.routing;
            if (!routing || routing === "Normal")
              link.routing = metamodel.routing;
            let linkcurve = reltype.typeview.linkcurve;
            if (linkcurve || linkcurve === "None")
              link.curve = metamodel.linkcurve;
            link.relshipkind = reltype.relshipkind;
            link.strokewidth = strokewidth;
            link.strokecolor = strokecolor;
            link.category = constants.gojs.C_RELSHIPTYPE;
            if (debug) console.log('541 link', link.name, link);
            myGoMetamodel.addLink(link);
          }
        }
      }
    }
    if (debug) console.log('547 myGoMetamodel', myGoMetamodel);
    return myGoMetamodel;
  }
}

export function buildAdminModel(myMetis: akm.cxMetis): akm.cxModel {
  const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_MM);
  if (!adminMetamodel) {
    if (debug) console.log('555 No Admin Metamodel found!');
    return;
  }
  // Correct some errors in the Admin Metamodel
  let generatedTypeview;
  {
    const reltype = adminMetamodel.findRelationshipTypeByName(constants.admin.AKM_GENERATEDFROM_MODEL);
    if (reltype) {
      generatedTypeview = reltype.typeview;
      if (generatedTypeview) {
        generatedTypeview.toArrow = "";
        generatedTypeview.strokecolor = "red";
        generatedTypeview.fromArrow = "BackwardOpenTriangle";
        generatedTypeview.toArrow = "None";
      }
    }
    let firstTime = false;
    let adminModel = myMetis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    let adminModelview;
    if (!adminModel) {
      firstTime = true;
      adminModel = new akm.cxModel(utils.createGuid(), constants.admin.AKM_ADMIN_MODEL, adminMetamodel, "");
      myMetis.addModel(adminModel);
      // Add modelview
      adminModelview = new akm.cxModelView(utils.createGuid(), '_ADMIN', adminModel, '');
      adminModelview.layout = 'LayeredDigraph'; // 'Grid', 'Circular', 'ForceDirected', 'LayeredDigraph', 'Tree'
      adminModel.addModelView(adminModelview);
      myMetis.addModelView(adminModelview);
    }
    if (adminModel) {
      if (debug) console.log('585 adminModel', adminModel);
      adminModel.objects = null;
      adminModel.relships = null;
      adminModelview = adminModel.modelviews ? adminModel.modelviews[0] : null;
      if (adminModelview) {
        adminModelview.objectviews = null;
        adminModelview.relshipviews = null;
      }

      const projectType = myMetis.findObjectTypeByName(constants.admin.AKM_PROJECT);
      const metamodelType = myMetis.findObjectTypeByName(constants.admin.AKM_METAMODEL);
      const modelType = myMetis.findObjectTypeByName(constants.admin.AKM_MODEL);
      const modelviewType = myMetis.findObjectTypeByName(constants.admin.AKM_MODELVIEW);
      const hasMetamodelType = myMetis.findRelationshipTypeByName(constants.admin.AKM_HAS_METAMODEL);
      const hasModelType = myMetis.findRelationshipTypeByName(constants.admin.AKM_HAS_MODEL);
      const hasModelviewType = myMetis.findRelationshipTypeByName(constants.admin.AKM_HAS_MODELVIEW);
      const refersToMetamodelType = myMetis.findRelationshipTypeByName(constants.admin.AKM_REFERSTO_METAMODEL);
      const generatedFromModelType = myMetis.findRelationshipTypeByName(constants.admin.AKM_GENERATEDFROM_MODEL);
      let projectview;
      if (debug) console.log('604 adminModel', adminModel);
      let project;
      if (!project) {
        project = new akm.cxObject(utils.createGuid(), myMetis.name, projectType, myMetis.description);
        project.metisId = myMetis.id;
        project.allowGenerateCurrentMetamodel = myMetis.allowGenerateCurrentMetamodel;
        adminModel.addObject(project);
        myMetis.addObject(project);
        projectview = new akm.cxObjectView(utils.createGuid(), project.name, project, '');
        projectview.fillcolor = "lightgrey";
        project.addObjectView(projectview);
        adminModelview.addObjectView(projectview);
        myMetis.addObjectView(projectview);
      }
      if (debug) console.log('617 project', project);
      // Handle metamodels
      const metamodels = myMetis.metamodels;
      for (let i = 0; i < metamodels.length; i++) {
        const mm = metamodels[i];
        if (mm) {
          if (mm.name === constants.admin.AKM_ADMIN_MM)
            continue;
          let mmObj;
          if (!mmObj) { // Metamodel object
            mmObj = new akm.cxObject(utils.createGuid(), mm.name, metamodelType, mm.description);
            mmObj.metamodelId = mm.id;
            adminModel.addObject(mmObj);
            myMetis.addObject(mmObj);
            // Add relship from Project to Metamodel
            const mmRel = new akm.cxRelationship(utils.createGuid(), hasMetamodelType, project, mmObj, constants.admin.AKM_HAS_METAMODEL, '');
            adminModel.addRelationship(mmRel);
            myMetis.addRelationship(mmRel);
            // Create objectview of metamodel object
            const mmObjview = new akm.cxObjectView(utils.createGuid(), mmObj.name, mmObj, '');
            mmObjview.fillcolor = "lightblue";
            mmObj.addObjectView(mmObjview);
            adminModelview.addObjectView(mmObjview);
            myMetis.addObjectView(mmObjview);
            // Create relshipview from Project to Metamodel
            const mmRelview = new akm.cxRelationshipView(utils.createGuid(), mmRel.name, mmRel, '');
            mmRelview.setFromObjectView(projectview);
            mmRelview.setToObjectView(mmObjview);
            mmRel.addRelationshipView(mmRelview);
            adminModelview.addRelationshipView(mmRelview);
            myMetis.addRelationshipView(mmRelview);

            // Handle models based on this metamodel
            const models = myMetis.models;
            if (debug) console.log('651 models', models);
            for (let j = 0; j < models.length; j++) {
              const m = models[j];
              if (m && m.metamodel?.id === mm.id) {
                let mObj;
                if (!mObj) { // Model object
                  mObj = new akm.cxObject(utils.createGuid(), m.name, modelType, m.description);
                  mObj.modelId = m.id;
                  adminModel.addObject(mObj);
                  myMetis.addObject(mObj);

                  if (debug) console.log('662 mObj', mObj);

                  // Create objectview
                  const mObjview = new akm.cxObjectView(utils.createGuid(), mObj.name, mObj, '');
                  mObjview.fillcolor = "lightgreen";
                  mObj.addObjectView(mObjview);
                  adminModelview.addObjectView(mObjview);
                  myMetis.addObjectView(mObjview);

                  // Refer to metamodel
                  let mMeta = m.metamodel;
                  if (mMeta) {
                    let mmRef = adminModel.findObjectByTypeAndName(metamodelType, mMeta?.name);
                    if (mmRef) {
                      const relToMM = new akm.cxRelationship(utils.createGuid(), refersToMetamodelType, mObj, mmObj, constants.admin.AKM_REFERSTO_METAMODEL, '');
                      adminModel.addRelationship(relToMM);
                      myMetis.addRelationship(relToMM);

                      // Create relshipview from Model to Metamodel
                      const rvToMMv = new akm.cxRelationshipView(utils.createGuid(), relToMM.name, relToMM, '');
                      rvToMMv.setFromObjectView(mObjview);
                      rvToMMv.setToObjectView(mmObjview);
                      relToMM.addRelationshipView(rvToMMv);
                      rvToMMv.strokecolor = 'blue';
                      adminModelview.addRelationshipView(rvToMMv);
                      myMetis.addRelationshipView(rvToMMv);
                    }
                  }

                  // Add relship from Project object to Model object
                  const mRelPtoM = new akm.cxRelationship(utils.createGuid(), hasModelType, project, mObj, constants.admin.AKM_HAS_MODEL, '');
                  adminModel.addRelationship(mRelPtoM);
                  myMetis.addRelationship(mRelPtoM);

                  // Create relshipview from Project view to Model view
                  const mRvPtoM = new akm.cxRelationshipView(utils.createGuid(), mRelPtoM.name, mRelPtoM, '');
                  mRvPtoM.setFromObjectView(projectview);
                  mRvPtoM.setToObjectView(mObjview);
                  mRelPtoM.addRelationshipView(mRvPtoM);
                  adminModelview.addRelationshipView(mRvPtoM);
                  myMetis.addRelationshipView(mRvPtoM);

                  // Handle modelviews
                  const modelviews = m.modelviews;
                  for (let k = 0; k < modelviews?.length; k++) {
                    const mv = modelviews[k];
                    if (mv) {
                      let mvObj;
                      if (!mvObj) {
                        mvObj = new akm.cxObject(utils.createGuid(), mv.name, modelviewType, mv.description);
                        mvObj.modelviewId = mv.id;
                        mvObj.layout = mv.layout;
                        mvObj['link routing'] = mv['routing'];
                        mvObj['link curve'] = mv['linkcurve'];
                        mvObj.showCardinality = mv.showCardinality;
                        mvObj.askForRelshipName = mv.askForRelshipName;
                        mvObj.includeInheritedReltypes = mv.includeInheritedReltypes;
                        adminModel.addObject(mvObj);
                        myMetis.addObject(mvObj);

                        // Create objectview of Modelview object
                        const mvObjview = new akm.cxObjectView(utils.createGuid(), mvObj.name, mvObj, '');
                        mvObjview.fillcolor = "pink";
                        mvObj.addObjectView(mvObjview);
                        adminModelview.addObjectView(mvObjview);
                        myMetis.addObjectView(mvObjview);

                        // Add relship from Model object to Modelview object
                        const mvRel = new akm.cxRelationship(utils.createGuid(), hasModelviewType, mObj, mvObj, constants.admin.AKM_HAS_MODELVIEW, '');
                        mvRel.setFromObject(mObj);
                        mvRel.setToObject(mvObj);
                        adminModel.addRelationship(mvRel);
                        myMetis.addRelationship(mvRel);

                        // Create relshipview from Model view to Modelview view
                        const mvRelview = new akm.cxRelationshipView(utils.createGuid(), mvRel.name, mvRel, '');
                        mvRelview.setFromObjectView(mObjview);
                        mvRelview.setToObjectView(mvObjview);
                        mvRel.addRelationshipView(mvRelview);
                        adminModelview.addRelationshipView(mvRelview);
                        myMetis.addRelationshipView(mvRelview);

                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      // Handle metamodels generated from models
      for (let i = 0; i < metamodels.length; i++) {
        const mmodel = metamodels[i];
        if (mmodel.generatedFromModelRef) {
          const modelRef = mmodel.generatedFromModelRef;
          const model = myMetis.findModel(modelRef);
          if (model) {
            // Find metamodelObj
            const mmObj = adminModel.findObjectByTypeAndName(metamodelType, mmodel.name);
            // Find modelObj
            const mObj = adminModel.findObjectByTypeAndName(modelType, model.name);
            // Add relship from Metamodel object to Model object
            const genRel = new akm.cxRelationship(utils.createGuid(), generatedFromModelType, mmObj, mObj, constants.admin.AKM_GENERATEDFROM_MODEL, '');
            genRel.setFromObject(mmObj);
            genRel.setToObject(mObj);
            adminModel.addRelationship(genRel);
            myMetis.addRelationship(genRel);
            // Create relshipview from Metamodel view to Model view
            const genRelview = new akm.cxRelationshipView(utils.createGuid(), genRel.name, genRel, '');
            genRelview.typeview = generatedTypeview;
            if (debug) console.log('772 genRelview', genRelview);
            // Find mmObj->objectview
            if (mmObj && mObj && genRel && genRelview) {
              const mmObjview = mmObj.objectviews[0];
              const mObjview = mObj.objectviews[0];
              genRelview.setFromObjectView(mmObjview);
              genRelview.setToObjectView(mObjview);
              genRelview.strokecolor = 'red';
              genRelview.toArrow = "None";
              genRelview.toArrowColor = "black";
              genRelview.fromArrow = "BackwardOpenTriangle";
              genRel.addRelationshipView(genRelview);
              adminModelview.addRelationshipView(genRelview);
              if (debug) console.log('785 adminModelview', adminModelview);
              myMetis.addRelationshipView(genRelview);
            }
          }
        }
      }
    }
    return adminModel;
  }
}

export function buildMinimisedMetis(metis, curmod) {
  // stripped down metis to, where only current models and metamodels include all their objects and relationships, the rest has only id and name (needed for _ADMIN modellen)
  if (debug) console.log('812 buildMinimisedMetis', metis, curmod);
  const models = metis.models;
  const metamodels = metis.metamodels;

  const focusModel = (props.phFocus) && props.phFocus.focusModel
  const focusModelview = (props.phFocus) && props.phFocus.focusModelview
  const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
  const curmodIndex = (models && focusModel?.id) && models.findIndex((m: any) => m.id === focusModel.id)
  if (debug) console.log('820 models  ', models, 'curmod', curmod.name, 'curmod.modelviews', curmod.modelviews, 'focusModelview:', focusModelview)
  const curmodview = (curmod && focusModelview?.id) && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)
  const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodelRef)
  const curmetamodelIndex = (curmod) && metamodels.findIndex(mm => mm?.id === curmod?.metamodelRef)
  const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodelRef)
  const curtargetmetamodelIndex = (curmod) && metamodels.findIndex(mm => mm?.id === curmod?.targetMetamodelRef)
  const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)

  if (debug) console.log('828 GenGojsModel: curmod++', curmod, curmodview, metamodels, curtargetmodel, curmod?.targetModelRef);
  if (debug) console.log('829 GenGojsModel: metis', curmod, curmetamodel, curtargetmodel, curtargetmetamodel);
  // make metis object containing only current model , curtargetmodel, curmetamodel, curtargetmetamodel
  const strippedMetamodels = metamodels?.map(mm => {
    return {
      ...mm,
      methods: [],
      methodtypes: [],
      objecttypes: [],
      objecttypes0: [],
      objecttypeviews: [],
      objtypegeos: [],
      relshipstypes0: [],
      properties: [],
      relshipstypes: [],
      relshipstypes0: [],
      relshipstypeviews: [],
      viewstyles: [],
      units: [],
    }
  })

  const strippedModels = models?.map(m => {
    return {
      ...m,
      objects: [],
      relships: [],
      modelviews: m.modelviews?.map(mv => { return { id: mv.id, name: mv.name, objectviews: [], relshipviews: [] } })
    }
  })
  if (debug) console.log('858 GenGojsModel: strippedModels', models, strippedModels, strippedMetamodels);

  const curModelWithStrippedModels = [
    ...strippedModels?.slice(0, curmodIndex),
    curmod,
    ...strippedModels?.slice(curmodIndex + 1, strippedModels.length),
  ]
  if (debug) console.log('865 curModelWithStrippedModels', curModelWithStrippedModels);
  const curTargetModelWithStrippedModels = (curtargetmodel) ? [
    ...curModelWithStrippedModels.slice(0, curtargetmodelIndex),
    curtargetmodel,
    ...curModelWithStrippedModels.slice(curtargetmodelIndex + 1, curModelWithStrippedModels.length)
  ] : [curmod]

  const curMetamodelWithStrippedMetamodels = [
    ...strippedMetamodels.slice(0, curmetamodelIndex),
    curmetamodel,
    ...strippedMetamodels.slice(curmetamodelIndex + 1, strippedMetamodels.length)
  ]

  const curTargetMetamodelWithStrippedMetamodels = [
    ...curMetamodelWithStrippedMetamodels.slice(0, curtargetmetamodelIndex),
    curtargetmetamodel,
    ...curMetamodelWithStrippedMetamodels.slice(curtargetmetamodelIndex + 1, curMetamodelWithStrippedMetamodels.length)
  ]

  if (debug) console.log('884 GenGojsModel:', curModelWithStrippedModels, curTargetMetamodelWithStrippedMetamodels);

  const curmodels = (curtargetmodel) ? curTargetModelWithStrippedModels : curModelWithStrippedModels
  const curmetamodels = (curtargetmetamodel) ? curTargetMetamodelWithStrippedMetamodels : curMetamodelWithStrippedMetamodels
  if (debug) console.log('888 GenGojsModel: curmodels', curmodels, curmetamodels);

  const metis2 = {
    name: metis.name,
    description: metis.description,
    currentMetamodelRef: metis.currentMetamodelRef,
    currentModelRef: metis.currentModelRef,
    currentModelviewRef: metis.currentModelviewRef,
    currentTargetModelRef: metis.currentTargetModelRef,
    currentTargetModelviewRef: metis.currentTargetModelviewRef,
    currentTaskModelRef: metis.currentTaskModelRef,
    currentTemplateModelRef: metis.currentTemplateModelRef,
    models: curmodels,
    metamodels: curmetamodels,
  }
  if (debug) console.log('903 GenGojsModel: metis2', metis2);

  return metis2;
}

export function buildInstancesModelview(myMetis: akm.cxMetis, dispatch: any, myModel: akm.cxModel) {
  // Find instances modelview
  let instancesModelview = myModel.findModelViewByName('_INSTANCES');
  if (instancesModelview) {
    instancesModelview.objectviews = null;
    instancesModelview.relshipviews = null;
  } else {
    // Create new instances modelview
    instancesModelview = new akm.cxModelView(utils.createGuid(), '_INSTANCES', myModel, '');
    instancesModelview.layout = 'LayeredDigraph'; // 'Grid', 'Circular', 'ForceDirected', 'LayeredDigraph', 'Tree'
    myModel.addModelView(instancesModelview);
    myMetis.addModelView(instancesModelview);
  }
  // Create object views
  const objects = myModel?.objects;
  for (let i = 0; i < objects?.length; i++) {
    const obj = objects[i];
    if (obj && !obj.markedAsDeleted) {
      const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, '');
      instancesModelview?.addObjectView(objview);
    }
  }
  // Create relship views
  const relships = myModel?.relships;
  for (let i = 0; i < relships?.length; i++) {
    const relship = relships[i];
    if (relship && !relship.markedAsDeleted) {
      let fromObjviews = instancesModelview?.findObjectViewsByObject(relship.fromObject);
      let toObjviews = instancesModelview?.findObjectViewsByObject(relship.toObject);
      const relview = new akm.cxRelationshipView(utils.createGuid(), relship.name, relship, '');
      if (fromObjviews && fromObjviews.length > 0 && toObjviews && toObjviews.length > 0) {
        relview.fromObjview = fromObjviews[0];
        relview.toObjview = toObjviews[0];
        instancesModelview?.addRelationshipView(relview);
      }
    }
  }
  if (instancesModelview) {
    // Do a dispatch
    const jsnMetis = new jsn.jsnExportMetis(myMetis, true);
    let data = { metis: jsnMetis }
    data = JSON.parse(JSON.stringify(data));
    dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
  }
  return instancesModelview;
}
