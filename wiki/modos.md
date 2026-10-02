# Modos de jogo

| Modo | Versão | Descrição |
|---|---|---|
| **Batalha contra a IA** | v1 | O modo principal: dá troféus, ouro e baús. |
| **Treino** | v1 | Batalha sem recompensas contra a IA, com dificuldade e deck do oponente escolhidos à mão. Ótimo para testar decks. |
| **Tutorial** | v1 | 4 batalhas guiadas que ensinam trilhas, mana, magias e counters. |
| **Campanha** | v2 | História dos deuses, com batalhas de regras especiais. |
| **PvP online** | v3 | Duelo em tempo real contra outros jogadores. |

## Tutorial (v1) {#tutorial}

Implementado na v0.4 (`src/data/content/tutorial.ts`). Enquanto o tutorial não termina, o botão da tela inicial vira **TUTORIAL n/4**. As batalhas do tutorial não valem troféus.

| # | Ensina | Seu deck | IA | Castelo da IA |
|---|---|---|---|---|
| 1 | Arrastar uma carta para uma trilha; tropas andam sozinhas | Cavaleiro e Esqueletos | Só Esqueletos | 800 |
| 2 | Mana e mão de cartas | + Arqueiras e Lanceiros | Esqueletos e Cavaleiro | 1.200 |
| 3 | Magias e recarga | Ignar com Cometa Rubro | Enxames de Esqueletos | 1.500 |
| 4 | Counters e voadores | Com Arqueiras e Lanceiros, Cometa e Brado | Diabretes e Esqueletos | 2.000 |

- A IA do tutorial joga devagar (uma decisão a cada 3,5–5 s), só com tropas e sem magias.
- Uma faixa no topo da arena mostra as dicas da batalha, trocando a cada 6 s.
- Cada vitória dá 20 de ouro. Ao concluir o tutorial, o jogador ganha um **Baú de Prata**. Perder repete o mesmo passo.

## Campanha (v2)

Quatro capítulos, um por deus, com 10 fases cada. As fases podem ter regras especiais:

- **Sobreviva** por X segundos;
- **Derrube** o castelo antes de 1:30;
- **Chefe**: um inimigo gigante numa trilha;
- **Deck fixo**: você recebe um deck pronto.

As rivalidades da [história](/historia) viram chefes: Ignar enfrenta os campeões de Solenne, e Hyela enfrenta os de Thalor.

## PvP online (v3)

Exige servidor autoritativo e simulação determinística. O plano técnico está no [Roadmap](/roadmap#v3-pvp-online).
