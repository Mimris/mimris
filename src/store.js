import { createStore, applyMiddleware, compose } from "redux";
import { createWrapper } from "next-redux-wrapper";
import createSagaMiddleware from "redux-saga";
import reducer, { InitialState } from "./reducers/reducer";
import rootSaga from "./saga";

const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== "production") {
    const { composeWithDevTools } = require("@redux-devtools/extension");
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return compose(applyMiddleware(...middleware));
};

const configureStore = (initialState = InitialState) => {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    reducer,
    initialState,
    bindMiddleware([sagaMiddleware])
  )
  store.sagaTask = sagaMiddleware.run(rootSaga)
  // console.log('27', store);
  return store
}

const makeStore = () => configureStore()

export const wrapper = createWrapper(configureStore)


// // not in use have to fix combinereducers
// import { applyMiddleware, createStore } from 'redux'
// import createSagaMiddleware from 'redux-saga'

// import reducer, { InitialState } from './reducers/reducer'

// import rootSaga from './saga'
// // import { InitialState } from './reducers/focusReducer';


// const bindMiddleware = middleware => {
//   if (process.env.NODE_ENV !== 'production') {
//     const { composeWithDevTools } = require('redux-devtools-extension')
//     return composeWithDevTools(applyMiddleware(...middleware))
//   }
//   return applyMiddleware(...middleware)
// }

// function configureStore(initialState=InitialState) {
//   const sagaMiddleware = createSagaMiddleware()
//   const store = createStore(
//     reducer,
//     initialState,
//     bindMiddleware([sagaMiddleware])
//   )
//   store.sagaTask = sagaMiddleware.run(rootSaga)
//   // console.log('27', store.sagaTask);
  
//   return store
// }

// export default configureStore
