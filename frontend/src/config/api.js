// API Configuration
// Centralized API URL management

export const API_BASE_URL = process.env.REACT_APP_API_BASE || 'https://13.250.60.234:8443';

// Helper function to build API URLs
export const getApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Export for backward compatibility
export const API_BASE = API_BASE_URL;

export default API_BASE_URL;
