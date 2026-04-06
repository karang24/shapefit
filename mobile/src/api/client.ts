import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_CONFIG = {
  // For development with Android emulator
  // emulator: 'http://10.0.2.2:8000',
  // simulator: 'http://localhost:8000',
  // device: 'http://192.168.1.4:8000',
  // production: 'https://your-api-domain.com/api',

  development: 'http://192.168.1.4:8000',
  production: 'http://192.168.1.4:8000i',
};

// Use EXPO_PUBLIC_API_BASE_URL when provided, otherwise default to local network dev URL.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? API_CONFIG.development;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_CONFIG, API_BASE_URL };
