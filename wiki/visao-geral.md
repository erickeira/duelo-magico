# Visão geral

**Duelo Mágico** é um jogo mobile de estratégia em tempo real, na horizontal (paisagem), para partidas curtas de **1 contra 1**. Ele segue o gênero de *Heroic: Magic Duel*, mas com mundo, personagens e números próprios.

## O jogo em uma frase

> Escolha um **deus**, leve **duas magias** dele e um **deck de 8 tropas**, e destrua o castelo do oponente em até **3 minutos**, disputando **três trilhas** ao mesmo tempo.

## Como é uma partida

1. **Antes da batalha** você escolhe um deus, duas magias desse deus e um dos seus decks salvos ([Montagem de deck](/regras/deck)).
2. **Na arena** os dois castelos ficam em lados opostos (o seu à esquerda), ligados por três trilhas horizontais.
3. **Tropas** custam mana. Você arrasta uma carta até uma trilha e a tropa marcha sozinha em direção ao castelo inimigo, lutando contra o que encontrar.
4. **Magias** não custam mana. Elas têm recarga e podem mudar uma luta inteira: cometas, congelamentos, curas, invocações.
5. Vence quem derrubar o castelo inimigo. Se ninguém derrubar em 3:00, começa a **prorrogação**, em que os castelos vão perdendo vida sozinhos até um cair ([Regras da batalha](/regras/batalha)).
6. **Depois da batalha** você ganha ouro, troféus e baús, e usa isso para subir de nível suas tropas, magias e deuses ([Progressão](/progressao)).

## Pilares do design

| Pilar | O que significa | Como aparece no jogo |
|---|---|---|
| **Decisões rápidas e legíveis** | Toda jogada deve ser entendida em menos de 1 segundo. | Três trilhas fixas, tropas que andam sozinhas, ícones grandes e cores fortes por time. |
| **Pedra, papel e tesoura profundo** | Nenhuma tropa é a melhor; toda tropa tem resposta. | Cada tropa tem *forte contra* e *fraco contra* explícitos ([Matriz de counters](/tropas/counters)). |
| **O deus define o estilo** | A escolha do deus muda como você joga, não só os números. | Ignar destrói, Solenne protege, Hyela controla e Thalor invoca ([Deuses](/deuses/)). |
| **Partidas curtas** | Uma partida cabe numa fila de café. | 3:00 + até 1:00 de prorrogação, sem pausas. |
| **Progresso que se sente** | Cada sessão deixa o jogador um pouco mais forte. | Baús, cartas, níveis de tropa, deus e magia, e arenas novas. |
| **Justo contra a IA** | A IA usa as mesmas regras e a mesma mana do jogador. | Sem trapaças: a dificuldade vem da qualidade das decisões ([IA](/ia)). |

## Escopo da versão 1.0

| Item | Quantidade |
|---|---|
| Deuses | 4 (cada um com 5 magias, total de 20) |
| Tropas | 24, sendo 8 por mundo (3 comuns, 2 raras, 2 épicas e 1 lendária) |
| Mundos | 3: [Reino Solar](/tropas/solar), [Abismo](/tropas/abismo) e [Domínio Arcano](/tropas/arcano) |
| Arenas | 6, de 0 a 2.600 troféus |
| Modos | Batalha contra a IA. Campanha e PvP online ficam para depois ([Modos de jogo](/modos)) |

## Onde estamos

O protótipo já tem a batalha básica funcionando (3 trilhas, mana, 8 cartas fixas e IA). Esta wiki descreve o **jogo completo**, e o [Roadmap](/roadmap) diz em que ordem cada parte vai para o código.
