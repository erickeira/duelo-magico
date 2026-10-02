import type { SpellDef } from './types';

/**
 * 20 magias, 5 por deus (2 comuns, 2 raras, 1 épica).
 * Magias NÃO gastam mana: usam recarga inicial + recarga.
 * Valores no nível 1 da magia; chaves em `scaling` crescem +10% por nível (máx. 5).
 */
export const SPELLS: SpellDef[] = [
  // ------------------------------------------------------------------ Ignar (fogo)
  {
    id: 'cometa-rubro', name: 'Cometa Rubro', icon: '☄️', god: 'ignar', rarity: 'comum', target: 'ponto',
    initialCooldown: 10, cooldown: 25, radius: 90,
    stats: { dano: 320, danoCastelo: 110 }, scaling: ['dano', 'danoCastelo'],
    description: 'Um cometa cai no ponto escolhido e causa {dano} de dano em área ({danoCastelo} se atingir o castelo).',
    evolutions: [
      { level: 3, description: 'Deixa o chão em brasa por 3s: 30 de dano por segundo na área.' },
      { level: 5, description: 'Raio +25%.' },
    ],
    godLevel: 1,
  },
  {
    id: 'brado-guerra', name: 'Brado de Guerra', icon: '📯', god: 'ignar', rarity: 'comum', target: 'trilha',
    initialCooldown: 15, cooldown: 30,
    stats: { velocidadeAtaquePct: 40, movimentoPct: 30, duracao: 6 }, scaling: [],
    description: 'Tropas aliadas na trilha ganham +{velocidadeAtaquePct}% de velocidade de ataque e +{movimentoPct}% de movimento por {duracao}s.',
    evolutions: [
      { level: 3, description: 'Também concede +20% de dano.' },
      { level: 5, description: 'Duração aumenta para 9s.' },
    ],
    godLevel: 1,
  },
  {
    id: 'muralha-fogo', name: 'Muralha de Fogo', icon: '🔥', god: 'ignar', rarity: 'rara', target: 'ponto',
    initialCooldown: 20, cooldown: 35, radius: 40,
    stats: { danoPorSegundo: 70, duracao: 8 }, scaling: ['danoPorSegundo'],
    description: 'Ergue uma parede de chamas atravessando a trilha. Inimigos que passam por ela levam {danoPorSegundo} de dano por segundo por {duracao}s.',
    evolutions: [
      { level: 3, description: 'Inimigos dentro da muralha ficam 30% mais lentos.' },
      { level: 5, description: 'Duração aumenta para 12s.' },
    ],
    godLevel: 4,
  },
  {
    id: 'sopro-vulcao', name: 'Sopro do Vulcão', icon: '🌋', god: 'ignar', rarity: 'rara', target: 'ponto',
    initialCooldown: 20, cooldown: 30, radius: 60,
    stats: { dano: 480, empurrao: 70 }, scaling: ['dano'],
    description: 'Explosão concentrada: {dano} de dano em área pequena e empurra os inimigos {empurrao}px para trás.',
    evolutions: [
      { level: 3, description: 'Atordoa os inimigos atingidos por 1s.' },
      { level: 5, description: 'Empurrão dobrado.' },
    ],
    godLevel: 6,
  },
  {
    id: 'juizo-cinzas', name: 'Juízo das Cinzas', icon: '🌠', god: 'ignar', rarity: 'epica', target: 'arena',
    initialCooldown: 45, cooldown: 70, radius: 80,
    stats: { dano: 350 }, scaling: ['dano'],
    description: 'Um meteoro cai sobre a tropa inimiga mais avançada de CADA trilha, causando {dano} de dano em área.',
    evolutions: [
      { level: 3, description: 'Cada meteoro deixa brasa por 3s (40 de dano por segundo).' },
      { level: 5, description: 'Cai um segundo meteoro em cada trilha, 1s depois.' },
    ],
    godLevel: 8,
  },

  // ------------------------------------------------------------------ Solenne (luz)
  {
    id: 'escudo-aurora', name: 'Escudo da Aurora', icon: '🛡️', god: 'solenne', rarity: 'comum', target: 'ponto',
    initialCooldown: 8, cooldown: 22, radius: 100,
    stats: { escudo: 220, duracao: 8 }, scaling: ['escudo'],
    description: 'Tropas aliadas na área recebem um escudo de {escudo} que dura {duracao}s.',
    evolutions: [
      { level: 3, description: 'Raio +30%.' },
      { level: 5, description: 'Quando o escudo quebra, cura 100 de vida.' },
    ],
    godLevel: 1,
  },
  {
    id: 'martelo-celeste', name: 'Martelo Celeste', icon: '🔨', god: 'solenne', rarity: 'comum', target: 'ponto',
    initialCooldown: 10, cooldown: 24, radius: 50,
    stats: { dano: 260, atordoamento: 1.5 }, scaling: ['dano'],
    description: 'Um martelo de luz cai do céu: {dano} de dano e atordoa por {atordoamento}s.',
    evolutions: [
      { level: 3, description: 'Atordoamento aumenta para 2,5s.' },
      { level: 5, description: 'Cria uma onda de choque: 50% do dano num raio de 100.' },
    ],
    godLevel: 1,
  },
  {
    id: 'bencao-luz', name: 'Bênção da Luz', icon: '💖', god: 'solenne', rarity: 'rara', target: 'ponto',
    initialCooldown: 18, cooldown: 32, radius: 120,
    stats: { cura: 320, regeneracao: 20, duracao: 5 }, scaling: ['cura', 'regeneracao'],
    description: 'Cura {cura} de vida das tropas aliadas na área e elas regeneram {regeneracao}/s por {duracao}s.',
    evolutions: [
      { level: 3, description: 'Também cura 150 de vida do seu castelo.' },
      { level: 5, description: 'Remove lentidão, congelamento e redução de cura dos aliados.' },
    ],
    godLevel: 4,
  },
  {
    id: 'falange-luz', name: 'Falange de Luz', icon: '🗡️', god: 'solenne', rarity: 'rara', target: 'trilha',
    initialCooldown: 20, cooldown: 35,
    stats: { soldados: 3, vida: 300, dano: 50, duracao: 15 }, scaling: ['vida', 'dano'],
    description: 'Invoca {soldados} Lanceiros de Luz na frente do seu castelo ({vida} de vida, {dano} de dano) que duram {duracao}s.',
    evolutions: [
      { level: 3, description: 'Invoca 4 soldados.' },
      { level: 5, description: 'Os soldados acertam voadores e recebem 20% menos dano.' },
    ],
    godLevel: 6,
  },
  {
    id: 'alvorada', name: 'Alvorada', icon: '🌅', god: 'solenne', rarity: 'epica', target: 'arena',
    initialCooldown: 40, cooldown: 75,
    stats: { curaPct: 40, danoPct: 20, duracao: 6 }, scaling: [],
    description: 'Todas as tropas aliadas da arena recuperam {curaPct}% da vida máxima e ganham +{danoPct}% de dano por {duracao}s.',
    evolutions: [
      { level: 3, description: 'Seu castelo recupera 5% da vida máxima.' },
      { level: 5, description: 'Aliados ficam imunes a controle (lentidão, congelamento, atordoamento) durante o efeito.' },
    ],
    godLevel: 8,
  },

  // ------------------------------------------------------------------ Hyela (gelo)
  {
    id: 'vento-gelido', name: 'Vento Gélido', icon: '🌬️', god: 'hyela', rarity: 'comum', target: 'trilha',
    initialCooldown: 10, cooldown: 24,
    stats: { dano: 70, lentidaoPct: 40, duracao: 5 }, scaling: ['dano'],
    description: 'Uma rajada percorre a trilha inteira: {dano} de dano em todos os inimigos e {lentidaoPct}% de lentidão por {duracao}s.',
    evolutions: [
      { level: 3, description: 'Lentidão aumenta para 55%.' },
      { level: 5, description: 'Empurra inimigos 40px para trás.' },
    ],
    godLevel: 1,
  },
  {
    id: 'lancas-gelo', name: 'Lanças de Gelo', icon: '🧊', god: 'hyela', rarity: 'comum', target: 'trilha',
    initialCooldown: 10, cooldown: 22,
    stats: { lancas: 3, dano: 160 }, scaling: ['dano'],
    description: 'Dispara {lancas} lanças em sequência pela trilha, a partir do seu castelo. Cada uma atravessa os inimigos causando {dano} de dano.',
    evolutions: [
      { level: 3, description: 'Dispara 4 lanças.' },
      { level: 5, description: 'Cada lança congela por 0,5s.' },
    ],
    godLevel: 1,
  },
  {
    id: 'prisao-cristal', name: 'Prisão de Cristal', icon: '❄️', god: 'hyela', rarity: 'rara', target: 'ponto',
    initialCooldown: 15, cooldown: 30, radius: 100,
    stats: { dano: 60, congelamento: 3 }, scaling: ['dano'],
    description: 'Congela todos os inimigos na área por {congelamento}s (não andam nem atacam) e causa {dano} de dano.',
    evolutions: [
      { level: 3, description: 'Congelamento aumenta para 4s.' },
      { level: 5, description: 'Inimigos congelados recebem +25% de dano.' },
    ],
    godLevel: 4,
  },
  {
    id: 'coracao-glacial', name: 'Coração Glacial', icon: '💠', god: 'hyela', rarity: 'rara', target: 'aliado',
    initialCooldown: 18, cooldown: 30,
    stats: { vidaExtra: 500, duracao: 10, lentidaoPct: 30 }, scaling: ['vidaExtra'],
    description: 'A tropa aliada escolhida ganha uma armadura de gelo de {vidaExtra} por {duracao}s. Quem a ataca fica {lentidaoPct}% mais lento.',
    evolutions: [
      { level: 3, description: 'Quando a armadura quebra, explode congelando inimigos próximos por 1,5s.' },
      { level: 5, description: 'Armadura dura 15s.' },
    ],
    godLevel: 6,
  },
  {
    id: 'era-gelo', name: 'Era do Gelo', icon: '🏔️', god: 'hyela', rarity: 'epica', target: 'arena',
    initialCooldown: 45, cooldown: 75,
    stats: { dano: 100, congelamento: 2.5 }, scaling: ['dano'],
    description: 'Congela TODAS as tropas inimigas da arena por {congelamento}s e causa {dano} de dano.',
    evolutions: [
      { level: 3, description: 'Congelamento aumenta para 3,5s.' },
      { level: 5, description: 'Construções inimigas também perdem 30% da vida.' },
    ],
    godLevel: 8,
  },

  // ------------------------------------------------------------------ Thalor (natureza)
  {
    id: 'raizes', name: 'Raízes Famintas', icon: '🌿', god: 'thalor', rarity: 'comum', target: 'ponto',
    initialCooldown: 8, cooldown: 22, radius: 80,
    stats: { dano: 90, prisao: 2.5 }, scaling: ['dano'],
    description: 'Raízes prendem os inimigos terrestres na área por {prisao}s (não andam, mas atacam) e causam {dano} de dano.',
    evolutions: [
      { level: 3, description: 'As raízes também puxam voadores para o chão (perdem o voo enquanto presos).' },
      { level: 5, description: 'Inimigos presos levam 40 de dano por segundo.' },
    ],
    godLevel: 1,
  },
  {
    id: 'forca-selvagem', name: 'Força Selvagem', icon: '💪', god: 'thalor', rarity: 'comum', target: 'aliado',
    initialCooldown: 12, cooldown: 26,
    stats: { vidaPct: 50, danoPct: 50, duracao: 10 }, scaling: [],
    description: 'A tropa aliada escolhida cresce: +{vidaPct}% de vida e +{danoPct}% de dano por {duracao}s.',
    evolutions: [
      { level: 3, description: 'A tropa também fica imune a empurrões e atordoamento.' },
      { level: 5, description: 'O efeito passa a ser permanente.' },
    ],
    godLevel: 1,
  },
  {
    id: 'revoada', name: 'Revoada', icon: '🐦‍⬛', god: 'thalor', rarity: 'rara', target: 'trilha',
    initialCooldown: 18, cooldown: 32,
    stats: { corvos: 4, vida: 120, dano: 35, duracao: 12 }, scaling: ['vida', 'dano'],
    description: 'Invoca {corvos} corvos-espírito voadores ({vida} de vida, {dano} de dano) na frente do seu castelo, que duram {duracao}s.',
    evolutions: [
      { level: 3, description: 'Invoca 6 corvos.' },
      { level: 5, description: 'Os ataques dos corvos deixam o alvo 20% mais lento.' },
    ],
    godLevel: 4,
  },
  {
    id: 'investida-alce', name: 'Investida do Alce', icon: '🫎', god: 'thalor', rarity: 'rara', target: 'trilha',
    initialCooldown: 20, cooldown: 34,
    stats: { dano: 300, empurrao: 60, danoCastelo: 150 }, scaling: ['dano', 'danoCastelo'],
    description: 'Um alce espiritual atravessa a trilha inteira: {dano} de dano e empurrão de {empurrao}px em cada inimigo terrestre. Se chegar ao castelo, causa {danoCastelo}.',
    evolutions: [
      { level: 3, description: 'Atordoa os atingidos por 1s.' },
      { level: 5, description: 'Corre por duas trilhas (a escolhida e a vizinha mais ameaçada).' },
    ],
    godLevel: 6,
  },
  {
    id: 'chamado-ancestral', name: 'Chamado Ancestral', icon: '🌳', god: 'thalor', rarity: 'epica', target: 'trilha',
    initialCooldown: 40, cooldown: 75,
    stats: { vida: 3000, dano: 160, duracao: 20 }, scaling: ['vida', 'dano'],
    description: 'Invoca o Guardião Ancestral na trilha escolhida: um tanque com {vida} de vida e {dano} de dano em área que dura {duracao}s.',
    evolutions: [
      { level: 3, description: 'O Guardião provoca: inimigos próximos são obrigados a atacá-lo.' },
      { level: 5, description: 'Ao sumir, cura 300 de vida das tropas aliadas na trilha.' },
    ],
    godLevel: 8,
  },
];

export const spellById = (id: string) => SPELLS.find((s) => s.id === id);

/** Troca {chave} pelos valores da magia no nível informado (dano/cura escalam +10% por nível). */
export function describeSpell(spell: SpellDef, level = 1): string {
  return spell.description.replace(/\{(\w+)\}/g, (_, key: string) => {
    const base = spell.stats[key];
    if (base === undefined) return `{${key}}`;
    const value = spell.scaling.includes(key) ? Math.round(base * (1 + 0.1 * (level - 1))) : base;
    return String(value).replace('.', ',');
  });
}
