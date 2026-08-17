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

const first = (arr: any) => (Array.isArray(arr) && arr.length > 0) ? arr[0] : undefined;

const hasRenderableModelviewContent = (modelview: any) => {
  const objectviews = Array.isArray(modelview?.objectviews) ? modelview.objectviews.filter(Boolean) : [];
  const relshipviews = Array.isArray(modelview?.relshipviews) ? modelview.relshipviews.filter(Boolean) : [];
  return objectviews.length > 0 || relshipviews.length > 0;
};

const resolveFocusableModelview = (model: any, requestedModelview: any = null) => {
  const modelviews = Array.isArray(model?.modelviews) ? model.modelviews.filter(Boolean) : [];
  if (!modelviews.length) return undefined;

  const requested = requestedModelview
    ? modelviews.find((modelview: any) => modelview?.id === requestedModelview?.id || modelview?.name === requestedModelview?.name)
    : undefined;
  if (requested) return requested;

  return modelviews.find(hasRenderableModelviewContent) || first(modelviews);
};

const GenGojsModel = async (props: any, myMetis: any, options: { skipImport?: boolean } = {}) => {
  // let myMetis = yourMetis;
  // let goParams = {};
  if (debug) console.log('28 GenGojsModel started', props, myMetis);
  const phData = props.phData || {};
  const phFocus = props.phFocus || {};
  const phUser = props.phUser || {};
  const includeDeleted = (phUser?.focusUser) ? phUser?.focusUser?.diagram?.showDeleted : false;
  const includeNoObject = (phUser?.focusUser) ? phUser?.focusUser?.diagram?.showDeleted : false;
  const includeInstancesOnly = (phUser?.focusUser) ? phUser?.focusUser?.diagram?.showDeleted : false;
  if (debug) console.log('32 GenGojsModel showDeleted', includeDeleted, phUser?.focusUser?.diagram?.showModified)
  const showModified = (phUser?.focusUser) ? phUser?.focusUser?.diagram?.showModified : false;
  const metis = phData?.metis; // Todo: check if current model and then load only current model
  const models = Array.isArray(metis?.models) ? metis.models.filter((m: any) => !!m) : []; // always an array
  let focusModel = phFocus?.focusModel;
  if (!focusModel) {
    const firstModel = first(models);
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
  let focusModelview = phFocus?.focusModelview;
  if (!focusModelview && Array.isArray(focusModel?.modelviews) && focusModel?.modelviews?.length > 0) {
    const fmvc0 = resolveFocusableModelview(focusModel);
    if (fmvc0) focusModelview = { id: fmvc0.id, name: fmvc0.name };
  }
  if (debug) console.log('37 GenGojsModel focusModel', focusModel, focusModelview);
  let focusObject = phFocus?.focusObject;
  let focusObjectview = phFocus?.focusObjectview;
  const metamodels = (metis) && metis.metamodels.filter((mm) => (mm) && mm); // filter out null metamodels
  let adminModel;

  if (metis != null) {
    if (debug) clogGreen('67 GenGojsModel: props', props);
    if (debug) clogGreen('44 GenGojsModel: metis', phData.metis);
  const curmod = (focusModel?.id && models.length > 0) ? (models.find((m: any) => m.id === focusModel.id) || first(models)) : first(models); // safe first model fallback
    const curmodview = resolveFocusableModelview(curmod, focusModelview);
    const focusTargetModel = phFocus.focusTargetModel
    const focusTargetModelview = phFocus.focusTargetModelview
  const curtargetmodel = (focusTargetModel?.id && models.length > 0) ? models.find((m: any) => m.id === curmod?.targetModelRef) : undefined;
  const focustargetmodelview = (curtargetmodel && focusTargetModelview?.id && Array.isArray(curtargetmodel.modelviews)) ? curtargetmodel.modelviews.find((mv: any) => mv.id === focusTargetModelview?.id) : undefined;
  const curtargetmodelview = focustargetmodelview || (Array.isArray(curtargetmodel?.modelviews) ? first(curtargetmodel?.modelviews) : undefined);

    if (debug) console.log('54 GenGojsModel: curmodview', curmodview, curmod, focusModelview, curmod?.modelviews)

    // const myMetis = new akm.cxMetis();
    // myMetis = props.myMetis;

    if (debug) console.log('81 GenGojsModel: metis', metis, myMetis);
    if (!options.skipImport) myMetis?.importData(metis, true);
    adminModel = uib.buildAdminModel(myMetis);

    if (debug) clogBlue('83 GenGojsModel :', myMetis)
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
