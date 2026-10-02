# Telas e fluxo

Todas as telas são **horizontais (1280×720 lógicos)** e pensadas para o polegar: botões principais embaixo e à direita, nada importante nos cantos de cima (por causa do notch).

::: info Estado atual (v0.3)
Já existem: **Início**, **Montar deck**, **Coleção**, **Batalha** e **Resultado**. Baús, recursos, nível de conta e a tela **Deuses e magias** (subir de nível) chegam com a progressão na v0.4; os desenhos abaixo já mostram onde vão ficar.
:::

## Mapa de telas

```
               ┌────────────┐
   abrir ────▶ │  Carregar  │
               └─────┬──────┘
                     ▼
 ┌─────────┐   ┌────────────┐   ┌──────────────┐
 │ Coleção │◀─▶│   INÍCIO   │◀─▶│ Deuses e     │
 │ (tropas)│   │ (hub)      │   │ magias       │
 └─────────┘   └─────┬──────┘   └──────────────┘
                     │ BATALHAR
                     ▼
               ┌────────────┐      ┌────────────┐
               │ Pré-batalha│ ───▶ │  Batalha   │
               │ (deck)     │      └─────┬──────┘
               └────────────┘            ▼
                                   ┌────────────┐
                                   │ Resultado  │ ──▶ Início (baú novo)
                                   └────────────┘
```

## Início (hub)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 👤 Nível 4  ▓▓▓▓░░ XP        🏆 820  Cripta Esquecida          🪙 1.240  ✴️ 35  │
│                                                                              │
│          [ ilustração da arena atual + castelo com a cor do deus ]           │
│                                                                              │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   ┌──────────────────┐ │
│   │ 📦   │ │ 🥈   │ │ vazio│ │ vazio│   🎁 baú grátis   │    BATALHAR ⚔️    │ │
│   │ 3:12 │ │ abrir│ │      │ │      │      (2/2)        │  deck: Fornalha   │ │
│   └──────┘ └──────┘ └──────┘ └──────┘                   └──────────────────┘ │
│  [🃏 Coleção]   [🔥 Deuses]   [🗺️ Arenas]   [⚙️ Ajustes]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Pré-batalha (montar deck)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◀ Voltar        DECK  [1] [2] [3] [4] [5]                    custo médio 3,4  │
│ ┌─────────────┐  Magias: [☄️ Cometa Rubro] [📯 Brado]   🔒Muralha (deus nv 4)  │
│ │ 🔥 IGNAR    │  Deck:  [⚔️][🏹][🔱][💀][🧟][🪄][💧][🗿]                        │
│ │ nível 3  ◀▶ │  ⚠️ Só 2 tropas acertam voadores                              │
│ └─────────────┘  ─────────────────── coleção ───────────────────────────────  │
│                  [😈][✨][💣] ... (toque para trocar; ↑ disponível p/ upgrade)  │
│                                                       ┌──────────────────┐   │
│                                                       │    BATALHAR ⚔️    │   │
└───────────────────────────────────────────────────────┴──────────────────┴───┘
```

## Batalha

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔥 VOCÊ ▓▓▓▓▓▓▓▓▓▓ 3000          2:41            ▓▓▓▓▓▓▓▓▓▓ 3000 IA ❄️         │
│ ┌──────┐ ═══════════════════════════ ┊ ════════════════════════════ ┌──────┐ │
│ │      │ ═══════════════════════════ ┊ ════════════════════════════ │      │ │
│ │  🏰  │ ═══════════════════════════ ┊ ════════════════════════════ │  🏰  │ │
│ └──────┘                                                            └──────┘ │
│  (☄️ 12s) (📯 pronto)    ▮▮▮▮▮▮▯▯▯▯ 6                                          │
│  [próx 🗿]   [⚔️ 3] [🏹 3] [💀 2] [🪄 2]                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Magias** à esquerda, acima das cartas, com anel de recarga. Quando ficam prontas, brilham e o aparelho vibra levemente.
- Ao arrastar uma tropa, a **zona de invocação** aparece em cada trilha.
- Ao arrastar uma magia de ponto, aparece o **círculo do raio**.
- Pausa só no Treino. Nas batalhas valendo troféus, sair conta como derrota (com confirmação).

## Resultado

- VITÓRIA, DERROTA ou EMPATE, com a vida final dos castelos.
- Recompensas animadas uma a uma: troféus, ouro, essência e baú (ou "espaços cheios").
- **MVP**: a tropa que mais causou dano.
- Botões: **Jogar de novo** (mesmo deck) e **Início**.

## Coleção

- Grade de tropas, filtrável por mundo, raridade e "pode subir de nível".
- Tocar numa tropa abre a ficha (os mesmos dados do [card da wiki](/tropas/solar)) com o botão **Subir de nível** (cartas e ouro).
- As tropas bloqueadas aparecem em silhueta, com a arena onde caem.

## Deuses e magias

- Carrossel de deuses com nível, essência e botão **Subir deus**.
- Abaixo, as 5 magias do deus: bloqueadas mostram o nível de deus necessário, liberadas mostram nível, fragmentos e botão **Subir magia**, além da prévia das evoluções.

## Acessibilidade e UX

- Times sempre diferenciados por **cor e posição** (seu lado é sempre a esquerda), nunca só pela cor.
- Texto mínimo de 16 px lógicos na batalha.
- Toda ação destrutiva (sair da batalha, gastar recurso) pede confirmação.
- Configurações: som, música, vibração e "mostrar zona de invocação sempre".
