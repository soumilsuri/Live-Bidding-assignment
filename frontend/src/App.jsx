import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TimeSyncProvider } from './contexts/TimeSyncContext';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/layout/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TimeSyncProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </Router>
          </SocketProvider>
        </TimeSyncProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
