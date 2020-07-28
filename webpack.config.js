const path = require('path')
const HTMLPlugin = require('html-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  mode: isProd ? 'production' : 'development',
  entry: path.join(__dirname, 'src/main.tsx'),
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, use: ['babel-loader', 'ts-loader'] },
    ],
  },
  plugins: [new HTMLPlugin()],
}
