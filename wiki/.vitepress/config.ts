import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'pt-BR',
  title: 'Duelo Mágico',
  description: 'Wiki oficial do Duelo Mágico: regras, deuses, magias, tropas, progressão e planos do jogo.',
  base: '/duelo-magico/',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏰</text></svg>" }]],

  vite: {
    resolve: {
      // Os dados do jogo vêm direto do código: wiki e jogo usam a mesma fonte.
      alias: { '@content': fileURLToPath(new URL('../../src/data/content', import.meta.url)) },
    },
  },

  themeConfig: {
    siteTitle: '🏰 Duelo Mágico',
    nav: [
      { text: 'Começar', link: '/visao-geral' },
      { text: 'Deuses', link: '/deuses/' },
      { text: 'Tropas', link: '/tropas/' },
      { text: 'Magias', link: '/magias/' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    sidebar: [
      {
        text: 'O jogo',
        items: [
          { text: 'Visão geral', link: '/visao-geral' },
          { text: 'Mundo e história', link: '/historia' },
          { text: 'Glossário', link: '/glossario' },
        ],
      },
      {
        text: 'Regras',
        items: [
          { text: 'Batalha', link: '/regras/batalha' },
          { text: 'Montagem de deck', link: '/regras/deck' },
        ],
      },
      {
        text: 'Deuses',
        items: [
          { text: 'Visão geral', link: '/deuses/' },
          { text: '🔥 Ignar', link: '/deuses/ignar' },
          { text: '🌅 Solenne', link: '/deuses/solenne' },
          { text: '❄️ Hyela', link: '/deuses/hyela' },
          { text: '🦌 Thalor', link: '/deuses/thalor' },
          { text: 'Todas as magias', link: '/magias/' },
        ],
      },
      {
        text: 'Tropas',
        items: [
          { text: 'Visão geral', link: '/tropas/' },
          { text: '☀️ Reino Solar', link: '/tropas/solar' },
          { text: '💀 Abismo', link: '/tropas/abismo' },
          { text: '🔮 Domínio Arcano', link: '/tropas/arcano' },
          { text: 'Matriz de counters', link: '/tropas/counters' },
        ],
      },
      {
        text: 'Meta-jogo',
        items: [
          { text: 'Progressão', link: '/progressao' },
          { text: 'Economia e recompensas', link: '/economia' },
          { text: 'Modos de jogo', link: '/modos' },
          { text: 'IA do oponente', link: '/ia' },
        ],
      },
      {
        text: 'Produção',
        items: [
          { text: 'Telas e fluxo', link: '/telas' },
          { text: 'Arte e áudio', link: '/arte-audio' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Referências', link: '/referencias' },
        ],
      },
      {
        text: 'Técnico',
        collapsed: true,
        items: [
          { text: 'Arquitetura', link: '/tecnico/arquitetura' },
          { text: 'Dados do jogo', link: '/tecnico/dados' },
          { text: 'Como estender', link: '/tecnico/estender' },
          { text: 'Mobile (Capacitor)', link: '/tecnico/mobile' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
          modal: {
            noResultsText: 'Nada encontrado para',
            resetButtonTitle: 'Limpar',
            footer: { selectText: 'abrir', navigateText: 'navegar', closeText: 'fechar' },
          },
        },
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/erickeira/duelo-magico' }],
    editLink: { pattern: 'https://github.com/erickeira/duelo-magico/edit/main/wiki/:path', text: 'Editar esta página no GitHub' },
    outline: { label: 'Nesta página', level: [2, 3] },
    docFooter: { prev: 'Anterior', next: 'Próxima' },
    lastUpdated: { text: 'Atualizado em' },
    darkModeSwitchLabel: 'Tema',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Voltar ao topo',
    footer: { message: 'Projeto original inspirado no gênero de Heroic: Magic Duel.', copyright: 'Duelo Mágico' },
  },
});
