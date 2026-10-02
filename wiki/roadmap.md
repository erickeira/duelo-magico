# Roadmap de implementação

Ordem planejada para levar a wiki para o código. Cada fase deixa o jogo **jogável** no final.

## ✅ v0.1: protótipo da batalha (feito)

- [x] Arena horizontal com 3 trilhas e 2 castelos
- [x] Mana, mana em dobro, mão de 4 cartas e próxima carta
- [x] 6 tropas e 2 feitiços placeholder; IA básica
- [x] Menu, partida e resultado
- [x] Wiki com os dados do jogo (este site)

## ✅ v0.2: batalha completa (feito)

Objetivo: a batalha do jogo final contra a IA, com o deck sugerido do deus escolhido no menu.

- [x] O jogo passa a ler as tropas de `src/data/content/units.ts` (fim do `cards.ts`)
- [x] As 24 tropas com habilidades: cura, aura, construção, explosão, invocação ao morrer, roubo de vida etc.
- [x] Sistema de efeitos (lentidão, prisão, atordoamento, congelamento, escudo, empurrão, provocação)
- [x] Magias do deus com recarga (botões à esquerda das cartas) e as 20 magias com evoluções
- [x] Zona de invocação e construções
- [x] Prorrogação
- [x] IA usando magias e `strongAgainst`, com 3 dificuldades
- [x] Menu com escolha rápida de deus e dificuldade
- [x] IA capaz de jogar dos dois lados, para simular IA × IA ([Arquitetura](/tecnico/arquitetura#simulacao))

## ✅ v0.3: pré-partida e coleção (feito)

- [x] Tela inicial (hub) com deck ativo, dificuldade e atalhos
- [x] Montar deck: escolher deus, 2 magias e deck de 8; 5 decks salvos; avisos de montagem (`analyzeDeck`)
- [x] Coleção com fichas de tropa
- [x] Salvamento local (localStorage) com reparo de dados inválidos
- [ ] Trocar localStorage por Capacitor Preferences quando virar app (v0.5)

Na v0.3, todas as tropas, deuses e magias ficam liberados. Os desbloqueios por troféus e o nível do deus entram na v0.4.

## v0.4: progressão e economia

- [ ] Níveis de tropa, magia, deus e conta
- [ ] Troféus, arenas, baús com timer e baú grátis
- [ ] Tela de resultado com recompensas
- [ ] Tutorial (4 batalhas)

## v0.5: arte, som e celular

- [ ] Sprites, animações e efeitos ([Arte e áudio](/arte-audio))
- [ ] Música e efeitos sonoros
- [ ] App Android/iOS com Capacitor ([Mobile](/tecnico/mobile)), testado em aparelho real

## v1.0: lançamento offline

- [ ] Balanceamento com muitas partidas IA × IA (a simulação já existe; falta um script de lote e relatório de vitórias por deus/tropa)
- [ ] Publicação na Play Store e na App Store

## v2: campanha

- [ ] 4 capítulos × 10 fases com regras especiais e chefes ([Modos de jogo](/modos))

## v3: PvP online {#v3-pvp-online}

- [ ] Simulação com **passo fixo** (ex.: 20 ticks/s) e determinística, separada da renderização
- [ ] Servidor autoritativo (Node + WebSocket ou Colyseus) rodando a mesma simulação
- [ ] O cliente envia só comandos (`jogar carta X na posição Y`); `BattleScene.playCard` já é esse ponto único
- [ ] Contas, pareamento por troféus, ranking e temporadas
- [ ] Validação de mana e recarga no servidor

## Como usar este roadmap

Cada item vira uma tarefa. Ao terminar um item, marque-o aqui e atualize a página da wiki relacionada. Se um número mudar no código, ele já muda na wiki automaticamente.
