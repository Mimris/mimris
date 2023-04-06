
module.exports = {
    // webpack: (config) => {

    //   return config
    // }
    reactStrictMode: false,
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.node = {
        // fs: 'empty'
        global: true,
        __filename: true,
        __dirname: true,
      }
    
    return config
  }
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   config.node = {
  //     fs: 'empty'
  //   }
  //   return config
  // }
}
const removeImports = require('next-remove-imports')();
module.exports = removeImports({});