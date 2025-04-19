import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
//import { createStore, applyMiddleware } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { legacy_createStore as createStore, applyMiddleware } from 'redux';
import { legacy_createStore as createStore } from 'redux';
import { applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

// Import components and services
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import rootReducer from './src/store/reducers';
import { AuthContext } from './src/services/auth/AuthContext';
import LoadingScreen from './src/components/common/LoadingScreen';

// Create Redux store
const store = createStore(rootReducer, applyMiddleware(thunk));

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Authentication state management
  const authContext = React.useMemo(() => ({
    signIn: async (token: string) => {
      setIsLoading(true);
      try {
        await AsyncStorage.setItem('userToken', token);
        setUserToken(token);
      } catch (e) {
        console.error('Error signing in:', e);
      }
      setIsLoading(false);
    },
    signOut: async () => {
      setIsLoading(true);
      try {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
      } catch (e) {
        console.error('Error signing out:', e);
      }
      setIsLoading(false);
    },
    signUp: async (token: string) => {
      setIsLoading(true);
      try {
        await AsyncStorage.setItem('userToken', token);
        setUserToken(token);
      } catch (e) {
        console.error('Error signing up:', e);
      }
      setIsLoading(false);
    },
  }), []);

  // Check if user is logged in on app load
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token = null;
      try {
        token = await AsyncStorage.getItem('userToken');
      } catch (e) {
        console.error('Failed to load token:', e);
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <AuthContext.Provider value={authContext}>
        <SafeAreaProvider>
          <NavigationContainer>
            {userToken ? <AppNavigator /> : <AuthNavigator />}
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthContext.Provider>
    </Provider>
  );
}