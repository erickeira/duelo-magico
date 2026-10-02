# Arte e áudio

As **24 tropas e as molduras das cartas já têm arte** (geradas com o Gemini, ver abaixo). Deuses, magias, cenário, o resto da interface e o áudio ainda usam placeholder. Esta página define o estilo e a lista de tudo que precisa ser produzido.

## Galeria das tropas

<div class="dm-gallery">
  <img v-for="u in UNITS" :key="u.id" :src="withBase(`/assets/cards/${u.id}.jpg`)" :alt="u.name" :title="u.name" loading="lazy" />
</div>

<script setup>
import { withBase } from 'vitepress';
import { UNITS } from '@content/index';
import { framedArt } from './.vitepress/theme/components/util';

const FRAME_SAMPLES = ['cavaleiro', 'cleriga', 'paladino', 'campea-do-sol'].map((id) => UNITS.find((u) => u.id === id));
</script>

## Molduras por raridade

<div class="dm-gallery">
  <div v-for="u in FRAME_SAMPLES" :key="u.id" class="dm-art" :style="framedArt(u.id, u.rarity, 10)" :title="u.rarity"></div>
</div>

| Raridade | Material |
|---|---|
| Comum | Pedra gasta e ferro escuro com rebites |
| Rara | Prata polida com safiras azuis |
| Épica | Ametista roxa com filigrana dourada |
| Lendária | Ouro com raios de sol, chamas e âmbar |

## Como a arte das cartas é produzida {#producao}

1. **Prompts** em `art/cards.prompts.json`: um modelo de texto comum (estilo, enquadramento, "sem moldura, sem texto"), o fundo de cada mundo e a descrição de cada tropa.
2. **Geração** com o **Gemini Nano Banana Pro** (`gemini-3-pro-image-preview`, proporção 3:4, 1K), feita pelo Composio conectado ao Claude. As originais (896×1200) ficam em `art/cards-raw/`, que **não vai para o git**.
3. **Processamento:** `npm run art:process` (`scripts/process-cards.py`) corta a borda e gera:
   - `public/assets/cards/<id>.jpg`: arte da carta, 360×480;
   - `public/assets/tokens/<id>.png`: token redondo para a batalha, 128×128 com fundo transparente.
4. **No jogo:** a `PreloadScene` carrega tudo. As cartas e miniaturas usam `coverImage()` (recorte tipo `object-fit: cover`), e a batalha mostra o token com um anel na cor do time; o token da IA é espelhado. Sem arte, tudo volta para o emoji.

Para **regerar uma carta**, mude a descrição em `art/cards.prompts.json`, gere de novo com o mesmo modelo de texto, salve em `art/cards-raw/<id>.jpg` e rode `npm run art:process`.

### Molduras

1. **Prompts** em `art/frames.prompts.json`. O Gemini não gera transparência, então a moldura é pedida com o miolo e o lado de fora em **verde puro (#00FF00)**, como num fundo de chroma key.
2. **Processamento** (`scripts/process-frames.py`, também rodado pelo `npm run art:process`):
   - troca o verde por transparência, suavizando as bordas e tirando o reflexo verde;
   - apara a sobra e reduz para 300 px de largura;
   - mede a borda e grava `public/assets/frames/frames.json`, com a espessura média da borda (`border`) e o recorte de canto do nine-slice (`slice`, 1,5× a borda para incluir o ornamento).
3. **No jogo:** `rarityFrame()` (`src/scenes/frames.ts`) monta a moldura como **nine-slice** (os cantos não distorcem) e aplica uma escala para a borda ter a espessura pedida, por exemplo 11 px nas cartas da batalha. Sem WebGL, a moldura é só esticada. A seleção vira um brilho dourado por fora da moldura.
4. **Na wiki:** a mesma moldura entra via `border-image` do CSS (`framedArt()`).


::: tip Aprendizados da geração
- Sem a frase "full-bleed… background touching all four edges", o Gemini desenha uma moldura de carta própria, que brigaria com a moldura do jogo.
- Algumas imagens ainda vêm com uma borda fina. O script corta 2,5% de cada lado (5% na Campeã do Sol).
- Cartas com várias unidades (Esqueletos ×4, Arqueiras ×2) devem dizer o número na descrição.
:::

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

## Arena em 3/4

O cenário da batalha é uma imagem pintada em visão 3/4 (câmera de lado, inclinada uns 45° para baixo), com as três trilhas de pedra já desenhadas. Foi gerada no Gemini (`gemini-3-pro-image-preview`, 16:9, 2K) com o prompt `arena` de `art/ui.prompts.json`.

- Fonte em `art/ui-raw/arena/forest.jpg`; o `scripts/process-ui.py` gera `public/assets/arena/forest.jpg` com 1280 px de largura.
- Em `src/config.ts`, `ARENA_ART.lanes` guarda a linha (em px da imagem) do centro da trilha de cima e da de baixo. A batalha estica a imagem na vertical para essas linhas caírem em `LANES_Y`.
- As praças nas pontas das trilhas fazem o papel dos castelos (a vida continua no HUD). Sem a arte, o jogo volta ao chão de grama com trilhas e castelos desenhados.
- As tropas continuam como tokens redondos com a arte da carta.

## Identidade visual da interface

A interface é desenhada em código (Graphics do Phaser), então fica nítida em qualquer tela. O tema mora em `src/scenes/theme.ts`.

- **Fontes** (Google Fonts, carregadas no `index.html`; o `main.ts` espera ficarem prontas antes de abrir o jogo):
  - **Lilita One** (`FONT_DISPLAY`) para títulos, números e botões;
  - **Nunito** (`FONT_BODY`) para o resto. É a fonte padrão de todo `add.text`.
- **Cores:** azul-noite nos fundos, **dourado** (`THEME.gold`) em bordas e enfeites, roxo na mana, azul (jogador) e vermelho (IA) nas barras de vida.
- **Peças prontas:**
  - `titleStyle(tamanho, cor)`: título com contorno e sombra.
  - `Panel`: painel em degradê com borda dupla dourada e losangos nos cantos (é o que `panel()` de `ui.ts` cria).
  - `drawBevel`: botão em relevo, com base escura, brilho em cima e efeito de afundar ao tocar. Usado por `button()` e pelos seletores de dificuldade.
  - `backdrop(scene)`: fundo dos menus, com o cenário da arena desfocado e escurecido, vinheta e brasas subindo.
  - `gem()`: losango dourado usado como enfeite.
- **Batalha:**
  - faixa superior com medalhão do tempo e anéis dourados nos retratos dos deuses;
  - barras de vida e de mana em degradê com aro dourado;
  - bandeja de cartas com filete dourado;
  - gema de custo roxa nas cartas;
  - botões de magia com aro dourado.
- **Home:** baús com a arte gerada em espaços que mudam de borda conforme o estado (abrindo: dourado; pronto: verde pulsante).
- **Telas de Deuses e Deck:** retratos e ícones de magia gerados no lugar dos emojis.

### Nitidez em telas grandes

O jogo usa coordenadas lógicas de 1280×720, mas o canvas é desenhado `RENDER_SCALE` vezes maior (de 1 a 3, conforme o tamanho da tela e a densidade de pixels). Cada câmera aplica zoom do mesmo valor, e os textos são rasterizados na mesma escala.

- Para testar, abra com `?escala=2`.
- Em código de entrada, use `pointer.worldX/worldY`, nunca `pointer.x/y`.
