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
  exercise_type: string;
  exp_earned: number;
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
  rank: string;
  next_rank: string | null;
  total_exp: number;
  exp_to_next_rank: number;
  rank_progress_percent: number;
}

export interface WorkoutHistoryItem {
  date: string;
  exercise: string;
  weight_kg: number;
  reps: number;
  sets: number;
  exercise_type: string;
  exp_earned: number;
}

export interface ExerciseProgress {
  exercise: string;
  weights: Array<{ date: string; weight: number }>;
}

export interface WorkoutHistory {
  workouts: WorkoutHistoryItem[];
  exercise_progress: ExerciseProgress[];
}

export interface ExerciseTypeDefinition {
  type_key: string;
  label: string;
  base_exp_per_rep: number;
  description: string;
}

export interface ExerciseCatalogItem {
  id: number;
  name: string;
  category: string;
  base_exp_per_rep: number;
}

export interface ExerciseTypeExp {
  type_key: string;
  total_exp: number;
}

export interface WorkoutGamificationSummary {
  rank: string;
  next_rank: string | null;
  total_exp: number;
  exp_to_next_rank: number;
  progress_percent: number;
  exercise_type_exp: ExerciseTypeExp[];
}

export type FitnessGoalType = 'weight_loss' | 'fat_loss' | 'muscle_gain' | 'recomposition';

export interface GoalProfileState {
  has_profile: boolean;
  goal_type: FitnessGoalType | null;
  updated_at: string | null;
}

export interface WeeklyMissionItem {
  item_key: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface WeeklyMissionSummary {
  week_start: string;
  week_end: string;
  goal_type: FitnessGoalType;
  checklist: WeeklyMissionItem[];
  completed_items: number;
  total_items: number;
  checklist_bonus_exp: number;
  all_completed_bonus_exp: number;
  total_bonus_exp: number;
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
