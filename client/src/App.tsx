// client/src/App.tsx

import { Navigate, Route, Routes } from 'react-router-dom';

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
import { RolesPermissionsPage } from './features/users/pages/RolesPermissionsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';

import ReportsPage from './features/reports/pages/ReportsPage';

import { InventoryTable } from './features/inventory/components/InventoryTable';
import { ItemDetailView } from './features/inventory/components/ItemDetailView';

import { IssuingView } from './features/stock-issuing/components/IssuingView';
import { StockTransferPage } from './features/stock-transfer/pages/StockTransferPage';
import { StockReceivingPage } from './features/stock-receiving/pages/StockReceivingPage';
import GrnView from './features/stock-receiving/components/GrnView';
import { DamagedObsoletePage } from './features/damaged-obsolete/pages/DamagedObsoletePage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* =========================
            PUBLIC AUTH ROUTES
            ========================= */}

        <Route path="/login" element={<LoginPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* =========================
            PROTECTED APPLICATION ROUTES
            ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Root redirects to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/reports" element={<ReportsPage />} />

            <Route path="/users" element={<UsersPage />} />

            <Route path="/roles" element={<RolesPermissionsPage />} />

            <Route path="/stock-taking" element={<StockTakingPage />} />

            <Route path="/audit-log" element={<AuditLogPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/suppliers" element={<SuppliersPage />} />

            {/* Stock Issuing & Requisitions */}
            <Route path="/stock-issuing" element={<IssuingView />} />

            {/* Stock Receiving & GRNs */}
            <Route path="/stock-receiving" element={<StockReceivingPage />} />
            <Route path="/stock-receiving/grns" element={<StockReceivingPage />} />
            <Route path="/stock-receiving/grns/:id" element={<GrnView />} />

            {/* Damaged & Obsolete */}
            <Route path="/damaged-obsolete" element={<DamagedObsoletePage />} />
            <Route path="/write-off" element={<DamagedObsoletePage />} />

            <Route path="/stock-transfer" element={<StockTransferPage />} />

            {/* Inventory */}
            <Route path="/inventory" element={<InventoryTable />} />

            <Route path="/inventory/:id" element={<ItemDetailView />} />

            {/* 404 */}
            <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
