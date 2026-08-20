// client/src/App.tsx

import { Routes, Route, Link } from 'react-router-dom';
import { WriteOffForm } from './features/damaged-obsolete/components/WriteOffForm';
import { WriteOffHistory } from './features/damaged-obsolete/components/WriteOffHistory';

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl text-gray-900">Stock Management System</h1>
      <p className="mt-4 text-gray-600">
        Welcome to the stock management platform. Feature modules will be added under{' '}
        <code className="rounded bg-gray-200 px-1.5 py-0.5">client/src/features/</code>.
      </p>
      <nav className="mt-8 flex justify-center gap-4">
        <Link to="/dashboard" className="bg-primary-600 rounded px-4 py-2 text-white">
          Dashboard
        </Link>
        <Link to="/damaged-obsolete" className="bg-red-600 rounded px-4 py-2 text-white">
          Damaged Stock
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      
      <Route path="/damaged-obsolete" element={<WriteOffForm />} />
      <Route path="/damaged-obsolete/history" element={<WriteOffHistory />} />
    </Routes>
  );
}

export default App;