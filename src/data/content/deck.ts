import { BATTLE_RULES } from './rules';
import { spellById } from './spells';
import { unitById } from './units';

export interface DeckAnalysis {
  avgCost: number;
  antiAir: number;
  tanks: number;
  area: number;
  /** Magias do deck que causam dano em área (também respondem a enxames). */
  areaSpells: number;
  /** Avisos de montagem (ver wiki/regras/deck.md, "Princípios de um bom deck"). */
  warnings: string[];
}

/** Analisa um deck (tropas e, se informadas, magias) e aponta problemas comuns de montagem. */
export function analyzeDeck(unitIds: string[], spellIds: string[] = []): DeckAnalysis {
  const units = unitIds.map((id) => unitById(id)).filter((u) => !!u);
  const avgCost = units.length ? units.reduce((s, u) => s + u.cost, 0) / units.length : 0;
  const antiAir = units.filter((u) => u.targetsAir).length;
  const tanks = units.filter((u) => u.roles.includes('tanque')).length;
  const area = units.filter((u) => u.roles.includes('area') || !!u.splash).length;
  const areaSpells = spellIds
    .map((id) => spellById(id))
    // Conta magias que causam dano direto; invocações (têm `vida`) e magias em aliados ficam de fora.
    .filter((s) => !!s && s.stats.dano !== undefined && s.stats.vida === undefined && s.target !== 'aliado').length;

  const warnings: string[] = [];
  const missing = BATTLE_RULES.deckSize - units.length;
  if (missing > 0) warnings.push(`Faltam ${missing} tropa${missing > 1 ? 's' : ''}`);
  if (units.length) {
    if (avgCost < 3) warnings.push('Custo médio baixo: pode faltar força');
    if (avgCost > 4.3) warnings.push('Custo médio alto: difícil reagir a tempo');
    if (antiAir < 2) warnings.push(`Só ${antiAir} tropa${antiAir === 1 ? '' : 's'} acerta${antiAir === 1 ? '' : 'm'} voadores (ideal: 2+)`);
    if (tanks === 0) warnings.push('Nenhum tanque para segurar dano');
    if (area + areaSpells === 0) warnings.push('Nenhum dano em área (tropa ou magia): enxames vão incomodar');
  }
  return { avgCost, antiAir, tanks, area, areaSpells, warnings };
}
