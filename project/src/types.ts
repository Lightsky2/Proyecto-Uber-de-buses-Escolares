export type Role = 'admin' | 'chofer' | 'apoderado';

export type EstadoValue = 'en_ruta' | 'en_escuela' | 'retirado' | 'esperando';

export interface Profile {
  id: string;
  role: Role;
  nombre: string;
  contacto: string;
  created_at?: string;
}

export interface Furgon {
  id: string;
  nombre_furgon: string;
  patente: string;
  capacidad: number;
  chofer_id: string | null;
  chofer?: Profile;
  created_at?: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  colegio: string;
  direccion: string;
  apoderado_id: string | null;
  furgon_id: string | null;
  apoderado?: Profile;
  furgon?: Furgon;
  created_at?: string;
}

export interface Estado {
  id: string;
  estudiante_id: string;
  estado: EstadoValue;
  fecha_hora: string;
  created_at?: string;
}

export interface EstudianteConEstado extends Estudiante {
  ultimo_estado?: Estado;
}
