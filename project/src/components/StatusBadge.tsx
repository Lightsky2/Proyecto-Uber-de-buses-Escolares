import type { EstadoValue } from '../types';

const config: Record<EstadoValue, { label: string; classes: string; dot: string }> = {
  esperando: { label: 'Esperando', classes: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  en_ruta:   { label: 'En Ruta',   classes: 'bg-sky-100 text-sky-700',   dot: 'bg-sky-500 animate-pulse' },
  en_escuela:{ label: 'En Escuela',classes: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  retirado:  { label: 'Retirado',  classes: 'bg-amber-100 text-amber-700',dot: 'bg-amber-500' },
};

export default function StatusBadge({ estado }: { estado: EstadoValue }) {
  const c = config[estado] ?? config.esperando;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
