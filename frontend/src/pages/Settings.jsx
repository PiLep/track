import React, { useState, useEffect, useRef } from 'react'
import { post, put, get } from '../utils/api'
import useWorkspaceStore from '../stores/workspaceStore'
import { getAvatarUrl } from '../utils/avatar'

function Settings() {
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace)

  const [activeTab, setActiveTab] = useState('workspace')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const prevWorkspaceIdRef = useRef(null)

  // Workspace settings
  const [workspaceData, setWorkspaceData] = useState({
    name: currentWorkspace?.name || '',
    description: currentWorkspace?.description || '',
    domain_name: currentWorkspace?.domain_name || '',
    require_domain_membership: currentWorkspace?.require_domain_membership || false
  })

  // Members
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceData({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        domain_name: currentWorkspace.domain_name || '',
        require_domain_membership: currentWorkspace.require_domain_membership || false
      })

      // Fetch members when workspace changes or when members tab is active
      if (prevWorkspaceIdRef.current !== currentWorkspace.id || activeTab === 'members') {
        if (prevWorkspaceIdRef.current !== currentWorkspace.id) {
          prevWorkspaceIdRef.current = currentWorkspace.id
        }
        fetchMembers()
      }
    }
  }, [currentWorkspace, activeTab])

  const fetchMembers = async () => {
    if (!currentWorkspace) return

    try {
      setMembersLoading(true)
      const response = await get(`/api/workspaces/${currentWorkspace.id}/members`)
      if (response.success) {
        setMembers(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const handleWorkspaceUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await put(`/api/workspaces/${currentWorkspace.id}`, workspaceData)
      if (response.success) {
        // Update current workspace with new data
        const workspaceStore = useWorkspaceStore.getState()
        workspaceStore.setCurrentWorkspace(response.data)
        setMessage('Workspace updated successfully!')
      } else {
        setMessage(response.error || 'Failed to update workspace')
      }
    } catch (error) {
      setMessage('Error updating workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !currentWorkspace) return

    try {
      setInviting(true)
      const response = await post(`/api/workspaces/${currentWorkspace.id}/invite`, {
        email: inviteEmail,
        role: inviteRole
      })

      if (response.success) {
        setMessage('User invited successfully!')
        setInviteEmail('')
        setInviteRole('member')
        // Refresh members list
        await fetchMembers()
      } else {
        setMessage(response.error || 'Failed to invite user')
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
      setMessage('Error inviting user')
    } finally {
      setInviting(false)
    }
  }

  const tabs = [
    { id: 'workspace', label: 'Workspace', icon: '🏢' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' }
  ]

  return (
    <>
      <div className="dashboard-welcome">
        <h1 className="welcome-title">Settings</h1>
        <p className="welcome-subtitle">
          Manage your account and workspace preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Sidebar */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Settings</h3>
          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === tab.id ? '#667eea' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ marginRight: '0.75rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '2rem',
              borderRadius: '8px',
              background: message.includes('success') ? '#d1fae5' : '#fee2e2',
              color: message.includes('success') ? '#065f46' : '#dc2626',
              border: `1px solid ${message.includes('success') ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message}
            </div>
          )}

          {activeTab === 'workspace' && (
            <div>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Workspace Settings</h2>
              <form onSubmit={handleWorkspaceUpdate}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceData.name}
                    onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={workspaceData.description}
                    onChange={(e) => setWorkspaceData({ ...workspaceData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    Domain (optional)
                  </label>
                  <input
                    type="text"
                    value={workspaceData.domain_name}
                    onChange={(e) => setWorkspaceData({ ...workspaceData, domain_name: e.target.value })}
                    placeholder="e.g., company.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    Users with emails from this domain can be invited to join
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={workspaceData.require_domain_membership}
                      onChange={(e) => setWorkspaceData({ ...workspaceData, require_domain_membership: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#374151', fontWeight: '500' }}>
                      Require domain membership for invitations
                    </span>
                  </label>
                  <p style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    Only users with emails from the specified domain can join
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

           {activeTab === 'members' && (
             <div>
               <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Workspace Members</h2>

               {/* Invite User Form */}
               <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                 <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Invite New Member</h3>
                 <form onSubmit={handleInviteUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>
                       Email Address
                     </label>
                     <input
                       type="email"
                       value={inviteEmail}
                       onChange={(e) => setInviteEmail(e.target.value)}
                       placeholder="user@example.com"
                       style={{
                         width: '100%',
                         padding: '0.75rem',
                         border: '1px solid #d1d5db',
                         borderRadius: '6px',
                         fontSize: '0.875rem'
                       }}
                       required
                     />
                   </div>
                   <div>
                     <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>
                       Role
                     </label>
                     <select
                       value={inviteRole}
                       onChange={(e) => setInviteRole(e.target.value)}
                       style={{
                         padding: '0.75rem',
                         border: '1px solid #d1d5db',
                         borderRadius: '6px',
                         fontSize: '0.875rem',
                         minWidth: '120px'
                       }}
                     >
                       <option value="member">Member</option>
                       <option value="admin">Admin</option>
                     </select>
                   </div>
                   <button
                     type="submit"
                     disabled={inviting}
                     style={{
                       padding: '0.75rem 1.5rem',
                       background: '#10b981',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: inviting ? 'not-allowed' : 'pointer'
                     }}
                   >
                     {inviting ? 'Inviting...' : 'Invite'}
                   </button>
                 </form>
               </div>

               {/* Members List */}
               <div>
                 <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
                   Current Members ({members.length})
                 </h3>

                 {membersLoading ? (
                   <p style={{ color: '#64748b' }}>Loading members...</p>
                 ) : members.length === 0 ? (
                   <p style={{ color: '#64748b' }}>No members found.</p>
                 ) : (
                   <div style={{ display: 'grid', gap: '0.75rem' }}>
                     {members.map((member) => (
                       <div key={member.membership_id} style={{
                         display: 'flex',
                         alignItems: 'center',
                         padding: '1rem',
                         border: '1px solid #e5e7eb',
                         borderRadius: '8px',
                         background: 'white'
                       }}>
                         <div style={{ position: 'relative', marginRight: '1rem' }}>
                           <img
                             src={getAvatarUrl(member.email, member.avatar_url, 40)}
                             alt="Avatar"
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
                               position: 'absolute',
                               top: 0,
                               left: 0,
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
                             {member.email ? member.email.charAt(0).toUpperCase() : 'U'}
                           </div>
                         </div>
                         <div style={{ flex: 1 }}>
                           <div style={{ fontWeight: '500', color: '#1e293b' }}>
                             {member.full_name || member.username || member.email.split('@')[0]}
                           </div>
                           <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                             {member.email}
                           </div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <span style={{
                             padding: '0.25rem 0.75rem',
                             borderRadius: '12px',
                             fontSize: '0.75rem',
                             fontWeight: '500',
                             background: member.role === 'owner' ? '#fef3c7' : member.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                             color: member.role === 'owner' ? '#92400e' : member.role === 'admin' ? '#1e40af' : '#374151'
                           }}>
                             {member.role}
                           </span>
                           <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                             Joined {new Date(member.joined_at).toLocaleDateString()}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}

           {activeTab === 'billing' && (
             <div>
               <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Billing & Subscription</h2>

               {/* Current Plan */}
               <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                 <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Current Plan</h3>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                       Free Plan
                     </div>
                     <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                       Perfect for getting started with your team
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                       $0
                     </div>
                     <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                       per month
                     </div>
                   </div>
                 </div>
                 <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                     <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                       <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>5</div>
                       <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Team Members</div>
                     </div>
                     <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                       <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>100</div>
                       <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Issues per month</div>
                     </div>
                     <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                       <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>2GB</div>
                       <div style={{ color: '#64748b', fontSize: '0.875rem' }}>File Storage</div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Upgrade Options */}
               <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                 <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Upgrade Your Plan</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                   <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f8fafc' }}>
                     <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Pro Plan</h4>
                     <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                       $19<span style={{ fontSize: '1rem', fontWeight: '400' }}>/month</span>
                     </div>
                     <ul style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem 0', paddingLeft: '1.25rem' }}>
                       <li>Up to 25 team members</li>
                       <li>Unlimited issues</li>
                       <li>10GB file storage</li>
                       <li>Priority support</li>
                     </ul>
                     <button
                       style={{
                         width: '100%',
                         padding: '0.75rem',
                         background: '#667eea',
                         color: 'white',
                         border: 'none',
                         borderRadius: '6px',
                         fontSize: '0.875rem',
                         fontWeight: '500',
                         cursor: 'pointer'
                       }}
                     >
                       Upgrade to Pro
                     </button>
                   </div>

                   <div style={{ padding: '1.5rem', border: '2px solid #667eea', borderRadius: '8px', background: '#f0f4ff', position: 'relative' }}>
                     <div style={{
                       position: 'absolute',
                       top: '-10px',
                       right: '1rem',
                       background: '#667eea',
                       color: 'white',
                       padding: '0.25rem 0.75rem',
                       borderRadius: '12px',
                       fontSize: '0.75rem',
                       fontWeight: '600'
                     }}>
                       Most Popular
                     </div>
                     <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Enterprise Plan</h4>
                     <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                       $49<span style={{ fontSize: '1rem', fontWeight: '400' }}>/month</span>
                     </div>
                     <ul style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem 0', paddingLeft: '1.25rem' }}>
                       <li>Unlimited team members</li>
                       <li>Unlimited issues</li>
                       <li>100GB file storage</li>
                       <li>24/7 phone support</li>
                       <li>Custom integrations</li>
                     </ul>
                     <button
                       style={{
                         width: '100%',
                         padding: '0.75rem',
                         background: '#667eea',
                         color: 'white',
                         border: 'none',
                         borderRadius: '6px',
                         fontSize: '0.875rem',
                         fontWeight: '500',
                         cursor: 'pointer'
                       }}
                     >
                       Upgrade to Enterprise
                     </button>
                   </div>
                 </div>
               </div>

               {/* Billing History */}
               <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                 <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Billing History</h3>
                 <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                   No billing history available. Upgrade your plan to start using premium features.
                 </p>
               </div>
             </div>
           )}

           {activeTab === 'integrations' && (
             <div>
               <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Integrations</h2>
               <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                 Connect your favorite tools and services to streamline your workflow.
               </p>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                 {/* Slack Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#4a154b',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       💬
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Slack</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Get notifications in Slack channels
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#4a154b',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Connect Slack
                   </button>
                 </div>

                 {/* GitHub Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#24292e',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       🐙
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>GitHub</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Link issues to GitHub pull requests
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#24292e',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Connect GitHub
                   </button>
                 </div>

                 {/* Google Drive Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#4285f4',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       📁
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Google Drive</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Attach files from Google Drive
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#4285f4',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Connect Drive
                   </button>
                 </div>

                 {/* Zapier Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#ff4a00',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       ⚡
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Zapier</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Automate workflows with 2,000+ apps
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#ff4a00',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Connect Zapier
                   </button>
                 </div>

                 {/* Webhook Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#10b981',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       🔗
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Webhooks</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Send real-time updates to your servers
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#10b981',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Configure Webhooks
                   </button>
                 </div>

                 {/* API Integration */}
                 <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                     <div style={{
                       width: '40px',
                       height: '40px',
                       background: '#667eea',
                       borderRadius: '8px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       marginRight: '1rem',
                       fontSize: '1.25rem'
                     }}>
                       🔧
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>API Access</h4>
                       <p style={{ margin: '0', color: '#64748b', fontSize: '0.875rem' }}>
                         Build custom integrations with our API
                       </p>
                     </div>
                   </div>
                   <button
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       background: '#667eea',
                       color: 'white',
                       border: 'none',
                       borderRadius: '6px',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer'
                     }}
                   >
                     Get API Key
                   </button>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </>
  )
}

export default Settings