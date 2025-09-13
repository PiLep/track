import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { post, get } from '../utils/api'
import useAuthStore from '../stores/authStore'
import useWorkspaceStore from '../stores/workspaceStore'

function Onboarding() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const setUser = useAuthStore((state) => state.setUser)
    const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace)

    const [invitation, setInvitation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        fetchInvitation()
    }, [token])

    const fetchInvitation = async () => {
        try {
            const response = await get(`/api/invitations/${token}`)
            if (response.success) {
                setInvitation(response.data)
                setFormData(prev => ({ ...prev, email: response.data.email }))
            } else {
                setError('Invalid or expired invitation link')
            }
        } catch (error) {
            console.error('Failed to fetch invitation:', error)
            setError('Failed to load invitation')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setSubmitting(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
            setSubmitting(false)
            return
        }

        if (!formData.username.trim()) {
            setError('Username is required')
            setSubmitting(false)
            return
        }

        try {
            const response = await post(`/api/invitations/${token}/accept`, {
                email: invitation.email,
                username: formData.username,
                full_name: formData.full_name,
                password: formData.password
            })

            if (response.success) {
                // Store authentication data
                localStorage.setItem('auth_token', response.data.token)
                setUser(response.data.user)
                setCurrentWorkspace(response.data.workspace)

                // Redirect to dashboard
                navigate('/dashboard')
            } else {
                setError(response.error || 'Failed to create account')
            }
        } catch (error) {
            console.error('Failed to accept invitation:', error)
            setError('Failed to create account')
        } finally {
            setSubmitting(false)
        }
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #667eea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: '#666' }}>Chargement de votre invitation...</p>
                </div>
            </div>
        )
    }

    if (error && !invitation) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    maxWidth: '400px'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Invitation non valide</h2>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Retour à la connexion
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden',
                    maxWidth: '500px',
                    width: '100%',
                    animation: 'fadeInUp 0.6s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold' }}>
                            Bienvenue sur Track !
                        </h1>
                        <p style={{ margin: '0', opacity: 0.9 }}>
                            Créez votre compte pour rejoindre <strong>{invitation?.workspace_name}</strong>
                        </p>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '2rem' }}>
                        {invitation && (
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>
                                    <strong>👤 Invité par:</strong> {invitation.inviter_name}
                                </p>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#555', fontSize: '0.9rem' }}>
                                    <strong>📧 Email:</strong> {invitation.email}
                                </p>
                                <p style={{ margin: '0', color: '#555', fontSize: '0.9rem' }}>
                                    <strong>🏷️ Rôle:</strong> {invitation.role === 'admin' ? 'Administrateur' : 'Membre'}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                }}>
                                    Nom d'utilisateur *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="johndoe"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                }}>
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                }}>
                                    Mot de passe *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    color: '#374151',
                                    fontWeight: '500'
                                }}>
                                    Confirmer le mot de passe *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.875rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}
                            >
                                {submitting ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Création du compte...
                                    </span>
                                ) : (
                                    '🚀 Rejoindre ' + invitation?.workspace_name
                                )}
                            </button>
                        </form>

                        <p style={{
                            textAlign: 'center',
                            marginTop: '1.5rem',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                        }}>
                            En créant votre compte, vous acceptez de rejoindre le workspace{' '}
                            <strong>{invitation?.workspace_name}</strong>
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Onboarding
