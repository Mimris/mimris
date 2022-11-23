
module.exports = {
  webpack: (config) => {
    {
      resolve: {
        fallback: {
          fs: false
        }
      }
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