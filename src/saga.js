import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects';
// import keepAlive from 'redux-saga-restart';
import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
import { failure, loadDataSuccess } from './actions/actions';
import { LOAD_DATA, FAILURE } from './actions/types';
es6promise.polyfill()

function * loadDataSaga() {
  try {
    let res = ''
    // res = yield fetch('http://localhost:8080/metismodels')
    // res = yield fetch('http://localhost:4000/akmmodels',
    res = yield fetch('https://akmserver.herokuapp.com/akmmodels',
    {
      // mode: 'no-cors',
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    const metis = yield res.json()
    // const phData = yield {  metis  }
    // console.log('21', yield metis); 
    yield put(loadDataSuccess({ metis }))
  } catch (err) {
    console.log('32', failure(err));  
    yield put(failure(err))
  }
}

function* rootSaga() {
  yield all([
    takeLatest(LOAD_DATA, loadDataSaga)
    // take(LOAD_DATA, loadDataSaga)
  ])
}

export default rootSaga