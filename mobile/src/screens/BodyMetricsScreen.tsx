import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { bodyMetricsApi } from '../api/endpoints';
import { BodyMetric } from '../types';
import { useTheme } from '../context/ThemeContext';

type RootStackParamList = {
  BodyMetrics: undefined;
  Dashboard: undefined;
};

type BodyMetricsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BodyMetrics'>;

interface Props {
  navigation: BodyMetricsScreenNavigationProp;
}

const BodyMetricsScreen: React.FC<Props> = ({ navigation }) => {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const { mode, colors } = useTheme();

  const loadHistory = async () => {
    try {
      const data = await bodyMetricsApi.getAll();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSave = async () => {
    if (!weight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    setLoading(true);
    try {
      await bodyMetricsApi.log(parseFloat(weight), waist ? parseFloat(waist) : null, date);
      Alert.alert('Success', 'Body metrics saved successfully!');
      setWeight('');
      setWaist('');
      await loadHistory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Body Metrics</Text>

          <Text style={[styles.label, { color: colors.textPrimary }]}>Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>Waist (cm) - Optional</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={waist}
            onChangeText={setWaist}
            placeholder="Enter waist circumference"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Metrics'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>History</Text>
          {history.map((metric) => (
            <View
              key={metric.id}
              style={[
                styles.historyItem,
                {
                  backgroundColor: mode === 'light' ? '#f9f9f9' : colors.surfaceSoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.historyDate, { color: colors.textPrimary }]}>{metric.date}</Text>
              <Text style={[styles.historyMetrics, { color: colors.textSecondary }]}>
                Weight: {metric.weight_kg} kg
                {metric.waist_cm && ` | Waist: ${metric.waist_cm} cm`}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyMetrics: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BodyMetricsScreen;
