// client/src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import SuppliersPage from './features/suppliers/pages/SuppliersPage';
import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';
import { WriteOffForm, WriteOffHistory } from './features/damaged-obsolete';
import { InventoryTable } from './features/inventory/components/InventoryTable';
import { ItemDetailView } from './features/inventory/components/ItemDetailView';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Placeholder pages for unimplemented modules */}
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/users" element={<PlaceholderPage title="User Management" />} />
        <Route path="/roles" element={<PlaceholderPage title="Roles & Permissions" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/audit-log" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

        {/* Implemented modules */}
        <Route path="/suppliers" element={<SuppliersPage />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={<InventoryTable />} />
        <Route path="/inventory/:id" element={<ItemDetailView />} />

        {/* Damaged/Obsolete Routes */}
        <Route path="/damaged-obsolete" element={<WriteOffForm />} />
        <Route path="/damaged-obsolete/history" element={<WriteOffHistory />} />

        {/* 404 fallback */}
        <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
      </Routes>
    </Layout>
  );
}