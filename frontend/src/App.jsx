import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import CareerTree from './pages/CareerTree'
import CareerDetail from './pages/CareerDetail'
import Discussion from './pages/Discussion'
import DiscussionPost from './pages/DiscussionPost'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRegistrations from './pages/admin/AdminRegistrations'
import AdminOnboarding from './pages/admin/AdminOnboarding'
import AdminCareers from './pages/admin/AdminCareers'
import AdminDiscussion from './pages/admin/AdminDiscussion'
import AdminMessages from './pages/admin/AdminMessages'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* onboarding sits between login and the dashboard */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* student + employee */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute blockOnboarding>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-tree"
            element={
              <ProtectedRoute>
                <CareerTree />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-tree/:id"
            element={
              <ProtectedRoute>
                <CareerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discussion"
            element={
              <ProtectedRoute>
                <Discussion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discussion/:id"
            element={
              <ProtectedRoute>
                <DiscussionPost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="onboarding" element={<AdminOnboarding />} />
            <Route path="careers" element={<AdminCareers />} />
            <Route path="discussion" element={<AdminDiscussion />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
