// client/src/App.tsx

import { Routes, Route, Link } from 'react-router-dom';
import { WriteOffForm, WriteOffHistory } from './features/damaged-obsolete';
import { InventoryTable } from './features/inventory/components/InventoryTable';
import { ItemDetailView } from './features/inventory/components/ItemDetailView';

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl text-gray-900">Stock Management System</h1>
      <p className="mt-4 text-gray-600">
        Welcome to the stock management platform. Feature modules will be added under{' '}
        <code className="rounded bg-gray-200 px-1.5 py-0.5">client/src/features/</code>.
      </p>
      <nav className="mt-8 flex justify-center gap-4 flex-wrap">
        <Link to="/dashboard" className="bg-primary-600 rounded px-4 py-2 text-white">
          Dashboard
        </Link>
        <Link to="/inventory" className="bg-blue-600 rounded px-4 py-2 text-white hover:bg-blue-700">
          Inventory
        </Link>
        <Link to="/damaged-obsolete" className="bg-red-600 rounded px-4 py-2 text-white hover:bg-red-700">
          Damaged Stock
        </Link>
        <Link to="/damaged-obsolete/history" className="bg-gray-600 rounded px-4 py-2 text-white hover:bg-gray-700">
          Write-Off History
        </Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl text-gray-900">Dashboard</h1>
      <p className="mt-4 text-gray-600">Placeholder dashboard.</p>
      <Link to="/" className="text-primary-600 mt-8 inline-block">
        Back home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Inventory Routes */}
      <Route path="/inventory" element={<InventoryTable />} />
      <Route path="/inventory/:id" element={<ItemDetailView />} />
      
      {/* Damaged/Obsolete Routes */}
      <Route path="/damaged-obsolete" element={<WriteOffForm />} />
      <Route path="/damaged-obsolete/history" element={<WriteOffHistory />} />
    </Routes>
  );
}