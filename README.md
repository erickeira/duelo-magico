# Duelo Mágico

Jogo mobile de estratégia em tempo real inspirado no gênero de **Heroic: Magic Duel**.
Tela **horizontal**: seu castelo à esquerda, o do oponente à direita e três trilhas entre eles. Antes da partida você escolhe um **deus**, leva **duas magias** dele e um **deck de 8 tropas**, e vence quem derrubar o castelo inimigo.

> Status: **v0.1, protótipo jogável** (batalha contra IA com arte placeholder) e **wiki completa do jogo final**.

## 📖 Wiki

**https://erickeira.github.io/duelo-magico/**

Tudo sobre o jogo: regras, os 4 deuses e 20 magias, as 24 tropas dos 3 mundos, progressão, economia, telas, arte e roadmap. Os números da wiki vêm direto de `src/data/content/`, os mesmos arquivos que o jogo vai usar.

## Como rodar

Pré-requisito: Node 20+.

```bash
npm install
npm run dev          # jogo em http://localhost:5173
npm run wiki:dev     # wiki em http://localhost:5181/duelo-magico/
```

| Script | O que faz |
|---|---|
| `npm run dev` | Jogo em modo desenvolvimento (com `--host`, abre no celular pela rede local) |
| `npm run build` | Checagem de tipos + build do jogo em `dist/` |
| `npm run validate` | Valida as referências cruzadas dos dados do jogo |
| `npm run wiki:dev` | Wiki em modo desenvolvimento |
| `npm run wiki:build` | Valida os dados e gera a wiki em `wiki/.vitepress/dist` |

## Estrutura

```
src/
  main.ts, config.ts       # protótipo: configuração do Phaser e regras atuais
  battle/, scenes/         # protótipo: batalha, IA, menu e resultado
  data/cards.ts            # protótipo: 8 cartas atuais (substituído na v0.2)
  data/content/            # conteúdo do jogo final: fonte única para wiki e jogo
wiki/                      # site VitePress (páginas .md + componentes Vue)
scripts/validate-content.mjs
.github/workflows/wiki.yml # publica a wiki no GitHub Pages a cada push na main
```

Detalhes técnicos estão na seção **Técnico** da wiki (arquitetura, dados do jogo, como estender, mobile).
