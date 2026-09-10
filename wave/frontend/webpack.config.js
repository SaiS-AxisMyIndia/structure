const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = __dirname;

// Most of node_modules ships already-compiled JS and can be skipped, but
// react-native itself and its ecosystem (react-native-web, anything under
// the @react-native scope - e.g. new-app-screen, whose Flow-typed source
// App.tsx's default template still imports, and which itself reaches into
// react-native's own internals) ship raw Flow/JSX source that needs the
// same babel transform our own code gets - listed explicitly in `include`
// below rather than trying to `exclude` around them.
const compileNodeModules = ['react-native', 'react-native-web', '@react-native'].map(moduleName =>
  path.resolve(appDirectory, 'node_modules', moduleName),
);

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    ...compileNodeModules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['module:@react-native/babel-preset'],
      // Rewrites e.g. `Image`'s special-cased native props to their
      // react-native-web DOM equivalents - without this, a handful of
      // core RN components (Image, Text, View) don't fully behave right
      // when their implementation actually comes from react-native-web
      // (see the resolve.alias below) instead of react-native itself.
      plugins: ['react-native-web'],
    },
  },
};

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),
  output: {
    path: path.resolve(appDirectory, 'web-build'),
    filename: 'bundle.web.js',
  },
  resolve: {
    // .web.* first, same priority Metro gives it for android/ios's own
    // platform suffix - see e.g. AppConfig.web.ts/blurActiveElement.web.ts,
    // which only ever resolve through this list, never a static import.
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      // Native builds resolve an image require() through Metro's own
      // asset pipeline - webpack needs an equivalent for the same
      // require()s to work here (e.g. @react-native/new-app-screen's own
      // splash images).
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web', 'index.html'),
    }),
    // __DEV__ is a Metro/Hermes global RN source relies on - webpack has
    // no equivalent, so it has to be defined explicitly here instead.
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
    }),
  ],
  devServer: {
    port: 4040,
    hot: true,
    historyApiFallback: true,
  },
};
