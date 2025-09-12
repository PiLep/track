import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { get } from '../utils/api'
import useWorkspaceStore from '../stores/workspaceStore'

function Issues() {
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
        <h1 className="welcome-title">Issues</h1>
        <p className="welcome-subtitle">
          Track and manage all your project issues in one place
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Issues List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: '0', color: '#1e293b', fontSize: '1.5rem' }}>All Issues</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
            {loading ? 'Loading issues...' : `${issues.length} issues found`}
          </p>
        </div>

        {!loading && !error && (
          <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
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
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Project: {issue.project_name || 'Unknown'}</span>
                    {issue.assignee && <span>Assigned to: {issue.assignee}</span>}
                    {issue.reporter && <span>Reported by: {issue.reporter}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.75rem' }}>
                  {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && issues.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No issues yet</h3>
          <p style={{ margin: '0', color: '#64748b' }}>Issues will appear here once they're created in your projects</p>
         </div>
       )}
     </>
   )
}

export default Issues