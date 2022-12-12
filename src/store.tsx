
import {createStore, applyMiddleware, Store} from 'redux';
import logger from 'redux-logger';
import createSagaMiddleware, {Task} from 'redux-saga';
import {Context, createWrapper} from 'next-redux-wrapper';
import reducer from './reducers/reducer'
import rootSaga from './saga';

export interface SagaStore extends Store {
    sagaTask: Task;
}

export const makeStore = (context: Context) => {
    // 1: Create the middleware
    const sagaMiddleware = createSagaMiddleware();

    // 2: Add an extra parameter for applying middleware:
    const store = createStore(reducer, applyMiddleware(sagaMiddleware));
    // const store = createStore(reducer, applyMiddleware(sagaMiddleware, logger));

    // 3: Run your sagas on server
    (store as SagaStore).sagaTask = sagaMiddleware.run(rootSaga);

    // 4: now return the store:
    return store;
};

export const wrapper = createWrapper<SagaStore>(makeStore as any);

// import { applyMiddleware, createStore } from 'redux'
// import createSagaMiddleware from 'redux-saga'
// import { createWrapper } from 'next-redux-wrapper'

// import rootReducer from './reducers/reducer'
// import rootSaga from './saga'

// const bindMiddleware = (middleware) => {
//   if (process.env.NODE_ENV !== 'production') {
//     const { composeWithDevTools } = require('redux-devtools-extension')
//     return composeWithDevTools(applyMiddleware(...middleware))
//   }
//   return applyMiddleware(...middleware)
// }

// export const makeStore = () => {
//   const sagaMiddleware = createSagaMiddleware()
//   const store = createStore(rootReducer, bindMiddleware([sagaMiddleware]))

//   store.sagaTask = sagaMiddleware.run(rootSaga)

//   return store
// }

// export const wrapper = createWrapper(makeStore, { debug: true })





// import { createStore, applyMiddleware, compose } from "redux";
// import { createWrapper } from "next-redux-wrapper";
// import createSagaMiddleware from "redux-saga";
// import reducer, { InitialState } from "./reducers/reducer";
// import rootSaga from "./saga";

// const bindMiddleware = (middleware) => {
//   if (process.env.NODE_ENV !== "production") {
//     const { composeWithDevTools } = require("@redux-devtools/extension");
//     return composeWithDevTools(applyMiddleware(...middleware));
//   }
//   return compose(applyMiddleware(...middleware));
// };

// const configureStore = (initialState = InitialState) => {
//   const sagaMiddleware = createSagaMiddleware()
//   const store = createStore(
//     reducer,
//     initialState,
//     bindMiddleware([sagaMiddleware])
//   )
//   store.sagaTask = sagaMiddleware.run(rootSaga)
//   // console.log('27', store);
//   return store
// }

// const makeStore = () => configureStore()

// export const wrapper = createWrapper(configureStore)


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
