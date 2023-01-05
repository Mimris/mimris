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

export const SaveModelToFile = (model, name, type) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName = name+"_"+type //+'_'+today;
  
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
    const today = new Date().toISOString().slice(0, 19)
    const fileName = (name.includes('_MM')) ? name : name+"_"+type //+'_'+today;
  
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
    const fileName = name;
    if (!debug) console.log('56 LoadLocal', data, fileName);
    // const json = JSON.stringify(data);
    const json = JSON.safeStringify(data);
    if (!debug) console.log('59 LoadLocal', json);
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
    const fileName = name+"_"+type+'_'+today;
    if (debug) console.log('22 LoadLocal', data, fileName);
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

export const ReadModelFromFile = async (props, dispatch, e) => { // Read Project from file
    e.preventDefault()
    const reader = new FileReader()
    reader.fileName = '' // reset fileName
    reader.fileName = (e.target.files[0]?.name)
    console.log('92 ReadModelFromFile', reader.fileName)
    if (!reader.fileName) return null
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)
        const filename = e.target.fileName 

        //   alert(text)
        if (debug) console.log('46 SaveModelToFile', props.phFocus.focusModel.id);
        if (debug) console.log('44 SaveModelToFile', props, modelff);
    
        let mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        let mlength = props.phData?.metis?.models.length
        console.log('104 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)
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

        if (debug) console.log('138 SaveModelToFile', mvindex, mvlength);


        // ---------------------  load Project ---------------------
        console.log('142 SaveModelToFile',  props.phData?.metis, modelff.phData?.metis)
        let data
        if (modelff.phData) { // if modelff has phData, then it is a project file
            console.log('145 SaveModelToFile',  props.phData?.metis, modelff.phData?.metis)
            data = {
                phData:   modelff.phData,
                phFocus:  modelff.phFocus,
                phUser:   modelff.phUser,
                phSource: filename,
              }
        } else if (modelff.modelview) { // if modelff has modelview, then it is a modelview file

            let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
            let mvindex, mvlength
            mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
            if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: props.phData.metis.metamodels,   
                        models: [
                            ...props.phData.metis.models?.slice(0, fmindex),  
                            {  
                                ...props.phData.metis.models[fmindex],
                                modelviews: [ 
                                    ...props.phData.metis.models[fmindex]?.modelviews?.slice(0, mvindex),  
                                    {  
                                        ...props.phData.metis.models[fmindex]?.modelviews[mvindex],  
                                        ...modelff.modelview,
                                    },
                                    ...props.phData.metis.models[fmindex]?.modelviews?.slice(mvindex+1, mvlength),  
                                ],
                            },
                            ...props.phData.metis.models?.slice(fmindex + 1, mlength),
                        ],
                    },
                }, 
            };

        } else if (filename.includes('_MM')) { // if filename contains _MM, then it is a metamodel file
            let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === modelff?.id) // current model index
            const mmlength = props.phData?.metis?.metamodels.length
            if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
            if (debug) console.log('189 LoadLocal', metamodelff, mmindex, mmlength);
            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: [ 
                            ...props.phData.metis.metamodels?.slice(0, mindex),  
                            {  
                                ...props.phData.metis.metamodels[mindex],  
                                ...modelff,
                            },
                            ...props.phData.metis.metamodels?.slice(mindex + 1, mlength),
                        ],
                    },
                }, 
            };    
        } else { // then it is a model file            console.log('116 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)

            const r = window.confirm("Model already exists! Existing: "+props.phData?.metis?.models[mindex]?.name+" New: "+modelff?.name+" Do you want to replace (overwrite it)?")
            // const r = window.confirm("Model already exists, do you want to replace it?")
            if (r === false) { //  add model but change model id
                modelff.id = modelff.id + mlength
                mindex = mlength
                console.log('124 SaveModelToFile', mindex, mlength, modelff?.id, props.phData?.metis?.models[mindex]?.id)
            }


            data = {
                phData: {
                    ...props.phData,
                    metis: {
                        ...props.phData.metis,
                        metamodels: props.phData.metis.metamodels,   
                        models: [
                            ...props.phData.metis.models.slice(0, mindex),     
                            modelff,
                            ...props.phData.metis.models.slice(mindex + 1, mlength),
                        ],
                    },
                }, 
            };
        }
        if (debug) console.log('193 SaveModelToFile', data);      
        if (data.phData)    props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        if (data.phFocus)   props.dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        if (data.phUser)    props.dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        if (data.phSource)  props.dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
    };
    reader.readAsText(e.target.files[0])
  }

export const ReadMetamodelFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const metamodelff = JSON.parse(text)
        //   alert(text)
        if (debug) console.log('155 LoadLocal', props);
        let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('189 LoadLocal', metamodelff, mmindex, mmlength);
        
        const data = {
            phData: {
                ...props.phData,
                metis: {
                    ...props.phData.metis,
                    metamodels: [
                        ...props.phData.metis.metamodels.slice(0, mmindex),     
                        metamodelff,
                        ...props.phData.metis.metamodels.slice(mmindex + 1, props.phData.metis.metamodels.length),
                    ],
                    models: props.phData.metis.models,   
                },
            }, 
        };
        if (debug) console.log('205 LoadLocal', data);
        
        props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }