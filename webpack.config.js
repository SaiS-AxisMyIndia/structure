const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isProduction = mode === 'production';

  // Mirror react-native-config's convention (see android/app/build.gradle) of
  // one .env.<flavor> file per environment, so web reads the same values
  // native does instead of falling back to empty strings.
  const appEnv = process.env.APP_ENV || 'dev';
  const envFilePath = path.resolve(__dirname, `.env.${appEnv}`);
  const fileEnv = fs.existsSync(envFilePath) ? dotenv.parse(fs.readFileSync(envFilePath)) : {};
  const resolvedApiBaseUrl = process.env.API_BASE_URL || fileEnv.API_BASE_URL || '';
  const resolvedAppEnv = fileEnv.APP_ENV || appEnv;

  return {
    mode,
    entry: path.resolve(__dirname, 'index.web.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      publicPath: '/',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
      // Prefer CJS builds over `module`/ESM builds: several RN-ecosystem packages
      // (e.g. @react-native-async-storage/async-storage) ship an ESM build with
      // extensionless imports that violates strict ESM resolution under webpack 5.
      mainFields: ['main', 'browser'],
      alias: {
        'react-native$': 'react-native-web',
        'react-native-webview$': 'react-native-web-webview',
        'react-native-config$': path.resolve(__dirname, 'web/shims/react-native-config.js'),
        'react-native-sound$': path.resolve(__dirname, 'web/shims/react-native-sound.js'),
        'react-native-linear-gradient$': path.resolve(__dirname, 'web/shims/react-native-linear-gradient.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: resourcePath => {
            if (!resourcePath.includes('node_modules')) return false;
            return !/[\\/](react-native[^\\/]*|@react-native[^\\/]*|@react-navigation)[\\/]/.test(resourcePath);
          },
          type: 'javascript/auto',
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['module:@react-native/babel-preset'],
              plugins: [['react-native-web', { commonjs: true }]],
            },
          },
        },
        {
          // Some packages (e.g. @react-native-async-storage/async-storage) ship an
          // ESM build with extensionless imports but no "type": "module" marker,
          // which fails webpack 5's strict ESM resolution. Relax it for plain .js.
          test: /\.js$/,
          resolve: { fullySpecified: false },
        },
        {
          test: /\.svg$/,
          type: 'asset/resource',
        },
        {
          test: /\.(png|jpe?g|gif|ttf|otf|woff2?)$/,
          type: 'asset/resource',
        },
        {
          // react-native-web-webview's `require('./postMock.html')` expects a
          // loadable URL string back (it's only ever opened as a real
          // window.open() popup navigation for POST-method WebViews - a
          // feature this app doesn't use). Without an explicit rule here,
          // html-webpack-plugin intercepts that require() itself, renders the
          // file as if it were another template, and bundles its <script> as
          // an extra chunk that runs eagerly on page load and throws (it
          // expects ?uri=/?body= query params that only exist in that popup).
          // Treating it as a plain static asset avoids that entirely.
          test: /\.html$/,
          exclude: path.resolve(__dirname, 'web/index.html'),
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'web/index.html') }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        'process.env.APP_ENV': JSON.stringify(resolvedAppEnv),
        'process.env.API_BASE_URL': JSON.stringify(resolvedApiBaseUrl),
      }),
    ],
    devServer: {
      port: 8080,
      hot: true,
      historyApiFallback: true,
      static: { directory: path.resolve(__dirname, 'web') },
    },
  };
};
