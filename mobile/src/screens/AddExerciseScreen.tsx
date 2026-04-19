import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { sessionsApi, workoutsApi } from '../api/endpoints';
import { ExerciseCatalogItem, WorkoutLog } from '../types';

type RootStackParamList = {
  AddExercise: { sessionId: number };
  Dashboard: undefined;
};

type Props = StackScreenProps<RootStackParamList, 'AddExercise'>;

const formatCategory = (category: string) => {
  if (category === 'kalistenik') return 'Kalistenik';
  if (category === 'kettlebell') return 'Kettlebell';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const AddExerciseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [sessionExercises, setSessionExercises] = useState<WorkoutLog[]>([]);
  const [exerciseCatalog, setExerciseCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [exerciseDropdownOpen, setExerciseDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(exerciseCatalog.map((item) => item.category)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [exerciseCatalog]);

  const filteredExercises = useMemo(
    () => exerciseCatalog.filter((item) => item.category === selectedCategory),
    [exerciseCatalog, selectedCategory]
  );

  const selectedExercise = useMemo(
    () => exerciseCatalog.find((item) => item.name === selectedExerciseName) ?? null,
    [exerciseCatalog, selectedExerciseName]
  );

  useEffect(() => {
    if (sessionId === 0) {
      loadActiveSession();
    }
    loadExerciseCatalog();
  }, [sessionId]);

  const loadActiveSession = async () => {
    try {
      const session = await sessionsApi.getActive();
      setCurrentSessionId(session.id);
    } catch (error) {
      try {
        const selfSession = await sessionsApi.startSelf();
        setCurrentSessionId(selfSession.id);
      } catch (selfSessionError) {
        Alert.alert('Error', 'No active session found and failed to create self session.');
        navigation.goBack();
      }
    }
  };

  const loadExerciseCatalog = async () => {
    try {
      const catalog = await workoutsApi.getExerciseCatalog();
      setExerciseCatalog(catalog);
    } catch (error) {
      console.error('Failed to load exercise catalog', error);
    }
  };

  const handleAddExercise = async () => {
    if (!selectedCategory || !selectedExerciseName || !weight || !reps || !sets) {
      Alert.alert('Error', 'Please choose category, exercise, and fill all fields');
      return;
    }

    setLoading(true);
    try {
      const newExercise = await workoutsApi.add(
        currentSessionId,
        selectedExerciseName,
        parseFloat(weight),
        parseInt(reps),
        parseInt(sets)
      );
      setSessionExercises([...sessionExercises, newExercise]);

      setSelectedCategory('');
      setSelectedExerciseName('');
      setWeight('');
      setReps('');
      setSets('');

      Alert.alert('Exercise Added', `${newExercise.exercise} (${newExercise.exercise_type})\n+${newExercise.exp_earned} EXP`);
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
      Alert.alert('Great job!', 'Session finished successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to finish session');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Add Exercise</Text>

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setCategoryDropdownOpen((v) => !v);
              setExerciseDropdownOpen(false);
            }}
          >
            <Text style={[styles.dropdownText, !selectedCategory && styles.dropdownPlaceholder]}>
              {selectedCategory ? formatCategory(selectedCategory) : 'Select category'}
            </Text>
          </TouchableOpacity>

          {categoryDropdownOpen && (
            <View style={styles.dropdownListWrap}>
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedCategory(category);
                      setSelectedExerciseName('');
                      setCategoryDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemTitle}>{formatCategory(category)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Exercise</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, !selectedCategory && styles.dropdownButtonDisabled]}
            onPress={() => {
              if (!selectedCategory) return;
              setExerciseDropdownOpen((v) => !v);
              setCategoryDropdownOpen(false);
            }}
          >
            <Text style={[styles.dropdownText, !selectedExerciseName && styles.dropdownPlaceholder]}>
              {selectedExerciseName || 'Select exercise'}
            </Text>
          </TouchableOpacity>

          {exerciseDropdownOpen && (
            <View style={styles.dropdownListWrap}>
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                {filteredExercises.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedExerciseName(item.name);
                      setExerciseDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemTitle}>{item.name}</Text>
                    <Text style={styles.dropdownItemMeta}>Base {item.base_exp_per_rep} EXP/rep</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedExercise && (
            <View style={styles.selectedInfoCard}>
              <Text style={styles.selectedInfoText}>Kategori: {formatCategory(selectedExercise.category)}</Text>
              <Text style={styles.selectedInfoText}>Base EXP: {selectedExercise.base_exp_per_rep} / rep</Text>
            </View>
          )}

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
              {sessionExercises.map((log) => (
                <View key={log.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{log.exercise}</Text>
                  <Text style={styles.exerciseDetails}>
                    {log.weight_kg} kg x {log.reps} reps x {log.sets} sets
                  </Text>
                  <Text style={styles.expText}>+{log.exp_earned} EXP ({log.exercise_type})</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dropdownButtonDisabled: {
    opacity: 0.55,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#888',
  },
  dropdownListWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ededed',
    backgroundColor: '#fff',
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  dropdownItemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#5f6f87',
  },
  selectedInfoCard: {
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  selectedInfoText: {
    fontSize: 13,
    color: '#174986',
    fontWeight: '600',
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
  expText: {
    marginTop: 4,
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700',
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
