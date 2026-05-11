import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { MonitoringLayout } from './pages/monitoring/MonitoringLayout';
import { Network } from './pages/monitoring/Network';
import { Memory } from './pages/monitoring/Memory';
import { CPU } from './pages/monitoring/CPU';
import { Temperature } from './pages/monitoring/Temperature';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route: Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />

      {/* Protected Routes: Dashboard Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
              {/* Sidebar */}
              <Sidebar />
              
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <Topbar />
                
                {/* Page Content */}
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/monitoring" element={<MonitoringLayout />}>
                    <Route index element={<Navigate to="/monitoring/network" replace />} />
                    <Route path="network" element={<Network />} />
                    <Route path="memory" element={<Memory />} />
                    <Route path="cpu" element={<CPU />} />
                    <Route path="temperature" element={<Temperature />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}