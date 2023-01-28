// @ts-nocheck
const debug = false;

const clog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: green; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: green; color: white');

// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as jsn from '../akmm/ui_json';
import * as uic from '../akmm/ui_common';

const constants = require('../akmm/constants');

// Parameters to configure loads
// const includeNoObject = false;
// const includeInstancesOnly = true 
let includeNoType = false;

const systemtypes = ['Property', 'Method', 'MethodType', 'Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];

const GenGojsModel = async (props: any, dispatch: any) =>  {
  if (debug) console.log('28 GenGojsModel started', props);
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('32 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showDeleted)
  const metis = (props.phData) && props.phData.metis // Todo: check if current model and then load only current model
  const models = (metis) && metis.models
  const focusModel = props.phFocus.focusModel
  const focusModelview = props.phFocus.focusModelview
  if (debug) console.log('37 GenGojsModel focusModel', focusModel, focusModelview)
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels
  let adminModel;
  if (metis != null) {
    if (!debug) clog('42 GenGojsModel: props', props);

    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)

    
    const myMetis = new akm.cxMetis();
    const tempMetis = myMetis
    if (debug) console.log('55 GenGojsModel: tempMetis', tempMetis);
    myMetis.importData(metis, true);
    // const metis2 = buildMinimisedMetis(metis, curmod) //Todo: change modelview not load from redux store
    // if (!debug) console.log('51 GenGojsModel: metis2', metis2);
    // myMetis.importData(metis2, true);
    adminModel = buildAdminModel(myMetis);
    clog('61 GenGojsModel :', '\n currentModelview :', myMetis.currentModelview?.name, ',\n props :', props, '\n myMetis :', myMetis);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
        if (debug) console.log('65 myModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
        if (debug) console.log('70 myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
        if (debug) console.log('72 myMetamodel :', curmod.metamodel, curmetamodel);
        if (debug) console.log('73 myTargetMetamodel :', curmod, curmod.targetMetamodelRef, curtargetmodel);
      let myTargetMetamodel = myMetis.findMetamodel(curmod.targetMetamodelRef) || null;
      // if (myTargetMetamodel !== null)
      //   myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      if (debug) console.log('77 myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette();
        if (debug) console.log('80 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
        if (debug) console.log('82 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel) && buildGoPalette(myTargetMetamodel, myMetis);
        if (debug) console.log('84 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel, myMetis);
        if (debug) console.log('87 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
        if (debug) console.log('89 myModelview', myModelview);
        if (debug) console.log('90 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = buildGoModel(myMetis, myModel, myModelview);
        if (debug) console.log('92 GenGojsModel myGoModel', myGoModel, myGoModel?.nodes);
      const myGoTargetModel = buildGoModel(myMetis, myTargetModel, myTargetModelview);
        if (debug) console.log('94 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      (myTargetModel) && myMetis?.setCurrentTargetModel(myTargetModel);
      (myTargetModelview) && myMetis?.setCurrentTargetModelview(myTargetModelview);
        if (debug) console.log('101 GenGojsModel  myMetis', myMetis);

      // const nodedataarray = await (curmodview)
      //   ? curmodview.objectviews.map((mv: any, index: any) =>
      //     ({ key: mv.id, text: mv.name, color: 'orange', loc: `${mv.loc ? mv.loc.split(' ')[0] + ' ' + mv.loc.split(' ')[1] : {}}` }))
      //   : []
      // const linkdataarray = await (curmodview)
      //   ? curmodview.relshipviews.map((rv: any, index: any) => ((rv) && { key: rv.id, from: rv.fromObjview.id, to: rv.toObjview.id }))
      //   : []
      // const nodemetadataarray = (metamodel)
      //   ? metamodel.objecttypes.map((ot: any, index: any) =>
      //   ({ key: ot.id, text: ot.name, color: 'lightyellow', loc: `0 ${index * (-40)}` }))
      //   : []
        
      if (debug) console.log('115 myPalette', myPalette.nodes, myPalette.links);
      if (debug) console.log('116 myMetamodelPalette', myMetamodelPalette.nodes);
      if (debug) console.log('117 myTargetMetamodelPalette', myTargetMetamodelPalette);

      
      const gojsMetamodelPalette =  {
        nodeDataArray: myMetamodelPalette?.nodes,
        linkDataArray: []
      }

      const gojsTargetMetamodel = myTargetMetamodelPalette && {
        nodeDataArray: myTargetMetamodelPalette?.nodes,
        linkDataArray: []
      }
      const gojsMetamodelModel = 
        (myGoMetamodel) && 
        { 
          nodeDataArray: myGoMetamodel?.nodes,
          linkDataArray: myGoMetamodel?.links
        }

      const gojsMetamodel = {
        nodeDataArray: myPalette?.nodes,
        linkDataArray: []
      }
      let gojsModel = {}
      gojsModel = {
          nodeDataArray: myGoModel?.nodes,
          linkDataArray: myGoModel?.links
        }

      const gojsTargetModel = {
        nodeDataArray: myGoTargetModel?.nodes,
        linkDataArray: myGoTargetModel?.links
      }

      const objects = myModel.objects;
      const nodes = buildObjectPalette(objects);
      const gojsModelObjects = {
        nodeDataArray: nodes,
        linkDataArray: [] //myGoModel?.links
      }
  
      if (debug) console.log('155 GenGojsModel gojsModel', gojsModel);

      // /** metamodel */
      // const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => (mm && mm.id) && mm.id === curmod.metamodel?.id);
           
      // update the Gojs arrays in the store
        dispatch({ type: 'SET_GOJS_METAMODELPALETTE', gojsMetamodelPalette })
        dispatch({ type: 'SET_GOJS_METAMODELMODEL', gojsMetamodelModel })
        dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
        dispatch({ type: 'SET_GOJS_MODELOBJECTS', gojsModelObjects })
        dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
        dispatch({ type: 'SET_GOJS_TARGETMODEL', gojsTargetModel })
        dispatch({ type: 'SET_GOJS_TARGETMETAMODEL', gojsTargetMetamodel })
        dispatch({ type: 'SET_MYMETIS_MODEL', myMetis })
        dispatch({ type: 'SET_MYMETIS_METAMODEL', myMetis })
        dispatch({ type: 'SET_MY_GOMODEL', myGoModel })
        dispatch({ type: 'SET_MY_GOMETAMODEL', myGoMetamodel })
    }
  }

  function buildGoPalette(metamodel: akm.cxMetaModel, metis: akm.cxMetis): gjs.goModel {
    if (debug) console.log('177 metamodel', metamodel);
    let inheritedTypenames, typenames;
    const modelRef = metamodel.generatedFromModelRef;
    let model = metis.findModel(modelRef);
    if (metamodel) {
      const mmtypenames = [];
      const objtypes = metamodel.includeSystemtypes ? metamodel?.objecttypes : metamodel?.objecttypes0;
      if (objtypes) {
        for (let i=0; i<objtypes.length; i++) {
          const objtype = objtypes[i];
          if (objtype) {
            mmtypenames.push(objtype.name);
          }
        }
      }
      typenames = [...new Set(mmtypenames)];
      if (debug) console.log('193 MM objecttypes', typenames);
    }
    if (model) {
      const mmodel = model.metamodel;
      const objtypenames = [];
      const objtypes = mmodel?.objecttypes;
      if (objtypes) {
        for (let i=0; i<objtypes.length; i++) {
          const objtype = objtypes[i];
          if (objtype) {
            objtypenames.push(objtype.name);
          }
        }
      }
      inheritedTypenames = [...new Set(objtypenames)];
      if (debug) console.log('208 objecttypes', inheritedTypenames);
    }
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    let objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      objecttypes.sort(utils.compare);
    }
    if (debug) console.log('215 objecttypes', objecttypes);
    if (objecttypes) {
      let includesSystemtypes = false;
      const otypes = new Array();
      for (let i = 0; i < objecttypes.length; i++) {
        const objtype: akm.cxObjectType = objecttypes[i];  
        if (debug) console.log('202 objtype', objtype); 
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
      if (debug) console.log('239 otypes', otypes); 
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
        if (debug) console.log('264 obj, objtype', obj, objtype);
        const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
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
        if (debug) console.log('279 node', objtype, objview, node);          
        node.isGroup = objtype.isContainer();
        if (node.isGroup)
            node.category = constants.gojs.C_PALETTEGROUP_OBJ;
        myGoPaletteModel.addNode(node);        
      }
    }
    if (debug) console.log('286 Objecttype palette', myGoPaletteModel);
    return myGoPaletteModel;
  }

  function buildObjectPalette(objects: akm.cxObject[]) {
    const myGoObjectPalette = new gjs.goModel(utils.createGuid(), "myObjectPalette", null);
    if (objects) {
      objects.sort(utils.compare);
    }
    const nodeArray = new Array();
    for (let i=0; i<objects?.length; i++) {
      let includeObject = false;
      const obj = objects[i];
      const objtype = obj?.getObjectType();
      if (!objtype) continue; // added 2022-09-29 sf 
      if (!objtype.getDefaultTypeView) continue; // added 2022-09-29 sf 
      const typeview = objtype?.getDefaultTypeView() as akm.cxObjectTypeView;
      const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "");
      objview.setTypeView(typeview);
      if (debug) console.log('303 obj, objview:', obj, objview);
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
          if (debug) console.log('316 obj', obj);
          obj.markedAsDeleted = true;
        }
      }        
      if (includeNoType) {
        if (!obj.type) {
          if (debug) console.log('322 obj', obj);
          objview.strokecolor = "green";
          includeObject = true;
        }
      }      
      if (!obj.markedAsDeleted && obj.type) {
        includeObject = true;
      }
      if (includeObject) {
        // if (obj.name === 'Container') {
        //   obj.viewkind = 'Container';
        //   objview.isGroup = true;
        //   console.log('206 Container', obj, objview, objtype);
        // }
        const node = new gjs.goObjectNode(utils.createGuid(), objview);
        if (debug) console.log('337 node, objview, objtype:', node, objview, objtype);
        node.isGroup = objtype?.isContainer();
        node.category = constants.gojs.C_OBJECT;
        const viewdata: any = typeview?.data;
        node.addData(viewdata);
        nodeArray.push(node);
        if (node.name === 'Container')
          if (debug) console.log('344 node', node);
      }
    }
    if (debug) console.log('347 Object palette', nodeArray);
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    if (debug) console.log('357 GenGojsModel', metis, model, modelview);
    if (!model) return;
    if (!modelview) return;
    if (!modelview.includeInheritedReltypes)
      modelview.includeInheritedReltypes = model.metamodel?.includeInheritedReltypes;
    let showRelshipNames = modelview.showRelshipNames;
    if (showRelshipNames == undefined) 
      showRelshipNames = true;
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview);
    let objviews = modelview?.getObjectViews();
    if (objviews) {
      if (debug) console.log('363 modelview, objviews:', modelview, objviews);
      for (let i = 0; i < objviews.length; i++) {
        let includeObjview = false;
        let objview = objviews[i];
        if (!objview.id) 
          continue;
        if (objview.name === objview.id)
          continue;
        const obj = objview.object;
        if (!model.findObject(obj?.id)) 
          continue;
        if (!objview.typeview && !objview.object) {
          objview.markedAsDeleted = true;
          if (!objview.textcolor)
            objview.textcolor = "black";
        }
        let objtype;
        objtype = obj?.type;
        if (debug) console.log('379 obj, objview', obj, objview);
        if (!objtype) {
          includeObjview = true;
          includeNoType = true;
          if (debug) console.log('374 includeObjview, includeNoType', includeObjview, includeNoType);
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
          if (includeNoObject) {
            if (!objview.object) {
              objview.strokecolor = "blue";
              if (!objview.fillcolor) objview.fillcolor = "lightgrey";
              includeObjview = true;
            }
          }
          if (includeNoType) {
            if (!objview.object?.type) {
              if (debug) console.log('406 objview', objview);
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
          if (debug) console.log('418 objview:', objview);
          if (objtype?.viewkind === constants.viewkinds.CONT) {
            objview.viewkind = constants.viewkinds.CONT;
          }
          if (!includeDeleted && objview.markedAsDeleted)
            continue;
          if (!includeNoObject && !objview.object)
            continue;
          if (!includeNoType && !objview.object?.type)
            continue;
          const node = new gjs.goObjectNode(utils.createGuid(), objview);
          if (debug) console.log('429 node', node);
          if (node.template === "")
            node.template = 'textAndIcon';
          myGoModel.addNode(node);
          node.name = objview.name;
          if (node.fillcolor === "") {
            node.fillcolor = "lightgrey";
          }
          if (debug) console.log('437 buildGoModel - node', node, myGoModel);
        }
      }
      const nodes = myGoModel.nodes;
      if (debug) console.log('450 buildGoModel - nodes', nodes);
      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as gjs.goObjectNode;
          if (!node.object) continue;
          const objview = node.objectview;
          const obj = node.object;
          const objtype = obj.type;
          if (objtype?.name === 'Label') {
            node.text = objview.name;
          }
          node.name = objview.name;
          node.loadNodeContent(myGoModel);
          node.name = objview.name;
          myGoModel.addNode(node);
      }
      if (debug) console.log('465 myGoModel', myGoModel);
    }
    // load relship views
    const relshipviews = [];
    let relviews = (modelview) && modelview.getRelationshipViews();
    if (relviews) {
      if (debug) console.log('471 modelview, relviews', modelview, relviews);
      const modifiedRelviews = [];
      let l = relviews.length;
      for (let i = 0; i < l; i++) {
        let includeRelview = false;
        let relview = relviews[i];
        let fromObjview = relview.fromObjview;
        if (!modelview.findObjectView(fromObjview.id)) 
          continue;
        let toObjview = relview.toObjview;
        if (!modelview.findObjectView(toObjview.id))
          continue;
        const rel = relview.relship;
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
          relcolor = relview?.typeview?.strokecolor;
          if (debug) console.log('521 rel, relview, relcolor:', rel, relview, relcolor);
          if (!relcolor) relcolor = 'black';
        if (debug) console.log('523 rel, relview, relcolor:', rel, relview, relcolor);
        if (includeRelview) {
          if (relview.strokewidth === "NaN") relview.strokewidth = "1";
          relview.setFromArrow2(rel?.relshipkind);
          relview.setToArrow2(rel?.relshipkind);
          relview = uic.updateRelationshipView(relview);
          relshipviews.push(relview);
          if (debug) console.log('533 rel, relview, relcolor:', rel, relview, relcolor);
          const jsnRelview = new jsn.jsnRelshipView(relview);
          modifiedRelviews.push(jsnRelview);
    
          let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
          if (debug) console.log('538 modelview, link:', modelview, link);
          link.loadLinkContent(myGoModel);
          // link.corner = relview.corner ? relview.corner : "0";
          link.curve = relview.curve ? relview.curve : "None";
          link.routing = relview.routing ? relview.routing : "Normal";
          if (!showRelshipNames)
            link.name = " ";
          if (includeDeleted || includeNoObject || includeNoType) {
            link.strokecolor = relcolor;
            link.strokewidth = "1";
          }
          if (debug) console.log('542 link, relview:', link, relview);
          if (debug) console.log('543 GenGojsModel: props', props);
          myGoModel.addLink(link);
        }
        if (debug) console.log('546 myGoModel', myGoModel);
      }
      modifiedRelviews.map(mn => {
        let data = mn;
        props.dispatch({ type: 'UPDATE_RELSHIPVIEW_PROPERTIES', data })
      })
      if (debug) console.log('552 modifiedRelviews', modifiedRelviews);
    }
    modelview.relshipviews = relshipviews;
    if (debug) console.log('539 buildGoModel - myGoModel', myGoModel);
    // In some cases some of the links were not shown in the goModel (i.e. the modelview), so ...
    uic.repairGoModel(myGoModel, modelview);
    if (debug) console.log('558 myGoModel.links', myGoModel.links);
    if (debug) console.log('569 myGoModel', myGoModel);
    return myGoModel;
  }

  function buildGoMetaPalette() {
    if (debug) console.log('547 buildGoMetaPalette');
    const myGoMetaPalette = new gjs.goModel(utils.createGuid(), "myMetaPalette", null);
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
    if (debug) console.log('560 myGoMetaPalette', myGoMetaPalette);
    return myGoMetaPalette;
  }

  function buildGoMetaModel(metamodel: akm.cxMetaModel): gjs.goModel {
    if (!metamodel)
      return;
    if (debug) console.log('600 metamodel', metamodel);
    metamodel.objecttypes = utils.removeArrayDuplicates(metamodel?.objecttypes);
    if (metamodel.objecttypes) {
      if (debug) console.log('603 metamodel', metamodel);
      const myGoMetamodel = new gjs.goModel(utils.createGuid(), "myMetamodel", null);
      const objtypes = metamodel?.getObjectTypes();
      if (objtypes) {
        if (debug) console.log('565 objtypes', objtypes);
        for (let i = 0; i < objtypes.length; i++) {
          let includeObjtype = false;
          const objtype = objtypes[i];
          const outreltypes = objtype.outputreltypes;
          for (let j=0; j<outreltypes?.length; j++) {
            const reltype = outreltypes[j];
            if (reltype) {
              if (debug) console.log('615 reltype', reltype);
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
          let strokecolor = objtype.typeview?.strokecolor;
          let fillcolor = typeview?.fillcolor;
          if (objtype) {
            if (!objtype.markedAsDeleted) 
              includeObjtype = true;
            else {
              if (debug) console.log('632 objtype', objtype);
              if (includeDeleted) {
                if (objtype.markedAsDeleted) {
                  strokecolor = "orange";
                  includeObjtype = true;
                  fillcolor = "pink";
                }
              }
            }
            if (includeObjtype) {
              if (!objtype.typeview) 
                objtype.typeview = objtype.newDefaultTypeView('Object');
              const node = new gjs.goObjectTypeNode(utils.createGuid(), objtype);
              node.loadNodeContent(metamodel);
              node.strokecolor = strokecolor;
              // node.fillcolor = fillcolor;
              if (debug) console.log('648 objtype, node', objtype, node);
              myGoMetamodel.addNode(node);
            }
          }
        }
      }
      // metamodel.relshiptypes = utils.removeArrayDuplicates(metamodel?.relshiptypes);
      let relshiptypes = metamodel.relshiptypes;
      if (debug) console.log('656 relshiptypes', relshiptypes);
      if (relshiptypes) {
        for (let i = 0; i < relshiptypes.length; i++) {
          let includeReltype = false;
          let reltype = relshiptypes[i];
          if (reltype.name === 'isRelatedTo')
            reltype.name = 'generic';
          if (reltype.name === 'contains') {
            if (reltype.fromObjtype === reltype.toObjtype)
              reltype.markedAsDeleted = true;
          }
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
            if (debug) console.log('685 reltype', reltype);
            if (!reltype.typeview) 
                reltype.typeview = reltype.newDefaultTypeView(reltype.relshipkind);
            if (!reltype.fromObjtype) 
                reltype.fromObjtype = metamodel.findObjectType(reltype.fromobjtypeRef);
            if (!reltype.toObjtype) 
                reltype.toObjtype = metamodel.findObjectType(reltype.toobjtypeRef);
            const key = utils.createGuid();
            const link = new gjs.goRelshipTypeLink(key, myGoMetamodel, reltype);
            if (debug) console.log('694 reltype, link', reltype, link);
            let strokewidth = reltype.typeview.strokewidth;
            if (!strokewidth)
              strokewidth = "1";
          if (link.loadLinkContent()) {
              link.relshipkind = reltype.relshipkind;
              link.strokewidth = strokewidth;
              link.strokecolor = strokecolor;
              link.routing = metamodel.routing;
              link.curve = metamodel.linkcurve;
              link.category = constants.gojs.C_RELSHIPTYPE;
              if (debug) console.log('701 link', link.name, link);
              myGoMetamodel.addLink(link);
            }            
          }
        }
      }
      if (debug) console.log('707 myGoMetamodel', myGoMetamodel);
      return myGoMetamodel;
    }
  }

  function buildAdminModel(myMetis: akm.cxMetis): akm.cxModel {
    const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_MM);
    if (!adminMetamodel) {
      if (debug) console.log('590 No Admin Metamodel found!');
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
        if (debug) console.log('709 adminModel', adminModel);
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
        if (debug) console.log('598 adminModel', adminModel);
        let project; 
        if (!project) {
          project = new akm.cxObject(utils.createGuid(), myMetis.name, projectType, myMetis.description);
          project.metisId = myMetis.id;
          adminModel.addObject(project);
          myMetis.addObject(project);
          projectview = new akm.cxObjectView(utils.createGuid(), project.name, project, '');
          projectview.fillcolor = "lightgrey";
          project.addObjectView(projectview);
          adminModelview.addObjectView(projectview);
          myMetis.addObjectView(projectview);
        }
        if (debug) console.log('741 project', project);
        // Handle metamodels
        const metamodels = myMetis.metamodels;
        for (let i=0; i<metamodels.length; i++) {
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
              const mmRel = new akm.cxRelationship(utils.createGuid(),hasMetamodelType, project, mmObj, constants.admin.AKM_HAS_METAMODEL, '');
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
              if (debug) console.log('640 models', models);
              for (let j=0; j<models.length; j++) {
                const m = models[j];
                if (m && m.metamodel?.id === mm.id) { 
                  let mObj; 
                  if (!mObj) { // Model object
                    mObj = new akm.cxObject(utils.createGuid(), m.name, modelType, m.description);
                    mObj.modelId = m.id;
                    adminModel.addObject(mObj);
                    myMetis.addObject(mObj);

                    if (debug) console.log('654 mObj', mObj);
                    
                    // Create objectview
                    const mObjview = new akm.cxObjectView(utils.createGuid(), mObj.name, mObj, '');
                    mObjview.fillcolor = "lightgreen";
                    mObj.addObjectView(mObjview);
                    adminModelview.addObjectView(mObjview);
                    myMetis.addObjectView(mObjview);

                    // Refer to metamodel
                    let mMeta = m.metamodel;
                    let mmRef = adminModel.findObjectByTypeAndName(metamodelType, mMeta.name);
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

                    // Add relship from Project object to Model object
                    const mRelPtoM = new akm.cxRelationship(utils.createGuid(),hasModelType, project, mObj, constants.admin.AKM_HAS_MODEL, '');
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
                    for (let k=0; k<modelviews?.length; k++) {
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
        for (let i=0; i<metamodels.length; i++) {
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
              if (debug) console.log('886 genRelview', genRelview);
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
                if (debug) console.log('899 adminModelview', adminModelview);
                myMetis.addRelationshipView(genRelview);
              }
            }
          }
        }
      }
      if (debug) console.log('910 adminModel, adminModelview', adminModel, adminModelview);
      if (firstTime) {
        // Do a dispatch 
        const jsnModel = new jsn.jsnModel(adminModel, true);
        const modifiedModels = []
        modifiedModels.push(jsnModel);
        modifiedModels.map(mn => {
            let data = mn;
            data = JSON.parse(JSON.stringify(data));
            dispatch({ type: 'LOAD_TOSTORE_NEWMODEL', data });
        });
      }
      return adminModel;
    }
  }

  function buildMinimisedMetis(metis, curmod) { 
    // stripped down metis to, where only current models and metamodels include all their objects and relationships, the rest has only id and name (needed for _ADMIN modellen)
    console.log('957 buildMinimisedMetis', metis, curmod);
    const models = metis.models;
    const metamodels = metis.metamodels;

    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const curmodIndex = (models && focusModel?.id) && models.findIndex((m: any) => m.id === focusModel.id)
    if (debug) console.log('49 models  ', models, 'curmod', curmod.name, 'curmod.modelviews', curmod.modelviews,  'focusModelview:', focusModelview)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodelRef)
    const curmetamodelIndex = (curmod) && metamodels.findIndex(mm => mm?.id === curmod?.metamodelRef)
    const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodelRef)
    const curtargetmetamodelIndex = (curmod) && metamodels.findIndex(mm => mm?.id === curmod?.targetMetamodelRef)
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
 
    if (debug) console.log('56 GenGojsModel: curmod++', curmod, curmodview, metamodels, curtargetmodel, curmod?.targetModelRef);
    if (debug) console.log('60 GenGojsModel: metis', curmod, curmetamodel, curtargetmodel, curtargetmetamodel);
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
        modelviews: m.modelviews?.map(mv => { return {id: mv.id, name: mv.name, objectviews: [], relshipviews:[]} } )
      }
    })
    if (!debug) console.log('1005 GenGojsModel: strippedModels', models, strippedModels, strippedMetamodels);

    const curModelWithStrippedModels =  [
      ...strippedModels?.slice(0,curmodIndex), 
      curmod, 
      ...strippedModels?.slice(curmodIndex+1, strippedModels.length),
    ]
    console.log('1015 curModelWithStrippedModels', curModelWithStrippedModels);
    const curTargetModelWithStrippedModels = (curtargetmodel) ? [
      ...curModelWithStrippedModels.slice(0,curtargetmodelIndex),
      curtargetmodel,
      ...curModelWithStrippedModels.slice(curtargetmodelIndex+1, curModelWithStrippedModels.length)
    ] : [curmod]

    const curMetamodelWithStrippedMetamodels = [
      ...strippedMetamodels.slice(0,curmetamodelIndex),
      curmetamodel,
      ...strippedMetamodels.slice(curmetamodelIndex+1, strippedMetamodels.length)
    ]

    const curTargetMetamodelWithStrippedMetamodels = [
      ...curMetamodelWithStrippedMetamodels.slice(0,curtargetmetamodelIndex),
      curtargetmetamodel,
      ...curMetamodelWithStrippedMetamodels.slice(curtargetmetamodelIndex+1, curMetamodelWithStrippedMetamodels.length)
    ]

    if (!debug) console.log('1033 GenGojsModel:', curModelWithStrippedModels, curTargetMetamodelWithStrippedMetamodels);

    const curmodels = (curtargetmodel) ? curTargetModelWithStrippedModels : curModelWithStrippedModels
    const curmetamodels = (curtargetmetamodel) ? curTargetMetamodelWithStrippedMetamodels : curMetamodelWithStrippedMetamodels
    if (!debug) console.log('1033 GenGojsModel: curmodels',  curmodels, curmetamodels);

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
    if (debug) console.log('1047 GenGojsModel: metis2', metis2);

    return metis2;
  }
}
export default GenGojsModel;

