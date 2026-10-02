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

## Tropas animadas: do 3D às sprites {#sprites-animadas}

O jogo é 2D, mas as tropas podem ganhar **animação de verdade** a partir de um modelo 3D. O **Golem** é o primeiro: ele anda, ataca (ergue os punhos e soca o chão) e cai. As outras tropas continuam com o token redondo até ganharem modelo.

```
arte da carta → Meshy (image to 3D + rig) → art/models/<id>.glb
  → tools/sprite-renderer (anima os ossos por código e renderiza de lado)
  → public/assets/sprites/<id>/{idle,walk,attack,death}.png + manifest.json
  → no jogo: Unit troca o token pela sprite animada
```

1. **Modelo:** no [Meshy](https://www.meshy.ai), *image to 3D* com `art/cards-raw/<id>.jpg`, depois **remesh** (Adaptive, Medium, de graça) e **Rig**. Não precisa animar no Meshy: basta exportar o GLB **com o rig** e salvar em `art/models/<id>.glb`. Essa pasta fica fora do git porque os arquivos têm cerca de 40 MB.
2. **Ossos:** o rig do Meshy usa nomes genéricos (`Bone_000`…). Em `tools/sprite-renderer/rigs.ts`, mapeie quais ossos são raiz, coluna, cabeça, ombros e cotovelos, quadris e joelhos (ver o mapa do Golem).
3. **Animações:** também em `rigs.ts`, como funções que recebem o progresso (0 a 1) e devolvem rotações em graus. As do Golem estão em `HEAVY_ANIMS`.
4. **Renderização:** com `npm run dev`, abra `http://localhost:5180/tools/sprite-renderer/?model=<id>&save=1`. O renderizador:
   - usa uma câmera ortográfica de lado, um pouco de frente e de cima;
   - usa **um único recorte para todas as animações**, para o personagem não mudar de tamanho;
   - desenha um **contorno escuro** de 3 px, como o traço das cartas;
   - grava as folhas e o `manifest.json` (tamanho do quadro, ponto do pé, quadros e fps) pela rota de desenvolvimento `/__sprites` do `vite.config.ts`.
5. **No jogo:** a `PreloadScene` lê o manifest e cria as animações `<id>-idle`, `-walk`, `-attack` e `-death`.
   - A `Unit` mostra a sprite em pé sobre uma elipse na cor do time, espelhada para a IA.
   - Ela anda no ritmo da velocidade atual, ataca acelerando se o intervalo for curto e congela junto com os efeitos de gelo e atordoamento.
   - Ao morrer, deixa a animação de queda no lugar.

::: tip Por que animar por código e não no Meshy
As animações prontas do Meshy custam créditos e exportações (o plano Starter tem 20 por mês). Com o rig exportado uma vez, as poses por código saem de graça, podem ser ajustadas a qualquer momento e mantêm o mesmo estilo em todas as tropas.
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
