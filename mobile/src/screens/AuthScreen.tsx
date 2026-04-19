import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { progressionApi } from '../api/endpoints';

type RootStackParamList = {
  Auth: undefined;
  GoalSetup: undefined;
  Dashboard: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { mode, colors, toggleTheme } = useTheme();

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      const goalState = await progressionApi.getGoalProfile();
      navigation.replace(goalState.has_profile ? 'Dashboard' : 'GoalSetup');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>ShapeFit Fitness Tracker</Text>
          </View>
          <TouchableOpacity style={[styles.modeButton, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={toggleTheme}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{mode === 'light' ? 'Dark' : 'Light'}</Text>
          </TouchableOpacity>
        </View>

        {!isLogin && (
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={[styles.switchText, { color: mode === 'light' ? '#2A86FF' : '#66B6FF' }]}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});

export default AuthScreen;
