import { Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';

import LoginPage from './features/auth/pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';

import SuppliersPage from './features/suppliers/pages/SuppliersPage';
import UsersPage from './features/users/pages/UsersPage';
import RolesPage from './features/roles/pages/RolesPage';
import SettingsPage from './features/settings/pages/SettingsPage';

import { DashboardPage } from './features/stock-monitoring/pages/DashboardPage';
import AuditLogPage from './features/audit-log/pages/AuditLogPage';
import { StockTakingPage } from './features/stock-taking/pages/StockTakingPage';
import ReportsPage from './features/reports/pages/ReportsPage';
import DamagedObsoletePage from './features/damaged-obsolete/pages/DamagedObsoletePage';
import StockReceivingPage from './features/stock-receiving/pages/StockReceivingPage';
import GrnView from './features/stock-receiving/components/GrnView';

import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';
import { ErrorBoundary } from './components/ErrorBoundary';

import { InventoryTable } from './features/inventory/components/InventoryTable';
import { ItemDetailView } from './features/inventory/components/ItemDetailView';
import { IssuingView } from './features/stock-issuing/components/IssuingView';
import { StockTransferPage } from './features/stock-transfer/pages/StockTransferPage';

/** Wrap a page component in an ErrorBoundary so render errors show a helpful message */
function Guarded({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* =========================
            PUBLIC AUTH ROUTES
            ========================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<LoginPage />} />

        {/* =========================
            PROTECTED APPLICATION ROUTES WITH RBAC
            ========================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Dashboard: All Roles */}
            <Route path="/dashboard" element={<Guarded><DashboardPage /></Guarded>} />

            {/* Inventory Catalog: All Roles */}
            <Route path="/inventory" element={<Guarded><InventoryTable /></Guarded>} />
            <Route path="/inventory/:id" element={<Guarded><ItemDetailView /></Guarded>} />

            {/* Stock Receiving (GRN): Admin, PAO, Storekeeper, Stock Clerk */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK']}
                />
              }
            >
              <Route path="/stock-receiving" element={<Guarded><StockReceivingPage /></Guarded>} />
              <Route path="/stock-receiving/grns/:id" element={<Guarded><GrnView /></Guarded>} />
            </Route>

            {/* Stock Issuing: All 7 Roles */}
            <Route path="/stock-issuing" element={<Guarded><IssuingView /></Guarded>} />

            {/* Stock Transfers: Admin, PAO, Storekeeper, Stock Clerk */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK']}
                />
              }
            >
              <Route path="/stock-transfer" element={<Guarded><StockTransferPage /></Guarded>} />
            </Route>

            {/* Physical Stock Taking: Admin, PAO, Storekeeper, Stock Clerk, Accountant */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMINISTRATOR',
                    'PAO',
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/stock-taking" element={<Guarded><StockTakingPage /></Guarded>} />
            </Route>

            {/* Damaged & Obsolete Write-Off: Admin, PAO, Storekeeper, Stock Clerk, Accountant */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMINISTRATOR',
                    'PAO',
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/damaged-obsolete" element={<Guarded><DamagedObsoletePage /></Guarded>} />
            </Route>

            {/* Suppliers: Admin, PAO, Storekeeper, Stock Clerk, Accountant */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMINISTRATOR',
                    'PAO',
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/suppliers" element={<Guarded><SuppliersPage /></Guarded>} />
            </Route>

            {/* Reports: Admin, PAO, Accountant, Storekeeper, Stock Clerk, Dept Head */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMINISTRATOR',
                    'PAO',
                    'ACCOUNTANT',
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'DEPARTMENT_HEAD',
                  ]}
                />
              }
            >
              <Route path="/reports" element={<Guarded><ReportsPage /></Guarded>} />
            </Route>

            {/* Users Administration: Admin, PAO */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR', 'PAO']} />}>
              <Route path="/users" element={<Guarded><UsersPage /></Guarded>} />
            </Route>

            {/* Roles & Permissions Matrix: All Roles */}
            <Route path="/roles" element={<Guarded><RolesPage /></Guarded>} />

            {/* Audit Logs: Admin, PAO, Accountant */}
            <Route
              element={<ProtectedRoute allowedRoles={['ADMINISTRATOR', 'PAO', 'ACCOUNTANT']} />}
            >
              <Route path="/audit-log" element={<Guarded><AuditLogPage /></Guarded>} />
            </Route>

            {/* Settings: All Roles */}
            <Route path="/settings" element={<Guarded><SettingsPage /></Guarded>} />

            {/* 404 Fallback */}
            <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
