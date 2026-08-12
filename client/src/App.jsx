import { Routes, Route, Link } from 'react-router-dom';

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
    </Routes>
  );
}
