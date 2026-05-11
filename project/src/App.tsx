import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ChoferPanel from './pages/ChoferPanel';
import ApoderadoPanel from './pages/ApoderadoPanel';
import { Bus } from 'lucide-react';

function AppContent() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-700 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Bus className="w-8 h-8 text-sky-700" />
        </div>
        <p className="text-white text-sm font-medium">Cargando...</p>
      </div>
    );
  }

  if (!profile) return <LoginPage />;

  if (profile.role === 'admin') return <AdminPanel />;
  if (profile.role === 'chofer') return <ChoferPanel />;
  return <ApoderadoPanel />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
