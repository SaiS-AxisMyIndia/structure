/**
 * Web entry point - index.js (Metro's entry for Android/iOS) only calls
 * AppRegistry.registerComponent(), since the native host app calls
 * runApplication() itself once it loads the bundle. There's no such host on
 * web, so this file (webpack's own entry - see webpack.config.js) has to
 * call runApplication() itself, against the #root div in web/index.html.
 *
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
