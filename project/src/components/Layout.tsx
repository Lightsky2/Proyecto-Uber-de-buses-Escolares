import { ReactNode } from 'react';
import { useAuth } from '../AuthContext';
import { Bus, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  chofer: 'Chofer',
  apoderado: 'Apoderado',
};

const roleColors: Record<string, string> = {
  admin: 'bg-sky-600',
  chofer: 'bg-emerald-600',
  apoderado: 'bg-amber-500',
};

export default function Layout({ children, title }: LayoutProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-600" />
            <span className="font-bold text-gray-800 text-base">Viaje Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-white px-2.5 py-1 rounded-full ${roleColors[profile.role]}`}>
                <User className="w-3 h-3" />
                {roleLabels[profile.role]}
              </span>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page title bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          {profile && (
            <p className="text-xs text-gray-500 mt-0.5">{profile.nombre}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5">
        {children}
      </main>
    </div>
  );
}
