# IA do oponente

A IA joga com **as mesmas regras do jogador**: mesmo limite de mana, mesma mão de 4 cartas, as mesmas 2 magias com recarga e a mesma zona de invocação. Ela não vê as cartas da sua mão.

## Como ela decide (hoje no protótipo)

A cada 0,5–1,3 s, nesta ordem de prioridade:

1. **Magia:** procura o ponto onde uma magia causaria mais valor (dano útil ou número de tropas atingidas) e usa se passar de um limite.
2. **Defesa:** calcula a **ameaça por trilha** (vida das tropas inimigas, com peso maior quanto mais perto do castelo da IA). Se a ameaça passa da defesa que a IA já tem na trilha, invoca a melhor resposta disponível, preferindo antiaéreo quando há voadores.
3. **Ataque:** com mana alta, invoca uma tropa na trilha mais vazia ou reforçando um ataque em andamento.

## Dificuldades (planejado)

| | Fácil | Normal | Difícil |
|---|---|---|---|
| Tempo de reação | 1,5–2,5 s | 0,5–1,3 s | 0,3–0,8 s |
| Usa magias | só as comuns, com atraso | sim | sim, e combinadas com tropas |
| Escolha de resposta | aleatória entre as possíveis | a mais cara possível | a que é **forte contra** a ameaça (usa `strongAgainst`) |
| Guarda mana | não | não | sim, para responder a empurrões grandes |
| Nível das tropas | seu nível −1 | seu nível | seu nível +1 |
| Onde aparece | tutorial e arenas 1–2 | arenas 3–4 | arenas 5–6 e Treino |

## Decks da IA

Cada arena tem de 3 a 5 decks de IA, montados **só com cartas daquela arena e das anteriores**, sempre com um deus e 2 magias válidos. Os decks sugeridos dos deuses são o ponto de partida.

## Futuro: IA treinada

Para uma IA de alto nível, dá para treinar uma rede neural jogando contra si mesma (aprendizado por reforço), como fez a equipe do jogo de referência. Isso depende de a simulação rodar **sem gráficos e mais rápido que o tempo real**, a mesma exigência do PvP online (ver [Roadmap](/roadmap)).
