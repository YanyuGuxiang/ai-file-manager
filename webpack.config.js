const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/renderer/index.js',
  output: {
    path: path.resolve(__dirname, 'src/renderer/dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  mode: 'development',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new webpack.ExternalsPlugin('commonjs', [
      'electron'
    ])
  ]
};