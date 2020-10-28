// @ts-nocheck
// const fetch = require('isomorphic-unfetch')
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import cors from 'cors'
import util from 'util'

let curMod = ''
let curModd = ''
let mMetis = ''

let plhD = ''
try {
  async function getStore(filename) {
    await fetch(filename, {

      header: {
        'Accept': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
      .then((res) => {
        if (res.ok) {
          return res.text()
        } else {
          throw Error(`Request with status ${res.status}`)
        }
      })
      .then(function (data) {
        console.log('29 ', data);

        // datas = cheerio.load(data)
        const $ = cheerio.load(data)
        console.log('33 $ ', $("script")) //.get()[0]);
        // console.log($('<script>').get(1).text());
        const scrmod = $("script").get()[1].children[0].data
        const scrmod2 = scrmod
          .replace(/__NEXT_DATA__ \=/, '')
          .replace(/;__NEXT_LOADED_PAGES__=\[\];__NEXT_REGISTER_PAGE=function\(r,f\)\{__NEXT_LOADED_PAGES__.push\(\[r, f\]\)\}/, '')

        console.log(' 40 ', scrmod2)
        const curMod = JSON.parse(scrmod2).props.pageProps.initialState.placeholderData.currentModel;
        const metaMod = JSON.parse(scrmod2).props.pageProps.initialState.placeholderMetaData
        const metis = curMod.kmv.metis
        // console.log('#33 metamod: ',metaMod);
        // console.log('#34 modfile :', curMod.modelfile);
        // console.log('metis obj :', metis.objectview[0]);
        // console.log('object :', metis.modelview[0]);
        plhD = { modStore: { metaMod: metaMod, curMod: curMod } }
        console.log('#38 : ', plhD.modStore.curMod);
        // mMetis = metis
        //  return mMetis

        return plhD // placeholder...Data
      })
  }

  const delay = t => new Promise(resolve => setTimeout(resolve, t))
  delay(132000).then(() => {
    getStore('http://localhost:4000/akmodels')
  })

} catch (err) {
  console.log('err', err);
}

module.exports = class ModelStore {
  findAll() {
    return plhD
  }
}



// module.exports = class ModelStore {
//   setTimeout(function(){
//     findAll(){
//       return curmod
//     }
//   }, 9000)
// }
