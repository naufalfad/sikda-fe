import axios from 'axios';

// Buat instance axios terpusat
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', // sesuaikan dengan port backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to automatically inject token
api.interceptors.request.use((config) => {
  try {
    // Only access localStorage if in browser environment
    if (typeof window !== 'undefined') {
      const isPortalPasienGuestOrPatient =
        config.url &&
        config.url.includes('/portal-pasien') &&
        !config.url.includes('/portal-pasien/faskes-bookings') &&
        !config.url.includes('/portal-pasien/check-in');

      if (isPortalPasienGuestOrPatient) {
        // If config already specified an Authorization header, respect it
        const existingAuth = config.headers?.get 
          ? config.headers.get('Authorization') 
          : (config.headers?.Authorization || config.headers?.authorization);
        
        if (existingAuth) {
          return config;
        }

        const portalToken = localStorage.getItem('siapkes_pasien_token');
        if (portalToken) {
          if (config.headers?.set) {
            config.headers.set('Authorization', `Bearer ${portalToken}`);
          } else {
            config.headers.Authorization = `Bearer ${portalToken}`;
          }
        }
        // IMPORTANT: Never use admin/staff auth-storage for portal-pasien endpoints
        return config;
      }

      // Standard Admin/Staff auth
      let existingAuth = config.headers?.get 
        ? config.headers.get('Authorization') 
        : (config.headers?.Authorization || config.headers?.authorization);
      
      if (existingAuth && typeof existingAuth === 'string' && (existingAuth.includes('undefined') || existingAuth.includes('null'))) {
        existingAuth = null;
      }

      if (existingAuth) {
        return config;
      }

      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        const token = parsedData?.state?.token;
        if (token && typeof token === 'string' && token !== 'undefined' && token !== 'null') {
          if (config.headers?.set) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse auth token', error);
  }
  return config;
});


// Response interceptor to handle expired sessions / 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isAuthOrPortal = pathname.startsWith('/login') || pathname.startsWith('/portal-pasien') || pathname.startsWith('/booking');
        if (!isAuthOrPortal) {
          console.warn('[API 401] Sesi telah berakhir atau tidak valid. Membersihkan sesi lokal...');
          localStorage.removeItem('auth-storage');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
