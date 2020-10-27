// @ts-nocheck

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

const GenGojsModel = async (props: any, dispatch: any) =>  {
  const debug = true
  if (debug) console.log('18 GenGojsModel props:', props);
  const metis = (props.phData) && props.phData.metis
  const models = (metis) && metis.models
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels

  // console.log('22 GenGojsModel metis:', metis, modelviews);

  if (metis != null) {
    // let myMetis = null;
    // console.log('24 glb.metis', glb.metis, metis);
    // if (!glb.metis) {
    //   myMetis = new akm.cxMetis();
    //   myMetis.importData(metis, true);
    // } else {
      const myMetis = new akm.cxMetis();
      myMetis.importData(metis, true);
    // }
    if (debug) console.log('44 GenGojsModel myMetis', myMetis);
    
    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    // console.log('46 gengojsmodel', models, curmod, curmod.modelviews, focusModelview)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodelRef)
    const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodelRef)
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    // console.log('56 gengojsmodel', curmod, curmodview, metamodels, curtargetmodel, curmod?.targetModelRef);

    let curGomodel = props.phMyGoModel?.myGoModel;
    // console.log('45 gengojsmodel :', curmod, curmod?.id);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      // console.log('50 GengojsModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      const myMetamodel = myModel?.metamodel;
      // console.log('53 GenGojsModel myMetamodel :', myMetamodel);
      // console.log('61 GenGojsModel myMetamodelRef :', curmod.metamodelRef, curmetamodel);
      // console.log('62 GenGojsModel myTargetMetamodelRef :', curmod.targetMetamodelRef, curtargetmodel);
      let myTargetMetamodel = curtargetmetamodel || null;
      if (myTargetMetamodel !== null)
        myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      // console.log('60 GenGojsModel myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette(myMetamodel);
      // console.log('63 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
      // console.log('65 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel !== null) && buildGoPalette(myTargetMetamodel);
      // console.log('74 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel);
      // console.log('69 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
      if (!myModelview) myModelview = myMetis?.findModelView(focusModelview?.id);
      // console.log('82 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = buildGoModel(myMetis, myModel, myModelview);
      const myGoTargetModel = buildGoModel(myMetis, myTargetModel, myTargetModelview);
      if (debug) console.log('83 GenGojsModel myGoModel', myMetis, myGoModel, myModel, myModelview);
      // console.log('84 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      myMetis?.setCurrentTargetModel(myTargetModel);
      myMetis?.setCurrentTargetModelview(myTargetModelview);
      // console.log('89 GenGojsModel  myMetis', myMetis);

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
        
      // console.log('98 gojsModel', myMetamodelPalette.nodes);
      // console.log('98 myMetamodelPalette', myMetamodelPalette.nodes);
      // console.log('98 myTargetMetamelPalette', myTargetMetamodelPalette);
      
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
  
      // console.log('101 GenGojsModel gojsTargetMetamodel', gojsTargetMetamodel);

      // /** metamodel */
      const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => mm.id === curmod.metamodelRef);
           
      // update the Gojs arrays in the store
          dispatch({ type: 'SET_GOJS_METAMODELPALETTE', gojsMetamodelPalette })
          dispatch({ type: 'SET_GOJS_METAMODELMODEL', gojsMetamodelModel })
          dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
          dispatch({ type: 'SET_GOJS_MODELOBJECTS', gojsModelObjects })
          dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
          dispatch({ type: 'SET_GOJS_TARGETMODEL', gojsTargetModel })
          dispatch({ type: 'SET_GOJS_TARGETMETAMODEL', gojsTargetMetamodel })
          dispatch({ type: 'SET_MYMETIS_MODEL', myMetis })
          // dispatch({ type: 'SET_MYMETIS_METAMODEL', myMetis })
          dispatch({ type: 'SET_MY_GOMODEL', myGoModel })
          dispatch({ type: 'SET_MY_GOMETAMODEL', myGoMetamodel })
    }
  }

  function buildGoPalette(metamodel: akm.cxMetaModel): gjs.goModel {
    // console.log('74 buildGoPalette', metamodel);
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    const objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      for (let i = 0; i < objecttypes.length; i++) {
        const objtype: akm.cxObjectType = objecttypes[i];   
        if (objtype && !objtype.deleted && !objtype.abstract) {
          const obj = new akm.cxObject(utils.createGuid(), objtype.name, objtype, "");
          // console.log('164 GenGojsModel', obj);
          
          if (obj.isDeleted()) 
          continue;
          const objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj, "");
          const typeview = objtype.getDefaultTypeView() as akm.cxObjectTypeView;
          objview.setTypeView(typeview);
          const node = new gjs.goObjectNode(utils.createGuid(), objview);
          node.loadNodeContent(myGoPaletteModel);
          node.isGroup = objtype.isContainer();
          if (node.isGroup)
            node.category = constants.gojs.C_PALETTEGROUP_OBJ;
          myGoPaletteModel.addNode(node);
        }
      }
    }
    return myGoPaletteModel;
  }

  function buildObjectPalette(objects: akm.cxObject[]) {
    const myGoObjectPalette = new gjs.goModel(utils.createGuid(), "myObjectPalette", null);
    const nodeArray = new Array();
    for (let i=0; i<objects?.length; i++) {
      const obj = objects[i];
      if (obj.isDeleted()) 
        continue;
      const objtype = obj?.getObjectType();
      const typeview = objtype?.getDefaultTypeView();
      const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "");
      objview.setTypeView(typeview);
      const node = new gjs.goObjectNode(utils.createGuid(), objview);
      node.isGroup = objtype?.isContainer();
      node.category = constants.gojs.C_OBJECT;
      const viewdata: any = typeview?.data;
      node.addData(viewdata);
      nodeArray.push(node);
    }
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview, metis);
    let objviews = modelview?.getObjectViews();
    if (objviews) {
      for (let i = 0; i < objviews.length; i++) {
        let objview = objviews[i];
        if (!objview.deleted) {
          let node = new gjs.goObjectNode(utils.createGuid(), objview);
          myGoModel.addNode(node);
        }
      }
      const nodes = myGoModel.nodes;
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i] as gjs.goObjectNode;
        node.loadNodeContent(myGoModel);
      }
    }
    // load relship views
    let relviews = (modelview) && modelview.getRelationshipViews();
    if (relviews) {
      let l = relviews.length;
      for (let i = 0; i < l; i++) {
        let relview = relviews[i];
        if (!relview.deleted) {
          let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
          link.loadLinkContent(myGoModel);
          myGoModel.addLink(link);
          // console.log('177 buildGoModel - link', link, myGoModel);
        }
      }
    }
    // console.log('180 myGoModel', myGoModel);
    return myGoModel;
  }

  function buildGoMetaPalette() {
    const myGoMetaPalette = new gjs.goModel(utils.createGuid(), "myMetaPalette", null);
    const nodeArray = new Array();
    const palNode1 = new gjs.paletteNode("01", "objecttype", "Object type", "Object type", "");
    nodeArray.push(palNode1);
    let links = '[]';
    let linkArray = JSON.parse(links);
    myGoMetaPalette.nodes = nodeArray;
    myGoMetaPalette.links = linkArray;
    return myGoMetaPalette;
  }
}

function buildGoMetaModel(metamodel: akm.cxMetaModel): gjs.goModel {
  if (metamodel?.objecttypes) {
    let myGoMetaModel = new gjs.goModel(utils.createGuid(), "myMetaModel", null);
    const objtypes = metamodel?.getObjectTypes();
    if (objtypes) {
      for (let i = 0; i < objtypes.length; i++) {
        const objtype = objtypes[i];
        if (objtype && !objtype.deleted) {
          const node = new gjs.goObjectTypeNode(utils.createGuid(), objtype);
          node.loadNodeContent(metamodel);
          myGoMetaModel.addNode(node);
        }
      }
    }
    let relshiptypes = metamodel.getRelshipTypes();
    if (relshiptypes) {
      for (let i = 0; i < relshiptypes.length; i++) {
        let reltype = relshiptypes[i];
        if (reltype && !reltype.deleted) {
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


export default GenGojsModel;
