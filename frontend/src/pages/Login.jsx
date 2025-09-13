import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { getAvatarUrl } from '../utils/avatar'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email, password, remember_me: rememberMe }
        : { email, username, full_name: fullName, password }

      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        // Update auth store (which handles token storage based on rememberMe)
        await login(data.data.user, data.data.token, rememberMe)
        navigate('/')
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchAccount = () => {
    logout()
    setEmail('')
    setPassword('')
    setUsername('')
    setFullName('')
    setError('')
    setRememberMe(false)
  }

  // If user is authenticated, show current user card
  if (isAuthenticated && user) {
    return (
      <div className="login-container">
        <h1 className="login-title">Track</h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>You're signed in</p>

        {/* Current User Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <img
              src={getAvatarUrl(user?.email, user?.avatar_url, 60)}
              alt="Profile"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginRight: '1rem'
              }}
            />
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1.25rem' }}>
                {user.full_name || user.username}
              </h3>
              <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>{user.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5a67d8'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#667eea'
              }}
            >
              Continue as {user.full_name?.split(' ')[0] || user.username}
            </button>

            <button
              onClick={handleSwitchAccount}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #d1d5db',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.color = '#374151'
                e.target.style.borderColor = '#9ca3af'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#64748b'
                e.target.style.borderColor = '#d1d5db'
              }}
            >
              <span>🚪</span>
              Sign out
            </button>
          </div>
        </div>

        {/* Switch Account Section */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
            Want to use a different account?
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
            Sign out above and sign in with another account
          </p>
          <button
            onClick={handleSwitchAccount}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#059669'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#10b981'
            }}
          >
            Use another account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <h1 className="login-title">Track</h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </p>

      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            disabled={loading}
          />
        </div>

        {!isLogin && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
            disabled={loading}
            minLength="6"
          />
        </div>

        {isLogin && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
              disabled={loading}
            />
            <label htmlFor="rememberMe" style={{ color: '#374151', cursor: 'pointer' }}>
              Keep me signed in for 30 days
            </label>
          </div>
        )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
            setEmail('')
            setPassword('')
            setUsername('')
            setFullName('')
            setRememberMe(false)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline'
          }}
          disabled={loading}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

export default Login