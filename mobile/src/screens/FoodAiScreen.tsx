import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { nutritionApi } from '../api/endpoints';
import { AnalyzeMealImageResponse, MealType, NutritionDailyUsage } from '../types';

type RootStackParamList = {
  FoodAI: undefined;
  Dashboard: undefined;
};

type FoodAiScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FoodAI'>;

interface Props {
  navigation: FoodAiScreenNavigationProp;
}

const MEAL_OPTIONS: Array<{ label: string; value: MealType }> = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

const FoodAiScreen: React.FC<Props> = ({ navigation }) => {
  const { mode, colors } = useTheme();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [usage, setUsage] = useState<NutritionDailyUsage | null>(null);
  const [result, setResult] = useState<AnalyzeMealImageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadUsage();
    }, [])
  );

  const loadUsage = async () => {
    setLoadingUsage(true);
    try {
      const data = await nutritionApi.getUsageToday();
      setUsage(data);
    } catch (error) {
      console.error('Error loading nutrition usage:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (usage && usage.remaining <= 0) {
      Alert.alert('Limit Harian', `Kuota analisis foto hari ini habis (${usage.limit}/hari).`);
      return;
    }

    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission', source === 'camera' ? 'Akses kamera dibutuhkan.' : 'Akses galeri dibutuhkan.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    };

    const pickerResult =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }

    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      Alert.alert('Error', 'Gagal membaca file gambar. Coba pilih gambar lain.');
      return;
    }

    setImageUri(asset.uri);
    setImageBase64(asset.base64);
    setMimeType(asset.mimeType ?? 'image/jpeg');
    setResult(null);
  };

  const analyzeImage = async () => {
    if (!imageBase64) {
      Alert.alert('Error', 'Pilih foto makanan dulu.');
      return;
    }

    setAnalyzing(true);
    try {
      const data = await nutritionApi.analyzeMealImage({
        image_base64: imageBase64,
        mime_type: mimeType,
        meal_type: mealType,
      });
      setResult(data);
      setUsage(data.daily_usage);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Gagal analisis foto makanan');
    } finally {
      setAnalyzing(false);
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Food AI Analyzer</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Foto makanan untuk estimasi kalori dan makro.
      </Text>

      <View style={[styles.usageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {loadingUsage ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.usageText, { color: colors.textPrimary }]}>
            Kuota hari ini: {usage?.used ?? 0}/{usage?.limit ?? 3} (sisa {usage?.remaining ?? 0})
          </Text>
        )}
      </View>

      <Text style={[styles.label, { color: colors.textPrimary }]}>Meal Type</Text>
      <View style={styles.mealRow}>
        {MEAL_OPTIONS.map((option) => (
          <View key={option.value} style={styles.mealItem}>
            {renderPill(option.label, mealType === option.value, () => setMealType(option.value))}
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: mode === 'light' ? '#EAF4FF' : '#162B44', borderColor: colors.border }]}
          onPress={() => pickImage('camera')}
        >
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Ambil Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: mode === 'light' ? '#ECFFF4' : '#173727', borderColor: colors.border }]}
          onPress={() => pickImage('gallery')}
        >
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Pilih Galeri</Text>
        </TouchableOpacity>
      </View>

      {imageUri ? (
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.analyzeButton, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
        onPress={analyzeImage}
        disabled={analyzing}
      >
        <Text style={styles.analyzeText}>{analyzing ? 'Menganalisis...' : 'Analisis Makanan'}</Text>
      </TouchableOpacity>

      {result ? (
        <View style={[styles.resultCard, { backgroundColor: mode === 'light' ? '#F6FBFF' : colors.surfaceSoft, borderColor: colors.border }]}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Hasil Estimasi</Text>
          <Text style={[styles.bigCalories, { color: mode === 'light' ? '#1D5DB8' : '#6CC0FF' }]}>
            {result.estimated_calories} kcal
          </Text>
          <Text style={[styles.resultLine, { color: colors.textSecondary }]}>
            Protein {result.protein_g}g | Karbo {result.carbs_g}g | Lemak {result.fat_g}g
          </Text>
          <Text style={[styles.resultLine, { color: colors.textSecondary }]}>
            Confidence: {Math.round(result.confidence * 100)}%
          </Text>

          <Text style={[styles.itemsTitle, { color: colors.textPrimary }]}>Detected Items</Text>
          {result.food_items.length === 0 ? (
            <Text style={[styles.resultLine, { color: colors.textSecondary }]}>Tidak ada item terdeteksi.</Text>
          ) : (
            result.food_items.map((item, idx) => (
              <View key={`${item.name}-${idx}`} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  {item.estimated_portion} - {item.estimated_calories} kcal
                </Text>
              </View>
            ))
          )}

          {result.notes ? <Text style={[styles.notes, { color: colors.textSecondary }]}>{result.notes}</Text> : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Kembali ke Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
  },
  usageCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  usageText: {
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  mealItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    fontWeight: '700',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 240,
  },
  analyzeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyzeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bigCalories: {
    fontSize: 34,
    fontWeight: '800',
    marginVertical: 4,
  },
  resultLine: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemsTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '800',
  },
  itemRow: {
    marginBottom: 6,
  },
  itemName: {
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 13,
  },
  notes: {
    marginTop: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});

export default FoodAiScreen;
