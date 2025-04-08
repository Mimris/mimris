import * as uib from '../../akmm/ui_buildmodels';

export function loadMyModeldata(props: any) {
    let debug = false
    console.log('5 LoadMyModeldata ', props, 'myMetis', props.myMetis);
    // let myMetis = props.phMyMetis
    // if (!myMetis) return null
    let myMetis = props.myMetis
    let gojsmetamodelpalette, gojsmetamodelmodel, gojsmodel, gojsmetamodel, gojsmodelobjects, gojstargetmodel, gojstargetmetamodel
    let myModel, myGoModel, myGoObjectPalette, myGoRelshipPalette, myGoMetamodel, myGoMetamodelModel, myGoMetamodelPalette
    let myMetamodel, myTargetModel, myTargetModelview, myTargetMetamodel, myTargetMetamodelPalette
    let myModelview, myGoModelview, myGoMetamodelView, myGoMetamodelModelview, myGoMetamodelPaletteview
    const includeDeleted = false
    const includeNoObject = false
    const showModified = false
    const focusModel = myMetis?.focusModel
    const focusModelview = myMetis?.focusModelview
    const focusTargetModel = myMetis?.focusTargetModel
    const focusTargetModelview = myMetis?.focusTargetModelview
    const curmod = (focusModel) && myMetis?.findModel(focusModel?.id)
    const curmodview = (focusModelview) && myMetis?.findModelView(focusModelview?.id)
    const curtargetmodel = (focusTargetModel) && myMetis?.findModel(focusTargetModel?.id)
    const curtargetmodelview = (focusTargetModelview) && myMetis?.findModelView(focusTargetModelview?.id)

    myModel = myMetis?.findModel(curmod?.id);
    myModelview = (curmodview) && myMetis?.findModelView(curmodview?.id);
    myMetamodel = myModel?.metamodel;
    myMetamodel = (myMetamodel) ? myMetis.findMetamodel(myMetamodel?.id) : null;
    myTargetModel = myMetis?.findModel(curtargetmodel?.id);
    myTargetModelview = (curtargetmodelview) && myMetis.findModelView(focusTargetModelview?.id)
    myTargetMetamodel = (myMetis) && myMetis.findMetamodel(curmod?.targetMetamodelRef) || null;
    myTargetMetamodelPalette = (myTargetMetamodel) && uib.buildGoPalette(myTargetMetamodel, myMetis);

    if (debug) console.log('33 LoadMyModeldata ', props, myMetis, myModel, myModelview, myMetamodel);
    if (!myMetis && !myModel && !myModelview && !myMetamodel) {
        console.error('187 One of the required variables is undefined: myMetis: ', myMetis, 'myModel: ', 'myModelview: ', myModelview, 'myMetamodel: ', myMetamodel);
        return null;
    }
    myGoModel = uib.buildGoModel(myMetis, myModel, myModelview, includeDeleted, includeNoObject, showModified) //props.phMyGoModel?.myGoModel
    myGoMetamodel = uib.buildGoMetaPalette() //props.phMyGoMetamodel?.myGoMetamodel
    myGoMetamodelModel = uib.buildGoMetaModel(myMetamodel, includeDeleted, showModified) //props.phMyGoMetamodelModel?.myGoMetamodelModel
    myGoMetamodelPalette = uib.buildGoPalette(myMetamodel, myMetis) //props.phMyGoMetamodelPalette?.myGoMetamodelPalette
    myGoObjectPalette = (myModel?.objects) ? uib.buildObjectPalette(myModel?.objects, myMetis) : [] //props.phMyGoObjectPalette?.myGoObjectPalette
    if (!myModel?.objects) {
        console.log('196 myModel.objects is undefined', myMetis);
        // return null
    } else { myGoObjectPalette = uib.buildObjectPalette(myModel.objects, myMetis); }
    if (!myGoObjectPalette) { console.log('202 myGoObjectPalette is undefined after function call'); }
    // myGoRelshipPalette = uib.buildRelshipPalette(myModel?.relships, myMetis) //props.phMyGoRelshipPalette?.myGoRelshipPalette  Todo: build this
    if (debug) console.log('188 LoadMyModeldata ', myGoObjectPalette);
    // myMetis?.setGojsModel(myGoModel);
    // myMetis?.setCurrentMetamodel(myMetamodel);
    // myMetis?.setCurrentModel(myModel);
    // myMetis?.setCurrentModelview(myModelview);
    // (myTargetModel) && myMetis?.setCurrentTargetModel(myTargetModel);

    // (myTargetModelview) && myMetis?.setCurrentTargetModelview(myTargetModelview);

    // set the gojs objects from the myMetis objects
    gojsmetamodelpalette = (myGoMetamodel) && { nodeDataArray: myGoMetamodel?.nodes, linkDataArray: myGoMetamodel?.links }  // props.phGojs?.gojsMetamodelPalette 
    gojsmetamodelmodel = (myGoMetamodelModel) && { nodeDataArray: myGoMetamodelModel?.nodes, linkDataArray: myGoMetamodelModel?.links }
    gojsmodel = (myGoModel) && { nodeDataArray: myGoModel.nodes, linkDataArray: myGoModel.links }
    gojsmetamodel = (myGoMetamodelPalette) && { nodeDataArray: myGoMetamodelPalette?.nodes, linkDataArray: myGoMetamodelPalette?.links }// props.phGojs?.gojsMetamodel 
    gojsmodelobjects = (myGoModel) && { nodeDataArray: myGoObjectPalette, linkDataArray: myGoRelshipPalette || [] } // props.phGojs?.gojsModelObjects // || []
    gojstargetmodel = (myTargetModel) && { nodeDataArray: myGoModel.nodes, linkDataArray: myGoModel.links }//props.phGojs?.gojsTargetModel 
    gojstargetmetamodel = (myTargetMetamodel) && { nodeDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).nodes, linkDataArray: uib.buildGoPalette(myTargetMetamodel, myMetis).links } // props.phGojs?.gojsTargetMetamodel || [] // this is the generated target metamodel

    const allprops ={
        myMetis: myMetis,
        myModel: myModel,
        myModelview: myModelview,
        myMetamodel: myMetamodel,
        myTargetModel: myTargetModel,
        myTargetModelview: myTargetModelview,
        myTargetMetamodel: myTargetMetamodel,
        myTargetMetamodelPalette: myTargetMetamodelPalette,
        myGoModel: myGoModel,
        myGoMetamodel: myGoMetamodel,
        myGoMetamodelModel: myGoMetamodelModel,
        myGoMetamodelPalette: myGoMetamodelPalette,
        myGoObjectPalette: myGoObjectPalette,
        myGoRelshipPalette: myGoRelshipPalette,
        gojsmetamodelpalette: gojsmetamodelpalette,
        gojsmetamodelmodel: gojsmetamodelmodel,
        gojsmodel: gojsmodel,
        gojsmetamodel: gojsmetamodel,
        gojsmodelobjects: gojsmodelobjects,
        gojstargetmodel: gojstargetmodel,
        gojstargetmetamodel: gojstargetmetamodel,
    };

    if (debug) console.log('91 LoadMyModeldata ', allprops);

    return (
        {allprops}
    )
    
};
