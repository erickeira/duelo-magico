# Como estender

## Adicionar uma carta de tropa

1. Em `src/data/cards.ts`, adicione uma entrada em `CARDS`:

```ts
giant: {
  kind: 'unit', id: 'giant', name: 'Gigante', cost: 6, icon: '🧌', count: 1,
  desc: 'Muito lento, bate forte',
  unit: { hp: 3000, damage: 200, attackInterval: 2, range: 14, speed: 20, radius: 32, icon: '🧌' },
},
```

2. Coloque o `id` em `DEFAULT_DECK`. O deck deve ter **pelo menos 5 cartas** (4 na mão e 1 na fila).

Campos de `UnitStats`:

| Campo | Significado |
|---|---|
| `hp` | Vida |
| `damage` | Dano por ataque |
| `attackInterval` | Segundos entre ataques |
| `range` | Alcance (de borda a borda). Com **60 ou mais** o ataque vira projétil |
| `speed` | px/s (a arena tem 740 px de altura) |
| `radius` | Tamanho do círculo e da colisão |
| `splash` | Raio do dano em área (opcional) |
| `flying` | Voa: só é atingido por quem tem `targetsAir` (opcional) |
| `targetsAir` | Pode acertar voadores (opcional) |

`count` invoca várias cópias lado a lado.

## Adicionar um feitiço

```ts
lightning: {
  kind: 'spell', id: 'lightning', name: 'Raio', cost: 2, icon: '⚡',
  desc: 'Dano alto em área pequena', radius: 50, damage: 400, castleDamagePct: 0.25,
},
```

Para um efeito novo (cura, empurrão, veneno etc.), adicione um campo opcional em `SpellCard` e trate esse campo em `BattleScene.castSpell`. Se a IA precisar usar o feitiço de um jeito diferente, ajuste também `Ai.bestSpellSpot`.

## Balanceamento

- Regras globais (tempo, mana, castelo): `src/config.ts`.
- Números das cartas: `src/data/cards.ts`.
- Agressividade da IA: limiares em `src/battle/Ai.ts`, como `thinkIn`, `>= 8.5` de mana para atacar e `>= 450` de valor para a Bola de Fogo.

Dica: no console, `game.scene.getScene('Battle').timeLeft = 65` pula direto para a fase de mana dobrada.

## Trocar a arte placeholder por sprites

Hoje cada tropa é um círculo colorido com um emoji (`Unit.ts`) e o castelo é um retângulo (`Castle.ts`).

1. Coloque as imagens em `public/assets/` (ex.: `public/assets/units/knight.png`).
2. Crie uma `PreloadScene` que carregue tudo (`this.load.image(...)` / `this.load.spritesheet(...)`) e registre essa cena antes da `MenuScene` em `main.ts`.
3. Em `UnitStats`, troque `icon` por uma chave de textura (ex.: `sprite: 'knight'`).
4. Em `Unit.ts`, substitua `circle` + `text` por `scene.add.sprite(0, lift, stats.sprite)` e use `setTint`/`setFlipY` para diferenciar os times, ou carregue versões azul e vermelha.
5. Para animações (andar e atacar), use `this.anims.create` na preload e `sprite.play('knight-walk')` no `updateUnit`/`attack`.

A lógica não depende do visual. Só `Unit`, `Castle` e `CardView` precisam mudar.
