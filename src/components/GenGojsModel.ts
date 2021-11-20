// @ts- nocheck
const debug = false;
// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';

const constants = require('../akmm/constants');

// Parameters to configure loads
// const includeNoObject = false;
// const includeInstancesOnly = true 
const includeNoType = false;

const GenGojsModel = async (props: any, dispatch: any) =>  {
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('21 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showDeleted)
  const metis = (props.phData) && props.phData.metis
  const models = (metis) && metis.models
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels


  if (metis != null) {
    console.log('29 GenGojsModel: phData, metis:', props.phData, props);
    const myMetis = new akm.cxMetis();
    if (debug) console.log('31 GenGojsModel', myMetis);  
    myMetis.importData(metis, true);
    console.log('33 GenGojsModel: myMetis', myMetis);
    
    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    if (debug) console.log('37 focusModelview', focusModelview)
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const focusObjectview = (props.phFocus) && props.phFocus.focusObjectview
    const focusObject = (props.phFocus) && props.phFocus.focusObject
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    if (debug) console.log('43 GenGojsModel: models, curmod', models, curmod, curmod.modelviews, focusModelview)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodel?.id)
    const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodel?.id)
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModel?.id)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    if (debug) console.log('50 GenGojsModel: curmod++', curmod, curmodview, metamodels, curtargetmodel, curtargetmetamodel, curmod?.targetModel?.id);

    let curGomodel = props.phMyGoModel?.myGoModel;
    if (debug) console.log('53 GenGojsModel: curmod', curmod, curmod?.id);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      if (debug) console.log('57 myModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
      if (debug) console.log('62 myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
      if (debug) console.log('64 myMetamodel :', curmod.metamodel, curmetamodel);
      if (debug) console.log('65 myTargetMetamodel :', curmod.targetMetamodel, curtargetmodel);
      let myTargetMetamodel = curtargetmetamodel || null;
      if (myTargetMetamodel !== null)
        myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      if (debug) console.log('69 myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette(myMetamodel);
      if (debug) console.log('72 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
      if (debug) console.log('74 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel !== null) && buildGoPalette(myTargetMetamodel, myMetis);
      if (debug) console.log('76 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel, myMetis);
      if (debug) console.log('79 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
      if (!myModelview) myModelview = myMetis?.findModelView(focusModelview?.id);
      if (debug) console.log('82 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = buildGoModel(myMetis, myModel, myModelview);
      const myGoTargetModel = buildGoModel(myMetis, myTargetModel, myTargetModelview);
      if (debug) console.log('85 GenGojsModel myGoModel', myMetis, myGoModel, myModel, myModelview);
      if (debug) console.log('86 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      myMetis?.setCurrentTargetModel(myTargetModel);
      myMetis?.setCurrentTargetModelview(myTargetModelview);
      if (debug) console.log('93 GenGojsModel  myMetis', myMetis);
      if (debug) console.log('94 focusTab', props.phFocus.focusTab);
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
        
      if (debug) console.log('107 myPalette', myPalette.nodes, myPalette.links);
      if (debug) console.log('108 myMetamodelPalette', myMetamodelPalette.nodes);
      if (debug) console.log('109 myTargetMetamodelPalette', myTargetMetamodelPalette);
      
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

      const gojsModel = {
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
  
      if (debug) console.log('149 GenGojsModel gojsTargetMetamodel', gojsTargetMetamodel);

      // /** metamodel */
      const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => (mm && mm.id) && mm.id === curmod.metamodel?.id);
           
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
    if (debug) console.log('170 metamodel', metamodel);
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    let objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      objecttypes.sort(utils.compare);
    }
    if (debug) console.log('176 objecttypes', objecttypes);
    if (objecttypes) {
      let includesSystemtypes = false;
      const otypes = new Array();
      for (let i = 0; i < objecttypes.length; i++) {
        const objtype: akm.cxObjectType = objecttypes[i];  
        if (debug) console.log('182 objtype', objtype); 
        if (!objtype) continue;
        if (objtype.markedAsDeleted) continue;
        if (objtype.abstract) continue;
        if (objtype.nameId === 'Entity0') continue;
        if (objtype.name === 'Datatype') includesSystemtypes = true;
        otypes.push(objtype);
      }
      const noTypes = otypes.length;
      for (let i = 0; i < noTypes; i++) {
        const objtype: akm.cxObjectType = otypes[i];  
        // Hack
        if (!includesSystemtypes) {    // Systemtypes are not included
          const typename = objtype.name;
          if (
              typename === 'Entity' || 
              typename === 'EntityType' ||
              typename === 'RelationshipType' ||
              typename === 'Method'     ||
              typename === 'MethodType'
            )
              continue;
        }
        // End Hack
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
        if (debug) console.log('214 obj, objtype', obj, objtype);
        const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
        let typeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
        // Hack
        if (!typeview) {
            const otype = metis.findObjectTypeByName(objtype.name);
            if (otype) {
              typeview = otype.getDefaultTypeView() as akm.cxObjectTypeView;
            } else
              typeview = objtype.newDefaultTypeView('Object') as akm.cxObjectTypeView;
        }
        // End hack
        objview.setTypeView(typeview);
        const node = new gjs.goObjectNode(utils.createGuid(), objview);
        node.loadNodeContent(myGoPaletteModel);
        if (debug) console.log('229 node', objtype, objview, node);          
        node.isGroup = objtype.isContainer();
        if (node.isGroup)
            node.category = constants.gojs.C_PALETTEGROUP_OBJ;
        myGoPaletteModel.addNode(node);        
      }
    }
    if (debug) console.log('236 Objecttype palette', myGoPaletteModel);
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
      const typeview = objtype?.getDefaultTypeView() as akm.cxObjectTypeView;
      const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "");
      objview.setTypeView(typeview);
      if (debug) console.log('253 obj, objview:', obj, objview);
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
          if (debug) console.log('246 obj', obj);
          obj.markedAsDeleted = true;
        }
      }        
      if (includeNoType) {
        if (!obj.type) {
          if (debug) console.log('272 obj', obj);
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
        if (debug) console.log('287 node, objview:', node, objview);
        node.isGroup = objtype?.isContainer();
        node.category = constants.gojs.C_OBJECT;
        const viewdata: any = typeview?.data;
        node.addData(viewdata);
        nodeArray.push(node);
        if (node.name === 'Container')
          if (debug) console.log('294 node', node);
      }
    }
    if (debug) console.log('297 Object palette', nodeArray);
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    if (debug) console.log('292 GenGojsModel', metis, model, modelview);
    if (!model) return;
    if (!modelview) return;
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview);
    let objviews = modelview?.getObjectViews();
    if (objviews) {
      if (debug) console.log('308 modelview, objviews:', modelview, objviews);
      for (let i = 0; i < objviews.length; i++) {
        let includeObjview = false;
        let objview = objviews[i];
        const obj = objview?.object;
        const objtype = obj?.type;
        if (obj && obj?.markedAsDeleted == undefined)
          obj.markedAsDeleted = false;
        if (obj?.markedAsDeleted)
          objview.markedAsDeleted = obj?.markedAsDeleted;
        objview.name = obj?.name;
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
            if (debug) console.log('340 objview', objview);
            objview.strokecolor = "green"; 
            if (objview.fillcolor) objview.fillcolor = "lightgrey";
            includeObjview = true;
          }
        }
        if (!objview.markedAsDeleted && objview.object) {
          includeObjview = true;
        }
        // if (!objview.visible) includeObjview = false;
        if (includeObjview) {
          if (objtype?.viewkind === 'Container') {
            objview.viewkind = 'Container';
          }
          if (debug) console.log('354 includeNoObject, objview:', includeNoObject, objview);
          if (!includeDeleted && objview.markedAsDeleted)
            continue;
          if (!includeNoObject && !objview.object)
            continue;
          if (!includeNoType && !objview.object?.type)
            continue;
          const node = new gjs.goObjectNode(utils.createGuid(), objview);
          if (node.template === "")
            node.template = 'textOnly';
          myGoModel.addNode(node);
          node.name = objview.name;
          if (node.fillcolor === "") {
            node.fillcolor = "lightgrey";
          }
          if (debug) console.log('369 buildGoModel - node', node, myGoModel);
        }
      }
      const nodes = myGoModel.nodes;
      for (let i = 0; i < nodes.length; i++) {
        const objview = nodes[i].objectview;
        const isGroup = (objview.viewkind === 'Container');
        const node = nodes[i] as gjs.goObjectNode;
          node.name = objview.name;
          node.loadNodeContent(myGoModel);
          node.text = objview.text ? objview.text : objview.object.text;
          node.isGroup = isGroup;
      }
      if (debug) console.log('382 nodes', nodes);
    }
    // load relship views
    let relviews = (modelview) && modelview.getRelationshipViews();
    if (relviews) {
      if (debug) console.log('387 modelview, relviews', modelview.name, relviews);
      let l = relviews.length;
      for (let i = 0; i < l; i++) {
        let includeRelview = false;
        let relview = relviews[i];
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
        if (includeRelview) {
          relview.setFromArrow2(rel?.relshipkind);
          relview.setToArrow2(rel?.relshipkind);
          if (debug) console.log('431 rel, relview:', rel, relview);
          let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
          link.loadLinkContent(myGoModel);
          link.points = relview.points;
          link.name = rel?.name;
          if (relview.fromArrow === '') 
            link.fromArrow = relview.typeview?.fromArrow;
          if (link.fromArrow === 'None') 
            link.fromArrow = '';
          if (relview.toArrow === '') 
            link.toArrow = relview.typeview?.toArrow;
          if (link.toArrow === 'None') 
            link.toArrow = '';
          link.routing = modelview.routing;
          link.curve = modelview.linkcurve;
          if (modelview.showCardinality) {
            link.cardinalityFrom = rel?.getCardinalityFrom(); 
            link.cardinalityTo = rel?.getCardinalityTo();
          } else {
            link.cardinalityFrom = "";
            link.cardinalityTo = "";
          }
          if (link.toArrow == undefined)
            link.toArrow = 'OpenTriangle';
          if (debug) console.log('455 modelview:', modelview, link);
          if (debug) console.log('456 GenGojsModel: props', props);
          myGoModel.addLink(link);
          if (debug) console.log('458 buildGoModel - link', link, myGoModel);
        }
      }
    }
    if (debug) console.log('462 myGoModel.links', myGoModel.links);
    return myGoModel;
  }

  function buildGoMetaPalette() {
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
    if (debug) console.log('453 myGoMetaPalette', myGoMetaPalette);
    return myGoMetaPalette;
  }

  function buildGoMetaModel(metamodel: akm.cxMetaModel): gjs.goModel {
    if (!metamodel)
      return;
    metamodel.objecttypes = utils.removeArrayDuplicates(metamodel?.objecttypes);
    if (metamodel.objecttypes) {
      if (debug) console.log('488 metamodel', metamodel);
      const myGoMetamodel = new gjs.goModel(utils.createGuid(), "myMetamodel", null);
      const objtypes = metamodel?.getObjectTypes();
      if (objtypes) {
        if (debug) console.log('492 objtypes', objtypes);
        for (let i = 0; i < objtypes.length; i++) {
          let includeObjtype = false;
          let fillcolor = "white";
          const objtype = objtypes[i];
          if (objtype) {
            let strokecolor = objtype.typeview?.strokecolor;
            if (!strokecolor) strokecolor = "black";
            if (!objtype.markedAsDeleted) 
              includeObjtype = true;
            else {
              if (debug) console.log('503 objtype', objtype);
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
              node.text = objtype.text;
              if (node.name === "") node.name = node.text;
              node.strokecolor = strokecolor;
              // node.fillcolor = fillcolor;
              if (debug) console.log('521 node', node);
              myGoMetamodel.addNode(node);
            }
          }
        }
      }
      // metamodel.relshiptypes = utils.removeArrayDuplicates(metamodel?.relshiptypes);
      let relshiptypes = metamodel.relshiptypes;
      if (debug) console.log('529 relshiptypes', relshiptypes);
      if (relshiptypes) {
        for (let i = 0; i < relshiptypes.length; i++) {
          let includeReltype = false;
          let reltype = relshiptypes[i];
          if (reltype.cardinality.length > 0) {
            reltype.cardinalityFrom = reltype.getCardinalityFrom(); 
            reltype.cardinalityTo = reltype.getCardinalityTo();
          }
          let strokecolor = reltype.typeview?.strokecolor;
          if (!strokecolor) strokecolor = "black";
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
            if (debug) console.log('553 reltype', reltype);
            if (!reltype.typeview) 
                reltype.typeview = reltype.newDefaultTypeView(reltype.relshipkind);
            if (!reltype.fromObjtype) 
                reltype.fromObjtype = metamodel.findObjectType(reltype.fromobjtypeRef);
            if (!reltype.toObjtype) 
                reltype.toObjtype = metamodel.findObjectType(reltype.toobjtypeRef);
            const key = utils.createGuid();
            const link = new gjs.goRelshipTypeLink(key, myGoMetamodel, reltype);
            if (debug) console.log('562 link', link);
            if (link.loadLinkContent()) {
              link.strokecolor = strokecolor;
              link.routing = metamodel.routing;
              link.curve = metamodel.linkcurve;
                  if (debug) console.log('567 link', link);
              myGoMetamodel.addLink(link);
            }            
          }
        }
      }
      return myGoMetamodel;
    }
  }
}

export default GenGojsModel;
