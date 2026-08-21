import { Routes, Route, Navigate } from 'react-router-dom';
import SuppliersPage from './features/suppliers/pages/SuppliersPage';
import { StockTakingPage } from './features/stock-taking/pages/StockTakingPage';
import { Layout } from './components/Layout';
import { PlaceholderPage } from './components/PlaceholderPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Placeholder pages for unimplemented modules */}
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
		<Route path="/stock-taking" element={<StockTakingPage />} />
        <Route path="/users" element={<PlaceholderPage title="User Management" />} />
        <Route path="/roles" element={<PlaceholderPage title="Roles & Permissions" />} />
        <Route path="/inventory" element={<PlaceholderPage title="Inventory Management" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/audit-log" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

        {/* Implemented modules */}
        <Route path="/suppliers" element={<SuppliersPage />} />
        
        {/* New Stock Taking Module */}
        <Route path="/stock-taking" element={<StockTakingPage />} />

        {/* 404 fallback (Prevents blank page on unknown URLs) */}
        <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
      </Routes>
    </Layout>
  );
}