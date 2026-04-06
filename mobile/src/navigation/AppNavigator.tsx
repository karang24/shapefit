import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';
import BodyMetricsScreen from '../screens/BodyMetricsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CoachQRScreen from '../screens/CoachQRScreen';
import CalorieTargetScreen from '../screens/CalorieTargetScreen';
import FoodAiScreen from '../screens/FoodAiScreen';
import BleScaleScreen from '../screens/BleScaleScreen';

type RootStackParamList = {
  Auth: undefined;
  Dashboard: undefined;
  QRScanner: undefined;
  CoachQR: undefined;
  AddExercise: { sessionId: number };
  BodyMetrics: undefined;
  CalorieTarget: undefined;
  FoodAI: undefined;
  BleScale: undefined;
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppStack: React.FC = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="CoachQR" component={CoachQRScreen} />
          <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
          <Stack.Screen name="BodyMetrics" component={BodyMetricsScreen} />
          <Stack.Screen name="CalorieTarget" component={CalorieTargetScreen} />
          <Stack.Screen name="FoodAI" component={FoodAiScreen} />
          <Stack.Screen name="BleScale" component={BleScaleScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

const AppContainer: React.FC = () => {
  const { mode } = useTheme();
  const navigationTheme = mode === 'dark' ? NavigationDarkTheme : NavigationLightTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <AuthProvider>
        <AppStack />
      </AuthProvider>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContainer />
    </ThemeProvider>
  );
};

export default App;
