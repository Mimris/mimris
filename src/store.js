// not in use have to fix combinereducers
import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { createWrapper } from 'next-redux-wrapper'

import reducer, { InitialState } from './reducers/reducer'

import rootSaga from './saga'
// import { InitialState } from './reducers/focusReducer';


const bindMiddleware = middleware => {
  if (process.env.NODE_ENV !== 'production') {
    const { composeWithDevTools } = require('redux-devtools-extension')
    return composeWithDevTools(applyMiddleware(...middleware))
  }
  return applyMiddleware(...middleware)
}

// const makeStore = () => configureStore()

// function configureStore(initialState=InitialState) {

  const sagaMiddleware = createSagaMiddleware()
  const makeStore = () => {
    const store = createStore(reducer, InitialState, bindMiddleware([sagaMiddleware]))
    store.sagaTask = sagaMiddleware.run(rootSaga)
    return store
  }
  // const createAppStore = () => {
  //     createStore(
  //       reducer, 
  //       initialState, 
  //       bindMiddleware([sagaMiddleware])
  //     )
  //   // const store = createStore(
  //   //   reducer,
  //   //   initialState,
  //   //   bindMiddleware([sagaMiddleware])
  //   // )

  //   sagaMiddleware.run(rootSaga)
  //   // console.log('27', store.sagaTask);
    
  //   return makeStore
  // }

export const  wrapper = createWrapper(makeStore)
// export default configureStore
