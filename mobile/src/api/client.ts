import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Force API to VPS to avoid stale env/fallback issues during local Android testing.
const API_BASE_URL = 'http://31.97.222.194:8008';

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
    console.log('[API Request]', `${config.baseURL ?? ''}${config.url ?? ''}`);
    return config;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.status, `${response.config.baseURL ?? ''}${response.config.url ?? ''}`);
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const fullUrl = `${error?.config?.baseURL ?? ''}${error?.config?.url ?? ''}`;
    console.error('[API Response Error]', status, fullUrl, error?.response?.data);
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
