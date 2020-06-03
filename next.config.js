// // next.config.js
// const withSass = require('@zeit/next-sass')
// // const withCSS = require('@zeit/next-css')
// // const path = require('path');
// const { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin');

// module.exports = withSass({
//   cssModules: true,
//   cssLoaderOptions: {
//     importLoaders: 2,
//     localIdentName: '[local]___[hash:base64:5]'
//   },
//   webpack: (config, { dev }) => {
//     if (!config.plugins) config.plugins = [];
//     config.plugins.push(
//       new TypedCssModulesPlugin({
//         globPattern: 'components/**/*.scss',
//       }),
//       )
//       return config;
//     }
//   });
  
  
  
  // module.exports = withCSS(withSass(
    //   {
      //     target: "serverless",
      //   }
      // ))
      
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