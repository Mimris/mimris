// // next.config.js
// const withSass = require('@zeit/next-sass')
// const withCSS = require('@zeit/next-css')

// // module.exports = withCSS(withSass(
// //   {
// //     target: "serverless",
// //   }
// // ))

// module.exports = 
//   // withCSS({
//   //   cssLoaderOptions: {
//   //     url: false
//   //   }
//   // }),
//   withCSS(withSass(
//     {
//       target: "serverless",
//       cssLoaderOptions: {
//         url: false
//       }
//     }
//   )),
//   {
//   webpack: (config, { isServer }) => {
//     // Fixes npm packages that depend on `fs` module
//     if (!isServer) {
//       config.node = {
//         fs: 'empty'
//       }
//     }
//     return config
//   }
// }

module.exports = {
    // webpack: (config) => {

    //   return config
    // }
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.node = {
        fs: 'empty'
      }
      return config
    }
  }