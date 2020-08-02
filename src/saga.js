import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects';
// import keepAlive from 'redux-saga-restart';
import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
import { failure, loadDataSuccess } from './actions/actions';
import { LOAD_DATA, FAILURE } from './actions/types';
es6promise.polyfill()

function * loadDataSaga() {
  // console.log('10 Saga', document.cookie);
  
  function getCookie(cname) {
    var name = cname + "=";
    
    var decodedCookie = decodeURIComponent(document.cookie);
    // console.log('14 saga', decodedCookie);
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
  // console.log('27 saga');
  // const cookies = document.cookie
  // const localhost = 'https://akmserver.herokuapp.com/'
  const localhost = 'http://localhost:4000/'
  const _crf = getCookie("XSRF-TOKEN") || "";
  const _csrf = getCookie("_csrf") || "";
  const sessionCookie = getCookie("session") || "";
  // console.log('35 saga', _crf);
  // console.log('36 saga', sessionCookie);
  // console.log('37 saga', _csrf);

  try {
    let res = ''
    // console.log('42 test');
    
    res = yield fetch(`${localhost}akmmodels/`,
      {
        mode: 'no-cors',
        // mode: 'cors',
        // method: "GET",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true, 
          // 'Accept': 'application/json', //text/html',
          'Content-Type': 'application/json',
          'Cookie':`_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`,
          'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.',
          "Access-Control-Allow-Credentials": 'include', 
          // 'Cache': 'no-cache' // This is set on request
        },
        // credentials: 'same-origin'
        credentials: 'include'
      }
    )
    // res.then(res => res.txt()).then(console.log)
    console.log('61 saga fetch()', yield res.clone());
    // console.log('62 saga', yield res.clone().json()); 
    const metis = yield res.clone().json()
    console.log('63 Saga', metis);
    
    // const phData = yield {  metis  }
    yield put(loadDataSuccess({ metis }))


  } catch (err) {
    console.log('72 saga', failure(err));  
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


// headers: {
//   "Access-Control-Allow-Origin": "*",
//     'Accept': 'application/json',
//       'Content-Type': 'application/json',
//         '_csrf': `${_csrf}`,
//           'session': `${sessionCookie}`,
//             'XSRF-TOKEN': `${_crf}`,
//               // 'CSRF-Token': `${_crf}`, // This is set on request
//               // 'Cache': 'no-cache' // This is set on request
//               'credentials': 'same-origin', // This is set on request
//       },
