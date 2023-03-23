    
const debug = false;

export const SaveModelToLocState = (props, memoryLocState, setMemoryLocState) => {

    if (debug) console.log('6 SaveModelToLocState', props, memoryLocState);
    let focusOrg, focusProj, focusModelv;

        // set focusOrg and focusProj to focusProj.org and focusProj.proj
        if (props.phFocus.focusOrg.name !== props.phFocus.focusProj.org ) {
            focusOrg = props.phFocus.focusProj.org 
        }
        if (props.phFocus.focusProj.name !== props.phFocus.focusProj.proj) {
            focusProj = props.phFocus.focusProj.proj 
        }
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
        // if empty, set focusOrg and focusProj to the current focusOrg and focusProj 
        //  and make sure that focusModelview and focusModel are set with only id and name
        const focusFocus1 = {
            ...props.phFocus,
            focusOrg: focusOrg || {id: props.phFocus.focusOrg.id, name: props.phFocus.focusOrg.name},
            focusProj: focusProj || {id: props.phFocus.focusProj.id, name: props.phFocus.focusProj.name},
            focusModelview: {id: props.phFocus.focusModelview.id, name: props.phFocus.focusModelview.name},
            focusModel: {id: props.phFocus.focusModel.id, name: props.phFocus.focusModel.name}
        }
        console.log('47 SaveMod..', focusFocus1)

    if (memoryLocState && Array.isArray(memoryLocState) && memoryLocState.length > 0) {
        let mdata = (memoryLocState && Array.isArray(memoryLocState)) 
            ? [{phData: props.phData, phFocus: focusFocus1, phSource: props.phSource, phUser: props.phUser}, ...memoryLocState] 
            : [{phData: props.phData, phFocus: focusFocus1, phSource: props.phSource, phUser: props.phUser}];
        if (debug) console.log('53 SaveModeltoLocState', mdata);
        // if mdata is longer than 10, remove the last 2 elements
        if (mdata.length > 2) {mdata = mdata.slice(0, 2)}
        if (mdata.length > 2) { mdata.pop() }
        if (debug) console.log('57 SaveModeltoLocState', mdata);
        (typeof window !== 'undefined') && setMemoryLocState(mdata) // Save Project to Memorystate in LocalStorage at every refresh
    } else {
        if (debug) console.log('60 SaveModeltoLocState', props);
        setMemoryLocState([{phData: props.phData, phFocus: focusFocus1, phSource: props.phSource, phUser: props.phUser}]) // Save Project to Memorystate in LocalStorage at every refresh
    }
}