import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get stored token from localStorage
const getToken = () => localStorage.getItem('token');

// Set up axios interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (name, email, password, phone) =>
    api.post('/auth/register', { name, email, password, phone }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/users/me'),
  
  updateLocation: (lat, lng) =>
    api.post('/users/update-location', { lat, lng })
};

// Incidents API calls
export const incidentsAPI = {
  report: (type, severity, title, description, latitude, longitude, address) =>
    api.post('/incidents/report', { type, severity, title, description, latitude, longitude, address }),
  
  getAll: () =>
    api.get('/incidents'),
  
  getById: (id) =>
    api.get(`/incidents/${id}`),
  
  getNearby: (latitude, longitude, radius = 5000) =>
    api.get('/incidents/nearby', { params: { latitude, longitude, radius } }),
  
  updateStatus: (id, status) =>
    api.patch(`/incidents/${id}/status`, { status })
};

// Places API calls (Tourist attractions & Weather)
export const placesAPI = {
  getNearby: (lat, lng, radius = 5000, type = 'tourist_attraction') =>
    api.post('/places/nearby', { lat, lng, radius, type }),
  
  getSafeZones: (lat, lng, radius = 5000) =>
    api.post('/places/safe-zones', { lat, lng, radius }),
  
  getWeather: (lat, lng) =>
    api.post('/places/weather', { lat, lng })
};

export default api;
