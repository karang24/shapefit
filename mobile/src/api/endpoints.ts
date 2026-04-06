import apiClient from './client';
import {
  User,
  Session,
  WorkoutLog,
  BodyMetric,
  DashboardSummary,
  WorkoutHistory,
  ExerciseProgress,
  CalorieTargetRequest,
  CalorieTargetResponse,
  NutritionDailyUsage,
  AnalyzeMealImageRequest,
  AnalyzeMealImageResponse,
} from '../types';

type AuthTokenResponse = {
  access_token: string;
  token_type: string;
};

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const response = await apiClient.post<User>('/api/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);
    const response = await apiClient.post<AuthTokenResponse>('/api/auth/login', formBody.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  getMe: async (accessToken?: string) => {
    const response = await apiClient.get<User>('/api/auth/me', accessToken ? {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    } : undefined);
    return response.data;
  },
};

export const sessionsApi = {
  start: async (qrToken: string) => {
    const response = await apiClient.post<Session>('/api/sessions/start', {
      qr_token: qrToken,
    });
    return response.data;
  },
  getActive: async () => {
    const response = await apiClient.get<Session>('/api/sessions/active');
    return response.data;
  },
  finish: async (sessionId: number, notes?: string) => {
    const response = await apiClient.put<Session>(`/api/sessions/${sessionId}/finish`, {
      end_time: new Date().toISOString(),
      notes,
    });
    return response.data;
  },
};

export const workoutsApi = {
  add: async (sessionId: number, exercise: string, weightKg: number, reps: number, sets: number) => {
    const response = await apiClient.post<WorkoutLog>('/api/workouts/', {
      session_id: sessionId,
      exercise,
      weight_kg: weightKg,
      reps,
      sets,
    });
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get<WorkoutHistory>('/api/workouts/history');
    return response.data;
  },
  getProgress: async (exercise: string) => {
    const response = await apiClient.get<ExerciseProgress>(`/api/workouts/progress/${exercise}`);
    return response.data;
  },
};

export const bodyMetricsApi = {
  log: async (weightKg: number, waistCm: number | null, date: string) => {
    const response = await apiClient.post<BodyMetric>('/api/body-metrics/', {
      weight_kg: weightKg,
      waist_cm: waistCm,
      date,
    });
    return response.data;
  },
  getAll: async () => {
    const response = await apiClient.get<BodyMetric[]>('/api/body-metrics/');
    return response.data;
  },
  getLatest: async () => {
    const response = await apiClient.get<BodyMetric>('/api/body-metrics/latest');
    return response.data;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get<DashboardSummary>('/api/dashboard');
    return response.data;
  },
};

export const nutritionApi = {
  calculateCalorieTarget: async (payload: CalorieTargetRequest) => {
    const response = await apiClient.post<CalorieTargetResponse>('/api/nutrition/calorie-target', payload);
    return response.data;
  },
  getUsageToday: async () => {
    const response = await apiClient.get<NutritionDailyUsage>('/api/nutrition/usage-today');
    return response.data;
  },
  analyzeMealImage: async (payload: AnalyzeMealImageRequest) => {
    const response = await apiClient.post<AnalyzeMealImageResponse>('/api/nutrition/analyze-image', payload);
    return response.data;
  },
};
