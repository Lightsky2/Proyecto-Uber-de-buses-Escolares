import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Bus, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: 'Administrador', email: 'admin@viajseguro.cl', pass: 'admin123', color: 'bg-sky-50 border-sky-200 text-sky-700' },
    { label: 'Chofer', email: 'roberto@viajseguro.cl', pass: 'chofer123', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Apoderado', email: 'maria@viajseguro.cl', pass: 'apoderado123', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  }

  function fillDemo(e: string, p: string) {
    setEmail(e);
    setPassword(p);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-900 via-sky-800 to-sky-700 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
          <Bus className="w-9 h-9 text-sky-700" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Viaje Seguro</h1>
        <p className="text-sky-200 text-sm mt-1">Gestión de Transporte Escolar</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-semibold text-gray-800">Iniciar Sesión</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="correo@ejemplo.cl"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors duration-200 shadow-sm"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-500 text-center mb-3 font-medium uppercase tracking-wide">Cuentas de demostración</p>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc.email, acc.pass)}
                className={`border rounded-xl py-2 px-1 text-xs font-medium transition-all hover:shadow-sm ${acc.color}`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sky-300 text-xs text-center">
        Plataforma segura de monitoreo de transporte escolar
      </p>
    </div>
  );
}
