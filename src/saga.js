/* global fetch */

import { all, call, delay, put, take, takeLatest, debounce } from 'redux-saga/effects';
// import keepAlive from 'redux-saga-restart';
import es6promise from 'es6-promise'
import 'isomorphic-unfetch'

import { failure, loadDataSuccess } from './actions/actions';
import { LOAD_DATA, FAILURE } from './actions/types';

es6promise.polyfill()

function * loadDataSaga() {
  try {
    let res = ''
    // res = yield fetch('http://localhost:8080/metismodels',
    // res = yield fetch('http://localhost:4000/akmmodels')
    res = yield fetch('https://akmserver.herokuapp.com/akmmodels')

    const metis = yield res.json()
    // const totdata = { model }
    // console.log('21 saga', metis);
    
    yield put(loadDataSuccess({metis}))

  } catch (err) {
    yield put(failure(err))
  }
}

function * rootSaga() {
  yield all([

    takeLatest(LOAD_DATA, loadDataSaga)
    
    // take(LOAD_DATA, loadDataSaga)
  ])
}

export default rootSaga






   // ,{

    //   headers: {
    //     'mode': 'cors',
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   }
    // }
    // )
    // { mode: 'cors'})
    // { mode: 'cors', headers: 'Access-Control-Allow-Origin'}
    //, dataType: 'json'}
    //.then(res => res.json())
    // *,
      // {
            // {crossDomain: true}
      //   mode: 'no-cors',
      //   headers: {
      //     'Referrer-Policy': '',
      //     'Access-Control-Allow-Origin': '*',
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json',
      //   }
      // }
    // )
    // yield delay(10000);