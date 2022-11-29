import { createStore, applyMiddleware, compose } from "redux";
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from "redux-devtools-extension";
import { createWrapper } from "next-redux-wrapper";
import thunk from "redux-thunk";
import rootReducer from "./reducers";
import rootSaga from './saga'

// initial states here
const initalState = {};

// middleware
const middleware = [thunk];
// const sagaMiddleware = createSagaMiddleware()

// const middleware = [sagaMiddleware]

// const makeStore = () => createStore(rootReducer, initalState, compose(applyMiddleware(...middleware)));
// const makeStore = () => createStore( rootReducer, initalState, composeWithDevTools(applyMiddleware(...middleware)));

// const bindMiddleware = middleware => {
//   if (process.env.NODE_ENV !== 'production') {
//     const { composeWithDevTools } = require('redux-devtools-extension')
//     return composeWithDevTools(applyMiddleware(...sagaMiddleware))
//   }
//   return applyMiddleware(...sagaMiddleware)
// }



const makeStore = () =>  createStore(rootReducer, compose(applyMiddleware(...middleware)));


console.log('32 Store', makeStore())

// assigning store to next wrapper
// export const wrapper = createWrapper(makeStore, { debug: true });

export const wrapper = createWrapper(makeStore);