// @ts-nocheck

const debug = false

export const SaveModelToFile = (model, name, type) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName = type+"_"+name+'_'+today;
  
    const json = JSON.stringify(model);
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
export const SaveAllToFile = (model, name, type) => {
    const today = new Date().toISOString().slice(0, 19)
    const fileName = type+"_"+name+'_'+today;
    if (debug) console.log('22 LoadLocal', model, fileName);
  
    const json = JSON.stringify(model);
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
    reader.onload = async (e) => { 
        const text = (e.target.result)
        const modelff = JSON.parse(text)

        //   alert(text)
        if (debug) console.log('44 SaveModelToFile', props, modelff);
    
        let  mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        const mlength = props.phData?.metis?.models.length
        if (mindex < 0) { mindex = mlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        if (debug) console.log('49 SaveModelToFile', modelff, mindex, mlength);
        let data
        if (modelff.phData) {
            data = {
                phData:   modelff.phData,
                phFocus:  modelff.phFocus,
                phUser:   modelff.phUser,
                phSource: 'fromFile'
              }
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
                            ...props.phData.metis.models.slice(mindex + 1, props.phData.metis.models.length),
                        ],
                    },
                }, 
            };
        }
        if (!debug) console.log('77 SaveModelToFile', data);      
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
        dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data: data.phFocus })
        dispatch({ type: 'LOAD_TOSTORE_PHUSER', data: data.phUser })
        dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data: data.phSource })
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
        
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }