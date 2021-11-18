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
export const SaveAllToFile = (model, name, type) => {
    const fileName = name;
    if (debug) console.log('22 LoadLocal', model, fileName);
  
    const json = JSON.safeStringify(model);
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
export const SaveAllToFileDate = (model, name, type) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName = name+"_"+type //+'_'+today;
    if (debug) console.log('22 LoadLocal', model, fileName);
  
    const json = JSON.safeStringify(model);
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

export const ReadModelFromFile = async (props, dispatch, e) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.fileName = (e.target.files[0].name)
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)
        const filename = e.target.fileName 

        //   alert(text)
        if (debug) console.log('46 SaveModelToFile', props.phFocus.focusModel.id);
        if (debug) console.log('44 SaveModelToFile', props, modelff);
    
        let  mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        let mlength = props.phData?.metis?.models.length
        if (mindex < 0) { mindex = mlength } // mindex = -1, i.e.  not fond, which means adding a new model
        
        let fmindex = props.phData?.metis?.models?.findIndex(m => m.id === props.phFocus.focusModel?.id) // current focusmodel index
        // if (fmindex < 0) { fmindex = mlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
        
        if (debug) console.log('49 SaveModelToFile', props.phFocus.focusModel?.id, modelff, mindex, mlength, fmindex);
        let mvindex, mvlength
        if (modelff.modelview) {
            mvindex = props.phData?.metis?.models[fmindex]?.modelviews.findIndex(mv => mv.id === modelff.modelview?.id) // current modelview index
            mvlength = props.phData?.metis?.models[fmindex]?.modelviews?.length;
            if (mvindex < 0) { mvindex = mvlength } // mvindex = -1, i.e.  not fond, which means adding a new modelview
        }

        if (debug) console.log('60 SaveModelToFile', mvindex, mvlength);

        let data
        if (modelff.phData) {
            data = {
                phData:   modelff.phData,
                phFocus:  modelff.phFocus,
                phUser:   modelff.phUser,
                phSource: filename,
              }
        } else if (modelff.modelview) {
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
        } else {
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
        if (debug) console.log('77 SaveModelToFile', data);      
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
        if (debug) console.log('25 LoadLocal', props);
        let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('30 LoadLocal', metamodelff, mmindex, mmlength);
        
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
        if (debug) console.log('46 LoadLocal', data);
        
        props.dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }