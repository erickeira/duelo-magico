# Tropas

Tropas são as cartas do seu deck. Custam **mana**, são invocadas numa trilha e marcham sozinhas até o castelo inimigo.

## Mundos

<WorldCards />

## Raridades

| Raridade | Por mundo | Nível inicial | Papel no design |
|---|---|---|---|
| <span style="color:#9ca3af">**Comum**</span> | 3 | 1 | Peças básicas e fáceis de entender. O jogador começa com todas. |
| <span style="color:#3b82f6">**Rara**</span> | 2 | 3 | Introduzem mecânicas (cura, construção, explosão, invocação). |
| <span style="color:#a855f7">**Épica**</span> | 2 | 5 | Habilidades fortes que pedem resposta específica. |
| <span style="color:#f59e0b">**Lendária**</span> | 1 | 7 | Mudam a partida sozinhas. Custam 6 de mana. |

As cartas raras começam num nível mais alto para chegarem já equilibradas com as comuns que o jogador vem subindo (ver [Progressão](/progressao)).

## Papéis

| Papel | O que faz | Exemplos |
|---|---|---|
| **Tanque** | Muita vida. Segura dano para as outras tropas. | Golem de Pedra, Paladino, Colosso de Carne |
| **Corpo a corpo** | Luta de perto (alcance até 40). | Cavaleiro, Carniçal, Ceifador |
| **Distância** | Ataca de longe com projéteis (alcance de 60 ou mais). | Arqueiras, Aprendiz, Necromante |
| **Enxame** | Várias unidades fracas numa carta só. | Esqueletos, Diabretes |
| **Dano em área** | O ataque atinge vários inimigos. | Mago de Batalha, Dragão Elemental |
| **Suporte** | Cura, escudo ou fortalece aliados. | Clériga, Fada Prismática, Arquimaga |
| **Cerco** | Feito para causar dano no castelo. | Bomba de Ossos |
| **Voador** | Ignora tropas terrestres de corpo a corpo. | Grifo Real, Dragão Ósseo |
| **Construção** | Não anda e desaba sozinha com o tempo. | Balestra, Torre de Cristal |

## Todas as tropas

Clique nos títulos das colunas para ordenar.

<UnitTable />

## Regras de equilíbrio (para quem cria tropas)

- **Valor por mana:** como referência, cada 1 de mana compra cerca de 210 de vida **ou** 27 de DPS. Tropas que fogem muito disso precisam de um motivo (habilidade, alcance, voo, área).
- **Toda tropa precisa de pelo menos 2 counters**, e pelo menos um deles **comum**, para que jogadores novos tenham resposta.
- **Voador ⇒ frágil ou caro.** Voar é a vantagem mais forte do jogo.
- **Área ⇒ DPS menor** que o de uma tropa de alvo único do mesmo custo.
- Mudanças de número são feitas **só em `src/data/content/units.ts`**, e esta wiki atualiza sozinha.
