import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './auth/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import GovernmentDashboard from './components/GovernmentDashboard';

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/crop-health"
        element={
          <ProtectedRoute allowedRoles={['government']}>
            <GovernmentDashboard initialTab="crop-health" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          user?.role === 'government' ? (
            <GovernmentDashboard initialTab="dashboard" />
          ) : (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
