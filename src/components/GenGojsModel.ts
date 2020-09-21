// @ts-nocheck

// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
import glb from '../akmm/akm_globals';
import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
//import {gqlImportMetis} from '../Server/src/akmm/ui_graphql'
const constants = require('../akmm/constants');

const GenGojsModel = async (props: any, dispatch: any) =>  {

  // console.log('17 GenGojsModel props:', props);
  const metis = (props.phData) && props.phData.metis
  const models = (metis) && metis.models
  const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels

  console.log('22 GenGojsModel metis:', metis);

  if (metis !== null) {
    let myMetis = null;
    // console.log('24 myMetis', glb.metis);
    if (!glb.metis) {
      myMetis = new akm.cxMetis();
      myMetis.importData(metis, true);
      glb.metis = myMetis;
      // console.log('29 myMetis', myMetis);
    } else {
      myMetis = glb.metis;
      const deleteViewsOnly = myMetis.deleteViewsOnly;
      const pasteViewsOnly  = myMetis.pasteViewsOnly;
      myMetis = new akm.cxMetis();
      myMetis.importData(metis, true);
      myMetis.deleteViewsOnly = deleteViewsOnly;
      myMetis.pasteViewsOnly  = pasteViewsOnly
      // console.log('34 myMetis', myMetis);
    }
    // console.log('37 GenGojsModel myMetis', glb.metis);
    
    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm.id === curmod.metamodelRef)
    const curtargetmodel = (curmod) && metamodels.find(mm => mm.id === curmod.targetModelRef)
    
    // console.log('42 gengojsmodel', focusModel, focusModelview);

    let curGomodel = props.phMyGoModel?.myGoModel;
    // console.log('45 gengojsmodel :', curmod, curmod?.id);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      // console.log('50 GengojsModel :', myModel);
      
      const myMetamodel = myModel?.metamodel;
      // console.log('53 GenGojsModel myMetamodel :', myMetamodel);
      // console.log('61 GenGojsModel myMetamodelRef :', curmod.metamodelRef, curmetamodel);
      // console.log('62 GenGojsModel myTargetModelRef :', curmod.targetModelRef, curtargetmodel);
      const myTargetMetamodel = curtargetmodel || null
      // console.log('60 GenGojsModel myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette(myMetamodel);
      // console.log('63 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
      // console.log('65 myGoMetamodel', myGoMetamodel);
      const myTargetModelPalette = (myTargetMetamodel !== null) && buildGoMetaPalette(myTargetMetamodel);
      // console.log('66 myTargetModelPalette', myTargetModelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel);
      // console.log('69 myPalette', myPalette);
      let myModelView = (curmodview) && myMetis?.findModelView(curmodview?.id);
      if (!myModelView) myModelView = myMetis?.findModelView(focusModelview?.id);
      // console.log('63 GenGojsModel  myModel', myMetis, myModel, myModelView);
      const myGoModel = buildGoModel(myMetis, myModel, myModelView);
      // console.log('70 myGoModel', myGoModel);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelView);
      
      // console.log('53 GenGojsModel  myMetis', myMetis);
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
        
      console.log('98 gojsModel', myMetamodelPalette.nodes);
      // console.log('98 myMetamodelPalette', myMetamodelPalette.nodes);
      // console.log('98 myTargetModelPalette', myTargetModelPalette.nodes);
      // console.log('100 myPalette', myPalette);
      
      const gojsMetamodelPalette =  {
        nodeDataArray: myMetamodelPalette?.nodes,
        linkDataArray: []
      }

      const gojsTargetMetamodel =  {
        nodeDataArray: myTargetModelPalette?.nodes,
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
// Added by Dag      
      const objects = myModel.objects;
      const nodes = buildObjectPalette(objects);
      console.log('131 GenGojsModel', nodes);
      const gojsModelObjects = {
        nodeDataArray: nodes,
        linkDataArray: [] //myGoModel?.links
      }
// ----
  
      // console.log('101', gojsTargetMetamodel);
      // console.log('110 GenGojsModel', myMetis);
      // console.log('111 gojsModel', gojsModel);

      // /** metamodel */
      const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => mm.id === curmod.metamodelRef);
           
      // console.log('126 GenGojsModel', gojsMetamodel);
      // update the Gojs arrays in the store
          dispatch({ type: 'SET_GOJS_METAMODELPALETTE', gojsMetamodelPalette })
          dispatch({ type: 'SET_GOJS_METAMODELMODEL', gojsMetamodelModel })
          dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
          dispatch({ type: 'SET_GOJS_MODELOBJECTS', gojsModelObjects })
          dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
          dispatch({ type: 'SET_GOJS_TARGETMETAMODEL', gojsTargetMetamodel })
          dispatch({ type: 'SET_MYMETIS_MODEL', myMetis })
          dispatch({ type: 'SET_MY_GOMODEL', myGoModel })
          dispatch({ type: 'SET_MY_GOMETAMODEL', myGoMetamodel })
    }
    // return myMetis; 
  }

  function buildGoPalette(metamodel: akm.cxMetaModel): gjs.goModel {
    // console.log('74 buildGoPalette', metamodel);
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    const objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      for (let i = 0; i < objecttypes.length; i++) {
        const objtype: akm.cxObjectType = objecttypes[i];
        //if (objtype && objtype.isInstantiable()) {
        if (objtype && !objtype.deleted && !objtype.abstract) {
          //console.log('83 buildGoPalette', objtype);
          const obj = new akm.cxObject(utils.createGuid(), objtype.name, objtype, "");
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
    for (let i=0; i<objects.length; i++) {
      const obj = objects[i];
      const objtype = obj?.getObjectType();
      const typeview = objtype?.getDefaultTypeView();
      const objview = new akm.cxObjectView(utils.createGuid(), objtype?.getName(), obj, "");
      objview.setTypeView(typeview);
      const node = new gjs.goObjectNode(utils.createGuid(), objview);
      node.isGroup = objtype.isContainer();
      node.category = constants.gojs.C_OBJECT;
      nodeArray.push(node);
    }
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview, metis);
    let objviews = modelview?.getObjectViews();
    // console.log('152 buildGoMOdel', metis);
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
    // const palNode2 = new gjs.paletteNode("02", "objecttype", "Object type", "Container type", "");
    // palNode2.viewkind = "Container";
    // //palNode2.isGroup = false;
    // palNode2.fillcolor = "lightgrey";
    // nodeArray.push(palNode2);
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
          // console.log('208 buildGoMetaModel', metamodel);
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
