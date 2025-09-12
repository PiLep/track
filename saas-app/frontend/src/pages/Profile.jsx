import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import useAuthStore from '../stores/authStore'
import { getAvatarUrl } from '../utils/avatar'
import { get, post } from '../utils/api'

function Profile() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const [userStats, setUserStats] = useState({
    assignedIssues: 0,
    reportedIssues: 0,
    completedIssues: 0
  })

  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Profile editing state
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || ''
  })

  useEffect(() => {
    // Fetch user statistics from API
    fetchUserStats()
  }, [])

  useEffect(() => {
    // Initialize profile data with user data on mount
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || ''
      })
    }
  }, []) // Only run on mount



  const fetchUserStats = async () => {
    try {
      // Use the actual logged-in user ID
      const data = await get(`/api/users/stats/${user.id}`)

      if (data.success) {
        setUserStats(data.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await post('/api/users/profile', profileData)
      if (response.success) {
        // Update user in auth store
        const authStore = useAuthStore.getState()
        authStore.setUser({ ...authStore.user, ...profileData })
        setProfileMessage('Profile updated successfully!')
        setShowProfileEdit(false)
      } else {
        setProfileMessage(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setProfileMessage('Error updating profile. Please try again.')
    } finally {
      setProfileLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout activePage="profile">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Please log in to view your profile.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout activePage="profile">
          <div className="dashboard-welcome">
            <h1 className="welcome-title">My Profile</h1>
            <p className="welcome-subtitle">
              Manage your account settings and view your activity
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
             {/* Profile Info Card */}
             <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h2 style={{ margin: '0', color: '#1e293b', fontSize: '1.5rem' }}>Profile Information</h2>
                 <button
                   onClick={() => setShowProfileEdit(!showProfileEdit)}
                   style={{
                     padding: '0.5rem 1rem',
                     background: showProfileEdit ? '#dc2626' : '#667eea',
                     color: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     fontSize: '0.875rem',
                     fontWeight: '500',
                     cursor: 'pointer'
                   }}
                 >
                   {showProfileEdit ? 'Cancel' : 'Edit Profile'}
                 </button>
               </div>

               {showProfileEdit ? (
                 <form onSubmit={handleProfileUpdate}>
                   {profileMessage && (
                     <div style={{
                       padding: '1rem',
                       marginBottom: '1.5rem',
                       borderRadius: '8px',
                       background: profileMessage.includes('success') ? '#d1fae5' : '#fee2e2',
                       color: profileMessage.includes('success') ? '#065f46' : '#dc2626',
                       border: `1px solid ${profileMessage.includes('success') ? '#a7f3d0' : '#fecaca'}`
                     }}>
                       {profileMessage}
                     </div>
                   )}

                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                     <div style={{ position: 'relative', marginRight: '1rem' }}>
                       <img
                         src={getAvatarUrl(user?.email, user?.avatar_url, 80)}
                         alt="Profile"
                         onError={(e) => {
                           e.target.style.display = 'none';
                           e.target.nextSibling.style.display = 'flex';
                         }}
                         style={{
                           width: '80px',
                           height: '80px',
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
                           width: '80px',
                           height: '80px',
                           borderRadius: '50%',
                           background: '#667eea',
                           color: 'white',
                           alignItems: 'center',
                           justifyContent: 'center',
                           fontWeight: '600',
                           fontSize: '2rem'
                         }}
                       >
                         {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                       </div>
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ marginBottom: '1rem' }}>
                         <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                           Full Name
                         </label>
                         <input
                           type="text"
                           value={profileData.full_name}
                           onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                           style={{
                             width: '100%',
                             padding: '0.75rem',
                             border: '1px solid #d1d5db',
                             borderRadius: '6px',
                             fontSize: '1rem'
                           }}
                           required
                         />
                       </div>
                       <div style={{ marginBottom: '1rem' }}>
                         <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                           Username
                         </label>
                         <input
                           type="text"
                           value={profileData.username}
                           onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                           style={{
                             width: '100%',
                             padding: '0.75rem',
                             border: '1px solid #d1d5db',
                             borderRadius: '6px',
                             fontSize: '1rem'
                           }}
                           required
                         />
                       </div>
                       <div style={{ marginBottom: '1rem' }}>
                         <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                           Email
                         </label>
                         <input
                           type="email"
                           value={profileData.email}
                           onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                           style={{
                             width: '100%',
                             padding: '0.75rem',
                             border: '1px solid #d1d5db',
                             borderRadius: '6px',
                             fontSize: '1rem'
                           }}
                           required
                         />
                       </div>
                     </div>
                   </div>

                   <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                     <button
                       type="button"
                       onClick={() => setShowProfileEdit(false)}
                       style={{
                         padding: '0.75rem 1.5rem',
                         border: '1px solid #d1d5db',
                         background: 'white',
                         borderRadius: '6px',
                         cursor: 'pointer'
                       }}
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       disabled={profileLoading}
                       style={{
                         padding: '0.75rem 1.5rem',
                         background: '#10b981',
                         color: 'white',
                         border: 'none',
                         borderRadius: '6px',
                         cursor: profileLoading ? 'not-allowed' : 'pointer'
                       }}
                     >
                       {profileLoading ? 'Saving...' : 'Save Changes'}
                     </button>
                   </div>
                 </form>
               ) : (
                 <>
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                     <div style={{ position: 'relative', marginRight: '1rem' }}>
                       <img
                         src={getAvatarUrl(user?.email, user?.avatar_url, 80)}
                         alt="Profile"
                         onError={(e) => {
                           e.target.style.display = 'none';
                           e.target.nextSibling.style.display = 'flex';
                         }}
                         style={{
                           width: '80px',
                           height: '80px',
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
                           width: '80px',
                           height: '80px',
                           borderRadius: '50%',
                           background: '#667eea',
                           color: 'white',
                           alignItems: 'center',
                           justifyContent: 'center',
                           fontWeight: '600',
                           fontSize: '2rem'
                         }}
                       >
                         {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                       </div>
                     </div>
                     <div>
                       <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>
                         {user.full_name || user.email.split('@')[0]}
                       </h3>
                       <p style={{ margin: '0', color: '#64748b' }}>{user.email}</p>
                     </div>
                   </div>

                   <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                       <span style={{ color: '#64748b' }}>Member since:</span>
                       <span style={{ color: '#1e293b', fontWeight: '500' }}>
                         {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                       </span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ color: '#64748b' }}>Last updated:</span>
                       <span style={{ color: '#1e293b', fontWeight: '500' }}>
                         {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                       </span>
                     </div>
                   </div>
                 </>
               )}
             </div>

            {/* Statistics Card */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Activity Statistics</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea', marginBottom: '0.5rem' }}>
                    {userStats.assignedIssues}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Assigned Issues</div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
                    {userStats.reportedIssues}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Reported Issues</div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                    {userStats.completedIssues}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Completed Issues</div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {Math.round((userStats.completedIssues / Math.max(userStats.assignedIssues, 1)) * 100)}%
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Completion Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Account Actions</h2>
            <button
              onClick={handleLogout}
              style={{
                background: '#dc2626',
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
                e.target.style.backgroundColor = '#b91c1c'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🚪</span>
              Sign Out
            </button>
          </div>



          {/* Recent Activity */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.5rem' }}>Recent Activity</h2>
            <p style={{ margin: '0', color: '#64748b' }}>
              Activity tracking will be implemented in a future update. This will show your recent actions, issue updates, and team activities.
            </p>
          </div>


      </Layout>
    )
}

export default Profile