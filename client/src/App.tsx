import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <div className="mx-auto max-w-3xl px-6 py-16 text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                  Dashboard
                </h1>

                <p className="mt-4 text-slate-600">
                  Placeholder dashboard.
                </p>
              </div>
            }
          />
        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}