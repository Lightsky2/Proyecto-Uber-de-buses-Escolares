import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { MOCK_PROFILES, MOCK_FURGONES, MOCK_ESTUDIANTES, MOCK_ESTADOS } from '../mockData';
import type { Profile, Furgon, Estudiante, Estado, EstadoValue } from '../types';
import {
  Users, Bus, GraduationCap, Plus, Pencil, Trash2, X, Check,
  Phone, ChevronDown, ChevronUp
} from 'lucide-react';

type Tab = 'usuarios' | 'furgones' | 'estudiantes';

export default function AdminPanel() {
  const { useMock } = useAuth();
  const [tab, setTab] = useState<Tab>('usuarios');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [furgones, setFurgones] = useState<Furgon[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/add states
  const [editProfile, setEditProfile] = useState<Partial<Profile> | null>(null);
  const [editFurgon, setEditFurgon] = useState<Partial<Furgon> | null>(null);
  const [editEstudiante, setEditEstudiante] = useState<Partial<Estudiante> | null>(null);
  const [expandedEst, setExpandedEst] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (useMock) {
      setProfiles(MOCK_PROFILES);
      setFurgones(MOCK_FURGONES);
      setEstudiantes(MOCK_ESTUDIANTES);
      setEstados(MOCK_ESTADOS);
      setLoading(false);
      return;
    }
    const [pRes, fRes, eRes, stRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('furgones').select('*'),
      supabase.from('estudiantes').select('*'),
      supabase.from('estados').select('*').order('fecha_hora', { ascending: false }),
    ]);
    if (pRes.data) setProfiles(pRes.data);
    if (fRes.data) setFurgones(fRes.data);
    if (eRes.data) setEstudiantes(eRes.data);
    if (stRes.data) setEstados(stRes.data);
    setLoading(false);
  }, [useMock]);

  useEffect(() => { loadData(); }, [loadData]);

  function getLatestEstado(estId: string): EstadoValue {
    const all = estados.filter(e => e.estudiante_id === estId);
    if (!all.length) return 'esperando';
    return all.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())[0].estado;
  }

  // Profile CRUD
  async function saveProfile() {
    if (!editProfile) return;
    if (useMock) {
      if (editProfile.id) {
        setProfiles(p => p.map(x => x.id === editProfile.id ? { ...x, ...editProfile } as Profile : x));
      } else {
        setProfiles(p => [...p, { ...editProfile, id: `p-${Date.now()}` } as Profile]);
      }
      setEditProfile(null); return;
    }
    if (editProfile.id) {
      await supabase.from('profiles').update(editProfile).eq('id', editProfile.id);
    }
    await loadData();
    setEditProfile(null);
  }

  async function deleteProfile(id: string) {
    if (!confirm('¿Eliminar usuario?')) return;
    if (useMock) { setProfiles(p => p.filter(x => x.id !== id)); return; }
    await supabase.from('profiles').delete().eq('id', id);
    await loadData();
  }

  // Furgon CRUD
  async function saveFurgon() {
    if (!editFurgon) return;
    if (useMock) {
      if (editFurgon.id) {
        setFurgones(f => f.map(x => x.id === editFurgon.id ? { ...x, ...editFurgon } as Furgon : x));
      } else {
        setFurgones(f => [...f, { ...editFurgon, id: `furgon-${Date.now()}` } as Furgon]);
      }
      setEditFurgon(null); return;
    }
    if (editFurgon.id) {
      await supabase.from('furgones').update(editFurgon).eq('id', editFurgon.id);
    } else {
      await supabase.from('furgones').insert({ ...editFurgon });
    }
    await loadData();
    setEditFurgon(null);
  }

  async function deleteFurgon(id: string) {
    if (!confirm('¿Eliminar furgón?')) return;
    if (useMock) { setFurgones(f => f.filter(x => x.id !== id)); return; }
    await supabase.from('furgones').delete().eq('id', id);
    await loadData();
  }

  // Estudiante CRUD
  async function saveEstudiante() {
    if (!editEstudiante) return;
    if (useMock) {
      if (editEstudiante.id) {
        setEstudiantes(e => e.map(x => x.id === editEstudiante.id ? { ...x, ...editEstudiante } as Estudiante : x));
      } else {
        setEstudiantes(e => [...e, { ...editEstudiante, id: `est-${Date.now()}` } as Estudiante]);
      }
      setEditEstudiante(null); return;
    }
    if (editEstudiante.id) {
      await supabase.from('estudiantes').update(editEstudiante).eq('id', editEstudiante.id);
    } else {
      await supabase.from('estudiantes').insert({ ...editEstudiante });
    }
    await loadData();
    setEditEstudiante(null);
  }

  async function deleteEstudiante(id: string) {
    if (!confirm('¿Eliminar estudiante?')) return;
    if (useMock) { setEstudiantes(e => e.filter(x => x.id !== id)); return; }
    await supabase.from('estudiantes').delete().eq('id', id);
    await loadData();
  }

  const choferes = profiles.filter(p => p.role === 'chofer');
  const apoderados = profiles.filter(p => p.role === 'apoderado');

  const tabs: { key: Tab; label: string; icon: typeof Users; count: number }[] = [
    { key: 'usuarios', label: 'Usuarios', icon: Users, count: profiles.length },
    { key: 'furgones', label: 'Furgones', icon: Bus, count: furgones.length },
    { key: 'estudiantes', label: 'Estudiantes', icon: GraduationCap, count: estudiantes.length },
  ];

  return (
    <Layout title="Panel Administrador">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl p-3 flex flex-col items-center gap-1 border transition-all ${tab === t.key ? 'bg-sky-600 border-sky-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-lg font-bold">{t.count}</span>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando datos...</div>
      ) : (
        <>
          {/* USUARIOS */}
          {tab === 'usuarios' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Usuarios registrados</h2>
              </div>
              <div className="space-y-2">
                {profiles.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{p.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.role === 'admin' ? 'bg-sky-100 text-sky-700' : p.role === 'chofer' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.role === 'admin' ? 'Admin' : p.role === 'chofer' ? 'Chofer' : 'Apoderado'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{p.contacto}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditProfile({ ...p })} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProfile(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FURGONES */}
          {tab === 'furgones' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Furgones registrados</h2>
                <button
                  onClick={() => setEditFurgon({ nombre_furgon: '', patente: '', capacidad: 10, chofer_id: null })}
                  className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo
                </button>
              </div>
              <div className="space-y-2">
                {furgones.map(f => {
                  const chofer = profiles.find(p => p.id === f.chofer_id);
                  const count = estudiantes.filter(e => e.furgon_id === f.id).length;
                  return (
                    <div key={f.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{f.nombre_furgon}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{f.patente} &bull; Capacidad: {f.capacidad}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Chofer: <span className="text-gray-600 font-medium">{chofer?.nombre ?? 'Sin asignar'}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Estudiantes: <span className="text-gray-600 font-medium">{count}</span>
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditFurgon({ ...f })} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteFurgon(f.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ESTUDIANTES */}
          {tab === 'estudiantes' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Estudiantes registrados</h2>
                <button
                  onClick={() => setEditEstudiante({ nombre: '', colegio: '', direccion: '', apoderado_id: null, furgon_id: null })}
                  className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo
                </button>
              </div>
              <div className="space-y-2">
                {estudiantes.map(e => {
                  const furgon = furgones.find(f => f.id === e.furgon_id);
                  const apo = profiles.find(p => p.id === e.apoderado_id);
                  const status = getLatestEstado(e.id);
                  const isOpen = expandedEst === e.id;
                  return (
                    <div key={e.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedEst(isOpen ? null : e.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 text-sm truncate">{e.nombre}</p>
                            <StatusBadge estado={status} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{e.colegio}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={ev => { ev.stopPropagation(); setEditEstudiante({ ...e }); }} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={ev => { ev.stopPropagation(); deleteEstudiante(e.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs text-gray-600 space-y-1">
                          <p><span className="font-medium">Dirección:</span> {e.direccion}</p>
                          <p><span className="font-medium">Furgón:</span> {furgon?.nombre_furgon ?? 'Sin asignar'} {furgon ? `(${furgon.patente})` : ''}</p>
                          <p><span className="font-medium">Apoderado:</span> {apo?.nombre ?? 'Sin asignar'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Edit Profile */}
      {editProfile && (
        <Modal title={editProfile.id ? 'Editar Usuario' : 'Nuevo Usuario'} onClose={() => setEditProfile(null)}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input value={editProfile.nombre ?? ''} onChange={e => setEditProfile(p => ({ ...p!, nombre: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
          <input value={editProfile.contacto ?? ''} onChange={e => setEditProfile(p => ({ ...p!, contacto: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
          <select value={editProfile.role ?? 'apoderado'} onChange={e => setEditProfile(p => ({ ...p!, role: e.target.value as Profile['role'] }))} className="input mb-4">
            <option value="admin">Administrador</option>
            <option value="chofer">Chofer</option>
            <option value="apoderado">Apoderado</option>
          </select>
          <div className="flex gap-2">
            <button onClick={saveProfile} className="flex-1 btn-primary flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Guardar</button>
            <button onClick={() => setEditProfile(null)} className="flex-1 btn-ghost flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Modal: Edit Furgon */}
      {editFurgon && (
        <Modal title={editFurgon.id ? 'Editar Furgón' : 'Nuevo Furgón'} onClose={() => setEditFurgon(null)}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del furgón</label>
          <input value={editFurgon.nombre_furgon ?? ''} onChange={e => setEditFurgon(f => ({ ...f!, nombre_furgon: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Patente</label>
          <input value={editFurgon.patente ?? ''} onChange={e => setEditFurgon(f => ({ ...f!, patente: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Capacidad</label>
          <input type="number" value={editFurgon.capacidad ?? 10} onChange={e => setEditFurgon(f => ({ ...f!, capacidad: parseInt(e.target.value) || 0 }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Chofer asignado</label>
          <select value={editFurgon.chofer_id ?? ''} onChange={e => setEditFurgon(f => ({ ...f!, chofer_id: e.target.value || null }))} className="input mb-4">
            <option value="">Sin asignar</option>
            {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={saveFurgon} className="flex-1 btn-primary flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Guardar</button>
            <button onClick={() => setEditFurgon(null)} className="flex-1 btn-ghost flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Modal: Edit Estudiante */}
      {editEstudiante && (
        <Modal title={editEstudiante.id ? 'Editar Estudiante' : 'Nuevo Estudiante'} onClose={() => setEditEstudiante(null)}>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input value={editEstudiante.nombre ?? ''} onChange={e => setEditEstudiante(es => ({ ...es!, nombre: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Colegio</label>
          <input value={editEstudiante.colegio ?? ''} onChange={e => setEditEstudiante(es => ({ ...es!, colegio: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
          <input value={editEstudiante.direccion ?? ''} onChange={e => setEditEstudiante(es => ({ ...es!, direccion: e.target.value }))} className="input mb-3" />
          <label className="block text-xs font-medium text-gray-600 mb-1">Apoderado</label>
          <select value={editEstudiante.apoderado_id ?? ''} onChange={e => setEditEstudiante(es => ({ ...es!, apoderado_id: e.target.value || null }))} className="input mb-3">
            <option value="">Sin asignar</option>
            {apoderados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <label className="block text-xs font-medium text-gray-600 mb-1">Furgón</label>
          <select value={editEstudiante.furgon_id ?? ''} onChange={e => setEditEstudiante(es => ({ ...es!, furgon_id: e.target.value || null }))} className="input mb-4">
            <option value="">Sin asignar</option>
            {furgones.map(f => <option key={f.id} value={f.id}>{f.nombre_furgon} ({f.patente})</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={saveEstudiante} className="flex-1 btn-primary flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Guardar</button>
            <button onClick={() => setEditEstudiante(null)} className="flex-1 btn-ghost flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
