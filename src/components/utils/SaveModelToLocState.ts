const debug = false;

// export const SaveModelToLocState = (props, memoryLocState) => {
export const SaveModelToLocState = (props, memoryLocState, setMemoryLocState) => {

    if (!debug) console.log('6 SaveModelToLocState', props, );


    // check if focusModel exists in one of the current models. If not, set it to the first model
    let found = false;
    let localfocusModel
    let localfocusModelview
    for (let i = 0; i < props.phData?.metis.models.length; i++) {
        if (props.phFocus.focusModel?.id === props.phData?.metis.models[i]) {
            found = true;
            break;
        }
    }
    if (!found) {
        localfocusModel = {id: props.phData?.metis.models[0].id, name: props.phData?.metis.models[0].name};


        // Check if focusModelview exists in one of the current modelviews. If not, set it to the first modelview
        found = props.phData?.metis.models[0].modelviews.some((modelview: any) => {
            return props.phFocus.focusModelview.id === modelview.id;
        });

        if (!found) {
            localfocusModelview = { id: props.phData?.metis.models[0].modelviews[0].id, name: props.phData?.metis.models[0].modelviews[0].name };
        }
    }

    if (debug) console.log('24 SaveModeltoLocState ', props.phFocus.focusModel, props.phData?.metis.models)
    let locState
    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
        let mdata = (memoryLocState && Array.isArray(memoryLocState)) 
            ? [{phData: props.phData, phFocus: {
                ...props.phFocus,
                focusModel: localfocusModel,
                focusModelview: localfocusModelview,
            }, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] 
            : [{phData: props.phData, phFocus: props.phfocus, phSource: props.phSource, phUser: props.phUser}];
        if (debug) console.log('53 SaveModeltoLocState', mdata);
        // if mdata is longer than 10, remove the last 2 elements
        if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
        if (debug) console.log('57 SaveModeltoLocState', mdata);
        if (typeof window !== 'undefined') locState = mdata // Save Project to Memorystate in LocalStorage at every refresh
    } else {
        if (debug) console.log('60 SaveModeltoLocState', props.phFocus);
        locState = [{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}] // Save Project to Memorystate in LocalStorage at every refresh
    }
    if (!debug) console.log('52 SaveModeltoLocState', locState);
    return locState;
}