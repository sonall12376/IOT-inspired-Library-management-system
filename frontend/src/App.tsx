import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { motion } from 'framer-motion';
import { Library, Wifi, Cpu, Layers, LogOut, User as UserIcon } from 'lucide-react';

// Protected Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium tracking-wide">Securing connection session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import StudentDashboard from './pages/StudentDashboard';

// Main Dashboard Switcher based on User Role
const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    // Placeholder rendering StudentDashboard until AdminDashboard is built
    return <StudentDashboard />;
  } else if (user?.role === 'librarian') {
    // Placeholder rendering StudentDashboard until LibrarianDashboard is built
    return <StudentDashboard />;
  } else {
    return <StudentDashboard />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes wrapped in AuthLayout */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
          <Route path="/reset-password/:token" element={<AuthLayout><ResetPassword /></AuthLayout>} />
          
          {/* Guarded Main Dashboard */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
