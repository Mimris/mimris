// import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects'
// import { actionTypes, failure, loadDataSuccess, tickClock } from './actions'

// function* runClockSaga() {
//   yield take(actionTypes.START_CLOCK)
//   while (true) {
//     yield put(tickClock(false))
//     yield delay(1000)
//   }
// }

// function* loadDataSaga() {
//   try {
//     const res = yield fetch('https://jsonplaceholder.typicode.com/users')
//     const data = yield res.json()
//     yield put(loadDataSuccess(data))
//   } catch (err) {
//     yield put(failure(err))
//   }
// }

// function* rootSaga() {
//   yield all([
//     call(runClockSaga),
//     takeLatest(actionTypes.LOAD_DATA, loadDataSaga),
//   ])
// }

// export default rootSaga

import { all, call, delay, put, take, takeLatest } from 'redux-saga/effects';

import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
import { failure, loadDataSuccess, loadDataModelSuccess, loadDataModelListSuccess } from './actions/actions';
import { LOAD_DATA, LOAD_DATA_GITHUB, LOAD_DATAMODELLIST, LOAD_DATAMODEL, FAILURE } from './actions/types';
es6promise.polyfill()
import { searchGithub } from './components/githubServices/githubService'
// import Cors from 'cors'

// const cors = Cors({
//   methods: ['POST', 'GET', 'HEAD'],
// })

const debug = false
// const akmmhost = 'https://akmserver-eq.herokuapp.com/'  //TODO: put this as a phFocus variable
// const akmmhost = 'https://cors-anywhere.herokuapp.com/https://akmserver-eq.herokuapp.com/'  //TODO: put this as a phFocus variable
const akmmhost = 'http://localhost:4000/'
// const akmmhost = 'https://cors-anywhere.herokuapp.com/http://localhost:4000/'

if (false) {  // comment in for without server login
  // this version is without login
  function * loadDataSaga() {
    try {
      let res = ''  
      res = yield fetch(`${akmmhost}akmmodels/`,
        {
          // mode: 'no-cors',
          headers: {
            // "Access-Control-Allow-Origin": "*",
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      )
      const metis = yield res.clone().json()
      // console.log('63 Saga', metis);
      yield put(loadDataSuccess({ metis }))
    } catch (err) {
      console.log('72 saga', failure(err));  
      yield put(failure(err))
    }
  }
}

// This version is for login server with credential
function getCookie(cname, document) {
  var name = cname + "=";
  if (debug) console.log('40 ',  cname, document.cookie);
  var decodedCookie = decodeURIComponent(document.cookie);
  if (debug) console.log('42', decodedCookie);
  // var decodedCookie = decodeURIComponent(document.cookie);
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

function * loadDataSaga() {
  const _crf = getCookie("XSRF-TOKEN", document) || ""; // comment in for  server login
  const _csrf = getCookie("_csrf", document) || ""; // comment in for  server login
  const sessionCookie = getCookie("session", document) || ""; // comment in for  server login
  try {
    let res = ''  
    res = yield fetch(`${akmmhost}akmmodels/`,
        {
          mode: 'no-cors', // comment in for  server login
          headers: {
            "Access-Control-Allow-Origin": "*", // comment in for  server login
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': `_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`, // comment in for  server login
            "Access-Control-Allow-Credentials": 'include', // comment in for  server login
          },
          credentials: 'include' // comment in for  server login
        }
      )
      const metis = yield res.clone().json()
      console.log('78 Saga', metis);
      yield put(loadDataSuccess({ metis }))
    } catch (err) {
      if (debug) console.log('72 saga', failure(err));  
      yield put(failure(err))
    }
  }

function * loadDataGithubSaga(data) {  // load url-params of data from github
  // url example:  http://localhost:3000/modelling?repo=Kavca/kavca-akm-models&path=startmodels&file=AKM-IRTV-Startup.json

  const repo = data.query.repo;
  const path = data.query.path;
  const file = data.query.file;
  const focus = data.query.focus; // should be set as phFocus
  
  console.log('99 Saga', data, data.query, repo, path, file, focus);


if (data.query !== {}) 
  if (repo && file) {
    try {
      let res = ''  
      res = yield searchGithub(repo, path, file, 'main', 'paramfile')
      console.log('109 Saga', res.data);
      // const metis = yield res.clone().json()
      const metis = yield res.data.phData.metis
      console.log('113 Saga', metis);

      yield put(loadDataSuccess({ metis })) 
    } catch (err) {
      console.log('116 saga', failure(err));  
      yield put(failure(err))
    }
  }
}

if (false) {  // comment in for  server login  
  function * loadDataModelListSaga() {
    if (debug) console.log('83 saga');
    const _crf = getCookie("XSRF-TOKEN", document) || ""; // comment in for  server login
    const _csrf = getCookie("_csrf", document) || ""; // comment in for  server login
    const sessionCookie = getCookie("session", document) || ""; // comment in for  server login
    // console.log('89 saga', _crf, _csrf, sessionCookie, document);
    try {
      let res = ''  
      res = yield fetch(`${akmmhost}akm-model-list/`,
        {
          mode: 'no-cors', // comment in for  server login
          headers: {
            // "Access-Control-Allow-Origin": "*", // comment in for  server login
            "Access-Control-Allow-Origin": "*", // comment in for  server login
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie': `_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`, // comment in for  server login
            "Access-Control-Allow-Credentials": 'include',  // comment in for  server login
          },
          credentials: 'include' // comment in for  server login
        }
      )
        if (debug) console.log('102 saga', yield res.clone().json());
        const modList = yield res.clone().json()
        if (debug) console.log('104 Saga', modList);
        yield put(loadDataModelListSuccess( modList ))
      } catch (err) {
        if (debug) console.log('107 saga', failure(err));  
        yield put(failure(err))
      }
    }
  }

function * loadDataModelSaga(data) {
  const _crf = getCookie("XSRF-TOKEN", document) || ""; // comment in for  server login
  const _csrf = getCookie("_csrf", document) || ""; // comment in for  server login
  const sessionCookie = getCookie("session", document) || ""; // comment in for  server login
  const modelId = data.data.id
  if (debug) console.log('118 saga', data.data, modelId);
  try {
      let res = ''  
      res = yield fetch(`${akmmhost}akmmodel?id=${modelId}`,
        {
          mode: 'no-cors', // comment in for  server login
          headers: {
            "Access-Control-Allow-Origin": "*", // comment in for  server login
            "Access-Control-Allow-Header": "origin", // comment in for  server login
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cookie':`_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`,  // comment in for  server login
            "Access-Control-Allow-Credentials": 'include', // comment in for  server login
          },
          credentials: 'include' // comment in for  server login
        }
      )
      const model = yield res.clone().json()
      if (!debug) console.log('134 Saga', model);
      yield put(loadDataModelSuccess({ model }))
    } catch (err) {
      if (debug) console.log('137 saga', failure(err));  
      yield put(failure(err))
    }
  }


function* rootSaga() {
  yield all([
    // console.log('175 saga', loadDataSaga, loadDataModelListSaga),
    takeLatest(LOAD_DATA_GITHUB, loadDataGithubSaga),
    takeLatest(LOAD_DATA, loadDataSaga),
    // takeLatest(LOAD_DATAMODELLIST, loadDataModelListSaga),
    takeLatest(LOAD_DATAMODEL, loadDataModelSaga)
    // takeLatest(SAVE_DATA, saveDataSaga)
  ])
}

export default rootSaga




// ToDo:  Make save model as dispatch
// function * saveDataSaga() {
//   const _crf = getCookie("XSRF-TOKEN", document) || "";
//   const _csrf = getCookie("_csrf", document) || "";
//   const sessionCookie = getCookie("session", document) || "";

//   try {
//     let res = ''  
//     res = yield fetch(`${localhost}akmmodels/`,
//       {
//         method: 'POST',
//         mode: 'no-cors',
//         headers: {
//           "Access-Control-Allow-Origin": "*",
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'Cookie':`_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`,
//           "Access-Control-Allow-Credentials": 'include', 
//         },
//         credentials: 'include'
//       }
//     )
//     const metis = yield res.clone().json()
//     console.log('63 Saga', metis);
//     yield put(saveDataSuccess({ metis }))
//   } catch (err) {
//     console.log('72 saga', failure(err));  
//     yield put(failure(err))
//   }
// }