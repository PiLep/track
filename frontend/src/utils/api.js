// API utility functions with authentication
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// Utility to check if a token is a valid JWT format
const isValidJWTFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Utility to clean corrupted tokens
const cleanCorruptedTokens = () => {
  const sessionToken = sessionStorage.getItem('auth_token');
  const localToken = localStorage.getItem('auth_token');
  const legacyToken = localStorage.getItem('token');
  
  // Clean sessionStorage token if corrupted or "null" string
  if (sessionToken && (!isValidJWTFormat(sessionToken) || sessionToken === 'null' || sessionToken === 'undefined')) {
    sessionStorage.removeItem('auth_token');
  }
  
  // Clean localStorage token if corrupted or "null" string
  if (localToken && (!isValidJWTFormat(localToken) || localToken === 'null' || localToken === 'undefined')) {
    localStorage.removeItem('auth_token');
  }
  
  // Clean legacy token if corrupted or "null" string
  if (legacyToken && (!isValidJWTFormat(legacyToken) || legacyToken === 'null' || legacyToken === 'undefined')) {
    localStorage.removeItem('token');
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  // Clean any corrupted tokens first
  cleanCorruptedTokens();
  
  // Check for token in both storages (prioritize sessionStorage for current session)
  const sessionToken = sessionStorage.getItem('auth_token');
  const localToken = localStorage.getItem('auth_token');
  const legacyToken = localStorage.getItem('token');
  
  // Filter out "null" strings and empty strings
  const validSessionToken = sessionToken && sessionToken !== 'null' && sessionToken !== 'undefined' ? sessionToken : null;
  const validLocalToken = localToken && localToken !== 'null' && localToken !== 'undefined' ? localToken : null;
  const validLegacyToken = legacyToken && legacyToken !== 'null' && legacyToken !== 'undefined' ? legacyToken : null;
  
  const token = validSessionToken || validLocalToken || validLegacyToken;
  
  // If no valid token found, redirect to login
  if (!token) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('No authentication token found');
  }
  
  // Validate token format
  if (!isValidJWTFormat(token)) {
    cleanCorruptedTokens();
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Invalid token format');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  // Add workspace_id to query params if not already present
  let finalEndpoint = endpoint
  if (!endpoint.includes('workspace_id=') && !endpoint.includes('/workspaces')) {
    try {
      // Import here to avoid circular dependency
      const useWorkspaceStore = (await import('../stores/workspaceStore')).default
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace

      if (currentWorkspace && !endpoint.includes('?')) {
        finalEndpoint += `?workspace_id=${currentWorkspace.id}`
      } else if (currentWorkspace && endpoint.includes('?')) {
        finalEndpoint += `&workspace_id=${currentWorkspace.id}`
      }
    } catch (error) {
      // Ignore import errors
    }
  }

  const response = await fetch(`${API_BASE}${finalEndpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    console.error(`❌ API Error (${response.status}):`, data);
    
    // Handle authentication errors specifically
    if (response.status === 401) {
      console.error('🚫 Authentication error:', data);
      
      // Clean up invalid tokens based on error code
      if (data.code === 'INVALID_TOKEN' || data.code === 'TOKEN_EXPIRED') {
        console.log('🧹 Cleaning up invalid/expired tokens...');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        }
      }
    }
    
    throw new Error(data.error || 'API request failed')
  }

  return data
}

export const get = (endpoint) => apiRequest(endpoint)
export const post = (endpoint, data) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
})
export const put = (endpoint, data) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
})
export const del = (endpoint) => apiRequest(endpoint, {
  method: 'DELETE'
})