import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { SkeletonDashboard } from '@/components/ui'
import Layout from '@/components/layout/Layout'
import Splash from '@/pages/Splash'

// Lazy load pages for code splitting
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const GateControl = lazy(() => import('@/pages/GateControl'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const Settings = lazy(() => import('@/pages/Settings'))
const DevicePairing = lazy(() => import('@/pages/DevicePairing'))
const GuestAccess = lazy(() => import('@/pages/GuestAccess'))
const Diagnostics = lazy(() => import('@/pages/Diagnostics'))
const UserManagement = lazy(() => import('@/pages/UserManagement'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="max-w-md w-full">
        <SkeletonDashboard />
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show splash while checking auth
  if (isLoading) {
    return <Splash />
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  )
}

export default App
