import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient & Core Clinical Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import NewAssessment from './pages/patient/NewAssessment';
import AssessmentResult from './pages/patient/AssessmentResult';
import AssessmentHistory from './pages/patient/AssessmentHistory';
import Profile from './pages/patient/Profile';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientList from './pages/doctor/PatientList';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ModelManagement from './pages/admin/ModelManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Helper component for role-based root redirect
const RoleRedirector = () => {
  const { role, user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const normalizedRole = (role || user?.role || '').toLowerCase();
  if (normalizedRole === 'admin') return <Navigate to="/admin" replace />;
  if (normalizedRole === 'doctor') return <Navigate to="/doctor" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Role-Aware Redirect */}
          <Route path="/" element={<RoleRedirector />} />

          {/* Protected Routes inside App Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Patient Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/new"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <NewAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <AssessmentResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/history"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <AssessmentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/assessment"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <NewAssessment />
                </ProtectedRoute>
              }
            />

            {/* Administrator Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/models"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModelManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
