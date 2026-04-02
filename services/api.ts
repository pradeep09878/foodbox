import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Replace this IP with your machine's local IP address when testing on a physical device.
// To find your IP on Windows: run `ipconfig` in cmd and look for IPv4 Address.
// Example: 'http://192.168.1.100:3000/api'
const API_BASE_URL = 'https://foodboxapi.apparelindia.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Network error. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
