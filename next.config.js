const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias['gojs/extensions'] = path.resolve(__dirname, 'node_modules/gojs/extensions');
    return config;
  },
};

// const removeImports = require('next-remove-imports')();

// const nextConfig = {
//   reactStrictMode: false,
//   webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
//     // Ensure that custom webpack configurations are preserved.
//     config.node = {
//       global: true,
//       __filename: true,
//       __dirname: true,
//     };
//     return config;
//   },
// };

// module.exports = removeImports(nextConfig);


// module.exports = {
//     // webpack: (config) => {

//     //   return config
//     // }
//     reactStrictMode: false,
//     webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
//       config.node = {
//         // fs: 'empty'
//         global: true,
//         __filename: true,
//         __dirname: true,
//       }
    
//     return config
//   }
//   // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
//   //   config.node = {
//   //     fs: 'empty'
//   //   }
//   //   return config
//   // }
// }
// const removeImports = require('next-remove-imports')();
// module.exports = removeImports({});