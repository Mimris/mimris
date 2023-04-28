const debug = false;

export const SaveModelToLocState = (props, memoryLocState, setMemoryLocState) => {

    if (debug) console.log('6 SaveModelToLocState', props, );
    const localprops = props;

    // check if focusModel exists in one of the current models. If not, set it to the first model
    let found = false;
    for (let i = 0; i < localprops.phData?.metis.models.length; i++) {
        if (localprops.phFocus.focusModel?.id === localprops.phData?.metis.models[i]) {
            found = true;
            break;
        }
    }
    if (!found) {
        localprops.phFocus.focusModel = localprops.phData?.metis.models[0];

        // Check if focusModelview exists in one of the current modelviews. If not, set it to the first modelview
        found = localprops.phData?.metis.models[0].modelviews.some((modelview: any) => {
            return localprops.phFocus.focusModelview.id === modelview.id;
        });

        if (!found) {
            localprops.phFocus.focusModelview = localprops.phData?.metis.models[0].modelviews[0];
        }
    }

    if (debug) console.log('24 SaveModeltoLocState ', localprops.phFocus.focusModel, localprops.phData?.metis.models)

    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
        let mdata = (memoryLocState && Array.isArray(memoryLocState)) 
            ? [{phData: localprops.phData, phFocus: localprops.phFocus, phSource: localprops.phSource, phUser: localprops.phUser}, ...memoryLocState] 
            : [{phData: localprops.phData, phFocus: localprops.phfocus, phSource: localprops.phSource, phUser: localprops.phUser}];
        if (debug) console.log('53 SaveModeltoLocState', mdata);
        // if mdata is longer than 10, remove the last 2 elements
        if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
        if (debug) console.log('57 SaveModeltoLocState', mdata);
        (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    } else {
        if (debug) console.log('60 SaveModeltoLocState', localprops.phFocus);
        setMemoryLocState([{phData: localprops.phData, phFocus: localprops.phFocus, phSource: localprops.phSource, phUser: localprops.phUser}]) // Save Project to Memorystate in LocalStorage at every refresh
    }
}