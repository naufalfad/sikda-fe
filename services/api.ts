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
      const existingAuth = config.headers?.get 
        ? config.headers.get('Authorization') 
        : (config.headers?.Authorization || config.headers?.authorization);
      
      if (existingAuth) {
        return config;
      }

      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        const token = parsedData?.state?.token;
        if (token) {
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

export default api;
