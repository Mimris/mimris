// @ts-nocheck
const debug = false;

const clog = console.log.bind(console, '%c %s', // green colored cosole log
    'background: green; color: white');
const ctrace = console.trace.bind(console, '%c %s',
    'background: green; color: white');

// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
// import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
// import * as gjs from '../akmm/ui_gojs';
// import * as jsn from '../akmm/ui_json';
import * as uib from '../akmm/ui_buildmodels';
// import * as uic from '../akmm/ui_common';

const constants = require('../akmm/constants');

// Parameters to configure loads
// const includeNoObject = false;
// const includeInstancesOnly = true 

const systemtypes = ['Property', 'Method', 'MethodType', 'Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];

const GenGojsModel = async (props: any, dispatch: any) =>  {
  if (!debug) console.log('28 GenGojsModel started', props);
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('32 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showDeleted)
  const metis = (props.phData) && props.phData.metis // Todo: check if current model and then load only current model
  const models = (metis) && metis.models
  const focusModel = props.phFocus?.focusModel
  const focusModelview = props.phFocus?.focusModelview
  if (debug) console.log('37 GenGojsModel focusModel', focusModel, focusModelview)
  // const modelviews = (metis) && metis.modelviews
  const metamodels = (metis) && metis.metamodels
  let adminModel;
  if (metis != null) {
    if (debug) clog('42 GenGojsModel: props', props);

    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]
    const curmodview = (curmod && focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)) 
        ? curmod?.modelviews?.find((mv: any) => mv.id === focusModelview.id)
        : curmod?.modelviews[0] // if focusmodview does not exist set it to the first

    if (debug) console.log('54 GenGojsModel: curmodview', curmodview, curmod, focusModelview, curmod?.modelviews)

    
    const myMetis = new akm.cxMetis();
    const tempMetis = myMetis
    if (debug) console.log('55 GenGojsModel: tempMetis', tempMetis);
    myMetis.importData(metis, true);
    // const metis2 = uib.buildMinimisedMetis(metis, curmod) //Todo: change modelview not load from redux store
    // if (debug) console.log('51 GenGojsModel: metis2', metis2);
    // myMetis.importData(metis2, true);
    adminModel = uib.buildAdminModel(myMetis);
    clog('61 GenGojsModel :', '\n currentModelview :', myMetis.currentModelview?.name, ',\n props :', props, '\n myMetis :', myMetis);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
        if (debug) console.log('65 myModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
        if (!debug) console.log('70 myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
        if (!debug) console.log('72 myMetamodel :', myMetamodel);
        if (debug) console.log('73 myTargetMetamodel :', curmod, curmod.targetMetamodelRef, curtargetmodel);
      let myTargetMetamodel = myMetis.findMetamodel(curmod.targetMetamodelRef) || null;
      // if (myTargetMetamodel !== null)
      //   myTargetMetamodel = myMetis?.findMetamodel(myTargetMetamodel.id);
      if (debug) console.log('77 myTargetMetamodel :', myTargetMetamodel);

      const myMetamodelPalette = (myMetamodel) && uib.buildGoMetaPalette();
        if (!debug) console.log('80 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = uib.buildGoMetaModel(myMetamodel, includeDeleted);
        if (!debug) console.log('82 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel) && uib.buildGoPalette(myTargetMetamodel, myMetis);
        if (debug) console.log('84 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);

      const myPalette = (myMetamodel) && uib.buildGoPalette(myMetamodel, myMetis);
        if (debug) console.log('87 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
        if (debug) console.log('89 myModelview', myModelview);
        if (debug) console.log('90 GenGojsModel  myModel', myMetis, myModel, myModelview);
      const myGoModel = uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject);
        if (debug) console.log('92 GenGojsModel myGoModel', myGoModel, myGoModel?.nodes);
      const myGoTargetModel = uib.buildGoModel(myMetis, myTargetModel, myTargetModelview, includeDeleted, includeNoObject);
        if (debug) console.log('94 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      (myTargetModel) && myMetis?.setCurrentTargetModel(myTargetModel);
      (myTargetModelview) && myMetis?.setCurrentTargetModelview(myTargetModelview);
      if (debug) console.log('101 GenGojsModel  myGoModel', myGoModel);
      if (debug) console.log('102 GenGojsModel  myMetis', myMetis);

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
        linkDataArray: myPalette?.links
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
      const nodes = uib.buildObjectPalette(objects);
      const gojsModelObjects = {
        nodeDataArray: nodes,
        linkDataArray: [] //myGoModel?.links
      }
  
      if (!debug) console.log('155 GenGojsModel gojsModel', myGoMetamodel);
      if (!debug) console.log('155 GenGojsModel gojsModel',  gojsMetamodelModel);

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
}
export default GenGojsModel;

