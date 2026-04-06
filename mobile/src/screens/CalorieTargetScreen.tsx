import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { nutritionApi } from '../api/endpoints';
import { ActivityLevel, CalorieTargetResponse, GoalType, SexType } from '../types';

type RootStackParamList = {
  CalorieTarget: undefined;
  Dashboard: undefined;
};

type CalorieTargetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CalorieTarget'>;

interface Props {
  navigation: CalorieTargetScreenNavigationProp;
}

const ACTIVITY_OPTIONS: Array<{ label: string; value: ActivityLevel }> = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Active', value: 'active' },
  { label: 'Very Active', value: 'very_active' },
];

const GOAL_OPTIONS: Array<{ label: string; value: GoalType }> = [
  { label: 'Deficit', value: 'deficit' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Surplus', value: 'surplus' },
];

const CalorieTargetScreen: React.FC<Props> = ({ navigation }) => {
  const { mode, colors } = useTheme();
  const [age, setAge] = useState('28');
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('70');
  const [sex, setSex] = useState<SexType>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<GoalType>('maintenance');
  const [deficitPercent, setDeficitPercent] = useState('15');
  const [surplusPercent, setSurplusPercent] = useState('10');
  const [result, setResult] = useState<CalorieTargetResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    const parsedAge = parseInt(age, 10);
    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);
    const parsedDeficit = parseFloat(deficitPercent);
    const parsedSurplus = parseFloat(surplusPercent);

    if (!parsedAge || !parsedHeight || !parsedWeight) {
      Alert.alert('Error', 'Isi umur, tinggi, dan berat dengan benar.');
      return;
    }

    setLoading(true);
    try {
      const data = await nutritionApi.calculateCalorieTarget({
        age: parsedAge,
        sex,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        activity_level: activityLevel,
        goal,
        deficit_percent: parsedDeficit,
        surplus_percent: parsedSurplus,
      });
      setResult(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Gagal hitung target kalori');
    } finally {
      setLoading(false);
    }
  };

  const renderPill = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: selected ? (mode === 'light' ? '#E8F2FF' : '#1E3555') : colors.surface,
          borderColor: selected ? (mode === 'light' ? '#2A86FF' : '#66B6FF') : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: selected ? (mode === 'light' ? '#1D4D8F' : '#BBDDFF') : colors.textSecondary, fontWeight: '700' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Target Kalori Harian</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Hitung maintenance, defisit, atau surplus tanpa AI.
        </Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Umur</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="28"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Tinggi (cm)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="170"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Berat (kg)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
          placeholder="70"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Jenis kelamin</Text>
        <View style={styles.pillRow}>
          {renderPill('Male', sex === 'male', () => setSex('male'))}
          {renderPill('Female', sex === 'female', () => setSex('female'))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Aktivitas</Text>
        <View style={styles.wrapRow}>
          {ACTIVITY_OPTIONS.map((item) => (
            <View key={item.value} style={styles.wrapItem}>
              {renderPill(item.label, activityLevel === item.value, () => setActivityLevel(item.value))}
            </View>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Goal</Text>
        <View style={styles.pillRow}>
          {GOAL_OPTIONS.map((item) => (
            <View key={item.value} style={styles.goalItem}>
              {renderPill(item.label, goal === item.value, () => setGoal(item.value))}
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Defisit %</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={deficitPercent}
              onChangeText={setDeficitPercent}
              keyboardType="number-pad"
              placeholder="15"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Surplus %</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={surplusPercent}
              onChangeText={setSurplusPercent}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.calculateButton, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
          onPress={handleCalculate}
          disabled={loading}
        >
          <Text style={styles.calculateButtonText}>{loading ? 'Menghitung...' : 'Hitung Target Kalori'}</Text>
        </TouchableOpacity>

        {result && (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: mode === 'light' ? '#F6FBFF' : colors.surfaceSoft,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Hasil</Text>
            <Text style={[styles.resultLine, { color: colors.textSecondary }]}>Formula: {result.formula}</Text>
            <Text style={[styles.resultLine, { color: colors.textSecondary }]}>BMR: {result.bmr} kcal</Text>
            <Text style={[styles.resultLine, { color: colors.textSecondary }]}>
              Maintenance: {result.maintenance_calories} kcal
            </Text>
            <Text style={[styles.targetValue, { color: mode === 'light' ? '#1D5DB8' : '#6CC0FF' }]}>
              Target: {result.target_calories} kcal/day
            </Text>
            <Text style={[styles.resultLine, { color: colors.textSecondary }]}>
              Adjustment: {result.adjustment_kcal > 0 ? '+' : ''}
              {result.adjustment_kcal} kcal
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Kembali ke Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  wrapItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  goalItem: {
    flex: 1,
  },
  pill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  resultCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultLine: {
    fontSize: 14,
    marginBottom: 6,
  },
  targetValue: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 8,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default CalorieTargetScreen;

