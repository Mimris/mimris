


export const SaveModelToFile = (model, name, type) => {
    const fileName = type+"-"+name;
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
        console.log('25 LoadLocal', props);
    
        let  mindex = props.phData?.metis?.models?.findIndex(m => m.id === modelff?.id) // current model index
        const mlength = props.phData?.metis?.models.length
        if (mindex < 0) { mindex = mlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        console.log('30 LoadLocal', modelff, mindex, mlength);
        
        const data = {
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
        console.log('46 LoadLocal', data);
        
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
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
        console.log('25 LoadLocal', props);
        let  mmindex = props.phData?.metis?.metamodels?.findIndex(m => m.id === metamodelff?.id) // current model index
        const mmlength = props.phData?.metis?.metamodels.length
        if ( mmindex < 0) { mmindex = mmlength } // ovindex = -1, i.e.  not fond, which means adding a new model
        console.log('30 LoadLocal', metamodelff, mmindex, mmlength);
        
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
        console.log('46 LoadLocal', data);
        
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }