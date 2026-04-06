export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  coach_id: number | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
}

export interface WorkoutLog {
  id: number;
  session_id: number;
  exercise: string;
  weight_kg: number;
  reps: number;
  sets: number;
  created_at: string;
}

export interface BodyMetric {
  id: number;
  user_id: number;
  weight_kg: number;
  waist_cm: number | null;
  date: string;
  created_at: string;
}

export interface DashboardSummary {
  sessions_this_week: number;
  latest_weight: number | null;
  latest_waist: number | null;
}

export interface WorkoutHistoryItem {
  date: string;
  exercise: string;
  weight_kg: number;
  reps: number;
  sets: number;
}

export interface ExerciseProgress {
  exercise: string;
  weights: Array<{ date: string; weight: number }>;
}

export interface WorkoutHistory {
  workouts: WorkoutHistoryItem[];
  exercise_progress: ExerciseProgress[];
}

export type SexType = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'deficit' | 'maintenance' | 'surplus';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CalorieTargetRequest {
  age: number;
  sex: SexType;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  goal: GoalType;
  deficit_percent?: number;
  surplus_percent?: number;
}

export interface CalorieTargetResponse {
  formula: string;
  bmr: number;
  activity_multiplier: number;
  maintenance_calories: number;
  goal: GoalType;
  target_calories: number;
  adjustment_kcal: number;
}

export interface NutritionDailyUsage {
  used: number;
  limit: number;
  remaining: number;
}

export interface AnalyzeMealImageRequest {
  image_base64: string;
  mime_type?: string;
  meal_type: MealType;
}

export interface NutritionFoodItem {
  name: string;
  estimated_portion: string;
  estimated_calories: number;
}

export interface AnalyzeMealImageResponse {
  meal_type: MealType;
  estimated_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  food_items: NutritionFoodItem[];
  notes: string;
  model: string;
  daily_usage: NutritionDailyUsage;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
