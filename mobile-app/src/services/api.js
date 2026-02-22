import axios from 'axios';
import Constants from 'expo-constants';

// 1. If you know your IP, enter it here (e.g., '192.168.1.5')
const MANUAL_IP = '';

// 2. Logic to determine URL
// Default to Render Backend
let uri = 'https://eventhive-l9j5.onrender.com/api';

// Uncomment the below logic if you want to switch back to local development
/*
if (MANUAL_IP) {
  uri = `http://${MANUAL_IP}:5000/api`;
} else if (Constants.expoConfig?.hostUri) {
  // Dynamic IP from Expo (LAN)
  const ip = Constants.expoConfig.hostUri.split(':').shift();
  uri = `http://${ip}:5000/api`;
} else {
  // Fallback for Android Simulator if no hostUri
  // uri = 'http://10.0.2.2:5000/api'; 
}
*/
const BASE_URL = uri;
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