import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
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
import GoalSetupScreen from '../screens/GoalSetupScreen';
import { progressionApi } from '../api/endpoints';

type RootStackParamList = {
  Auth: undefined;
  GoalSetup: undefined;
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
  const [hasGoalProfile, setHasGoalProfile] = useState<boolean>(false);
  const [goalLoading, setGoalLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadGoalProfile = async () => {
      if (!user) {
        setHasGoalProfile(false);
        setGoalLoading(false);
        return;
      }

      setGoalLoading(true);
      try {
        const goalState = await progressionApi.getGoalProfile();
        setHasGoalProfile(goalState.has_profile);
      } catch (error) {
        console.error('Failed to load goal profile', error);
        setHasGoalProfile(false);
      } finally {
        setGoalLoading(false);
      }
    };

    loadGoalProfile();
  }, [user]);

  if (user && goalLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2A86FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {!hasGoalProfile ? (
            <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
          ) : null}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="CoachQR" component={CoachQRScreen} />
          <Stack.Screen name="AddExercise" component={AddExerciseScreen} />
          <Stack.Screen name="BodyMetrics" component={BodyMetricsScreen} />
          <Stack.Screen name="CalorieTarget" component={CalorieTargetScreen} />
          <Stack.Screen name="FoodAI" component={FoodAiScreen} />
          <Stack.Screen name="BleScale" component={BleScaleScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          {hasGoalProfile ? <Stack.Screen name="GoalSetup" component={GoalSetupScreen} /> : null}
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
