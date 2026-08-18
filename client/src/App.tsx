import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import SuppliersPage from './features/suppliers/pages/SuppliersPage';
import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected application routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={<PlaceholderPage title="Dashboard" />}
            />
            <Route
              path="/users"
              element={<PlaceholderPage title="User Management" />}
            />
            <Route
              path="/roles"
              element={<PlaceholderPage title="Roles & Permissions" />}
            />
            <Route
              path="/inventory"
              element={<PlaceholderPage title="Inventory Management" />}
            />
            <Route
              path="/reports"
              element={<PlaceholderPage title="Reports" />}
            />
            <Route
              path="/audit-log"
              element={<PlaceholderPage title="Audit Logs" />}
            />
            <Route
              path="/settings"
              element={<PlaceholderPage title="Settings" />}
            />

            <Route path="/suppliers" element={<SuppliersPage />} />

            <Route
              path="*"
              element={<PlaceholderPage title="Page Not Found" />}
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
