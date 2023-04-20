    
const debug = false;

export const SaveModelToLocState = (props, memoryLocState, setMemoryLocState) => {

    if (debug) console.log('6 SaveModelToLocState', props, memoryLocState);
    let focusOrg, focusProj, focusModelv;

    // set focusOrg and focusProj to focusProj.org and focusProj.proj
    // if (props.phFocus.focusOrg.name !== props.phFocus.focusProj.org ) {
    //     focusOrg = props.phFocus.focusProj.org 
    // }
    // if (props.phFocus.focusProj.name !== props.phFocus.focusProj.proj) {
    //     focusProj = props.phFocus.focusProj.proj 
    // }
    // check if focusModel exists in one of the current models. If not, set it to the first model
    let found = false;
    for (let i = 0; i < props.phData?.metis.models.length; i++) {
    if (props.phFocus.focusModel?.id === props.phData?.metis.models[i]) {
        found = true;
        break;
    }
    }
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
            focusModelv = props.phData?.metis.models[0].modelviews[0]
        }
    }
    if (debug) console.log('24 SaveModeltoLocState ',focusOrg, focusProj, props.phFocus.focusModel, props.phData?.metis.models)

    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
        let mdata = (memoryLocState && Array.isArray(memoryLocState)) 
            ? [{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] 
            : [{phData: props.phData, phFocus: props.phfocus, phSource: props.phSource, phUser: props.phUser}];
        if (debug) console.log('53 SaveModeltoLocState', mdata);
        // if mdata is longer than 10, remove the last 2 elements
        if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
        if (mdata.length > 2) { mdata.pop() }
        if (debug) console.log('57 SaveModeltoLocState', mdata);
        (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    } else {
        if (debug) console.log('60 SaveModeltoLocState', props.phFocus);
        setMemoryLocState([{phData: props.phData, phFocus: props.phFocus, phSource: props.phSource, phUser: props.phUser}]) // Save Project to Memorystate in LocalStorage at every refresh
    }

    //copy phFocus.focusUser to akmmUser
    // if (props.phFocus.focusUser) {
    //     props.setAkmmUser(props.phFocus.focusUser)
    // }
}