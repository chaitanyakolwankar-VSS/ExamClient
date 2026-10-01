import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? 'https://localhost:7225/api' : '/ExamAPI/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Endpoints where a 401 is an expected answer (bad credentials / OTP flow), not an expired session.
const AUTH_EXEMPT_URLS = ['/Auth/', '/SendResetOtp/'];

let redirectingToSignIn = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? '';
    const isAuthCall = AUTH_EXEMPT_URLS.some((p) => url.includes(p));

    if (error?.response?.status === 401 && !isAuthCall) {
      // Same session teardown as AuthContext.logout().
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('academicYear');
      localStorage.clear();

      // Router basename is derived from Vite's base path in App.tsx; keep them in sync.
      const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
      const signInPath = `${basename}/signin`;
      const onSignIn = window.location.pathname.replace(/\/$/, '').toLowerCase() === signInPath.toLowerCase();

      if (!onSignIn && !redirectingToSignIn) {
        redirectingToSignIn = true;
        window.location.assign(signInPath);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;