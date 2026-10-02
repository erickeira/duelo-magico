# Roadmap

O que existe hoje e o que falta para chegar perto do Heroic: Magic Duel.

## ✅ v0.1: protótipo da batalha (feito)

- [x] Arena em retrato com 3 trilhas e 2 castelos
- [x] Mana com regeneração e mana dobrada no último minuto
- [x] Mão de 4 cartas, fila e próxima carta visível
- [x] 6 tropas (corpo a corpo, à distância, tanque, enxame, área, voadora)
- [x] 2 feitiços (dano em área e congelar)
- [x] Castelo que se defende
- [x] IA que usa feitiços, defende e ataca
- [x] Menu, partida e tela de resultado
- [x] Controles de arrastar e de tocar e depois tocar

## v0.2: sensação de jogo

- [ ] Sprites e animações (andar, atacar, morrer)
- [ ] Efeitos sonoros e música
- [ ] Números de dano flutuantes e partículas
- [ ] Níveis de dificuldade da IA
- [ ] Empurrão entre aliados, para que não se sobreponham
- [ ] Mais cartas: cura, invocar construção, veneno, herói

## v0.3: meta-jogo (single player)

- [ ] Coleção de cartas e montagem de deck
- [ ] Moedas, baús/recompensas e upgrade de cartas (níveis)
- [ ] Progressão salva no aparelho (`localStorage` / Capacitor Preferences)
- [ ] Heróis com habilidade ativa (mecânica central do Heroic)
- [ ] Campanha / sequência de oponentes de IA

## v0.4: app nas lojas

- [ ] Capacitor + ícone + splash screen (ver `MOBILE.md`)
- [ ] Testes em aparelhos reais (desempenho, safe areas)
- [ ] Publicação na Play Store / App Store (contas de desenvolvedor)

## v1.0: multiplayer online

- [ ] Simulação com passo fixo e determinística, separada da renderização
- [ ] Servidor autoritativo (ex.: Node + WebSocket / Colyseus) rodando a mesma simulação
- [ ] `playCard` vira comando enviado ao servidor, e o cliente só renderiza
- [ ] Matchmaking, ranking (troféus/ligas) e contas de usuário
- [ ] Anti-cheat básico (validação de mana e cooldown no servidor)
