import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Projects from './pages/Projects'
import Teams from './pages/Teams'
import Issues from './pages/Issues'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import useAuthStore from './stores/authStore'
import './App.css'


function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    document.title = 'Track - Project Management'
    // Check authentication on app startup
    checkAuth()
  }, [checkAuth])

  return (
    <Router>
      <AppContent isAuthenticated={isAuthenticated} />
    </Router>
  )
}

function AppContent({ isAuthenticated }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isOnboardingPage = location.pathname === '/onboarding'

  if (!isAuthenticated) {
    return (
      <div className={`App ${isLoginPage || isOnboardingPage ? 'login-page' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="App">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App