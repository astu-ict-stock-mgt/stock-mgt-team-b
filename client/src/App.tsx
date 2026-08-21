import { Routes, Route, Link } from 'react-router-dom';
import ReportsPage from './features/reports/pages/ReportsPage';

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Stock Management System</h1>
      <p className="mt-4 text-gray-600">
        Enterprise Inventory Lifecycle & Stock Control System.
      </p>
      <nav className="mt-8 flex justify-center gap-4">
        <Link
          to="/dashboard"
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Dashboard
        </Link>
        <Link
          to="/reports"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
        >
          Reports & Analytics
        </Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-4 text-gray-600">Central inventory monitoring and quick links.</p>
      <div className="mt-8 flex justify-center gap-4">
        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back home
        </Link>
        <Link
          to="/reports"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Open Reports
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}
