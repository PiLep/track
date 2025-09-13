import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import useWorkspaceStore from '../stores/workspaceStore'
import { getAvatarUrl } from '../utils/avatar'

function Layout({ children }) {
  const location = useLocation()
  const activePage = location.pathname === '/' ? 'dashboard' :
                     location.pathname.startsWith('/projects') ? 'projects' :
                     location.pathname.startsWith('/teams') ? 'teams' :
                     location.pathname.startsWith('/issues') ? 'issues' :
                     location.pathname.startsWith('/settings') ? 'settings' :
                     location.pathname.startsWith('/profile') ? 'profile' : 'dashboard'
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces)
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace)

  const workspacesFetched = useRef(false)

  useEffect(() => {
    if (user && !workspacesFetched.current) {
      workspacesFetched.current = true
      fetchWorkspaces()
    }
  }, [user]) // Remove fetchWorkspaces from dependencies

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Track</h1>
        </div>

        <nav className="sidebar-nav">
          <a
            href="#"
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a
            href="#"
            className={`nav-item ${activePage === 'projects' ? 'active' : ''}`}
            onClick={() => navigate('/projects')}
          >
            <span className="nav-icon">📁</span>
            Projects
          </a>
           <a
             href="#"
             className={`nav-item ${activePage === 'issues' ? 'active' : ''}`}
             onClick={() => navigate('/issues')}
           >
             <span className="nav-icon">📋</span>
             Issues
           </a>
           <a
             href="#"
             className={`nav-item ${activePage === 'teams' ? 'active' : ''}`}
             onClick={() => navigate('/teams')}
           >
             <span className="nav-icon">👥</span>
             Teams
           </a>
           <a
             href="#"
             className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
             onClick={() => navigate('/settings')}
           >
             <span className="nav-icon">⚙️</span>
             Settings
           </a>
        </nav>

        {/* Workspace Switcher */}
        {workspaces.length > 1 && (
          <div className="sidebar-workspace">
            <div className="workspace-selector">
              <select
                value={currentWorkspace?.id || ''}
                onChange={(e) => {
                  const workspace = workspaces.find(w => w.id === parseInt(e.target.value))
                  if (workspace) {
                    setCurrentWorkspace(workspace)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  fontSize: '0.875rem',
                  marginBottom: '0'
                }}
              >
                {workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="sidebar-profile">
          <div className="profile-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
            <div className="profile-avatar">
              <img
                src={getAvatarUrl(user?.email, user?.avatar_url, 40)}
                alt="Profile"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div
                style={{
                  display: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#667eea',
                  color: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                {getInitials(user?.email)}
              </div>
            </div>
            <div className="profile-details">
              <h4>{user?.full_name || user?.username || user?.email}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <div
            className="sidebar-logout"
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.875rem',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8fafc'
              e.target.style.color = '#1e293b'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#64748b'
            }}
          >
            <span style={{ marginRight: '0.5rem' }}>🚪</span>
            Sign out
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout