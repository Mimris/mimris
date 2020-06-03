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


const GenGojsModel = (state: any, dispatch: any) => {

  const metis = (state.phData) && state.phData.metis
  const models = (metis) && metis.models
  const metamodels = (metis) && metis.metamodels

  // console.log('16', metis);

  if (metis != null) {
    let myMetis = new akm.cxMetis();
    glb.metis = myMetis;
    myMetis.importData(metis);
    // console.log('27 myMetis', myMetis);

    const focusModel = (state.phFocus) && state.phFocus.focusModel
    const focusModelview = (state.phFocus) && state.phFocus.focusModelview
    const curmod = (models && focusModel.id) && models.find((m: any) => m.id === focusModel.id)
    const curmodview = (curmod && focusModelview.id) && curmod.modelviews.find((mv: any) => mv.id === focusModelview.id)
    let curGomodel = state.phMyGoModel?.myGoModel;

    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      console.log('38 myMetamodel', myMetamodel);
      const myMetamodel = myModel?.metamodel;
      
      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel);
      console.log('40 myPalette', myPalette);

      const myModelView = myMetis?.findModelView(curmodview.id);
      const myGoModel = buildGoModel(myModel, myModelView);
      console.log('43 myGoModel', myGoModel);
      myMetis?.setGojsModel(myGoModel);
      const nodedataarray = (curmodview)
        ? curmodview.objectviews.map((mv: any, index: any) =>
          ({ key: mv.id, text: mv.name, color: 'orange', loc: `${mv.loc ? mv.loc.split(' ')[0] + ' ' + mv.loc.split(' ')[1] : {}}` }))
        : []
      const linkdataarray = (curmodview)
        ? curmodview.relshipviews.map((rv: any, index: any) => ((rv) && { key: rv.id, from: rv.fromobjviewRef, to: rv.toobjviewRef }))
        : []
      const gojsModel = (curGomodel) ?
        {
          nodeDataArray: curGomodel.nodes,
          linkDataArray: curGomodel.links
        } :
        {
          nodeDataArray: myGoModel.nodes,
          linkDataArray: myGoModel.links
        }
      console.log('58 gojsModel', gojsModel);


      // /** metamodel */
      const metamodel = (curmod && metamodels) && metamodels.find((mm: any) => mm.id === curmod.metamodelRef)
      const nodemetadataarray = (metamodel)
        ? metamodel?.objecttypes.map((ot: any, index: any) =>
          ({ key: ot.id, text: ot.name, color: 'lightyellow', loc: `0 ${index * (-40)}` }))
        : []
      //console.log('54', nodemetadataarray);

      const gojsMetamodel = {
        nodeDataArray: myPalette.nodes,
        linkDataArray: []
      }

      console.log('71', gojsMetamodel);
      console.log('73', myMetis);

      // update the Gojs arrays in the store
      dispatch({ type: 'SET_GOJS_METAMODEL', gojsMetamodel })
      dispatch({ type: 'SET_GOJS_MODEL', gojsModel })
      dispatch({ type: 'SET_MYMETIS_MODEL', myMetis })
      dispatch({ type: 'SET_MY_GOMODEL', myGoModel })
    }
    // return myMetis; 
  }

  function buildGoPalette(metamodel: akm.cxMetaModel): gjs.goModel {
    console.log('74 buildGoPalette', metamodel);
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    const objecttypes: akm.cxObjectType[] = metamodel?.objecttypes;
    if (objecttypes) {
      for (let i = 0; i < objecttypes.length; i++) {
        let objtype: akm.cxObjectType = objecttypes[i];
        //if (objtype && objtype.isInstantiable()) {
        if (objtype && !objtype.deleted && !objtype.abstract) {
          //console.log('83 buildGoPalette', objtype);
          let obj = new akm.cxObject(utils.createGuid(), objtype.name, objtype);
          let objview = new akm.cxObjectView(utils.createGuid(), obj.name, obj);
          objview.setTypeView(objtype.getDefaultTypeView());
          let node = new gjs.goObjectNode(utils.createGuid(), objview);
          node.loadNodeContent(myGoPaletteModel);
          node.isGroup = objtype.isContainer();
          if (node.isGroup)
            node.category = constants.C_PALETTEGROUP_OBJ;
          myGoPaletteModel.addNode(node);
        }
      }
    }
    return myGoPaletteModel;
  }

  function buildGoModel(model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview);
    let objviews = modelview.getObjectViews();
    console.log('103 modelview', modelview);
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
        let node = nodes[i];
        node.loadNodeContent(myGoModel);
      }
    }
    console.log('114 buildGoModel', myGoModel);
    // load relship views
    let relviews = modelview.getRelationshipViews();
    console.log('117 relviews', relviews);
    let l = (relviews && relviews.length);
    for (let i = 0; i < l; i++) {
      let relview = relviews[i];
      if (!relview.deleted) {
        let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
        //link.loadLinkContent(myGoModel);
        myGoModel.addLink(link);
        //console.log('125 relviews - link', link, myGoModel);
      }
    }
    return myGoModel;
  }
}


export default GenGojsModel;
