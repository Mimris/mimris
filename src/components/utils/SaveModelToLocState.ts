    
const debug = false;

export const SaveModelToLocState = (props, memoryLocState, setMemoryLocState) => {

    if (!debug) console.log('72 Modelling refresh', props);

    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
        // set focusOrg and focusProj to focusProj.org and focusProj.proj
        if (props.phFocus.focusOrg.name !== props.phFocus.focusProj.org ) {
            props.phFocus.focusOrg = props.phFocus.focusProj.org || props.phFocus.focusOrg
        }
        if (props.phFocus.focusProj.name !== props.phFocus.focusProj.proj) {
            props.phFocus.focusProj = props.phFocus.focusProj.proj || props.phFocus.focusProj
        }
        // check if focusModel exists in one of the current models. If not, set it to the first model
        let found = false;
        for (let i = 0; i < props.phData?.metis.models.length; i++) {
        if (props.phFocus.focusModel?.id === props.phData?.metis.models[i]) {
            found = true;
            break;
        }
        }
        if (debug) console.log('89 Modelling found', found, props.phFocus.focusModel, props.phData?.metis.models)
        if (!found) {
            props.phFocus.focusModel = props.phData?.metis.models[0]
            // check if focusModelview exists in one of the current modelviews. If not, set it to the first modelview
            found = false;
            props.phData?.metis.models[0].modelviews.map ((modelview:any) => { 
                if (props.phFocus.focusModelview.id === modelview.id) {
                found = true;
                }
            })
            if (!found) {
                props.phFocus.focusModelview = props.phData?.metis.models[0].modelviews[0]
            }
        }
        // put currentdata in the first position of the array data
        let mdata = (memoryLocState && Array.isArray(memoryLocState)) ? [{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] : [{phData: props.phData, phFocus: props.phFocus,phSource: props.phSource, phUser: props.phUser}];
        if (!debug) console.log('84 Modelling save memoryState', mdata);
        // if mdata is longer than 10, remove the last 2 elements
        if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
        if (mdata.length > 2) { mdata.pop() }
        if (debug) console.log('88 Modelling refresh', mdata);
        (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    } else {
        if (!debug) console.log('91 Modelling refresh', props);
        setMemoryLocState([{phData: props.phData, phFocus: props.phFocus,phSource: props.phSource, phUser: props.phUser}]) // Save Project to Memorystate in LocalStorage at every refresh
    }
}