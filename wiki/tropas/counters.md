# Matriz de counters

O coração do jogo é um **pedra, papel e tesoura estendido**: toda tropa vence algumas e perde para outras. A tabela abaixo é gerada a partir dos campos *forte contra* e *fraco contra* de cada tropa.

<CounterMatrix />

## Ciclos principais

```
 Enxames (Esqueletos, Diabretes) ──vencem──▶ Tanques (Golem, Colosso, Paladino)
         ▲                                            │
         │                                         vencem
       vencem                                         ▼
 Área (Mago de Batalha, Dragões) ◀──vencem── Corpo a corpo forte (Ceifador, Carniçal)
```

E o ciclo aéreo:

- **Voadores** vencem **corpo a corpo terrestre**, que não consegue revidar.
- **Antiaéreos** (Arqueiras, Lanceiros, Balestra) vencem **voadores**.
- **Corpo a corpo terrestre** vence **antiaéreos**, que são frágeis quando alcançados.

## Respostas rápidas

| Se o inimigo jogar… | Responda com… | Ou com a magia… |
|---|---|---|
| Golem / Colosso de Carne | Esqueletos, Torre de Cristal, Balestra | Prisão de Cristal, Raízes |
| Esqueletos / enxames | Mago de Batalha, Dragão Elemental | Cometa Rubro, Vento Gélido |
| Voadores | Arqueiras, Lanceiros, Aprendiz | Lanças de Gelo, Raízes (evoluída) |
| Construções | Bomba de Ossos, Esqueletos | Cometa Rubro, Era do Gelo (evoluída) |
| Ceifador | Esqueletos, Diabretes | Martelo Celeste, Raízes |
| Tropas de distância atrás do tanque | Grifo Real | Cometa Rubro, Sopro do Vulcão |
| Decks de cura e escudo | Dragão Ósseo | — |

::: tip Mantendo a matriz útil
Ao criar uma tropa nova, preencha `strongAgainst` e `weakAgainst` no arquivo de dados. O `npm run validate` acusa ids inexistentes.
:::
