# Arte e áudio

Hoje o jogo usa **formas e emojis** como placeholder. Esta página define o estilo final e a lista de tudo que precisa ser produzido.

## Direção de arte

- **Estilo:** 2D cartunesco com contorno, proporções exageradas (cabeças grandes), leitura clara em tela pequena.
- **Câmera:** vista lateral levemente de cima. Tropas desenhadas **olhando para a direita**; as do inimigo são espelhadas no código.
- **Times:** detalhes **azuis** (você) e **vermelhos** (inimigo) em faixas, escudos e bandeiras, mantendo as cores do mundo no resto do corpo.
- **Tamanho de referência:** tropas de 64–128 px de altura no espaço de 1280×720.

### Paleta por mundo

| Mundo | Cores principais | Materiais |
|---|---|---|
| ☀️ Reino Solar | dourado `#eab308`, branco, azul-céu | aço polido, tecido, pedra clara |
| 💀 Abismo | vermelho `#dc2626`, roxo escuro, verde doentio | ossos, carne, ferro enferrujado |
| 🔮 Domínio Arcano | ciano `#06b6d4`, violeta, branco brilhante | cristal, água, energia |

### Deuses

| Deus | Cor | Elementos visuais |
|---|---|---|
| 🔥 Ignar | laranja `#f97316` | coroa de brasas, pele rachada com lava, martelo de ferreiro |
| 🌅 Solenne | amarelo `#facc15` | halo solar, véu, farol |
| ❄️ Hyela | azul-gelo `#38bdf8` | coroa de estalactites, cabelos que se congelam |
| 🦌 Thalor | verde `#22c55e` | chifres de cervo com folhas, manto de musgo |

## Lista de assets

### Tropas (24)
Cada tropa precisa de: **parado**, **andando** (6–8 quadros), **atacando** (4–6 quadros), **morrendo** (4 quadros), ícone de carta (256×256) e retrato da coleção.

### Magias (20)
Cada magia precisa de: ícone (128×128), efeito de lançamento e efeito de impacto/área. Algumas reaproveitam partículas (fogo, gelo, luz, folhas).

### Deuses (4)
Retrato grande para a escolha de deus, retrato pequeno para o HUD e castelo tematizado (variação de cor e estandarte).

### Cenário
- 6 fundos de arena (um por arena);
- trilhas, linha do meio e decorações;
- castelo base com 3 estados de dano (100%, 50%, 20%).

### Interface
Molduras de carta por raridade, gema de mana, barra de mana, baús (4 tipos × fechado/abrindo/aberto), botões, ícones de recursos.

## Áudio

| Categoria | Itens |
|---|---|
| Música | Menu (calma), batalha (tensa, 3 min em loop), últimos 60 s (acelera), vitória e derrota (curtas) |
| Tropas | invocar (por mundo), ataque (corpo a corpo, flecha, magia), morte (por mundo) |
| Magias | 1 som por magia (lançamento + impacto) |
| Interface | toque, carta selecionada, mana cheia, magia pronta, baú abrindo, upgrade |
| Castelo | impacto, alarme com menos de 25% de vida, desabamento |

## Como produzir

- **IA generativa:** o Photoshop (MCP) pode gerar rascunhos e variações de tropas e cenários. Depois é preciso uniformizar estilo e tamanho.
- **Pacotes prontos** com licença comercial (ex.: itch.io, CraftPix) para a interface e efeitos.
- **Áudio:** bibliotecas com licença livre (ex.: freesound.org com CC0, Kenney).

Como trocar os placeholders pelos sprites: ver [Como estender](/tecnico/estender#trocar-a-arte-placeholder-por-sprites).
