
import { useDispatch } from 'react-redux';
import { loadLegacyUniverseSnapshot } from '../../sharedUniverse';
// import { loadState } from './LocalStorage'


const DispatchFromLocalStore = (props: any) => {
  const dispatch = useDispatch()
  const locState = props
  // console.log('9 modelling', locState.phSource);
  if (locState) {
    const phData = locState.phData
    const phFocus = locState.phFocus
    const phUser = locState.phUser
    const phSource = locState.phSource
    // console.log('15 DispatchFromLocalStore', phData, phFocus, phUser, phSource);

    if (phData && phFocus && phUser && phSource) {
      dispatch(loadLegacyUniverseSnapshot({ phData, phFocus, phUser, phSource }))
    } 
  }
} 
export default DispatchFromLocalStore;


