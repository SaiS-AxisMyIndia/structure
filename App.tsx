/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Router } from './src/config/routes/router';
import { applyGlobalFont } from './src/config/theme/applyGlobalFont';

applyGlobalFont();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Router role="user" />
    </SafeAreaProvider>
  );
}

export default App;
