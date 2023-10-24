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
  if (debug) console.log('28 GenGojsModel started', props);
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('32 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showModified)
  const showModified = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showModified : false;
  const metis = (props.phData) && props.phData.metis // Todo: check if current model and then load only current model
  const models = (metis) && metis.models
  const focusModel = props.phFocus?.focusModel
  const focusModelview = props.phFocus?.focusModelview
  if (debug) console.log('37 GenGojsModel focusModel', focusModel, focusModelview)
  const metamodels = (metis) && metis.metamodels
  let adminModel;
  if (metis != null) {
    if (debug) clog('42 GenGojsModel: props', props);
    if (debug) clog('43 GenGojsModel: metis', props.phData.metis);
    const curmod = (models && focusModel?.id) && models.find((m: any) => m.id === focusModel.id)
    const curmodview = (curmod && focusModelview?.id && curmod.modelviews?.find((mv: any) => mv.id === focusModelview.id)) 
        ? curmod?.modelviews?.find((mv: any) => mv.id === focusModelview.id)
        : curmod?.modelviews[0] // if focusmodview does not exist set it to the first
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
    const curtargetmodel = (models && focusTargetModel?.id) && models.find((m: any) => m.id === curmod?.targetModelRef)
    const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id) && curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id)
    const curtargetmodelview = focustargetmodelview || curtargetmodel?.modelviews[0]

    if (debug) console.log('54 GenGojsModel: curmodview', curmodview, curmod, focusModelview, curmod?.modelviews)

    
    const myMetis = new akm.cxMetis();

    if (debug) console.log('51 GenGojsModel: metis', metis);
    myMetis.importData(metis, true);

    adminModel = uib.buildAdminModel(myMetis);
    clog('61 GenGojsModel :', '\n currentModelview :', myMetis.currentModelview?.name, ',\n props :', props, '\n myMetis :', myMetis);
    
    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
        if (debug) console.log('65 myModel :', myModel);
      const myTargetModel = myMetis?.findModel(curtargetmodel?.id);
      let myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
      
      let myMetamodel = myModel?.metamodel;
        if (debug) console.log('75 myMetamodel :', myMetamodel);
      myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
        if (debug) console.log('77 myMetamodel :', myMetamodel);
      let myMetamodels = myMetis.metamodels;
        if (debug) console.log('79 myMetamodel :', myMetamodels, myModel.metamodels);
      let myTargetMetamodel = myMetis.findMetamodel(curmod.targetMetamodelRef) || null;
        if (debug) console.log('81 myTargetMetamodel :', curmod, curmod.targetMetamodelRef, curtargetmodel);
      if (debug) console.log('77 myTargetMetamodel :', myTargetMetamodel);
      const myMetamodelPalette = (myMetamodel) && uib.buildGoMetaPalette();
        if (debug) console.log('80 myMetamodelPalette', myMetamodelPalette);
      const myGoMetamodel = uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified);
        if (debug) console.log('88 myGoMetamodel', myGoMetamodel);
      const myTargetMetamodelPalette = (myTargetMetamodel) && uib.buildGoPalette(myTargetMetamodel, myMetis);
        if (debug) console.log('90 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);
      const myPalette = (myMetamodel) && uib.buildGoPalette(myMetamodel, myMetis);
        if (debug) console.log('92 myPalette', myPalette);
      let myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
        if (debug) console.log('108 myModelview', myModelview);
        if (debug) console.log('109 GenGojsModel  myModel', myMetis, myModel, myModelview, showModified);
      const myGoModel = uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject, showModified);
        if (debug) console.log('111 GenGojsModel myGoModel', myGoModel, myGoModel?.nodes);
      const myGoTargetModel = uib.buildGoModel(myMetis, myTargetModel, myTargetModelview, includeDeleted, includeNoObject);
        if (debug) console.log('113 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);

      if (!debug) console.log('98 phFocus', props.phFocus);
      if (props.phFocus && props.phFocus.focusModelview && props.phFocus.focusModelview.id) {
        const fModelview = myMetis.findModelView(focusModelview?.id);
        if (fModelview) {
          let fObjview = props.phFocus?.focusObjectview?.id
          fObjview = fModelview.findObjectView(fObjview);
          fModelview.setFocusObjectview(fObjview);
        }
      }
      myMetis?.setGojsModel(myGoModel);
      myMetis?.setCurrentMetamodel(myMetamodel);
      myMetis?.setCurrentModel(myModel);
      myMetis?.setCurrentModelview(myModelview);
      (myTargetModel) && myMetis?.setCurrentTargetModel(myTargetModel);
      (myTargetModelview) && myMetis?.setCurrentTargetModelview(myTargetModelview);
      if (debug) console.log('121 GenGojsModel  myMetis', myMetis);

      dispatch({ type: 'SET_MYMETIS_MODEL', myMetis })

    }
  }
}
export default GenGojsModel;
