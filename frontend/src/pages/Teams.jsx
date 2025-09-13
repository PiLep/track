import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { get } from '../utils/api'
import useWorkspaceStore from '../stores/workspaceStore'

function Teams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace)
  const lastWorkspaceId = useRef(null)

  useEffect(() => {
    if (currentWorkspace && currentWorkspace.id !== lastWorkspaceId.current) {
      lastWorkspaceId.current = currentWorkspace.id
      fetchTeams()
    }
  }, [currentWorkspace])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const data = await get('/api/teams')

      if (data.success) {
        setTeams(data.data)
      } else {
        setError('Failed to load teams')
      }
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="dashboard-welcome">
        <h1 className="welcome-title">Teams</h1>
        <p className="welcome-subtitle">
          Manage and collaborate with your teams
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Teams List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading teams...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>Team</div>
            <div>Members</div>
            <div>Projects</div>
            <div>Created</div>
          </div>

          {/* Teams List */}
          <div>
            {teams.map((team, index) => (
              <div key={team.id} style={{
                padding: '1.5rem',
                borderBottom: index < teams.length - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '1rem',
                alignItems: 'center',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              >
                {/* Team Info */}
                <div>
                  <h3 style={{
                    margin: '0 0 0.25rem 0',
                    color: '#1e293b',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    {team.name}
                  </h3>
                  <p style={{
                    margin: '0',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {team.description}
                  </p>
                  {team.member_names && team.member_names.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      {team.member_names.slice(0, 3).join(', ')}
                      {team.member_names.length > 3 && ` +${team.member_names.length - 3} more`}
                    </div>
                  )}
                </div>

                {/* Members Count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>👥</span>
                  <span style={{ color: '#1e293b', fontWeight: '500' }}>
                    {team.member_count}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    member{team.member_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Projects Count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>📁</span>
                  <span style={{ color: '#1e293b', fontWeight: '500' }}>
                    {team.project_count}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    project{team.project_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Created Date */}
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && teams.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No teams yet</h3>
          <p style={{ margin: '0', color: '#64748b' }}>Create your first team to get started</p>
        </div>
      )}
    </>
  )
}

export default Teams