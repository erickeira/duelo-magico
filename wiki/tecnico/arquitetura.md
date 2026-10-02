# Arquitetura

## Stack

- **Phaser 3**: renderização (WebGL/Canvas), cenas, tweens e input por toque e mouse.
- **TypeScript** (strict) e **Vite** (dev server e build).
- Resolução lógica **1280×720 (paisagem)** com `Scale.FIT`. Todo o código usa essas coordenadas, e o Phaser ajusta para a tela do aparelho.
- As tropas andam no **eixo X**: `Unit.dir` vale `+1` para o jogador (para a direita) e `-1` para a IA. As trilhas são definidas pelo **y** (`LANES_Y`).
- O conteúdo (tropas, magias, deuses e regras) vem de **`src/data/content/`**, a mesma fonte da wiki (ver [Dados do jogo](/tecnico/dados)).

## Cenas

```
             ┌──────────────┐
   ┌────────▶│  HomeScene   │◀──────────────┐
   │         └──┬───┬───┬───┘               │
   │   Montar deck  │  Coleção              │ MENU
   │      ▼         │     ▼                 │
   │  DeckScene     │  CollectionScene      │
   │      │ BATALHAR│                       │
   │      ▼         ▼ BATALHAR {deck, dificuldade}
   │      └───▶ BattleScene ──fim──▶ ResultScene ──JOGAR DE NOVO──▶ BattleScene
   └─────────────────────────────────────────┘
```

- `HomeScene`: barra de recursos (nível de conta, troféus, ouro, essência), deck ativo, arena, dificuldade, 4 espaços de baú, baú grátis e atalhos. Enquanto o tutorial não acaba, o botão principal vira **TUTORIAL n/4**.
- `GodsScene`: subir deuses (essência) e magias (fragmentos + ouro).
- `ResultScene`: mostra as recompensas que o `BattleScene` já aplicou ao save (`applyBattleResult`).
- `DeckScene`: abas dos 5 decks, deus (setas), 5 magias (escolhe 2), 8 espaços, coleção filtrável e análise do deck. Cada mudança vai direto para o save.
- `CollectionScene`: grade das 24 tropas (bloqueadas com 🔒), ficha no nível atual e botão de subir de nível.
- `scenes/ui.ts`: `button`, `toast`, `panel` e `UnitTile`, os componentes reutilizados pelas telas.
- `BattleScene.init()` zera todo o estado, porque o Phaser reaproveita a instância da cena entre partidas.

## Layout (px lógicos)

```
y 0–56     HUD: deus | vida do jogador | cronômetro / MANA x2 / PRORROGAÇÃO | vida da IA | deus
y 60–540   ┌─castelo─┐ ═══ trilha 0 (y=140) ═══ ┊ ═══════════ ┌─castelo─┐
           │ jogador │ ═══ trilha 1 (y=300) ═══ ┊ ═══════════ │   IA    │
           └─────────┘ ═══ trilha 2 (y=460) ═══ ┊ ═══════════ └─────────┘
              x 20–170  ↑ARENA_LEFT=170      MID_X   ARENA_RIGHT=1110↑
y 550–720  [magia][magia]   próxima · mana · mão com 4 cartas
```

## Salvamento (`src/save/save.ts`)

O estado fica em `localStorage`, na chave `duelo-magico:save` (versão 2):

```json
{
  "version": 2,
  "activeDeck": 0,
  "difficulty": "normal",
  "decks": [{ "name": "Fornalha Inicial", "god": "ignar", "spells": ["cometa-rubro", "brado-guerra"], "units": ["cavaleiro", "..."] }],
  "profile": {
    "gold": 100, "essence": 0, "trophies": 0, "bestTrophies": 0, "xp": 0,
    "units": { "cavaleiro": { "level": 1, "cards": 0 } },
    "gods": { "ignar": { "level": 1 } },
    "spells": { "cometa-rubro": { "level": 1, "fragments": 0 } },
    "chests": [{ "type": "prata", "readyAt": null }, null, null, null],
    "freeChests": 1, "freeChestNextAt": 0,
    "tutorial": 0,
    "stats": { "wins": 0, "losses": 0, "draws": 0 }
  }
}
```

- `getSave()` carrega uma vez. O perfil passa por `sanitizeProfile` (ids inexistentes saem, números ficam nos limites), e cada deck passa por `sanitizeDeck`, que tira tropas que o jogador não tem, magias bloqueadas ou de outro deus e repetidas. Com JSON quebrado ou `localStorage` bloqueado, o jogo começa do zero.
- **Migração da v1** (v0.3): o perfil começa novo, os nomes dos decks e a dificuldade ficam, e decks com tropas ainda não conquistadas voltam ao deck inicial.
- `updateSave(fn)` altera e grava. Se a gravação falhar, o jogo segue sem salvar.
- Os decks padrão são os sugeridos dos deuses (`defaultDecks`).
- Ao mudar o formato, aumente `version` e escreva a migração em `load()`.

## Meta-jogo (`src/meta/`)

| Arquivo | Responsabilidade |
|---|---|
| `progress.ts` | Nível de conta, custos e upgrades de tropas, deuses e magias, desbloqueio de deuses por troféus e `applyBattleResult` (troféus com piso da arena, ouro, essência, baú, tutorial). |
| `chests.ts` | Sorteio do conteúdo (`rollChest`: garantidos + pesos por raridade, só tropas da arena), estados dos espaços (vazio, bloqueado, abrindo, pronto), um abrindo por vez e baú grátis acumulando a cada 4 h. |

As funções recebem o `SaveData` ou o `Profile` e o tempo (`now`) como parâmetro, o que facilita testar o relógio sem esperar de verdade.

## Módulos da batalha (`src/battle/`)

| Arquivo | Responsabilidade |
|---|---|
| `Loadout.ts` | O que cada lado leva: deus, magias e níveis, tropas e níveis, e vida do castelo. `loadoutFromDeck()` lê o progresso do jogador; `enemyLoadout()` monta a IA na arena e no nível dele; `tutorialLoadouts()` monta as batalhas do tutorial; `scaledStats()` aplica +8% por nível. |
| `Hand.ts` | Mana, mão de 4 cartas e fila (com `UnitDef`). |
| `Unit.ts` | Uma tropa: atributos, vida, **escudo**, **status** com expiração, **buffs**, tempo de vida (construções e invocações) e desenho dos anéis de status. |
| `Castle.ts` | Vida, cura, dano e barra no HUD. |
| `api.ts` | Interface `BattleApi`, tudo o que habilidades, magias e IA podem fazer na batalha. |
| `abilities.ts` | Ganchos das habilidades por id de tropa (`onSpawn`, `onTick`, `onAttack`, `onHit`, `onKill`, `onDeath`, `modifyDamage`) e a aura do Paladino. |
| `spells.ts` | As 20 magias (`castSpell`) com evoluções, mais efeitos reutilizáveis: zona de fogo, algo que atravessa a trilha, efeito atrasado e invocações. |
| `Ai.ts` | Jogador controlado pelo computador, com 3 perfis de dificuldade. Pode controlar **qualquer lado** (útil para simular IA × IA). |
| `CardView.ts`, `SpellButton.ts` | Interface da carta (moldura com a cor da raridade) e do botão de magia (anel de recarga). |

## Loop de jogo (`BattleScene.update`)

A cada quadro, com `dt` limitado a 50 ms:

1. `now += dt` (segundos de partida, incluindo a prorrogação).
2. Mana dos dois lados (dobrada no último minuto).
3. `Ai.update`.
4. `updateUnit` em cada tropa:
   1. buffs e escudos vencidos;
   2. invocações expiradas (`onExpire`) e construções perdendo vida;
   3. se atordoada ou congelada, para aqui;
   4. `onTick` da habilidade;
   5. busca de alvo (provocador → inimigo à frente na trilha → castelo);
   6. ataque ou movimento.
5. Castelos atiram.
6. Projéteis.
7. Efeitos contínuos (`ArenaEffect`). Efeitos criados durante o update entram na lista sem se perder.
8. Remoção de mortos (`onDeath`, exceto em quem expirou).
9. Dreno da prorrogação.
10. Redesenho de status, HUD e verificação de fim.

## Dano (`BattleScene.dealDamage`)

```
dano × multiplicador fixo da tropa (ex.: Lanceiros de Luz evoluídos 0,8)
     × aura do Paladino (0,8 se houver um aliado Paladino a até 100 px)
     × vulnerável (+X% se congelado)
  → escudo absorve primeiro (onBreak ao quebrar)
  → armadura de gelo deixa o atacante lento
  → vida; se morrer, onKill do atacante
```

Cura e escudo recebidos caem 50% com `healReduction` (Sopro Necrótico).

## Status (`Unit.setStatus`)

`slow`, `attackSlow`, `root`, `stun`, `freeze`, `healReduction`, `ccImmune`, `steadfast`, `vulnerable`, `grounded`, `taunt`, `chillArmor` e `slowingAttacks`.

Status iguais não se somam: vale o maior valor, e a duração é renovada. `ccImmune` bloqueia lentidão, prisão, atordoamento, congelamento e empurrão; `steadfast` bloqueia atordoamento e empurrão.

## Pontos únicos de entrada

- `BattleScene.playCard(team, index, x, y)`: invoca uma carta. A trilha vem do `y`, e o `x` é ajustado para a **zona de invocação** (`spawnZone`).
- `BattleScene.castSpellAt(team, index, x, y)`: lança uma magia, se a recarga permitir.

Jogador e IA usam os mesmos dois métodos. No PvP online, eles serão os comandos enviados pela rede.

## Depuração

Em modo dev o jogo fica exposto como `window.game`:

```js
const b = game.scene.getScene('Battle');
b.now = 175;                          // pula para perto da prorrogação
b.hands.player.mana = 10;             // mana cheia
b.spells.player[0].readyAt = 0;       // magia pronta
b.playCard('player', 0, 400, 300);    // 1ª carta na trilha do meio
b.castSpellAt('player', 0, 700, 300); // 1ª magia no ponto (700, 300)
```

Para testar as evoluções das magias, abra o jogo com `?nivelMagia=5`.

### Simulação IA × IA (balanceamento) {#simulacao}

Com a simulação manual (cena pausada e `update` chamado em laço), uma partida inteira roda em menos de um segundo:

```js
const { Ai } = await import('/src/battle/Ai.ts');
game.scene.start('Battle', { difficulty: 'normal' }); // sem deck = deck ativo do save
// depois de a cena iniciar:
const b = game.scene.getScene('Battle');
b.sys.pause();
const jogador = new Ai(b, b.hands.player, 'normal', 'player');
while (!b.over) { jogador.update(0.05); b.update(0, 50); }
[b.now, b.castles.player.hp, b.castles.enemy.hp];
```

Medição de referência (v0.2, 16 partidas IA normal × IA normal, deuses alternados):
- duração média de **110 s** (de 51 a 187 s);
- 1 partida foi para a prorrogação;
- muitas terminaram com o vencedor intacto, sinal de efeito "bola de neve" a ajustar no balanceamento.

## Decisões e limitações conhecidas

- **Sem física:** movimento e colisão são 1D (eixo x) por trilha, o que deixa a simulação simples.
- Tropas aliadas podem se sobrepor, porque não há empurrão entre elas.
- A simulação usa `dt` variável e `Math.random` (na IA e no embaralhamento). Para PvP online, o ideal é migrar para um passo fixo e um gerador aleatório com semente (ver [Roadmap](/roadmap#v3-pvp-online)).
- O bundle tem cerca de 1,2 MB porque o Phaser inteiro vem junto.
