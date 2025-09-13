import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  rememberMe: false,

  login: async (userData, token, rememberMe = false) => {
    if (token) {
      let isRememberToken = false;
      
      // Decode JWT to check if it's a remember_me token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isRememberToken = payload.remember_me || rememberMe;
      } catch (error) {
        isRememberToken = rememberMe;
      }
      
      // Store token based on remember_me preference (only if token is valid)
      if (token && token !== 'null' && token !== 'undefined' && typeof token === 'string' && token.length > 10) {
        if (isRememberToken) {
          localStorage.setItem('auth_token', token);
          sessionStorage.removeItem('auth_token');
        } else {
          sessionStorage.setItem('auth_token', token);
          localStorage.removeItem('auth_token');
        }
      } else {
        throw new Error('Invalid token provided');
      }
      
      // Clean up legacy tokens
      localStorage.removeItem('token');
      
      set({ 
        isAuthenticated: true, 
        user: userData, 
        token,
        rememberMe: isRememberToken
      });
    } else {
      set({ isAuthenticated: true, user: userData, token, rememberMe: false });
    }

    // Initialize workspaces
    try {
      const useWorkspaceStore = (await import('./workspaceStore')).default
      await useWorkspaceStore.getState().fetchWorkspaces()
    } catch (error) {
      console.error('Failed to initialize workspaces:', error)
    }
  },

  logout: () => {
    // Remove tokens from both storages
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    // Legacy cleanup
    localStorage.removeItem('token');
    set({ isAuthenticated: false, user: null, token: null, rememberMe: false })
  },

  updateUser: (userData) => {
    set({ user: userData })
  },

  checkAuth: async () => {
    // Check for token in both storages (prioritize sessionStorage for current session)
    const sessionToken = sessionStorage.getItem('auth_token');
    const localToken = localStorage.getItem('auth_token');
    const legacyToken = localStorage.getItem('token');
    
    // Filter out "null" strings and invalid values
    const validSessionToken = sessionToken && sessionToken !== 'null' && sessionToken !== 'undefined' ? sessionToken : null;
    const validLocalToken = localToken && localToken !== 'null' && localToken !== 'undefined' ? localToken : null;
    const validLegacyToken = legacyToken && legacyToken !== 'null' && legacyToken !== 'undefined' ? legacyToken : null;
    
    let token = validSessionToken || validLocalToken || validLegacyToken;
    
    // Clean up any corrupted tokens found during check
    if (sessionToken && (sessionToken === 'null' || sessionToken === 'undefined')) {
      sessionStorage.removeItem('auth_token');
    }
    if (localToken && (localToken === 'null' || localToken === 'undefined')) {
      localStorage.removeItem('auth_token');
    }
    if (legacyToken && (legacyToken === 'null' || legacyToken === 'undefined')) {
      localStorage.removeItem('token');
    }
    
    if (!token) {
      return false;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Decode token to determine remember_me status
        let isRememberToken = false;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          isRememberToken = payload.remember_me || false;
        } catch (decodeError) {
          isRememberToken = false;
        }
        
        set({ 
          isAuthenticated: true, 
          user: data.data.user, 
          token,
          rememberMe: isRememberToken
        });
        
        return true;
      } else {
        // Token is invalid, remove from both storages
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('token'); // Legacy cleanup
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Remove invalid tokens
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('token'); // Legacy cleanup
      return false;
    }
  }
}))

export default useAuthStore