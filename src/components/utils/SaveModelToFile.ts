


export const SaveModelToFile = (model, name) => {
    const fileName = "model-"+name;
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
                    models: [
                        ...props.phData.metis.models.slice(0, mindex),     
                        modelff,
                        ...props.phData.metis.models.slice(mindex + 1, props.phData.metis.models.length),
                    ],
                    metamodels: props.phData.metis.metamodels,   
                },
            }, 
        };
        console.log('46 LoadLocal', data);
        
        dispatch({ type: 'LOAD_TOSTORE_PHDATA', data: data.phData })
    };
    reader.readAsText(e.target.files[0])
  }