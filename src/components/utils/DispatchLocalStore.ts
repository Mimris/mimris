
import { useDispatch } from 'react-redux';
import { loadState } from '../../components/utils/LocalStorage'


const DispatchLocalStore = () => {
  const dispatch = useDispatch()
  const locState = loadState()
  // console.log('9 modelling', locState);
  if (loadState()) {
    const phData = locState.phData
    const phFocus = locState.phFocus
    const phUser = locState.phUser
    const phSource = locState.sourceFlag
    // console.log('15 modelling', phData, phFocus, phUser, phSource);

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
export default DispatchLocalStore;



