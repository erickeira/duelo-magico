# Duelo Mágico

Jogo mobile de estratégia em tempo real inspirado em **Heroic: Magic Duel** (Nordeus).
Tela **horizontal (paisagem)**, como no Heroic: seu castelo à esquerda, o da IA à direita, três trilhas, mana que regenera e um deck de cartas: invoque tropas e lance feitiços para destruir o castelo do oponente antes que ele destrua o seu.

> Status: **v0.1, protótipo jogável**. Batalha completa contra IA, com arte placeholder (formas e emojis).

![stack](https://img.shields.io/badge/Phaser-3-8b5cf6) ![ts](https://img.shields.io/badge/TypeScript-5-3178c6) ![vite](https://img.shields.io/badge/Vite-bundler-646cff)

## Como rodar

Pré-requisito: Node 20+.

```bash
npm install
npm run dev
```

Abra `http://localhost:5180` (ou a porta que o Vite mostrar). O servidor sobe com `--host`, então dá para abrir no celular pela rede local, usando o IP do computador (ex.: `http://192.168.0.10:5180`).

| Script            | O que faz                                      |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com hot reload     |
| `npm run build`   | Checagem de tipos (`tsc`) + build em `dist/`   |
| `npm run preview` | Serve o build de produção localmente           |

## Como jogar

- **Arraste** uma carta até uma trilha (ou toque na carta e depois na arena).
- **Tropas** sempre saem do seu castelo (esquerda), na trilha escolhida, e avançam sozinhas para a direita.
- **Feitiços** caem exatamente onde você soltar.
- A mana regenera com o tempo (máx. 10). No **último minuto a mana enche em dobro**.
- **Vitória:** destruir o castelo inimigo ou ter mais vida quando os 3:00 acabarem.

## Documentação

| Documento                                       | Conteúdo                                                   |
| ----------------------------------------------- | ---------------------------------------------------------- |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)      | Regras, cartas, números de balanceamento e comportamento da IA |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)    | Estrutura do código, fluxo do loop de jogo, responsabilidades |
| [docs/EXTENDING.md](docs/EXTENDING.md)          | Como adicionar cartas, mudar balanceamento e trocar a arte |
| [docs/MOBILE.md](docs/MOBILE.md)                | Como empacotar para Android/iOS com Capacitor              |
| [docs/ROADMAP.md](docs/ROADMAP.md)              | O que falta para chegar perto do Heroic                    |

## Estrutura

```
src/
  main.ts              # configuração do Phaser e registro das cenas
  config.ts            # layout da tela (1280x720 paisagem) e regras globais
  data/cards.ts        # definição de todas as cartas e deck padrão
  battle/
    Hand.ts            # mana + mão + fila de cartas (lógica pura)
    Unit.ts            # tropa: estado + visual
    Castle.ts          # castelo: vida, visual, linha de frente
    Ai.ts              # oponente controlado pelo computador
    CardView.ts        # componente visual de carta
  scenes/
    MenuScene.ts       # tela inicial
    BattleScene.ts     # partida: simulação, input e HUD
    ResultScene.ts     # vitória / derrota / empate
    ui.ts              # botão reutilizável
```
