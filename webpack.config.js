var path = require('path');
var SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');

module.exports = {
  context: __dirname,

  entry: {
    main: path.resolve(__dirname, './src/main.js'),
  },

  output: {
    path: path.resolve(__dirname, './assets'),
    filename: 'bundle.js',
    publicPath: '/assets/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
        include: [
          path.resolve(__dirname, './src/main.js')
        ]
      }
    ]
  },

  plugins: [
    new SWPrecacheWebpackPlugin(
      {
        cacheId: 'todo-list',
        filepath: './sw-generated-webpack.js',
        maximumFileSizeToCacheInBytes: 4194304,
        staticFileGlobs: ['index.html', './src/main.css', './assets/images/*.png'],
        runtimeCaching: [{
          handler: 'networkFirst',
          urlPattern: /^http:\/\/localhost:3000/,
        }],
      }
    ),
  ]
}