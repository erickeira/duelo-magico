# Montagem de deck

Toda batalha começa com três escolhas: **deus**, **duas magias** e **deck de tropas**.

## Regras

| Regra | Valor |
|---|---|
| Tropas por deck | <Rule k="deckSize" />, todas diferentes |
| Magias por partida | <Rule k="spellsPerMatch" />, do deus escolhido e já desbloqueadas |
| Decks salvos | <Rule k="savedDecks" /> |
| Mistura de mundos | Livre: qualquer deus pode usar tropas de qualquer mundo |

- Cada deck salvo guarda **deus + 2 magias + 8 tropas**. Trocar de deck troca tudo de uma vez.
- O botão **Batalhar** só fica ativo se o deck estiver completo.

::: info No jogo hoje (v0.4)
Só entra no deck o que o jogador já conquistou: tropas que ele tem, deuses liberados por troféus e magias liberadas pelo nível do deus. O que ainda está bloqueado aparece com 🔒 e diz como liberar.
:::

## Fluxo de escolha

1. **Deus:** carrossel com os deuses liberados, mostrando o nível de cada um.
2. **Magias:** as 5 magias do deus, com as bloqueadas em cinza e o nível necessário. Você toca em 2.
3. **Tropas:** a coleção aparece embaixo e os 8 espaços em cima. Toque numa tropa para colocar no deck ou trocar (arrastar fica para uma versão futura).
4. **Resumo:** custo médio de mana, quantidade de tropas que acertam voadores, tanques e dano em área, com avisos calculados por `analyzeDeck` (`src/data/content/deck.ts`):
   - faltam tropas ou magias;
   - custo médio abaixo de 3 ou acima de 4,3;
   - menos de 2 tropas que acertam voadores;
   - nenhum tanque;
   - nenhum dano em área, contando tropas e magias de dano em área.

No jogo: toque numa tropa da coleção para colocá-la no primeiro espaço livre. Para trocar, toque primeiro na carta do deck e depois na tropa nova; tocar duas vezes na mesma carta do deck a remove. Ao trocar de deus, as magias passam a ser as sugeridas para ele e as tropas ficam. **Restaurar sugerido** volta o deck ao sugerido do deus. Tudo é salvo na hora.

## Deck inicial

O jogador começa com as 9 tropas comuns e o deus **Ignar** com as magias comuns **Cometa Rubro** e **Brado de Guerra**. O primeiro deck vem montado:

<DeckList god="ignar" />

## Princípios de um bom deck

| Princípio | Por quê | Exemplos |
|---|---|---|
| **Custo médio entre 3 e 4** | Abaixo de 3 falta força, acima de 4 você fica sem cartas para reagir. | — |
| **Pelo menos 2 respostas a voadores** | Sem elas, um Dragão sozinho derruba seu castelo. | Arqueiras, Lanceiros, Aprendiz, Mago de Batalha |
| **1 ou 2 tanques** | Alguém precisa segurar o dano enquanto as tropas de distância atacam. | Golem, Paladino, Colosso de Carne |
| **1 resposta a enxames** | Esqueletos e Diabretes punem decks sem área. | Mago de Batalha, Dragão Elemental, magias de área |
| **1 condição de vitória** | Aquilo que, se passar, causa dano no castelo. | Golem + suporte, Bomba de Ossos, Dragão Ósseo |

## Arquétipos

| Arquétipo | Ideia | Deus que combina |
|---|---|---|
| **Empurrão pesado** | Um tanque grande com tropas de distância atrás numa única trilha. | Ignar (Brado de Guerra), Solenne (Escudo) |
| **Ciclo rápido** | Cartas baratas para pressionar as três trilhas e sobrecarregar a defesa. | Thalor (Revoada), Ignar |
| **Controle** | Defende tudo com construções e área, depois contra-ataca. | Hyela, Solenne |
| **Enxame** | Muitas unidades por carta, apostando que o rival não tem área. | Thalor (Força Selvagem), Ignar |
| **Aéreo** | Voadores que ignoram a linha de frente terrestre. | Solenne (escudos nos voadores), Hyela |

Os decks sugeridos de cada deus estão nas páginas dos [deuses](/deuses/).
