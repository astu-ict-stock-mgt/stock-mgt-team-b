// client/src/App.tsx

import { Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

import LoginPage from './features/auth/pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';

import SuppliersPage from './features/suppliers/pages/SuppliersPage';
import UsersPage from './features/users/pages/UsersPage';

import { DashboardPage } from './features/stock-monitoring/pages/DashboardPage';

import AuditLogPage from './features/audit-log/pages/AuditLogPage';

import { StockTakingPage } from './features/stock-taking/pages/StockTakingPage';

import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';

import ReportsPage from './features/reports/pages/ReportsPage';

import { InventoryTable } from './features/inventory/components/InventoryTable';
import { ItemDetailView } from './features/inventory/components/ItemDetailView';

import { IssuingView } from './features/stock-issuing/components/IssuingView';

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Stock Management System</h1>
      <p className="mt-4 text-gray-600">Enterprise Inventory Lifecycle & Stock Control System.</p>
      <nav className="mt-8 flex justify-center gap-4">
        <a
          href="/dashboard"
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Dashboard
        </a>
        <a
          href="/reports"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700"
        >
          Reports & Analytics
        </a>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* =========================
            PUBLIC AUTH ROUTES
            ========================= */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/"
          element={<Home />}
        />

        {/* =========================
            TEMPORARY PUBLIC ROUTES
            NO AUTHENTICATION REQUIRED
            ========================= */}

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        {/* Reports & Analytics */}
        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        {/* =========================
            PROTECTED APPLICATION ROUTES
            ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Dashboard - temporarily disabled */}
            {
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
            }

            {/* Reports - temporarily disabled */}
            {
            <Route
              path="/reports"
              element={<ReportsPage />}
            />
            }

            <Route
              path="/users"
              element={<UsersPage />}
            />

            <Route
              path="/roles"
              element={
                <PlaceholderPage title="Roles & Permissions" />
              }
            />

            <Route
              path="/stock-taking"
              element={<StockTakingPage />}
            />

            <Route
              path="/audit-log"
              element={<AuditLogPage />}
            />

            <Route
              path="/settings"
              element={
                <PlaceholderPage title="Settings" />
              }
            />

            <Route
              path="/suppliers"
              element={<SuppliersPage />}
            />

            {/* Stock Issuing & Requisitions */}
            <Route
              path="/stock-issuing"
              element={<IssuingView />}
            />

            {/* Inventory */}
            <Route
              path="/inventory"
              element={<InventoryTable />}
            />

            <Route
              path="/inventory/:id"
              element={<ItemDetailView />}
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <PlaceholderPage title="Page Not Found" />
              }
            />

          </Route>
        </Route>

      </Routes>
    </AuthProvider>
  );
}