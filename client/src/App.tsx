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
import { GatePassPage } from './features/gate-pass/pages/GatePassPage';
import { FinancialValuationPage } from './features/valuation/pages/FinancialValuationPage';

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

            {/* Financial Valuation & Costing */}
            <Route
              element={<ProtectedRoute allowedRoles={['ACCOUNTANT', 'PAO', 'ADMINISTRATOR']} />}
            >
              <Route path="/finance" element={<FinancialValuationPage />} />
              <Route path="/valuation" element={<Navigate to="/finance" replace />} />
            </Route>

            {/* Reports */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'ADMINISTRATOR',
                    'PAO',
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'ACCOUNTANT',
                    'DEPARTMENT_HEAD',
                  ]}
                />
              }
            >
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Admin & PAO User Management */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR', 'PAO']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPermissionsPage />} />
            </Route>

            {/* System Settings */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']} />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Audit Logs */}
            <Route
              element={<ProtectedRoute allowedRoles={['ADMINISTRATOR', 'PAO', 'ACCOUNTANT']} />}
            >
              <Route path="/audit-log" element={<AuditLogPage />} />
            </Route>

            {/* Stock Taking */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'STOCK_CLERK',
                    'STOREKEEPER',
                    'PAO',
                    'ADMINISTRATOR',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/stock-taking" element={<StockTakingPage />} />
            </Route>

            {/* Suppliers */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'PAO',
                    'ADMINISTRATOR',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/suppliers" element={<SuppliersPage />} />
            </Route>

            {/* Stock Issuing & Requisitions */}
            <Route path="/stock-issuing" element={<IssuingView />} />

            {/* Stock Receiving & GRNs */}
            <Route path="/stock-receiving" element={<StockReceivingPage />} />
            <Route path="/stock-receiving/grns" element={<StockReceivingPage />} />
            <Route path="/stock-receiving/grns/:id" element={<GrnView />} />

            {/* Damaged & Obsolete */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'DEPARTMENT_HEAD',
                    'PAO',
                    'ADMINISTRATOR',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/damaged-obsolete" element={<DamagedObsoletePage />} />
              <Route path="/write-off" element={<DamagedObsoletePage />} />
            </Route>

            {/* Stock Transfer */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'STOREKEEPER',
                    'STOCK_CLERK',
                    'PAO',
                    'ADMINISTRATOR',
                    'ACCOUNTANT',
                  ]}
                />
              }
            >
              <Route path="/stock-transfer" element={<StockTransferPage />} />
            </Route>

            {/* Gate Clearance */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['SECURITY_OFFICER', 'STOREKEEPER', 'PAO', 'ADMINISTRATOR']}
                />
              }
            >
              <Route path="/gate-pass" element={<GatePassPage />} />
            </Route>

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
