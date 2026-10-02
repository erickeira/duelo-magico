import { withBase } from 'vitepress';
import { GODS, ROLE_LABELS, SPELLS, UNITS, rarityById, worldById } from '@content/index';

export const fmt = (n: number) => n.toLocaleString('pt-BR');

export const unitLink = (id: string) => {
  const u = UNITS.find((x) => x.id === id);
  return u ? withBase(`/tropas/${u.world}#${u.id}`) : '#';
};

export const spellLink = (id: string) => {
  const s = SPELLS.find((x) => x.id === id);
  return s ? withBase(`/deuses/${s.god}#${s.id}`) : '#';
};

/** Nome + ícone + link de uma tropa ou magia a partir do id. */
export function ref(id: string): { label: string; href: string } {
  const u = UNITS.find((x) => x.id === id);
  if (u) return { label: `${u.icon} ${u.name}`, href: unitLink(id) };
  const s = SPELLS.find((x) => x.id === id);
  if (s) return { label: `${s.icon} ${s.name}`, href: spellLink(id) };
  return { label: id, href: '#' };
}

export const roleLabel = (r: string) => ROLE_LABELS[r] ?? r;
export const rarityOf = rarityById;
export const worldOf = worldById;
export const godOf = (id: string) => GODS.find((g) => g.id === id)!;

export const TARGET_LABELS: Record<string, string> = {
  ponto: 'Ponto',
  trilha: 'Trilha inteira',
  aliado: 'Tropa aliada',
  arena: 'Arena inteira',
  castelo: 'Castelo',
};

export const dps = (damage: number, interval: number, count = 1) => Math.round((damage / interval) * count);
