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

## Trocar a arte placeholder por sprites

Hoje cada tropa é um círculo colorido (quadrado para construções) com um emoji (`Unit.ts`), e o castelo é um retângulo (`Castle.ts`).

1. Coloque as imagens em `public/assets/` (ex.: `public/assets/units/cavaleiro.png`).
2. Crie uma `PreloadScene` que carregue tudo (`this.load.image(...)` / `this.load.spritesheet(...)`) e registre essa cena antes da `MenuScene` em `main.ts`.
3. Use o próprio id da tropa como chave da textura, para não precisar de campo novo nos dados.
4. Em `Unit.ts`, substitua o `body_` + `icon` por `scene.add.sprite(0, lift, stats.id)`. Desenhe os sprites olhando para a direita e use `setFlipX(team === 'enemy')` para a IA. Para diferenciar os times, use `setTint` ou carregue versões azul e vermelha.
5. Para animações (andar e atacar), use `this.anims.create` na preload e `sprite.play('cavaleiro-andar')` no `updateUnit`/`attack`.

A lógica não depende do visual. Só `Unit`, `Castle`, `CardView` e `SpellButton` precisam mudar.
