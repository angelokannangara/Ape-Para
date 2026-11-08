import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SetupNeeded from './components/SetupNeeded.jsx';
import { firebaseConfigured } from './lib/firebase.js';
import Admin from './pages/Admin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NewReport from './pages/NewReport.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  if (!firebaseConfigured) return <SetupNeeded />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reports/new" element={<ProtectedRoute roles={['citizen', 'admin']}><NewReport /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
