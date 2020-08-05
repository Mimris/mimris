import es6promise from 'es6-promise'
import 'isomorphic-unfetch'
es6promise.polyfill()


const SaveModelData =  async (modeldata) => {

  const modelData = JSON.stringify(modeldata)
  const sendData = 'phData:"'+modelData+'"'
  console.log('9 SaveModelData', modelData);
  const localhost = 'http://localhost:4000/'

  // function getCookie(cname, document) {
  //   var name = cname + "=";
  //   var decodedCookie = decodeURIComponent(document.cookie);
  //   var ca = decodedCookie.split(';');
  //   for (var i = 0; i < ca.length; i++) {
  //     var c = ca[i];
  //     while (c.charAt(0) == ' ') {
  //       c = c.substring(1);
  //     }
  //     if (c.indexOf(name) == 0) {
  //       return c.substring(name.length, c.length);
  //     }
  //   }
  //   return "";
  // }



  // const _crf = getCookie("XSRF-TOKEN", document) || "";
  // const _csrf = getCookie("_csrf", document) || "";
  // const sessionCookie = getCookie("session", document) || "";
  // console.log('33', sendData);
  
    try {
      let res 
      res = await fetch(`${localhost}postakmmodels/`,
      // res = await fetch(`${localhost}postakmmodels/?${sendData}`,
        {
          method: 'POST',
          // mode: 'no-cors',
          headers: {
          //   // "Access-Control-Allow-Origin": "*",
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          //   // 'Cookie': `_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`,
          //   // "Access-Control-Allow-Credentials": 'include',
          },
          // credentials: 'include'
          body: modelData
        }
      ).then(res => {console.log('res', res)})
        // console.log('50', res)
      
        // const metis = await res.clone().json()
        console.log('63 Saga', 'metis');
        // yield put(loadDataSuccess({ metis }))
    } catch (err) {
      console.log('72 saga', err);
      // yield put(failure(err))
    }

    // try {

    //   const postData = await fetch(`${localhost}postakmmodels/`,
    //     {
    //       // method: 'POST',
    //       mode: 'no-cors',
    //       headers: {
    //         // "Access-Control-Allow-Origin": "*",
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json',
    //         'Cookie': `_csrf:${_csrf}, session: ${sessionCookie}, XSRF-TOKEN: ${_crf}`,
    //         // "Access-Control-Allow-Credentials": 'include',
    //       },
    //       credentials: 'include',
    //       body: '{"test":"JSON.stringify(modelData)"}'

    //       // body: JSON.stringify(modelData)
    //     }
    //   )
    //   // console.log('50 SaveModelData ', JSON.stringify(modelData) );
    //   const content = await postData.json();
    //   console.log('51 ModelData is saved to Server', content);
        
    // } catch (err) {
    //   console.log('72 saveModel', err);
    // }
  

  // })  


  // return (

  // )
}

export default SaveModelData;
