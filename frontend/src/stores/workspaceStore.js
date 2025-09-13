import { create } from 'zustand'

const useWorkspaceStore = create((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  loading: false,

  // Fetch user's workspaces
  fetchWorkspaces: async () => {
    try {
      set({ loading: true })
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      // Get token from sessionStorage first, then localStorage
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        set({ workspaces: data.data })

        // Set current workspace to first one if not set
        const current = get().currentWorkspace
        if (!current && data.data.length > 0) {
          set({ currentWorkspace: data.data[0] })
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    } finally {
      set({ loading: false })
    }
  },

  // Set current workspace
  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace })
  },

  // Create new workspace
  createWorkspace: async (name, description) => {
    try {
      set({ loading: true })
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      // Get token from sessionStorage first, then localStorage
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh workspaces
        await get().fetchWorkspaces()
        return data.data
      }
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // Invite user to workspace
  inviteUser: async (workspaceId, email, role = 'member') => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      // Get token from sessionStorage first, then localStorage
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()

      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
      throw error
    }
  }
}))

export default useWorkspaceStore