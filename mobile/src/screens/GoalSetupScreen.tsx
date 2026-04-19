import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { progressionApi } from '../api/endpoints';
import { FitnessGoalType } from '../types';
import { useTheme } from '../context/ThemeContext';

type RootStackParamList = {
  GoalSetup: undefined;
  Dashboard: undefined;
};

type GoalSetupNavigationProp = StackNavigationProp<RootStackParamList, 'GoalSetup'>;

interface Props {
  navigation: GoalSetupNavigationProp;
}

const GOAL_OPTIONS: Array<{ value: FitnessGoalType; title: string; subtitle: string }> = [
  { value: 'weight_loss', title: 'Weight Loss', subtitle: 'Turun berat badan bertahap dan stabil.' },
  { value: 'fat_loss', title: 'Fat Loss', subtitle: 'Fokus menurunkan lemak tubuh.' },
  { value: 'muscle_gain', title: 'Muscle Gain', subtitle: 'Fokus menambah massa otot.' },
  { value: 'recomposition', title: 'Recomposition', subtitle: 'Kurangi lemak sambil naikkan performa.' },
];

const GoalSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoalType | null>(null);
  const [saving, setSaving] = useState(false);
  const { colors, mode } = useTheme();

  const handleContinue = async () => {
    if (!selectedGoal) {
      Alert.alert('Pilih Goal', 'Silakan pilih goal utama kamu dulu.');
      return;
    }

    setSaving(true);
    try {
      await progressionApi.updateGoalProfile(selectedGoal);
      navigation.replace('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Gagal menyimpan goal profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Set Goal Profile</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Pilih goal utama kamu untuk generate misi mingguan otomatis.
      </Text>

      {GOAL_OPTIONS.map((option) => {
        const isSelected = selectedGoal === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.goalCard,
              {
                borderColor: isSelected ? (mode === 'light' ? '#2A86FF' : '#3B9CFF') : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => setSelectedGoal(option.value)}
          >
            <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{option.title}</Text>
            <Text style={[styles.goalSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
        onPress={handleContinue}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Menyimpan...' : 'Simpan Goal'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  goalCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GoalSetupScreen;
