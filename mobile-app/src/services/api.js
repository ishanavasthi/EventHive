import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 1. If you know your IP, enter it here (e.g., '192.168.1.5')
const MANUAL_IP = '';

// 2. Logic to determine URL dynamically
const getBaseUrl = () => {
  if (MANUAL_IP) {
    return `http://${MANUAL_IP}:5000/api`;
  }

  // Extract host IP from Expo hostUri (available when running via Expo Go)
  const expoHostIp = Constants.expoConfig?.hostUri?.split(':')?.shift() 
    || Constants.manifest2?.extra?.expoGo?.developer?.tool?.split(':')?.shift();

  let envUrl = process.env.EXPO_PUBLIC_API_URL;

  // On physical mobile device, replace localhost/127.0.0.1 with Expo host IP
  if (Platform.OS !== 'web' && expoHostIp && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return envUrl.replace('localhost', expoHostIp).replace('127.0.0.1', expoHostIp);
  }

  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5001/api';
  }

  if (expoHostIp) {
    return `http://${expoHostIp}:5001/api`;
  }

  return 'http://10.0.2.2:5001/api';
};

const BASE_URL = getBaseUrl();
console.log('API BASE_URL configured as:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(request => {
  console.log('Starting Request:', request.method, request.url);
  return request;
});

api.interceptors.response.use(response => {
  console.log('Response:', response.status, response.url);
  return response;
}, error => {
  console.error('API Error:', error.message);
  return Promise.reject(error);
});

export default api;
