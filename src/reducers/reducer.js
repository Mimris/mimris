import { FAILURE } from '../actions/types';
import startupSnapshot from '../startupModel/Mimris-template_PR.json';

const snapshot = JSON.parse(JSON.stringify(startupSnapshot));
export const InitialState = {
  phData: snapshot.phData,
  phFocus: snapshot.phFocus,
  phUser: snapshot.phUser,
  phSource: snapshot.phSource,
  lastUpdate: new Date().toISOString(),
};

/** Host error compatibility only. Mutable editor runtime is instance-owned. */
export default function reducer(state = InitialState, action) {
  if (action.type === FAILURE) return { ...state, error: action.error };
  return state;
}
