import type { GodDef } from './types';

export const GODS: GodDef[] = [
  {
    id: 'ignar', name: 'Ignar', title: 'o Rei das Cinzas', icon: '🔥', color: '#f97316', element: 'Fogo',
    difficulty: 1,
    summary: 'Destruição direta. Magias de dano alto que limpam a arena e abrem caminho até o castelo inimigo.',
    lore: [
      'Antes de ser deus, Ignar era o ferreiro que forjou as armas da primeira guerra de Eldara. Quando a guerra devorou sua cidade, ele mergulhou na forja para morrer — e saiu dela feito de brasa viva.',
      'Hoje Ignar acredita que só o fogo purifica: tudo o que é velho e corrompido deve queimar para que algo novo nasça das cinzas. Seus devotos lutam com fúria e sem recuar.',
    ],
    playstyle: [
      'Use o Cometa Rubro para limpar enxames ou finalizar tropas de distância.',
      'Guarde o Brado de Guerra para o momento em que uma trilha está empurrando: ele transforma um ataque médio em dano no castelo.',
      'Deus ideal para iniciantes: as magias são fáceis de entender e perdoam erros de posicionamento.',
    ],
    spells: ['cometa-rubro', 'brado-guerra', 'muralha-fogo', 'sopro-vulcao', 'juizo-cinzas'],
    unlockTrophies: 0,
    suggestedDecks: [
      {
        name: 'Fornalha Inicial',
        units: ['cavaleiro', 'arqueiras', 'lanceiros', 'esqueletos', 'carnical', 'aprendiz', 'elemental-agua', 'golem'],
        spells: ['cometa-rubro', 'brado-guerra'],
        plan: 'Deck só de comuns. Golem na frente com Aprendiz e Arqueiras atrás; Cometa limpa o que o inimigo jogar para defender e o Brado acelera o empurrão final.',
      },
      {
        name: 'Terra Arrasada',
        units: ['golem', 'mago-batalha', 'dragao-elemental', 'esqueletos', 'arqueiras', 'ceifador', 'bomba-ossos', 'cavaleiro'],
        spells: ['cometa-rubro', 'muralha-fogo'],
        plan: 'Controle de área: Muralha de Fogo e Mago de Batalha param enxames; Golem + Dragão empurram uma trilha enquanto a Bomba de Ossos pune construções.',
      },
    ],
  },
  {
    id: 'solenne', name: 'Solenne', title: 'a Guardiã da Aurora', icon: '🌅', color: '#facc15', element: 'Luz',
    difficulty: 2,
    summary: 'Proteção e sustentação. Escudos, curas e soldados extras que fazem suas tropas durarem muito mais.',
    lore: [
      'Solenne foi a primeira sacerdotisa a ouvir a voz do sol nascente. Durante a Longa Noite, quando o Abismo cobriu Eldara, ela acendeu um farol no alto de Aurévia e manteve a luz acesa por cem dias sem dormir.',
      'Quando a aurora voltou, o próprio sol a ergueu ao panteão. Solenne não busca vingança nem conquista: ela luta para que ninguém precise viver outra Longa Noite.',
    ],
    playstyle: [
      'Combine tanques com Escudo da Aurora: um Paladino com escudo é quase impossível de parar.',
      'O Martelo Celeste atordoa — use para interromper o Ceifador ou a Bomba de Ossos antes que alcancem o alvo.',
      'Seja paciente: decks de Solenne vencem trocas longas e ganham vantagem de mana aos poucos.',
    ],
    spells: ['escudo-aurora', 'martelo-celeste', 'bencao-luz', 'falange-luz', 'alvorada'],
    unlockTrophies: 300,
    suggestedDecks: [
      {
        name: 'Muralha Dourada',
        units: ['paladino', 'cleriga', 'arqueiras', 'lanceiros', 'cavaleiro', 'balestra', 'fada', 'aprendiz'],
        spells: ['escudo-aurora', 'martelo-celeste'],
        plan: 'Defenda com Balestra e Lanceiros, contra-ataque com Paladino + Clériga. Escudo no momento em que o inimigo usar magia de área.',
      },
    ],
  },
  {
    id: 'hyela', name: 'Hyela', title: 'a Imperatriz do Inverno', icon: '❄️', color: '#38bdf8', element: 'Gelo',
    difficulty: 3,
    summary: 'Controle total. Lentidão e congelamento que param o inimigo enquanto suas tropas trabalham.',
    lore: [
      'Hyela governava os picos do norte quando um rival a aprisionou num glaciar. Ela passou trezentos anos congelada, ouvindo o mundo seguir sem ela — e aprendeu, no silêncio, que o tempo também pode ser uma arma.',
      'Quando o gelo rachou, Hyela saiu dele com o poder de parar qualquer coisa: rios, exércitos, corações. Agora ela quer o trono que lhe tiraram, e não tem pressa nenhuma.',
    ],
    playstyle: [
      'Vento Gélido desacelera uma trilha inteira: use quando o inimigo empurrar com muitas tropas.',
      'Congele grupos com Prisão de Cristal logo antes das suas tropas de dano chegarem.',
      'Deus difícil: o valor das magias depende muito do tempo certo. Combina com tropas de distância e área.',
    ],
    spells: ['vento-gelido', 'lancas-gelo', 'prisao-cristal', 'coracao-glacial', 'era-gelo'],
    unlockTrophies: 1200,
    suggestedDecks: [
      {
        name: 'Inverno Eterno',
        units: ['torre-cristal', 'mago-batalha', 'arquimaga', 'elemental-agua', 'golem', 'aprendiz', 'arqueiras', 'esqueletos'],
        spells: ['vento-gelido', 'prisao-cristal'],
        plan: 'Desacelere tudo e destrua de longe. Torre de Cristal e Arquimaga atrás do Golem; Vento Gélido mantém os inimigos dentro do alcance por mais tempo.',
      },
    ],
  },
  {
    id: 'thalor', name: 'Thalor', title: 'o Pastor das Feras', icon: '🦌', color: '#22c55e', element: 'Natureza',
    difficulty: 2,
    summary: 'Invocações e fortalecimento. Animais espirituais, raízes e tropas que crescem além do normal.',
    lore: [
      'Thalor nasceu cervo, no coração da Floresta Vasta. Quando lenhadores começaram a derrubar as árvores mais antigas, ele guiou todas as feras da mata numa só investida — e a floresta respondeu fazendo dele seu deus.',
      'Thalor não odeia os homens, mas não perdoa quem tira da terra mais do que precisa. Seus devotos lutam lado a lado com corvos, alces e espíritos de árvores milenares.',
    ],
    playstyle: [
      'Força Selvagem num tanque cria um muro; num Ceifador, cria um assassino de castelos.',
      'Revoada e Chamado Ancestral colocam tropas extras de graça: use para vencer a disputa de mana.',
      'Raízes prendem, mas não impedem ataques — combine com tropas de área para punir os presos.',
    ],
    spells: ['raizes', 'forca-selvagem', 'revoada', 'investida-alce', 'chamado-ancestral'],
    unlockTrophies: 1800,
    suggestedDecks: [
      {
        name: 'Manada',
        units: ['ceifador', 'carnical', 'esqueletos', 'diabretes', 'necromante', 'colosso-carne', 'cavaleiro', 'arqueiras'],
        spells: ['forca-selvagem', 'revoada'],
        plan: 'Muitas tropas por trilha. Força Selvagem no Colosso ou no Ceifador para quebrar a defesa; Revoada pressiona a trilha vazia.',
      },
    ],
  },
];

export const godById = (id: string) => GODS.find((g) => g.id === id);
