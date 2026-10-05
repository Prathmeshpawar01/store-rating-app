import axios from 'axios';

export const TOKEN_KEY = 'storerate.token';
export const USER_KEY = 'storerate.user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on an authenticated request means the session is no longer valid:
// broadcast an event so AuthContext can clear the session and redirect to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthAttempt && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from an axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error?.request && !error.response) return 'Cannot reach the server. Check that the backend is running.';
  return fallback;
}

/** Field errors ({ field: message }) from a 400 response, if any. */
export const getFieldErrors = (error) => error?.response?.data?.errors || {};

const data = (promise) => promise.then((res) => res.data.data);

/** Drops empty values so they are not sent as query params. */
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  register: (body) => data(api.post('/auth/register', body)),
  me: () => data(api.get('/auth/me')),
  changePassword: (body) => data(api.post('/auth/change-password', body)),
};

export const adminApi = {
  dashboard: () => data(api.get('/admin/dashboard')),
  users: (params) => data(api.get('/admin/users', { params: clean(params) })),
  user: (id) => data(api.get(`/admin/users/${id}`)),
  createUser: (body) => data(api.post('/admin/users', body)),
  owners: () => data(api.get('/admin/owners')),
  stores: (params) => data(api.get('/admin/stores', { params: clean(params) })),
  store: (id) => data(api.get(`/admin/stores/${id}`)),
  createStore: (body) => data(api.post('/admin/stores', body)),
};

export const storeApi = {
  list: (params) => data(api.get('/stores', { params: clean(params) })),
  get: (id) => data(api.get(`/stores/${id}`)),
  submitRating: (id, rating) => data(api.post(`/stores/${id}/rating`, { rating })),
  updateRating: (id, rating) => data(api.put(`/stores/${id}/rating`, { rating })),
};

export const userApi = {
  profile: () => data(api.get('/users/me')),
  myRatings: () => data(api.get('/users/me/ratings')),
};

export const ownerApi = {
  dashboard: () => data(api.get('/owner/dashboard')),
  ratings: (params) => data(api.get('/owner/ratings', { params: clean(params) })),
};

export default api;
