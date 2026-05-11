import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { MOCK_ESTUDIANTES, MOCK_FURGONES, MOCK_ESTADOS } from '../mockData';
import type { Estudiante, Estado, EstadoValue, Furgon } from '../types';
import { MapPin, School, Navigation, CheckCircle, Home, Clock } from 'lucide-react';

interface StudentWithStatus extends Estudiante {
  ultimo_estado: EstadoValue;
}

const STATUS_ACTIONS: { value: EstadoValue; label: string; icon: typeof Navigation; color: string }[] = [
  { value: 'en_ruta', label: 'En Ruta', icon: Navigation, color: 'bg-sky-500 hover:bg-sky-600' },
  { value: 'en_escuela', label: 'En Escuela', icon: CheckCircle, color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 'retirado', label: 'Retirado', icon: Home, color: 'bg-amber-500 hover:bg-amber-600' },
];

export default function ChoferPanel() {
  const { profile, useMock } = useAuth();
  const [furgon, setFurgon] = useState<Furgon | null>(null);
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (useMock) {
      const myFurgon = MOCK_FURGONES.find(f => f.chofer_id === profile?.id) ?? null;
      setFurgon(myFurgon);
      if (myFurgon) {
        const myStudents = MOCK_ESTUDIANTES.filter(e => e.furgon_id === myFurgon.id);
        const withStatus = myStudents.map(s => {
          const ests = MOCK_ESTADOS.filter(e => e.estudiante_id === s.id)
            .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
          return { ...s, ultimo_estado: ests[0]?.estado ?? 'esperando' as EstadoValue };
        });
        setStudents(withStatus);
      }
      setLoading(false);
      return;
    }

    const { data: fData } = await supabase
      .from('furgones').select('*').eq('chofer_id', profile!.id).maybeSingle();
    setFurgon(fData);
    if (fData) {
      const { data: estsData } = await supabase
        .from('estudiantes').select('*').eq('furgon_id', fData.id);
      if (estsData) {
        const { data: estadosData } = await supabase
          .from('estados').select('*').order('fecha_hora', { ascending: false });
        const withStatus = (estsData as Estudiante[]).map(s => {
          const lastEst = (estadosData ?? []).find((e: Estado) => e.estudiante_id === s.id);
          return { ...s, ultimo_estado: lastEst?.estado ?? 'esperando' as EstadoValue };
        });
        setStudents(withStatus);
      }
    }
    setLoading(false);
  }, [profile, useMock]);

  useEffect(() => { loadData(); }, [loadData]);

  async function updateStatus(studentId: string, newStatus: EstadoValue) {
    setUpdating(studentId);

    if (useMock) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ultimo_estado: newStatus } : s));
      showNotification(newStatus, students.find(s => s.id === studentId)?.nombre ?? '');
      setUpdating(null);
      setActiveStudent(null);
      return;
    }

    const { error } = await supabase.from('estados').insert({
      estudiante_id: studentId,
      estado: newStatus,
      fecha_hora: new Date().toISOString(),
    });

    if (!error) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ultimo_estado: newStatus } : s));
      showNotification(newStatus, students.find(s => s.id === studentId)?.nombre ?? '');
    }
    setUpdating(null);
    setActiveStudent(null);
  }

  function showNotification(status: EstadoValue, name: string) {
    const labels: Record<EstadoValue, string> = {
      en_ruta: 'en ruta',
      en_escuela: 'llegó a la escuela',
      retirado: 'fue retirado/a',
      esperando: 'está esperando',
    };
    setNotification(`${name} ${labels[status]}`);
    setTimeout(() => setNotification(null), 3500);
  }

  const total = students.length;
  const enRuta = students.filter(s => s.ultimo_estado === 'en_ruta').length;
  const enEscuela = students.filter(s => s.ultimo_estado === 'en_escuela').length;
  const retirados = students.filter(s => s.ultimo_estado === 'retirado').length;

  return (
    <Layout title="Panel del Chofer">
      {/* Toast notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl animate-bounce-in max-w-xs text-center">
          Notificado: {notification}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando recorrido...</div>
      ) : !furgon ? (
        <div className="text-center py-10 text-gray-400">
          <Bus2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No tienes un furgón asignado.</p>
        </div>
      ) : (
        <>
          {/* Furgon card */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-4 text-white mb-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-base">{furgon.nombre_furgon}</p>
                <p className="text-sky-200 text-xs">{furgon.patente} &bull; Cap. {furgon.capacidad}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              <Stat label="Total" value={total} />
              <Stat label="Ruta" value={enRuta} />
              <Stat label="Escuela" value={enEscuela} />
              <Stat label="Retirados" value={retirados} />
            </div>
          </div>

          {/* Students */}
          <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Estudiantes del recorrido</h2>
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">{s.nombre}</p>
                        <StatusBadge estado={s.ultimo_estado} />
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <School className="w-3 h-3" />{s.colegio}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{s.direccion}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveStudent(activeStudent === s.id ? null : s.id)}
                      className="mt-1 text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                {activeStudent === s.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Selecciona el nuevo estado:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_ACTIONS.map(action => {
                        const Icon = action.icon;
                        const isCurrent = s.ultimo_estado === action.value;
                        return (
                          <button
                            key={action.value}
                            disabled={updating === s.id}
                            onClick={() => updateStatus(s.id, action.value)}
                            className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-white text-xs font-semibold transition-all shadow-sm ${action.color} ${isCurrent ? 'ring-2 ring-offset-1 ring-gray-400' : ''} disabled:opacity-60`}
                          >
                            <Icon className="w-4 h-4" />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-lg py-1.5">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-sky-200">{label}</p>
    </div>
  );
}

import { Bus as Bus2 } from 'lucide-react';
