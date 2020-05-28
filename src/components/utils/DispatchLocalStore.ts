
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
      dispatch({ type: 'SET_FOCUS_PHDATA', data })
      data = phFocus
      dispatch({ type: 'SET_FOCUS_PHFOCUS', data })
      data = phUser
      dispatch({ type: 'SET_FOCUS_PHUSER', data })
      data = phSource
      dispatch({ type: 'SET_FOCUS_PHSOURCE', data })
    } 
  }
} 
export default DispatchLocalStore;



