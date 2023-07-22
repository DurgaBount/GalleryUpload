import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';
import MainScreen from './src/screens/MainScreen';
import {realmContext} from './src/screens/Realm';

type RootStackParamList = {
  SplashScreen: undefined;
  MainScreen: undefined;
  Gallery: undefined;
};

const {RealmProvider} = realmContext;

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <RealmProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Set headerShown to false to remove the header for SplashScreen */}
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="MainScreen"
            component={MainScreen}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </RealmProvider>
  );
}

export default App;
