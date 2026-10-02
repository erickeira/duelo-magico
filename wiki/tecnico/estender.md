# Como estender

Os **números** vivem em `src/data/content/` (ver [Dados do jogo](/tecnico/dados)), e o **comportamento** especial vive em `src/battle/`. Uma tropa ou magia nova quase sempre mexe nos dois lugares.

## Adicionar uma tropa

1. **Dados:** acrescente a entrada em `UNITS` (`src/data/content/units.ts`) e rode `npm run validate`.
2. **Comportamento:** se a tropa só anda e ataca (com ou sem área, voo ou alcance), **não precisa de código**. Se tem habilidade, adicione os ganchos em `ABILITIES` (`src/battle/abilities.ts`), usando o mesmo id:

```ts
gigante: {
  // Pisão: a cada 5s, atordoa inimigos num raio de 60 por 1s.
  onTick(u, api, dt) {
    every(u, 'pisao', dt, 5, () => {
      for (const e of api.enemiesInRadius(u.team, u.x, u.y, 60, false)) api.applyStatus(e, 'stun', 1);
      api.pulse(u.x, u.y, 60, 0xa16207, 0.5);
    });
  },
},
```

| Gancho | Quando roda | Exemplos atuais |
|---|---|---|
| `onSpawn` | Ao entrar em campo | Campeã do Sol |
| `onTick` | A cada quadro, se a tropa pode agir | Clériga, Necromante, Fada, Arquimaga |
| `onAttack` | No lugar do ataque normal (retorne `true`) | Bomba de Ossos |
| `onHit` | Depois de causar dano (inclui área) | Carniçal, Elemental de Água, Dragão Ósseo |
| `onKill` | Quando o ataque mata | Ceifador |
| `onDeath` | Ao morrer (não roda para quem expirou) | Colosso de Carne |
| `modifyDamage` | Antes de atacar, ajusta o dano | Grifo Real, Ceifador, Torre de Cristal |

3. **Wiki:** acrescente a ficha na página do mundo (ver [Dados do jogo](/tecnico/dados#criar-uma-tropa-nova)).

## Adicionar uma magia

1. **Dados:** acrescente a entrada em `SPELLS` (`src/data/content/spells.ts`) e o id na lista `spells` do deus (`gods.ts`).
2. **Comportamento:** crie a função em `CASTERS` (`src/battle/spells.ts`) com o mesmo id. Ela recebe `(api, time, magia, nível, alvo)`:

```ts
'chuva-acida'(api, team, s, L, t) {
  for (const e of api.enemiesInRadius(team, t.x, t.y, s.radius ?? 90)) {
    api.dealDamage(e, val(s, 'dano', L));          // val() aplica +10% por nível
    if (L >= 3) api.applyStatus(e, 'slow', 3, 30); // evolução do nível 3
  }
  api.pulse(t.x, t.y, s.radius ?? 90, 0x84cc16, 0.5);
},
```

Efeitos que duram (chão em brasa, algo que atravessa a trilha, efeitos atrasados) usam os auxiliares `burningZone`, `laneRunner` e `delayed`, ou um `ArenaEffect` próprio via `api.addEffect`.

3. **IA:** em `Ai.spellTarget` (`src/battle/Ai.ts`), diga quando e onde a IA deve usar a magia. Sem isso, a IA nunca a lança.
4. **Wiki:** acrescente o título e o `<SpellCard>` na página do deus.

## Balanceamento

- Números das tropas e magias: `src/data/content/units.ts` e `spells.ts`.
- Regras da partida (tempo, mana, castelo): `src/data/content/rules.ts`.
- Vida base do castelo: `CASTLE_BASE_HP` em `progression.ts`.
- Comportamento da IA por dificuldade: `PROFILES` em `src/battle/Ai.ts`.

Depois de mudar, meça com a [simulação IA × IA](/tecnico/arquitetura#simulacao).

## Arte das tropas

As tropas já têm arte: carta (`public/assets/cards/<id>.jpg`) e token da batalha (`public/assets/tokens/<id>.png`), carregados pela `PreloadScene` com as chaves `card-<id>` e `token-<id>`. Uma tropa nova só precisa da imagem com o mesmo id; sem ela, o jogo mostra o emoji. O passo a passo da geração está em [Arte e áudio](/arte-audio#producao).

## Dar animação a uma tropa

O passo a passo completo (Meshy → rig → renderizador) está em [Arte e áudio](/arte-audio#sprites-animadas). Em resumo, para a tropa `<id>`:

1. Salve o GLB com rig em `art/models/<id>.glb`.
2. Em `tools/sprite-renderer/rigs.ts`, acrescente o mapa de ossos em `RIGS` (e, se o corpo for diferente, um conjunto de animações próprio, como o `HEAVY_ANIMS`).
3. Rode `http://localhost:5180/tools/sprite-renderer/?model=<id>&save=1` com o `npm run dev` ligado.

Nenhuma mudança de código no jogo é necessária: com `<id>` no `public/assets/sprites/manifest.json`, a `Unit` usa a sprite animada automaticamente (`setAnim`, `playAttack`, `freezeAnim`, `playDeath`), e sem ele continua com o token.

A lógica não depende do visual: as animações só leem o estado da tropa (andando, atacando, congelada, morta).
