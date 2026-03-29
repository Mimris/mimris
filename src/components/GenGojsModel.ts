// @ts-nocheck

// /**
// * Generate GoJS model and metamodel from the metisobject in the store,
// */
// import * as utils from '../akmm/utilities';
import * as akm from '../akmm/metamodeller';
// import * as gjs from '../akmm/ui_gojs';
// import * as jsn from '../akmm/ui_json';
import * as uib from '../akmm/ui_buildmodels';
// import * as uic from '../akmm/ui_common';
import * as constants from './constants';

const debug = false;

const clogGreen = console.log.bind(console, '%c %s', // green colored cosole log
  'background: green; color: white');
const clogBlue = console.log.bind(console, '%c %s', // green colored cosole log
  'background: blue; color: white');
const ctrace = console.trace.bind(console, '%c %s',
  'background: green; color: white');

const systemtypes = ['Property', 'Method', 'MethodType', 'Datatype', 'Value', 'FieldType', 'InputPattern', 'ViewFormat'];

const GenGojsModel = async (props: any, myMetis: any) => {
  // Safe helper to fetch first element
  const first = (arr: any) => (Array.isArray(arr) && arr.length > 0) ? arr[0] : undefined;
  // let myMetis = yourMetis;
  // let goParams = {};
  if (debug) console.log('28 GenGojsModel started', props, myMetis);
  const includeDeleted = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('32 GenGojsModel showDeleted', includeDeleted, props.phUser?.focusUser?.diagram?.showModified)
  const showModified = (props.phUser?.focusUser) ? props.phUser?.focusUser?.diagram?.showModified : false;
  const metis = props.phData?.metis; // Todo: check if current model and then load only current model
  const models = Array.isArray(metis?.models) ? metis.models.filter((m: any) => !!m) : []; // always an array
  let focusModel = props.phFocus?.focusModel;
  if (!focusModel) {
    const firstModel = first(models[0]);
    if (firstModel && typeof firstModel === 'object') {
      focusModel = { id: firstModel.id, name: firstModel.name };
    } else if (debug) {
      console.warn('GenGojsModel: No usable first model. models value:', models);
    }
  }
  // If still no focusModel we can't proceed yet (likely data not loaded). Exit quietly.
  if (!focusModel) {
    if (debug) console.warn('GenGojsModel exiting early: focusModel unresolved');
    return;
  }
  let focusModelview = props.phFocus?.focusModelview;
  if (!focusModelview && Array.isArray(focusModel?.modelviews) && focusModel?.modelviews?.length > 0) {
    const fmvc0 = first(focusModel.modelviews);
    if (fmvc0) focusModelview = { id: fmvc0.id, name: fmvc0.name };
  }
  if (debug) console.log('37 GenGojsModel focusModel', focusModel, focusModelview);
  let focusObject = props.phFocus?.focusObject;
  let focusObjectview = props.phFocus?.focusObjectview;
  const metamodels = (metis) && metis.metamodels.filter((mm) => (mm) && mm); // filter out null metamodels
  let adminModel;

  if (metis != null) {
    clogGreen('43 GenGojsModel: props', props);
    if (debug) clogGreen('44 GenGojsModel: metis', props.phData.metis);
  const curmod = (focusModel?.id && models.length > 0) ? (models.find((m: any) => m.id === focusModel.id) || first(models)) : first(models); // safe first model fallback
    const curmodview = (curmod && focusModelview?.id && Array.isArray(curmod.modelviews) && curmod.modelviews.find((mv: any) => mv.id === focusModelview.id))
      ? curmod.modelviews.find((mv: any) => mv.id === focusModelview.id)
  : (Array.isArray(curmod?.modelviews) ? first(curmod?.modelviews) : undefined); // safe first modelview fallback
    const focusTargetModel = (props.phFocus) && props.phFocus.focusTargetModel
    const focusTargetModelview = (props.phFocus) && props.phFocus.focusTargetModelview
  const curtargetmodel = (focusTargetModel?.id && models.length > 0) ? models.find((m: any) => m.id === curmod?.targetModelRef) : undefined;
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id && Array.isArray(curtargetmodel.modelviews)) ? curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id) : undefined;
  const curtargetmodelview = focustargetmodelview || (Array.isArray(curtargetmodel?.modelviews) ? first(curtargetmodel?.modelviews) : undefined);

    if (debug) console.log('54 GenGojsModel: curmodview', curmodview, curmod, focusModelview, curmod?.modelviews)

    // const myMetis = new akm.cxMetis();
    // myMetis = props.myMetis;

    if (!debug) console.log('81 GenGojsModel: metis', metis, myMetis);
    myMetis?.importData(metis, true);
    adminModel = uib.buildAdminModel(myMetis);

    if (!debug) clogBlue('83 GenGojsModel :', myMetis)
    if (debug) clogBlue('88 GenGojsModel :', '\n currentModelview :', myMetis.currentModelview?.name, ',\n props :', props, '\n myMetis :', myMetis);

    if (curmod && curmod.id) {
      const myModel = myMetis?.findModel(curmod.id);
      if (debug) console.log('71 myModel :', myModel);
      let myModelview = (curmodview && myModel) ? myModel?.findModelView(curmodview?.id) : undefined;
      if (debug) console.log('73 myModelview', myModelview);
      let myGoModel = (myModel) ? uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject, showModified) : undefined;
      if (debug) console.log('75 GenGojsModel myGoModel', myGoModel, myGoModel?.nodes);
      let myMetamodel = myModel?.metamodel;
      if (debug) console.log('77 myMetamodel :', myMetamodel);
      const myGoMetamodel = myMetamodel ? uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified) : undefined;
      if (debug) console.log('79 myGoMetamodel', myGoMetamodel);
      const myGoMetamodelPalette = (myMetamodel) ? uib.buildGoMetaPalette() : undefined;
      if (debug) console.log('83 myMetamodelPalette', myMetamodelPalette);
      const myGoPalette = (myMetamodel) ? uib.buildGoPalette(myMetamodel, myMetis) : undefined;
      if (debug) console.log('85 myPalette', myPalette);

      const myTargetModel = (curtargetmodel?.id) ? myMetis?.findModel(curtargetmodel?.id) : undefined;
      let myTargetModelview = (curtargetmodelview && focusTargetModelview?.id) ? myMetis.findModelView(focusTargetModelview?.id) : undefined;
      let myTargetMetamodel = (curmod?.targetMetamodelRef) ? myMetis.findMetamodel(curmod.targetMetamodelRef) : null;
      const myGoTargetMetamodel = (myTargetMetamodel) ? uib.buildGoPalette(myTargetMetamodel, myMetis) : undefined;
      if (debug) console.log('81 myTargetMetamodel :', curmod, curmod.targetMetamodelRef, curtargetmodel, myTargetMetamodel);
      const myGoTargetMetamodelPalette = (myTargetMetamodel) ? uib.buildGoPalette(myTargetMetamodel, myMetis) : undefined;
      if (debug) console.log('90 myTargetModelPalette', myTargetMetamodel, myTargetMetamodelPalette);
      const myGoTargetModel = (myTargetModel) ? uib.buildGoModel(myMetis, myTargetModel, myTargetModelview, includeDeleted, includeNoObject) : undefined;
      if (debug) console.log('113 GenGojsModel myGoModel', myMetis, myGoTargetModel, myTargetModel, myTargetModelview);

      if (focusObjectview?.id && myModelview) {
        myModelview.setFocusObjectview(focusObjectview);
      }
      if (myGoModel) myMetis?.setGojsModel(myGoModel);
      if (myMetamodel) myMetis?.setCurrentMetamodel(myMetamodel);
      if (myModel) myMetis?.setCurrentModel(myModel);
      if (myModelview) myMetis?.setCurrentModelview(myModelview);

      if (debug) console.log('81 GenGojsModel: metis', myMetis.gojsModel);
      if (debug) console.log('121 GenGojsModel  myMetis', myMetis);
      if (debug) console.log('211 Modelling ', props, myMetis, myModel, myModelview, myMetamodel);
      if (!myMetis && !myModel && !myModelview && !myMetamodel) {
        console.error('187 One of the required variables is undefined: myMetis: ', myMetis, 'myModel: ', 'myModelview: ', myModelview, 'myMetamodel: ', myMetamodel);
        return null;
      }

    }
  }
  if (debug) console.log('114 GenGojsModel myMetis', myMetis);
}
export default GenGojsModel;