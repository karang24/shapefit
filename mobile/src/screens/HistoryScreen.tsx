import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { workoutsApi } from '../api/endpoints';
import { WorkoutHistory } from '../types';

type RootStackParamList = {
  History: undefined;
  Dashboard: undefined;
};

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;

interface Props {
  navigation: HistoryScreenNavigationProp;
}

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [history, setHistory] = useState<WorkoutHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await workoutsApi.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getProgressText = (weights: Array<{ date: string; weight: number }>) => {
    if (weights.length < 2) return 'No progress data yet';
    const latest = weights[weights.length - 1].weight;
    const previous = weights[0].weight;
    const change = latest - previous;
    if (change > 0) {
      return `${previous}kg → ${latest}kg (+${change.toFixed(1)}kg)`;
    } else if (change < 0) {
      return `${previous}kg → ${latest}kg (${change.toFixed(1)}kg)`;
    } else {
      return `${latest}kg (no change)`;
    }
  };

  if (loading || !history) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Workout History</Text>

        <Text style={styles.sectionTitle}>Exercise Progress</Text>
        {history.exercise_progress.map((progress, index) => (
          <View key={index} style={styles.progressItem}>
            <Text style={styles.exerciseName}>{progress.exercise}</Text>
            <Text style={styles.progressText}>{getProgressText(progress.weights)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {history.workouts.map((workout, index) => (
          <View key={index} style={styles.workoutItem}>
            <Text style={styles.workoutDate}>{workout.date}</Text>
            <Text style={styles.workoutExercise}>{workout.exercise}</Text>
            <Text style={styles.workoutDetails}>
              {workout.weight_kg} kg × {workout.reps} reps × {workout.sets} sets
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText} onPress={() => navigation.goBack()}>
            ← Back to Dashboard
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  progressItem: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  workoutItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workoutExercise: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 24,
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
});

export default HistoryScreen;
