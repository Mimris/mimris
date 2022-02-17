// @ts-nocheck
const debug = false;
// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as jsn from '../akmm/ui_json';

const constants = require('../akmm/constants');

// Parameters to configure loads
// const includeNoObject = false;
// const includeInstancesOnly = true 
const includeNoType = false;

const systemtypes = ['Property', 'Method', 'MethodType', 'Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];

const GenGojsModel = async (props: any, dispatch: any) =>  {
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('23 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showDeleted)
  const metis = (props.phData) && props.phData.metis
  const models = (metis) && metis.models
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels
  let adminModel;

  if (metis != null) {
    console.log('30 GenGojsModel: phData, metis:', props.phData, props);
    const myMetis = new akm.cxMetis();
    myMetis.importData(metis, true);
    adminModel = buildAdminModel(myMetis);
    console.log('34 GenGojsModel: myMetis', myMetis);
    
    const focusModel = (props.phFocus) && props.phFocus.focusModel
    const focusModelview = (props.phFocus) && props.phFocus.focusModelview
    if (debug) console.log('41 focusModel, focusModelview', focusModel, focusModelview)
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const focusObjectview = (props.phFocus) && props.phFocus.focusObjectview
    const focusObject = (props.phFocus) && props.phFocus.focusObject
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    if (debug) console.log('46 GenGojsModel: models, curmod', models, curmod, curmod.modelviews, focusModelview)
    const curmodview = (curmod && focusModelview?.id) && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)
    const curmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.metamodel?.id)
    const curtargetmetamodel = (curmod) && metamodels.find(mm => mm?.id === curmod?.targetMetamodel?.id)
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModel?.id)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    if (debug) console.log('53 GenGojsModel: curmod++', curmod, curmodview, metamodels, curtargetmodel, curmod?.targetModel?.id);

    let curGomodel = props.phMyGoModel?.myGoModel;
    if (debug) console.log('56 GenGojsModel: curmod', curmod, curmod?.id);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      if (debug) console.log('60 myModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
      if (debug) console.log('65 myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
      if (debug) console.log('67 myMetamodel :', curmod.metamodel, curmetamodel);
      if (debug) console.log('68 myTargetMetamodel :', curmod.targetMetamodel, curtargetmodel);
      let myTargetMetamodel = curtargetmetamodel || null;
      if (myTargetMetamodel !== null)
        myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      if (debug) console.log('72 myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && buildGoMetaPalette(myMetamodel);
      if (debug) console.log('75 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = buildGoMetaModel(myMetamodel);
      if (debug) console.log('77 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel !== null) && buildGoPalette(myTargetMetamodel, myMetis);
      if (debug) console.log('79 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && buildGoPalette(myMetamodel, myMetis);
      if (debug) console.log('82 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
      if (!myModelview) myModelview = myMetis?.findModelView(focusModelview?.id);
      if (debug) console.log('85 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = buildGoModel(myMetis, myModel, myModelview);
      const myGoTargetModel = buildGoModel(myMetis, myTargetModel, myTargetModelview);
      if (debug) console.log('88 GenGojsModel myGoModel', myMetis, myGoModel, myModel, myModelview);
      if (debug) console.log('89 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      myMetis?.setCurrentTargetModel(myTargetModel);
      myMetis?.setCurrentTargetModelview(myTargetModelview);
      if (debug) console.log('96 GenGojsModel  myMetis', myMetis);
      if (debug) console.log('97 focusTab', props.phFocus.focusTab);
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
        
      if (debug) console.log('110 myPalette', myPalette.nodes, myPalette.links);
      if (debug) console.log('111 myMetamodelPalette', myMetamodelPalette.nodes);
      if (debug) console.log('112 myTargetMetamodelPalette', myTargetMetamodelPalette);
      
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
  
      if (debug) console.log('152 GenGojsModel gojsTargetMetamodel', gojsTargetMetamodel);

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
    if (debug) console.log('173 metamodel', metamodel);
    let typenames;
    const modelRef = metamodel.generatedFromModelRef;
    let model = metis.findModel(modelRef);
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
      typenames = [...new Set(objtypenames)];
      if (debug) console.log('191 objecttypes', typenames);
    }
    const myGoPaletteModel = new gjs.goModel(utils.createGuid(), "myPaletteModel", null);
    let objecttypes: akm.cxObjectType[] | null = metamodel?.objecttypes;
    if (objecttypes) {
      objecttypes.sort(utils.compare);
    }
    if (debug) console.log('196 objecttypes', objecttypes);
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
          if (objtype.name !== 'Generic' && objtype.name !== 'Container') {
            if (typenames && utils.nameExistsInNames(typenames, objtype.name)) 
              continue;
          }
        }
        otypes.push(objtype);
      }
      if (debug) console.log('211 otypes', otypes); 
      const noTypes = otypes.length;
      for (let i = 0; i < noTypes; i++) {
        const objtype: akm.cxObjectType = otypes[i];  
        if (!includesSystemtypes) {    // Systemtypes are not included
          if (objtype.name !== 'Generic' && objtype.name !== 'Container') {
            if (typenames && utils.nameExistsInNames(typenames, objtype.name)) 
              continue;
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
        if (debug) console.log('230 obj, objtype', obj, objtype);
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
        if (debug) console.log('208 node', objtype, objview, node);          
        node.isGroup = objtype.isContainer();
        if (node.isGroup)
            node.category = constants.gojs.C_PALETTEGROUP_OBJ;
        myGoPaletteModel.addNode(node);        
      }
    }
    if (debug) console.log('252 Objecttype palette', myGoPaletteModel);
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
      if (debug) console.log('233 obj, objview:', obj, objview);
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
          if (debug) console.log('252 obj', obj);
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
        if (debug) console.log('268 node, objview:', node, objview);
        node.isGroup = objtype?.isContainer();
        node.category = constants.gojs.C_OBJECT;
        const viewdata: any = typeview?.data;
        node.addData(viewdata);
        nodeArray.push(node);
        if (node.name === 'Container')
          if (debug) console.log('274 node', node);
      }
    }
    if (debug) console.log('277 Object palette', nodeArray);
    return nodeArray;
  }

  function buildGoModel(metis: akm.cxMetis, model: akm.cxModel, modelview: akm.cxModelView): gjs.goModel {
    if (debug) console.log('303 GenGojsModel', metis, model, modelview);
    if (!model) return;
    if (!modelview) return;
    // const admModel = metis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    // const admModelview = admModel?.modelviews[0];
    // model.addModelView(admModelview.id)
    
    // if (utils.getShowAdminModel()) {
    //   model = metis.findModelByName(constants.admin.AKM_ADMIN_MODEL);
    //   modelview = model?.modelviews[0];
    // }

    const myGoModel = new gjs.goModel(utils.createGuid(), "myModel", modelview);
    let objviews = modelview?.getObjectViews();
    if (objviews) {
      if (debug) console.log('318 modelview, objviews:', modelview.name, objviews);
      for (let i = 0; i < objviews.length; i++) {
        let includeObjview = false;
        let objview = objviews[i];
        const obj = objview.object;
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
            if (debug) console.log('349 objview', objview);
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
          if (debug) console.log('360 includeNoObject, objview:', includeNoObject, objview);
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
          if (debug) console.log('373 buildGoModel - node', node, myGoModel);
        }
      }
      const nodes = myGoModel.nodes;
      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as gjs.goObjectNode;
          const objview = node.objectview;
          node.name = objview.name;
          node.loadNodeContent(myGoModel);
      }
      if (debug) console.log('383 nodes', nodes);
    }
    // load relship views
    let relviews = (modelview) && modelview.getRelationshipViews();
    if (relviews) {
      if (debug) console.log('388 modelview, relviews', modelview.name, relviews);
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
        if (!includeDeleted && !includeNoObject && !includeNoType)
          relcolor = relview.strokecolor;
          if (!relcolor) relcolor = 'black';
        if (includeRelview) {
          if (debug) console.log('433 rel, relview:', rel, relview);
          relview.setFromArrow2(rel?.relshipkind);
          relview.setToArrow2(rel?.relshipkind);
          if (debug) console.log('436 rel, relview:', rel, relview);
          let link = new gjs.goRelshipLink(utils.createGuid(), myGoModel, relview);
          link.loadLinkContent(myGoModel);
          link.name = rel?.name;
          link.routing = modelview.routing;
          link.curve = modelview.linkcurve;
          if (modelview.showCardinality) {
            link.cardinalityFrom = rel?.getCardinalityFrom(); 
            link.cardinalityTo = rel?.getCardinalityTo();
          } else {
            link.cardinalityFrom = "";
            link.cardinalityTo = "";
          }
          if (!link.fromArrow && !link.toArrow)
            link.toArrow = 'OpenTriangle';
          if (debug) console.log('449 modelview, link:', modelview, link);
          if (debug) console.log('450 GenGojsModel: props', props);
          myGoModel.addLink(link);
          if (debug) console.log('452 buildGoModel - link', link, myGoModel);
        }
      }
    }
    if (debug) console.log('431 myGoModel.links', myGoModel.links);
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
      if (debug) console.log('462 metamodel', metamodel);
      const myGoMetamodel = new gjs.goModel(utils.createGuid(), "myMetamodel", null);
      const objtypes = metamodel?.getObjectTypes();
      if (objtypes) {
        if (debug) console.log('466 objtypes', objtypes);
        for (let i = 0; i < objtypes.length; i++) {
          let includeObjtype = false;
          let strokecolor = "black";
          let fillcolor = "white";
          const objtype = objtypes[i];
          if (objtype) {
            if (!objtype.markedAsDeleted) 
              includeObjtype = true;
            else {
              if (debug) console.log('476 objtype', objtype);
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
              if (debug) console.log('492 node', node);
              myGoMetamodel.addNode(node);
            }
          }
        }
      }
      // metamodel.relshiptypes = utils.removeArrayDuplicates(metamodel?.relshiptypes);
      let relshiptypes = metamodel.relshiptypes;
      if (debug) console.log('500 relshiptypes', relshiptypes);
      if (relshiptypes) {
        for (let i = 0; i < relshiptypes.length; i++) {
          let includeReltype = false;
          let strokecolor = "black";
          let reltype = relshiptypes[i];
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
            if (debug) console.log('523 reltype', reltype);
            if (!reltype.typeview) 
                reltype.typeview = reltype.newDefaultTypeView(reltype.relshipkind);
            if (!reltype.fromObjtype) 
                reltype.fromObjtype = metamodel.findObjectType(reltype.fromobjtypeRef);
            if (!reltype.toObjtype) 
                reltype.toObjtype = metamodel.findObjectType(reltype.toobjtypeRef);
            const key = utils.createGuid();
            const link = new gjs.goRelshipTypeLink(key, myGoMetamodel, reltype);
            if (debug) console.log('533 link', link);
            if (link.loadLinkContent()) {
              link.strokecolor = strokecolor;
              link.routing = metamodel.routing;
              link.curve = metamodel.linkcurve;
                  if (debug) console.log('536 link', link);
              myGoMetamodel.addLink(link);
            }            
          }
        }
      }
      return myGoMetamodel;
    }
  }

  function buildAdminModel(myMetis: akm.cxMetis): akm.cxModel {
    const adminMetamodel = myMetis.findMetamodelByName(constants.admin.AKM_ADMIN_MM);
    if (!adminMetamodel) {
      if (debug) console.log('590 No Admin Metamodel found!');
      return;
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
        project.addObjectView(projectview);
        adminModelview.addObjectView(projectview);
        myMetis.addObjectView(projectview);
      }
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
                        adminModel.addObject(mvObj);
                        myMetis.addObject(mvObj);

                        // Create objectview of Modelview object
                        const mvObjview = new akm.cxObjectView(utils.createGuid(), mvObj.name, mvObj, '');
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
            // Find mmObj->objectview
            if (mmObj && mObj && genRel && genRelview) {
              const mmObjview = mmObj.objectviews[0];
              const mObjview = mObj.objectviews[0];
              genRelview.setFromObjectView(mmObjview);
              genRelview.setToObjectView(mObjview);
              genRelview.strokecolor = 'red';
              genRel.addRelationshipView(genRelview);
              adminModelview.addRelationshipView(genRelview);
              myMetis.addRelationshipView(genRelview);
            }
          }
        }
      }
    }
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

export default GenGojsModel;
