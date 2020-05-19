import { SET_FOCUS_OBJECT } from '../actions/types';

export const InitialState = {
  phFocus: null
}

function focusReducer(state = InitialState, action) {
  switch (action.type) {
    case SET_FOCUS_OBJECT:  
      return {
        ...state,
        ...{ focusData: action.data }
      }

    default:
      return state
  }
}

export default focusReducer
