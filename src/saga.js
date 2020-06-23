import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects';
// import keepAlive from 'redux-saga-restart';
import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
import { failure, loadDataSuccess } from './actions/actions';
import { LOAD_DATA, FAILURE } from './actions/types';
es6promise.polyfill()

function * loadDataSaga() {
  console.log('10', document.cookie);
  
  function getCookie(cname) {
    var name = cname + "=";
    
    var decodedCookie = decodeURIComponent(document.cookie);
    console.log('14 saga', decodedCookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  console.log('27 saga');
  // const cookies = document.cookie
  // const localhost = 'https://akmserver.herokuapp.com/'
  const localhost = 'http://localhost:4000/'
  const _crf = getCookie("XSRF-TOKEN") || "";
  const sessionCookie = getCookie("session") || "";
  console.log('33 saga', sessionCookie);
  console.log('34 saga', _crf);

  
  try {
    let res = ''
    res = yield fetch(`${localhost}akmmodels`,
    {
      mode: 'no-cors',
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': `${sessionCookie}`,
        'CSRF-Token': `${_crf}`, // This is set on request
        // 'Cache': 'no-cache' // This is set on request
        // 'credentials': 'same-origin', // This is set on request
        // 'Cookie': `${sessionCookie}` // This is missing from request
      },
      credentials: 'same-origin'
      // credentials: 'include'
    })
    const metis = yield res.json()
    // const phData = yield {  metis  }
    console.log('56 saga', yield metis); 
    yield put(loadDataSuccess({ metis }))
  } catch (err) {
    console.log('59 saga', failure(err));  
    yield put(failure(err))
  }
}

function* rootSaga() {
  yield all([
    console.log('45'),
    
    takeLatest(LOAD_DATA, loadDataSaga)
    // take(LOAD_DATA, loadDataSaga)
  ])
}

export default rootSaga