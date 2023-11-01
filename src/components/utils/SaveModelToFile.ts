// @ts-nocheck

const debug = false

// safely handles circular references
JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
};

export const SaveModelviewToFile = (model, name, type) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName = (name.includes('_MV')) ? name : name+type //+'_'+today;
    const json = JSON.safeStringify(model);
    const blob = new Blob([json], {type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const SaveModelToFile = (model, name, type) => {
    const fileName = (name.includes('_MO')) ? name : name+type 
    const json = JSON.safeStringify(model);
    const blob = new Blob([json], {type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export const SaveMetamodelToFile = (metamodel, name, type) => {
    const fileName = (name.includes('_MM')) ? name : name+type 
    const json = JSON.safeStringify(metamodel);
    const blob = new Blob([json], {type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export const SaveAllToFile = (data, name, type) => {
    const fileName = (name.includes('_PR')) ? name : name+type 
    if (debug) console.log('69 SaveModelToFile', data, fileName);
    // const json = JSON.stringify(data);
    const json = JSON.safeStringify(data);
    if (debug) console.log('72 SaveModelToFile', json);
    const blob = new Blob([json],{type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const SaveAllToFileDate = (data, name, type) => {
    const today = new Date().toISOString().slice(0, 10)
    // const today = new Date().toISOString().slice(0, 19)
    const fileName = (name.includes('_PR')) ? name+'_'+today : name+type+'_'+today;
    if (debug) console.log('88 SaveModelToFile', data, fileName);
    const json = JSON.safeStringify(data);
    const blob = new Blob([json],{type:'application/json'});
    const href = URL.createObjectURL(blob);
    // const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const SaveModelviewToSvgFile = (svgString, filename) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName =  `${filename}` //+'_'+today;
   
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    console.log('105 SaveModelviewToSvgFileAuto',  fileName)
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".svg";
    document.body.appendChild(link);
    link.click();
}


         // const existsMetamodel = props.phData?.metis?.metamodels.find(m => m.id === modelff?.metamodelRef)
        // console.log('106 SaveModelToFile', existsMetamodel, props.phData?.metis?.metamodels, modelff?.metamodelRef)
        // if (mindex < 0) { mindex = mlength  // mindex = -1, i.e.  not fond, which means adding a new model
        // if (!existsMetamodel) {
        //         console.log('111 SaveModelToFile', existsMetamodel)
        //         const r = (window.confirm('The metamodel for this model does not exist. Please load the metamodel first.'))
        //         if (r === true) { return null }
        //     }
        // } else { // model already exists, ask if to replace
            // console.log('116 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)

            // const r = window.confirm("Model already exists! Existing: "+props.phData?.metis?.models[mindex].name+" New: "+modelff?.name+" Do you want to replacen and overwrite it?")
            // // const r = window.confirm("Model already exists, do you want to replace it?")
            // if (r === false) { //  add model
            //     // change model id
            //     modelff.id = modelff.id + mlength
            //     mindex = mlength
            //     console.log('124 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)
            // }
        // }
        // let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
        // if (fmindex < 0) { fmindex = mlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
        
        // if (debug) console.log('130 SaveModelToFile', props.phFocus.focusModel?.id, modelff, mindex, mlength, fmindex);
        // let mvindex, mvlength
        // if (modelff.modelview) {
        //     mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
        //     mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
        //     if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
        // }
        // if (debug) console.log('138 SaveModelToFile', mvindex, mvlength);