import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { MOCK_ESTUDIANTES, MOCK_FURGONES, MOCK_PROFILES, MOCK_ESTADOS } from '../mockData';
import type { Estudiante, Furgon, Profile, Estado, EstadoValue } from '../types';
import {
  GraduationCap, Bus, User, MapPin, Phone, Bell, Clock, Navigation, CheckCircle, Home
} from 'lucide-react';

interface StudentInfo {
  estudiante: Estudiante;
  furgon: Furgon | null;
  chofer: Profile | null;
  estados: Estado[];
  ultimo_estado: EstadoValue;
}

const estadoMessages: Record<EstadoValue, string> = {
  esperando: 'Tu hijo/a está esperando ser recogido/a.',
  en_ruta:   'Tu hijo/a ya va en camino al colegio.',
  en_escuela:'Tu hijo/a llegó al colegio correctamente.',
  retirado:  'Tu hijo/a fue retirado/a del colegio.',
};

const estadoIcons: Record<EstadoValue, typeof Navigation> = {
  esperando: Clock,
  en_ruta:   Navigation,
  en_escuela: CheckCircle,
  retirado:  Home,
};

const estadoColors: Record<EstadoValue, string> = {
  esperando: 'bg-gray-50 border-gray-200',
  en_ruta:   'bg-sky-50 border-sky-200',
  en_escuela:'bg-emerald-50 border-emerald-200',
  retirado:  'bg-amber-50 border-amber-200',
};

export default function ApoderadoPanel() {
  const { profile, useMock } = useAuth();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationRequested, setLocationRequested] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; msg: string }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (useMock) {
      const myStudents = MOCK_ESTUDIANTES.filter(e => e.apoderado_id === profile?.id);
      const infos: StudentInfo[] = myStudents.map(est => {
        const furgon = MOCK_FURGONES.find(f => f.id === est.furgon_id) ?? null;
        const chofer = furgon ? MOCK_PROFILES.find(p => p.id === furgon.chofer_id) ?? null : null;
        const ests = MOCK_ESTADOS
          .filter(e => e.estudiante_id === est.id)
          .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
        return {
          estudiante: est,
          furgon,
          chofer,
          estados: ests,
          ultimo_estado: ests[0]?.estado ?? 'esperando',
        };
      });
      setStudents(infos);
      setLoading(false);
      return;
    }

    const { data: estsData } = await supabase
      .from('estudiantes').select('*').eq('apoderado_id', profile!.id);
    if (!estsData) { setLoading(false); return; }

    const infos: StudentInfo[] = [];
    for (const est of estsData as Estudiante[]) {
      const { data: furgonData } = est.furgon_id
        ? await supabase.from('furgones').select('*').eq('id', est.furgon_id).maybeSingle()
        : { data: null };
      const { data: choferData } = furgonData?.chofer_id
        ? await supabase.from('profiles').select('*').eq('id', furgonData.chofer_id).maybeSingle()
        : { data: null };
      const { data: estadosData } = await supabase
        .from('estados').select('*').eq('estudiante_id', est.id).order('fecha_hora', { ascending: false });
      const sortedEstados = (estadosData ?? []) as Estado[];
      infos.push({
        estudiante: est,
        furgon: furgonData ?? null,
        chofer: choferData ?? null,
        estados: sortedEstados,
        ultimo_estado: sortedEstados[0]?.estado ?? 'esperando',
      });
    }
    setStudents(infos);
    setLoading(false);
  }, [profile, useMock]);

  useEffect(() => { loadData(); }, [loadData]);

  // Subscribe to real-time estado changes (Supabase only)
  useEffect(() => {
    if (useMock || !profile) return;
    const channel = supabase
      .channel('estado-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'estados' }, payload => {
        const newEst = payload.new as Estado;
        const isMyStudent = students.some(s => s.estudiante.id === newEst.estudiante_id);
        if (isMyStudent) {
          const studentName = students.find(s => s.estudiante.id === newEst.estudiante_id)?.estudiante.nombre ?? '';
          addNotification(`${studentName}: ${estadoMessages[newEst.estado as EstadoValue]}`);
          loadData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [useMock, profile, students, loadData]);

  function addNotification(msg: string) {
    const id = `notif-${Date.now()}`;
    setNotifications(prev => [{ id, msg }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }

  function requestLocation(studentId: string) {
    setLocationRequested(studentId);
    addNotification('Solicitud de ubicación enviada al chofer.');
    setTimeout(() => setLocationRequested(null), 3000);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Layout title="Panel del Apoderado">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-400" />
            {n.msg}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando información...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No tienes estudiantes registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(({ estudiante, furgon, chofer, estados, ultimo_estado }) => {
            const Icon = estadoIcons[ultimo_estado];
            return (
              <div key={estudiante.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Student header */}
                <div className={`border-b px-4 py-4 ${estadoColors[ultimo_estado]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{estudiante.nombre}</p>
                        <p className="text-xs text-gray-500">{estudiante.colegio}</p>
                      </div>
                    </div>
                    <StatusBadge estado={ultimo_estado} />
                  </div>

                  {/* Status message */}
                  <div className="mt-3 flex items-start gap-2 bg-white/70 rounded-xl px-3 py-2.5">
                    <Icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-700">{estadoMessages[ultimo_estado]}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{estudiante.direccion}</span>
                  </div>

                  {furgon && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Bus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span><span className="font-medium">{furgon.nombre_furgon}</span> &bull; {furgon.patente}</span>
                    </div>
                  )}

                  {chofer && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium">{chofer.nombre}</span>
                      {chofer.contacto && (
                        <a href={`tel:${chofer.contacto}`} className="flex items-center gap-1 text-sky-600 hover:text-sky-700 ml-1">
                          <Phone className="w-3 h-3" />{chofer.contacto}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Status history */}
                {estados.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Historial de hoy</p>
                    <div className="space-y-1.5">
                      {estados.slice(0, 4).map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-gray-400">{formatTime(e.fecha_hora)}</span>
                          <StatusBadge estado={e.estado} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={() => requestLocation(estudiante.id)}
                    disabled={locationRequested === estudiante.id}
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    {locationRequested === estudiante.id ? 'Solicitud enviada...' : 'Solicitar Ubicación'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
