import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Splash from '@/pages/Splash'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import GateControl from '@/pages/GateControl'
import Schedule from '@/pages/Schedule'
import Settings from '@/pages/Settings'
import DevicePairing from '@/pages/DevicePairing'
import GuestAccess from '@/pages/GuestAccess'
import Diagnostics from '@/pages/Diagnostics'
import UserManagement from '@/pages/UserManagement'
import Layout from '@/components/layout/Layout'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show splash while checking auth
  if (isLoading) {
    return <Splash />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="gate/:id" element={<GateControl />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="settings" element={<Settings />} />
        <Route path="pairing" element={<DevicePairing />} />
        <Route path="guest-access" element={<GuestAccess />} />
        <Route path="diagnostics/:id?" element={<Diagnostics />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

