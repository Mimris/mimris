
import { useDispatch } from 'react-redux';
// import { loadState } from './LocalStorage'


const DispatchFromLocalStore = (props) => {
  const dispatch = useDispatch()
  const locState = props
  console.log('9 modelling', locState.phSource);
  if (locState) {
    const phData = locState.phData
    const phFocus = locState.phFocus
    const phUser = locState.phUser
    const phSource = locState.phSource
    // console.log('15 DispatchFromLocalStore', phData, phFocus, phUser, phSource);

    if (phData && phFocus && phUser && phSource) {
      let data = phData
      dispatch({ type: 'LOAD_TOSTORE_PHDATA', data })
      data = phFocus
      dispatch({ type: 'LOAD_TOSTORE_PHFOCUS', data })
      data = phUser
      dispatch({ type: 'LOAD_TOSTORE_PHUSER', data })
      data = phSource
      dispatch({ type: 'LOAD_TOSTORE_PHSOURCE', data })
    } 
  }
} 
export default DispatchFromLocalStore;



