export * from './types';
export * from './worlds';
export * from './units';
export * from './spells';
export * from './gods';
export * from './progression';
export * from './economy';
export * from './rules';
export * from './deck';
export * from './tutorial';

import { GODS } from './gods';
import { SPELLS } from './spells';
import { UNITS } from './units';
import { BATTLE_RULES } from './rules';
import { TUTORIAL } from './tutorial';

/** Verifica referências cruzadas do conteúdo. Retorna a lista de problemas (vazia = ok). */
export function validateContent(): string[] {
  const problems: string[] = [];
  const unitIds = new Set(UNITS.map((u) => u.id));
  const spellIds = new Set(SPELLS.map((s) => s.id));
  const known = (id: string) => unitIds.has(id) || spellIds.has(id);

  if (unitIds.size !== UNITS.length) problems.push('ids de tropas duplicados');
  if (spellIds.size !== SPELLS.length) problems.push('ids de magias duplicados');

  for (const u of UNITS) {
    for (const id of [...u.strongAgainst, ...u.weakAgainst]) {
      if (!known(id)) problems.push(`${u.id}: referência desconhecida "${id}"`);
    }
  }
  for (const g of GODS) {
    if (g.spells.length !== 5) problems.push(`${g.id}: deve ter 5 magias`);
    for (const s of g.spells) {
      if (SPELLS.find((x) => x.id === s)?.god !== g.id) problems.push(`${g.id}: magia "${s}" não é deste deus`);
    }
    for (const d of g.suggestedDecks) {
      if (new Set(d.units).size !== BATTLE_RULES.deckSize) problems.push(`${g.id}/${d.name}: deck precisa de ${BATTLE_RULES.deckSize} tropas diferentes`);
      for (const id of d.units) if (!unitIds.has(id)) problems.push(`${g.id}/${d.name}: tropa desconhecida "${id}"`);
      for (const id of d.spells) if (!g.spells.includes(id)) problems.push(`${g.id}/${d.name}: magia "${id}" não é de ${g.name}`);
    }
  }
  TUTORIAL.forEach((t, i) => {
    for (const id of [...t.player.units, ...t.enemy.units]) if (!unitIds.has(id)) problems.push(`tutorial ${i + 1}: tropa desconhecida "${id}"`);
    for (const id of t.player.spells) {
      if (SPELLS.find((x) => x.id === id)?.god !== t.player.god) problems.push(`tutorial ${i + 1}: magia "${id}" não é de ${t.player.god}`);
    }
  });
  return problems;
}
