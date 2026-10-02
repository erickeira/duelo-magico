# Game Design

Referência: *Heroic: Magic Duel* (Nordeus), PvP 1v1 em tempo real com partidas curtas em três trilhas.

## Loop da partida

1. Cada lado começa com **5 de mana** (máx. **10**), que regenera **1 a cada 1,4 s**.
2. A mão tem **4 cartas**, e a próxima carta da fila fica visível. Ao usar uma carta, ela vai para o fim da fila e a próxima entra no lugar.
3. Uma **tropa** surge na frente do seu castelo, na trilha escolhida, e anda em direção ao castelo inimigo.
4. As tropas param e atacam o primeiro inimigo **à frente, na mesma trilha** e dentro do alcance. Sem inimigos à vista, atacam o castelo quando chegam até ele.
5. O **castelo** também se defende: atira no inimigo mais próximo dentro de 240 px da sua frente, em qualquer trilha.
6. A partida dura **3:00**. No **último minuto a mana regenera em dobro**.
7. Vence quem destruir o castelo inimigo. Se o tempo acabar, vence quem tiver mais vida, e com vida igual dá empate.

Todos esses números ficam em `src/config.ts`.

## Regras de combate

- **Trilhas são independentes.** Uma tropa só enxerga inimigos da própria trilha. O castelo e os feitiços são as exceções.
- **Voadores** (🐉) só podem ser atingidos por tropas com `targetsAir`, pelo castelo e por feitiços. Tropas terrestres corpo a corpo passam por baixo deles.
- **Ataque à distância** (alcance ≥ 60) dispara um projétil, e o dano só é aplicado quando ele chega. Se o alvo morrer no caminho, o projétil termina no último ponto, e um ataque em área ainda causa dano ali.
- **Dano em área** (`splash`) acerta todos os inimigos dentro do raio em volta do ponto de impacto.
- **Congelado:** a tropa não anda nem ataca, e o recarregamento do ataque fica pausado.
- **Feitiços no castelo** causam só uma fração do dano (`castleDamagePct`).

## Cartas (v0.1)

| Carta | Custo | Tipo | Vida | Dano | Intervalo | Alcance | Vel. | Especial |
|---|---|---|---|---|---|---|---|---|
| ⚔️ Cavaleiro | 3 | tropa | 650 | 80 | 1,0 s | corpo a corpo | 45 | — |
| 🏹 Arqueiras | 3 | tropa ×2 | 200 | 45 | 0,9 s | 150 | 48 | acerta voadores |
| 🗿 Golem | 5 | tropa | 2000 | 130 | 1,6 s | corpo a corpo | 26 | tanque |
| 👺 Goblins | 2 | tropa ×3 | 120 | 40 | 0,7 s | corpo a corpo | 72 | rápidos |
| 🧙 Mago | 4 | tropa | 320 | 90 | 1,4 s | 130 | 42 | área 50, acerta voadores |
| 🐉 Dragão | 4 | tropa | 520 | 65 | 1,2 s | 80 | 52 | voa, área 40 |
| 🔥 Bola de Fogo | 4 | feitiço | — | 320 | — | raio 90 | — | 35% no castelo |
| ❄️ Congelar | 3 | feitiço | — | 60 | — | raio 110 | — | congela 3 s, 30% no castelo |

Castelo: **3000** de vida, **45** de dano a cada **0,9 s**, alcance **240**.

### Pedra-papel-tesoura pretendido

- Goblins e Arqueiras (enxames frágeis) perdem para o Mago e para a Bola de Fogo.
- O Golem (tanque) perde para Goblins e Cavaleiro somados com a ajuda do castelo, e o Congelar segura o avanço dele.
- O Dragão ignora tropas terrestres corpo a corpo e perde para Arqueiras, Mago e castelo.

## IA (`src/battle/Ai.ts`)

A IA "pensa" a cada 0,5–1,3 s e segue esta prioridade:

1. **Feitiço:** procura o ponto onde o feitiço causaria mais dano útil. Usa a Bola de Fogo se o dano útil for de pelo menos 450, e o Congelar se pegar 3 ou mais tropas no campo dela.
2. **Defesa:** calcula a ameaça por trilha (vida das tropas do jogador, com mais peso quanto mais perto do castelo da IA). Se a ameaça passa da defesa que a IA já tem na trilha, ela invoca a tropa mais cara que pode pagar ali, e prefere tropas antiaéreas se houver voadores.
3. **Ataque:** com mana ≥ 8,5, invoca uma tropa aleatória, na trilha mais vazia ou reforçando um ataque em curso.

A IA usa o mesmo deck, a mesma mana e as mesmas regras do jogador. Ela não trapaceia.
