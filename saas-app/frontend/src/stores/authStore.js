import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,

  login: async (userData, token) => {
    if (token) {
      localStorage.setItem('token', token)
    }
    set({ isAuthenticated: true, user: userData, token })

    // Initialize workspaces
    try {
      const useWorkspaceStore = (await import('./workspaceStore')).default
      await useWorkspaceStore.getState().fetchWorkspaces()
    } catch (error) {
      console.error('Failed to initialize workspaces:', error)
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ isAuthenticated: false, user: null, token: null })
  },

  updateUser: (userData) => {
    set({ user: userData })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        set({ isAuthenticated: true, user: data.data.user, token })
        return true
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token')
        return false
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      return false
    }
  }
}))

export default useAuthStore