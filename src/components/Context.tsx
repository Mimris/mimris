
import React, { useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Selector from './utils/Selector'


const Context = (props) => {

    let state = useSelector((state:any) => state) // Selecting the whole redux store
    if (!state.phData?.metis?.models) return <></>
    const dispatch = useDispatch()

    // set timeout to allow for redux store to be updated
    // setTimeout(() => {
    //   if (debug) console.log('17 SelectContext', state);
    // }, 1000);
    
    // if (debug) console.log('15 state', state);
  
   

  
    // if no state then exit
    const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
    const focusModel = useSelector(focusModel => state.phFocus?.focusModel) 
    const focusUser = useSelector(focusUser => state.phUser?.focusUser)
    const focusModelview = useSelector(focusModelview => state.phFocus?.focusModelview)
    const models = useSelector(models =>  state.phData?.metis?.models)  // selecting the models array
  
    // const [model, setModel] = useState(focusModel)
    // if (debug) console.log('23 focusModel', focusModel, models);
    
    const curmodel = models?.find((m: any) => m?.id === focusModel?.id) || models[0]
    const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
    const objects = curmodel?.objects //.map((o: any) => o)
    // const objectviews = curmodel?.objectviews //.map((o: any) => o)
    
    // find object with type
    const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews || []
    // if (debug) console.log('25 Sel', curmodel, modelviews, objects, objectviews);
    
    // remove duplicate objects
    const uniqueovs = objectviews?.filter((ov, index, self) =>
      index === self.findIndex((t) => (
        t.place === ov.place && t.id === ov.id
      ))
    ) || []
    const curmm = metamodels?.find(mm => (mm) && mm.id === (curmodel?.metamodelRef))
    
    // find object with type
    const type = (metamodels, model, objects, curov) => {                                                                                                                                                                                          
      const mmod = metamodels?.find(mm => (mm) && mm.id === model.metamodelRef)
      const o = objects.find(o => o.id === curov.objectRef)
      // if (debug) console.log('37 SelectContext :', curov.objectRef, objects, o, mmod.objecttypes.find(ot => ot.id === o?.typeRef === ot.id));
      const type = mmod?.objecttypes?.find(ot => ot.name && o?.typeRef === ot.id)?.name
      // if (debug) console.log('43 SelectContext', mmod.objecttypes.name, o, type);
      return type
    }

    const selroles = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Role')
    const seltasks = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Task')
    const selorgs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Organisation')
    // const selprojs = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Projects')
    const selobjviews = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) != null)
    const selPers = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Person')
    const selproperties = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Property')
    const selInfo = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Information')


    return (
        <div className="select bg-light pt-0 ">
        <Selector key='Tab' type='SET_FOCUS_TAB' selArray={seltasks} selName='Tab' focustype='focusTab' />
        <Selector key='Task' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' />
        <Selector key='Role'  type='SET_FOCUS_ROLE' selArray={selroles} selName='Roles' focustype='focusRole' />
        {/* <Selector key='Tab'  type='SET_FOCUS_ROLE' selArray={selroles} selName='Roles' focustype='focusRole' /> */}
        {/* <Selector key={selName}  type='SET_FOCUS_ORG' selArray={selorgs} selName='Orgs' focustype='focusOrg'  /> */}
        {/* <Selector key={selName} ' type='SET_FOCUS_ORG' selArray={selorgs} selName='Orgs' focustype='focusOrg' focus={state.phFocus.focusOrg.name} /> */}
        {/* <Selector key={selName}  type='SET_FOCUS_PROJ' selArray={selprojs} selName='Projects' focustype='focusProj' /> */}
        {/* <Selector type='SET_FOCUS_PROJ' selArray={seloprojs} selName='Projects' focustype='focusProj' /> */}
        <Selector key='Objectview'  type='SET_FOCUS_OBJECTVIEW' selArray={selobjviews} selName='Object(view)' focustype='focusObjectview'/>
        {/* <hr style={{ borderTop: "1px solid #8c8b8" , backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} /> */}
        {/* <h6>Model repository (Firebase) </h6> */}
        <hr style={{ backgroundColor: "#ccc", padding: "1px", marginTop: "5px", marginBottom: "0px" }} />
      </div>
    )

}
export default Context  