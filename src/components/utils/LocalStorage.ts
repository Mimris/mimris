export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    // console.log('7 LocalStorage', JSON.parse(serializedState));
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
}; 

export const saveState = (state: any) => {
  try {
    // const state2 = {...state, sourceFlag:'localStore'}
    const serializedState = JSON.stringify(state);
    // console.log('17 LocalStorage', state);
    
    localStorage.setItem('state', serializedState);
  } catch {
    // ignore write errors
    return 'write error'
  }
};