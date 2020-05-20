// // next.config.js
// const withSass = require('@zeit/next-sass')
// const withCSS = require('@zeit/next-css')

// // module.exports = withCSS(withSass(
// //   {
// //     target: "serverless",
// //   }
// // ))

// module.exports = 
//   withCSS(withSass(
//     {
//       target: "serverless",
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