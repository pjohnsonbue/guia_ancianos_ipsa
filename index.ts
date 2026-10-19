// Must be the very first import — react-native-gesture-handler needs to
// install its native event handling before anything else in the app runs.
// See App.tsx for the matching <GestureHandlerRootView> wrapper (required
// for gestures, swipe-to-navigate included, to work on Android).
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
