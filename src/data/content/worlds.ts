import type { RarityDef, WorldDef } from './types';

export const WORLDS: WorldDef[] = [
  {
    id: 'solar',
    name: 'Reino Solar',
    icon: '☀️',
    color: '#eab308',
    theme: 'Ordem, disciplina e defesa',
    description:
      'Os povos das planícies douradas, protegidos pelas muralhas de Aurévia. Cavaleiros, arqueiras e sacerdotes que vencem pela formação: tropas que se apoiam, curam e resistem.',
    strengths: ['Sustentação (cura e escudos)', 'Boa defesa contra enxames', 'Tropas versáteis e baratas'],
    weaknesses: ['Dano em área baixo', 'Lento para pressionar o castelo', 'Sofre contra tanques muito grandes'],
  },
  {
    id: 'abismo',
    name: 'Abismo',
    icon: '💀',
    color: '#dc2626',
    theme: 'Enxames, sacrifício e morte que volta',
    description:
      'As fendas sob a terra onde os mortos não descansam. Esqueletos, carniçais e criaturas que explodem: muitas tropas baratas, roubo de vida e efeitos ao morrer.',
    strengths: ['Muitas unidades por carta', 'Efeitos ao morrer', 'Pressão rápida e barata'],
    weaknesses: ['Tropas frágeis individualmente', 'Muito vulnerável a dano em área', 'Pouca defesa antiaérea'],
  },
  {
    id: 'arcano',
    name: 'Domínio Arcano',
    icon: '🔮',
    color: '#06b6d4',
    theme: 'Elementos, alcance e controle',
    description:
      'As ilhas flutuantes onde a magia corre como rios. Elementais, magos e construtos que atacam de longe, desaceleram inimigos e protegem com a própria matéria da magia.',
    strengths: ['Alcance e dano em área', 'Controle (lentidão, empurrão)', 'Melhores tropas antiaéreas'],
    weaknesses: ['Tropas caras', 'Pouca vida nas unidades de dano', 'Fraco quando alcançado no corpo a corpo'],
  },
];

export const RARITIES: RarityDef[] = [
  { id: 'comum', name: 'Comum', color: '#9ca3af', startLevel: 1 },
  { id: 'rara', name: 'Rara', color: '#3b82f6', startLevel: 3 },
  { id: 'epica', name: 'Épica', color: '#a855f7', startLevel: 5 },
  { id: 'lendaria', name: 'Lendária', color: '#f59e0b', startLevel: 7 },
];

export const ROLE_LABELS: Record<string, string> = {
  tanque: 'Tanque',
  'corpo-a-corpo': 'Corpo a corpo',
  distancia: 'Distância',
  enxame: 'Enxame',
  area: 'Dano em área',
  suporte: 'Suporte',
  cerco: 'Cerco',
  voador: 'Voador',
  construcao: 'Construção',
};

export const worldById = (id: string) => WORLDS.find((w) => w.id === id)!;
export const rarityById = (id: string) => RARITIES.find((r) => r.id === id)!;
