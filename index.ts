import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import './src/services/firebase/firebaseCrashlytics';
import App from './App';

registerRootComponent(App);
