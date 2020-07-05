import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects';
// import keepAlive from 'redux-saga-restart';
import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
import { failure, loadDataSuccess } from './actions/actions';
import { LOAD_DATA, FAILURE } from './actions/types';
es6promise.polyfill()

function * loadDataSaga() {
  // const cookies = document.cookie
  // const localhost = 'https://akmserver.herokuapp.com/'
  const localhost = 'http://localhost:4000/'
  try {
    let res = ''
    res = yield fetch(`${localhost}akmmodels`,
    {
      // mode: 'no-cors',
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const metis = yield res.json()
    // const phData = yield {  metis  }
    // console.log('56 saga', yield metis); 
    yield put(loadDataSuccess({ metis }))
  } catch (err) {
    console.log('59 saga', failure(err));  
    yield put(failure(err))
  }
}

function* rootSaga() {
  yield all([
    // console.log('45'),
    
    takeLatest(LOAD_DATA, loadDataSaga)
    // take(LOAD_DATA, loadDataSaga)
  ])
}

export default rootSaga