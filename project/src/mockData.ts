import type { Profile, Furgon, Estudiante, Estado } from './types';

export const MOCK_PROFILES: Profile[] = [
  { id: 'admin-1', role: 'admin', nombre: 'Carlos Administrador', contacto: 'admin@viajseguro.cl' },
  { id: 'chofer-1', role: 'chofer', nombre: 'Roberto Fuentes', contacto: '+56 9 8765 4321' },
  { id: 'chofer-2', role: 'chofer', nombre: 'Ana Morales', contacto: '+56 9 7654 3210' },
  { id: 'apoderado-1', role: 'apoderado', nombre: 'María González', contacto: '+56 9 1234 5678' },
  { id: 'apoderado-2', role: 'apoderado', nombre: 'Jorge Ramírez', contacto: '+56 9 2345 6789' },
  { id: 'apoderado-3', role: 'apoderado', nombre: 'Luisa Torres', contacto: '+56 9 3456 7890' },
];

export const MOCK_FURGONES: Furgon[] = [
  { id: 'furgon-1', nombre_furgon: 'Furgón Norte', patente: 'BCDT-45', capacidad: 12, chofer_id: 'chofer-1' },
  { id: 'furgon-2', nombre_furgon: 'Furgón Sur', patente: 'FGHJ-78', capacidad: 10, chofer_id: 'chofer-2' },
];

export const MOCK_ESTUDIANTES: Estudiante[] = [
  { id: 'est-1', nombre: 'Sofía González', colegio: 'Colegio San Martín', direccion: 'Av. Las Flores 123, Santiago', apoderado_id: 'apoderado-1', furgon_id: 'furgon-1' },
  { id: 'est-2', nombre: 'Diego González', colegio: 'Colegio San Martín', direccion: 'Av. Las Flores 123, Santiago', apoderado_id: 'apoderado-1', furgon_id: 'furgon-1' },
  { id: 'est-3', nombre: 'Matías Ramírez', colegio: 'Instituto Nacional', direccion: 'Calle Los Pinos 456, Santiago', apoderado_id: 'apoderado-2', furgon_id: 'furgon-1' },
  { id: 'est-4', nombre: 'Valentina Torres', colegio: 'Colegio Inglés', direccion: 'Pasaje El Roble 789, Santiago', apoderado_id: 'apoderado-3', furgon_id: 'furgon-2' },
  { id: 'est-5', nombre: 'Benjamín Torres', colegio: 'Colegio Inglés', direccion: 'Pasaje El Roble 789, Santiago', apoderado_id: 'apoderado-3', furgon_id: 'furgon-2' },
];

export const MOCK_ESTADOS: Estado[] = [
  { id: 'estado-1', estudiante_id: 'est-1', estado: 'en_ruta', fecha_hora: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'estado-2', estudiante_id: 'est-2', estado: 'esperando', fecha_hora: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'estado-3', estudiante_id: 'est-3', estado: 'en_escuela', fecha_hora: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'estado-4', estudiante_id: 'est-4', estado: 'retirado', fecha_hora: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'estado-5', estudiante_id: 'est-5', estado: 'esperando', fecha_hora: new Date(Date.now() - 90 * 60000).toISOString() },
];

// Credentials for mock login (email -> profile id)
export const MOCK_CREDENTIALS: Record<string, { password: string; profileId: string }> = {
  'admin@viajseguro.cl': { password: 'admin123', profileId: 'admin-1' },
  'roberto@viajseguro.cl': { password: 'chofer123', profileId: 'chofer-1' },
  'ana@viajseguro.cl': { password: 'chofer123', profileId: 'chofer-2' },
  'maria@viajseguro.cl': { password: 'apoderado123', profileId: 'apoderado-1' },
  'jorge@viajseguro.cl': { password: 'apoderado123', profileId: 'apoderado-2' },
  'luisa@viajseguro.cl': { password: 'apoderado123', profileId: 'apoderado-3' },
};
