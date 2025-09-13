import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { get } from '../utils/api'
import useWorkspaceStore from '../stores/workspaceStore'

function Dashboard() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace)
  const lastWorkspaceId = useRef(null)

  useEffect(() => {
    if (currentWorkspace && currentWorkspace.id !== lastWorkspaceId.current) {
      lastWorkspaceId.current = currentWorkspace.id
      fetchIssues()
    }
  }, [currentWorkspace])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const data = await get('/api/issues')

      if (data.success) {
        setIssues(data.data)
      } else {
        setError('Failed to load issues')
      }
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#10b981'
      case 'in_progress': return '#f59e0b'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      case 'urgent': return '#dc2626'
      default: return '#6b7280'
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <h1 className="welcome-title">Welcome back!</h1>
        <p className="welcome-subtitle">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Issues List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: '0', color: '#1e293b', fontSize: '1.5rem' }}>Issues</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
            {loading ? 'Loading issues...' : `${issues.length} issues found`}
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#dc2626', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {issues.map((issue) => (
              <div key={issue.id} style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                hover: { backgroundColor: '#f8fafc' }
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      color: getStatusColor(issue.status),
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {issue.status ? issue.status.replace('_', ' ') : 'unknown'}
                    </span>
                    <span style={{
                      color: getPriorityColor(issue.priority),
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {issue.priority || 'medium'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1rem' }}>
                    {issue.title}
                  </h3>
                  <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem', lineHeight: '1.4' }}>
                    {issue.description.length > 100
                      ? `${issue.description.substring(0, 100)}...`
                      : issue.description
                    }
                  </p>
                  {issue.assignee && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                      Assigned to: {issue.assignee}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.75rem' }}>
                  {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard