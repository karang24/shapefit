import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { sessionsApi, workoutsApi } from '../api/endpoints';
import { WorkoutLog } from '../types';

type RootStackParamList = {
  AddExercise: { sessionId: number };
  Dashboard: undefined;
};

type Props = StackScreenProps<RootStackParamList, 'AddExercise'>;

const AddExerciseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [sessionExercises, setSessionExercises] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId === 0) {
      loadActiveSession();
    }
  }, [sessionId]);

  const loadActiveSession = async () => {
    try {
      const session = await sessionsApi.getActive();
      setCurrentSessionId(session.id);
    } catch (error) {
      Alert.alert('Error', 'No active session found. Please scan QR code first.');
      navigation.goBack();
    }
  };

  const handleAddExercise = async () => {
    if (!exercise || !weight || !reps || !sets) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const newExercise = await workoutsApi.add(
        currentSessionId,
        exercise,
        parseFloat(weight),
        parseInt(reps),
        parseInt(sets)
      );
      setSessionExercises([...sessionExercises, newExercise]);
      
      setExercise('');
      setWeight('');
      setReps('');
      setSets('');
      
      Alert.alert('Success', 'Exercise added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSession = async () => {
    if (sessionExercises.length === 0) {
      Alert.alert('Warning', 'No exercises added. Are you sure you want to finish?');
      return;
    }

    try {
      await sessionsApi.finish(currentSessionId, 'Workout completed');
      Alert.alert(
        'Great job!',
        'Session finished successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to finish session');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Add Exercise</Text>

          <TextInput
            style={styles.input}
            placeholder="Exercise name (e.g., Kettlebell Swing)"
            value={exercise}
            onChangeText={setExercise}
            autoCapitalize="words"
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Sets"
              value={sets}
              onChangeText={setSets}
              keyboardType="number-pad"
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddExercise} disabled={loading}>
            <Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Exercise'}</Text>
          </TouchableOpacity>

          {sessionExercises.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Current Session</Text>
              {sessionExercises.map((log, index) => (
                <View key={log.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{log.exercise}</Text>
                  <Text style={styles.exerciseDetails}>
                    {log.weight_kg} kg × {log.reps} reps × {log.sets} sets
                  </Text>
                </View>
              ))}
            </>
          )}

          <TouchableOpacity style={styles.finishButton} onPress={handleFinishSession}>
            <Text style={styles.finishButtonText}>Finish Session</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Back to Dashboard</Text>
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flexInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  exerciseItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
  },
  finishButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddExerciseScreen;
