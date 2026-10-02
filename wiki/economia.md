# Economia e recompensas

A v1 é **offline e sem compras**. A economia existe para dar ritmo: cada sessão de 15 a 20 minutos deve render pelo menos um upgrade.

## Moedas e recursos

| Recurso | Para que serve | Como ganhar |
|---|---|---|
| 🪙 **Ouro** | Subir tropas e magias | Vitórias e baús |
| 🃏 **Cartas de tropa** | Cada tropa tem as suas; repetidas sobem o nível | Baús |
| ✴️ **Essência divina** | Subir deuses | Vitórias (+1) e baús |
| 🔹 **Fragmentos de magia** | Cada magia tem os seus | Baús, da magia de um deus que você já tem |
| 🏆 **Troféus** | Liberam arenas e deuses | Vitórias (+30), derrotas (−15) |

## Por partida

| Resultado | Troféus | Ouro | Essência | Baú |
|---|---|---|---|---|
| Vitória | +30 | 20 + 5 × arena | +1 | Sim, se houver espaço livre |
| Empate | 0 | 10 | 0 | Não |
| Derrota | −15 (não cai abaixo do piso da arena atual) | 0 | 0 | Não |

## Baús

Você tem **4 espaços de baú**. Ao vencer com os espaços cheios, não ganha baú, o que incentiva a voltar para abrir. Só um baú abre por vez.

<ChestTable />

- As cartas de um baú vêm da **arena atual e das anteriores**.
- O **baú grátis** recarrega a cada 4 h e acumula até 2 (sempre um Baú de Madeira).
- Os fragmentos vêm só de magias de **deuses que você já liberou**.

## Arenas {#arenas}

<ArenaList />

## Ritmo esperado (meta de design)

| Marco | Tempo de jogo aproximado |
|---|---|
| Primeiro upgrade de tropa | 1ª vitória |
| Liberar Solenne (300 🏆) | ~1 h |
| Primeira épica | ~3 h |
| Liberar Hyela (1.200 🏆) | ~6 h |
| Primeira lendária | ~15 h |
| Todas as tropas no nível 7 | ~40 h |

Esses tempos servem para testar o balanceamento quando a progressão for implementada: se um marco chegar rápido ou devagar demais, ajuste os números em `economy.ts` ou `progression.ts`.
