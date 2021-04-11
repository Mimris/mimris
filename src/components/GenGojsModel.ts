// @ts-nocheck
const debug = false;
// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
//import glb from '../akmm/akm_globals';
import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
//import {gqlImportMetis} from '../Server/src/akmm/ui_graphql'
const glb = require('../akmm/akm_globals');

const constants = require('../akmm/constants');

// Parameters to configure loads
// const includeNoObject = false;
// const includeInstancesOnly = true 
const includeNoType = false;

const GenGojsModel = async (props: any, dispatch: any) =>  {
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('23 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showDeleted)
  const debug = false
  const metis = (props.phData) && props.phData.metis
  const models = (metis) && metis.models
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels


  if (metis != null) {
    console.log('24 GenGojsModel phData, metis:', props.phData, props);
    const myMetis = new akm.cxMetis();
    if (debug) console.log('26 GenGojsModel', myMetis);  
    myMetis.importData(metis, true);
    console.log('28 GenGojsModel myMetis', myMetis);
    
    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const focusObjectview = (props.phFocus) && props.phFocus.focusObjectview
    const focusObject = (props.phFocus) && props.phFocus.focusObject
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    if (debug) console.log('46 gengojsmodel', models, curmod, curmod.modelviews, focusModelview)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodelRef)
    const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodelRef)
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    if (debug) console.log('56 gengojsmodel', curmod, curmodview, metamodels, curtargetmodel, curmod?.targetModelRef);

    let curGomodel = props.phMyGoModel?.myGoModel;
    if (debug) console.log('45 gengojsmodel :', curmod, curmod?.id);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      if (debug) console.log('50 GengojsModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
      if (debug) console.log('53 GenGojsModel myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
      if (debug) console.log('61 GenGojsModel myMetamodelRef :', curmod.metamodelRef, curmetamodel);
      if (debug) console.log('62 GenGojsModel myTargetMetamodelRef :', curmod.targetMetamodelRef, curtargetmodel);
      let myTargetMetamodel = curtargetmetamodel || null;
      if (myTargetMetamodel !== null)
        myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      if (debug) console.log('60 GenGojsModel myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette(myMetamodel);
      if (debug) console.log('63 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
      if (debug) console.log('65 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel !== null) && buildGoPalette(myTargetMetamodel, myMetis);
      if (debug) console.log('74 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel, myMetis);
      if (debug) console.log('69 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
      if (!myModelview) myModelview = myMetis?.findModelView(focusModelview?.id);
      if (debug) console.log('82 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = buildGoModel(myMetis, myModel, myModelview);
      const myGoTargetModel = buildGoModel(myMetis, myTargetModel, myTargetModelview);
      if (debug) console.log('83 GenGojsModel myGoModel', myMetis, myGoModel, myModel, myModelview);
      if (debug) console.log('84 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      myMetis?.setCurrentTargetModel(myTargetModel);
      myMetis?.setCurrentTargetModelview(myTargetModelview);
      if (debug) console.log('87 GenGojsModel  myMetis', myMetis);
      if (debug) console.log('88 focusTab', props.phFocus.focusTab);
      // const nodedataarray = await (curmodview)
      //   ? curmodview.objectviews.map((mv: any, index: any) =>
      //     ({ key: mv.id, text: mv.name, color: 'orange', loc: `${mv.loc ? mv.loc.split(' ')[0] + ' ' + mv.loc.split(' ')[1] : {}}` }))
      //   : []
      // const linkdataarray = await (curmodview)
      //   ? curmodview.relshipviews.map((rv: any, index: any) => ((rv) && { key: rv.id, from: rv.fromobjviewRef, to: rv.toobjviewRef }))
      //   : []
      // const nodemetadataarray = (metamodel)
      //   ? metamodel.objecttypes.map((ot: any, index: any) =>
      //   ({ key: ot.id, text: ot.name, color: 'lightyellow', loc: `0 ${index * (-40)}` }))
      //   : []
        
      if (debug) console.log('98 gojsModel', myPalette.nodes, myPalette.links);
      if (debug) console.log('98 myMetamodelPalette', myMetamodelPalette.nodes);
      if (debug) console.log('98 myTargetMetamodelPalette', myTargetMetamodelPalette);
      
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
  
      if (debug) console.log('101 GenGojsModel gojsTargetMetamodel', gojsTargetMetamodel);

      // /** metamodel */
      const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => (mm && mm.id) && mm.id === curmod.metamodelRef);
           
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
    if (debug) console.log('74 buildGoPalette', metamodel);
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    const objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      for (let i = 0; i < objecttypes.length; i++) {
        const objtype: akm.cxObjectType = objecttypes[i];   
        if (objtype && !objtype.markedAsDeleted && !objtype.abstract) {
          const obj = new akm.cxObject(utils.createGuid(), objtype.name, objtype, "");
          if (debug) console.log('164 GenGojsModel', obj);      
          if (obj.isDeleted()) 
              continue;
          const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
          let typeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
          // Hack
          if (!typeview) {
              const otype = metis.findObjectTypeByName(objtype.name);
              if (otype) {
                typeview = otype.getDefaultTypeView();
              }
          }
          // End hack
          objview.setTypeView(typeview);
          const node = new gjs.goObjectNode(utils.createGuid(), objview);
          node.loadNodeContent(myGoPaletteModel);
          if (debug) console.log('178 node', objtype, objview, node);          
          node.isGroup = objtype.isContainer();
          if (node.isGroup)
              node.category = constants.gojs.C_PALETTEGROUP_OBJ;
          myGoPaletteModel.addNode(node);
        }
      }
    }
    if (debug) console.log('193 Objecttype palette', myGoPaletteModel);
    return myGoPaletteModel;
  }

  function buildObjectPalette(objects: akm.cxObject[]) {
    const myGoObjectPalette = new gjs.goModel(utils.createGuid(), "myObjectPalette", null);
    const nodeArray = new Array();
    for (let i=0; i<objects?.length; i++) {
      let includeObject = false;
      const obj = objects[i];
      const objtype = obj?.getObjectType();
      const typeview = objtype?.getDefaultTypeView();
      const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "");
      objview.setTypeView(typeview);
      if (debug) console.log('216 obj, objview:', obj, objview);
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
        if (!obj.typeRef) {
          obj.markedAsDeleted = true;
        }
      }        
      if (includeNoType) {
        if (!obj.typeRef) {
          if (debug) console.log('236 obj', obj);
          objview.strokecolor = "green";
          includeObject = true;
        }
      }      
      if (!obj.markedAsDeleted && obj.typeRef) {
        includeObject = true;
      }
      if (includeObject) {
        // if (obj.name === 'Container') {
        //   obj.viewkind = 'Container';
        //   objview.isGroup = true;
        //   console.log('206 Container', obj, objview, objtype);
        // }
        const node = new gjs.goObjectNode(utils.createGuid(), objview);
        if (debug) console.log('248 node, objview:', node, objview);
        node.isGroup = objtype?.isContainer();
        node.category = constants.gojs.C_OBJECT;
        const viewdata: any = typeview?.data;
        node.addData(viewdata);
        nodeArray.push(node);
        if (node.name === 'Container')
          if (debug) console.log('221 node', node);
      }
    }
    if (debug) console.log('214 Object palette', nodeArray);
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    if (debug) console.log('263 GenGojsModel', metis, model, modelview);
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview);
    let objviews = modelview?.getObjectViews();
    if (objviews) {
      if (debug) console.log('266 modelview, objviews:', modelview.name, objviews);
      for (let i = 0; i < objviews.length; i++) {
        let includeObjview = false;
        let objview = objviews[i];
        const obj = objview.object;
        if (obj?.markedAsDeleted)
          objview.markedAsDeleted = obj?.markedAsDeleted;
        objview.name = obj?.name;
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
            if (debug) console.log('295 objview', objview);
            objview.strokecolor = "green"; 
            if (objview.fillcolor) objview.fillcolor = "lightgrey";
            includeObjview = true;
          }
        }
        if (!objview.markedAsDeleted && objview.object) {
          includeObjview = true;
        }
        if (includeObjview) {
          if (debug) console.log('305 includeNoObject, objview:', includeNoObject, objview);
          if (!includeDeleted && objview.markedAsDeleted)
            continue;
          if (!includeNoObject && !objview.object)
            continue;
          if (!includeNoType && !objview.object?.type)
            continue;
          const node = new gjs.goObjectNode(utils.createGuid(), objview);
          myGoModel.addNode(node);
          node.name = objview.name;
          if (node.fillcolor === "") {
            node.fillcolor = "lightgrey";
          }
          if (debug) console.log('314 buildGoModel - node', node, myGoModel);
        }
      }
      const nodes = myGoModel.nodes;
      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const objview = node.objectview;
          node.name = objview.name;
          node.loadNodeContent(myGoModel);
      }
      if (debug) console.log('325 nodes', nodes);
    }
    // load relship views
    let relviews = (modelview) && modelview.getRelationshipViews();
    if (relviews) {
      if (debug) console.log('318 modelview, relviews', modelview.name, relviews);
      let l = relviews.length;
      for (let i = 0; i < l; i++) {
        let includeRelview = false;
        let relview = relviews[i];
        const rel = relview.relship;
        relview.markedAsDeleted = rel?.markedAsDeleted;
        relview.name = rel?.name;
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
          if (debug) console.log('352 relview:', relview);
          let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
          link.loadLinkContent(myGoModel);
          link.name = rel?.name;
          link.strokecolor = relcolor;
          myGoModel.addLink(link);
          if (debug) console.log('357 buildGoModel - link', link, myGoModel);
        }
      }
    }
    if (debug) console.log('361 myGoModel', myGoModel);
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
    if (debug) console.log('275 myGoMetaPalette', myGoMetaPalette);
    return myGoMetaPalette;
  }

  function buildGoMetaModel(metamodel: akm.cxMetaModel): gjs.goModel {
    if (metamodel?.objecttypes) {
      if (debug) console.log('408 metamodel', metamodel);
      let myGoMetaModel = new gjs.goModel(utils.createGuid(), "myMetaModel", null);
      const objtypes = metamodel?.getObjectTypes();
      if (objtypes) {
        if (debug) console.log('412 objtype', objtypes);
        let includeObjtype = false;
        let strokecolor = "black";
        let fillcolor = "white";
        for (let i = 0; i < objtypes.length; i++) {
          const objtype = objtypes[i];
          if (objtype && !objtype.markedAsDeleted) {
            // if (!objtype.typeview) 
            //   continue;
            if (debug) console.log('289 objtype', objtype);
            if (includeDeleted) {
              if (objtype.markedAsDeleted) {
                strokecolor = "orange";
                includeObjtype = true;
              }
            } else
              includeObjtype = true;
            if (includeObjtype) {
              const node = new gjs.goObjectTypeNode(utils.createGuid(), objtype);
              node.loadNodeContent(metamodel);
              if (debug) console.log('291 node', node);
              myGoMetaModel.addNode(node);
            }
          }
        }
      }
      let relshiptypes = metamodel.getRelshipTypes();
      if (debug) console.log('425 relshiptypes', relshiptypes);
      if (relshiptypes) {
        for (let i = 0; i < relshiptypes.length; i++) {
          let reltype = relshiptypes[i];
          if (reltype && !reltype.markedAsDeleted) {
            if (!reltype.typeview) 
              reltype.typeview = reltype.newDefaultTypeView(constants.relkinds.REL);
            const key = utils.createGuid();
            const link = new gjs.goRelshipTypeLink(key, myGoMetaModel, reltype);
            if (link.loadLinkContent())
              myGoMetaModel.addLink(link);
          }
        }
      }
      return myGoMetaModel;
    }
  }
}

export default GenGojsModel;
