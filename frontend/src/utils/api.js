// API utility functions with authentication
const API_BASE = 'http://localhost:3001'

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

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