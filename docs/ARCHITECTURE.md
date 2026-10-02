# Arquitetura

## Stack

- **Phaser 3**: renderização (WebGL/Canvas), cenas, tweens e input por toque e mouse.
- **TypeScript** (strict) e **Vite** (dev server e build).
- Resolução lógica **720×1280 (retrato)** com `Scale.FIT`. Todo o código usa essas coordenadas, e o Phaser ajusta para a tela do aparelho.

## Cenas

```
MenuScene ──BATALHAR──▶ BattleScene ──fim──▶ ResultScene
     ▲                       ▲                    │
     └────────MENU───────────┴───JOGAR DE NOVO────┘
```

`BattleScene.init()` zera todo o estado, porque o Phaser reaproveita a instância da cena entre partidas.

## Layout (y em px lógicos)

| Faixa | Conteúdo |
|---|---|
| 0–60 | HUD superior: cronômetro, "MANA x2" |
| 60–200 | Castelo inimigo (`ARENA_TOP` = 200 é a frente dele) |
| 200–940 | Arena com 3 trilhas (`LANES_X` = 150, 360, 570) |
| 940–1060 | Castelo do jogador (`ARENA_BOTTOM` = 940) |
| 1060–1280 | Barra de mana, próxima carta e mão com 4 cartas |

## Loop de jogo (`BattleScene.update`)

A cada frame, com `dt` limitado a 50 ms para não "teleportar" depois de uma travada:

1. Desconta o cronômetro e calcula a taxa de mana (dobrada no fim).
2. `Hand.update` regenera a mana dos dois lados.
3. `Ai.update` deixa a IA decidir e talvez chamar `playCard('enemy', ...)`.
4. `updateUnit` em cada tropa: congelamento, busca de alvo (`findTarget`), depois ataque ou movimento.
5. `updateCastle`: a torre atira no inimigo mais próximo.
6. `updateProjectiles`: move os projéteis e aplica o dano (`hit`) na chegada.
7. `removeDead` remove as unidades com `alive = false` e mostra um efeito.
8. `refreshHud` e `checkEnd`.

## Responsabilidades

| Arquivo | Responsabilidade | Depende de Phaser? |
|---|---|---|
| `config.ts` | Constantes de layout e regras | não |
| `data/cards.ts` | Tipos e dados das cartas | não |
| `battle/Hand.ts` | Mana, mão e fila | só para embaralhar |
| `battle/Unit.ts` | Estado da tropa e visual (Container) | sim |
| `battle/Castle.ts` | Vida e visual do castelo | sim |
| `battle/Ai.ts` | Decisões do oponente | não (lê a cena) |
| `battle/CardView.ts` | Visual da carta | sim |
| `scenes/BattleScene.ts` | Regras de combate, input e HUD | sim |

### Interface `Damageable`

Tudo que pode levar dano (tropas e castelo) implementa:

```ts
interface Damageable {
  team: Team; alive: boolean; flying: boolean;
  takeDamage(amount: number): void;
  aimPoint(fromX: number): { x: number; y: number }; // onde o projétil mira
}
```

O castelo devolve um ponto na sua linha de frente na mesma coluna de quem atira, então os projéteis não convergem todos para o centro.

### Única porta de entrada para jogadas

`BattleScene.playCard(team, index, x, y)` é usado **tanto pelo input do jogador quanto pela IA**. Ele valida a mana, consome a carta e decide entre `spawnUnits` (só o `x` importa, para escolher a trilha) e `castSpell`. Quando houver multiplayer, este é o ponto que vai receber os comandos da rede.

## Depuração

Em modo dev o jogo fica exposto como `window.game`. Exemplos para o console:

```js
const b = game.scene.getScene('Battle');
b.timeLeft = 65;                       // pula para perto da mana dobrada
b.hands.player.mana = 10;              // mana cheia
b.playCard('player', 0, 360, 500);     // joga a 1ª carta na trilha do meio
b.units.map(u => [u.team, u.stats.icon, u.hp]);
```

## Decisões e limitações conhecidas

- **Sem física:** movimento e colisão são 1D (eixo y) por trilha, o que deixa a simulação simples e determinística o bastante para multiplayer no futuro.
- Tropas aliadas podem se sobrepor, porque não há empurrão entre elas.
- A simulação usa `dt` variável. Para PvP online, o ideal é migrar para um passo fixo (ex.: 20 ticks/s) e separar a simulação da renderização (ver ROADMAP).
- O bundle tem cerca de 1,2 MB porque o Phaser inteiro vem junto. Dá para reduzir com um build customizado do Phaser se precisar.
