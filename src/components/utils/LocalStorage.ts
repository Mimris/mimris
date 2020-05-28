export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
}; 

export const saveState = (state) => {
  try {
    // const state2 = {...state, sourceFlag:'localStore'}
    const serializedState = JSON.stringify(state);
    console.log('17', state);
    
    localStorage.setItem('state', serializedState);
  } catch {
    // ignore write errors
    return 'write error'
  }
};