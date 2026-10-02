# Regras da batalha

Os números destacados vêm direto de `src/data/content/rules.ts`.

## A arena

```
 HUD:  [vida do seu castelo]        2:41  MANA x2        [vida do castelo inimigo]
      ┌────────┐ ════════════ trilha de cima ═════════════ ┊ ══════════ ┌────────┐
      │  SEU   │ ════════════ trilha do meio ═════════════ ┊ ══════════ │INIMIGO │
      │CASTELO │ ════════════ trilha de baixo ════════════ ┊ ══════════ │CASTELO │
      └────────┘                                        meio            └────────┘
 Mana: ▮▮▮▮▮▮▯▯▯▯ 6     [próxima]  [carta] [carta] [carta] [carta]
```

- Tela **horizontal**. Seu castelo fica à esquerda, o do oponente à direita.
- **<Rule k="lanes" /> trilhas** independentes. As tropas só enxergam inimigos da **própria trilha**. O castelo e as magias são as exceções.
- A linha pontilhada no meio divide a arena nas duas metades.

## Duração e prorrogação

| Fase | Duração | Regra especial |
|---|---|---|
| Tempo normal | <Rule k="matchSeconds" /> s | — |
| Mana em dobro | últimos <Rule k="doubleManaLastSeconds" /> s do tempo normal e toda a prorrogação | A mana regenera 2× mais rápido |
| Prorrogação | até <Rule k="overtimeSeconds" /> s | Os dois castelos perdem <Rule k="overtimeDrainPctPerSec" />% da vida máxima por segundo, e essa perda aumenta <Rule k="overtimeDrainRampPct" /> ponto percentual a cada 10 s |

**Vitória:**
1. Quem destruir o castelo inimigo vence na hora.
2. Se a prorrogação acabar com os dois castelos de pé, vence quem tiver mais **% de vida**.
3. Com % igual, é empate.

> Por que prorrogação em vez de decidir por vida em 3:00? Porque ela força o último ataque e evita partidas em que alguém só defende depois de abrir vantagem.

## Mana

- Começa com **<Rule k="startMana" />** e vai até **<Rule k="maxMana" />**.
- Regenera **1 a cada <Rule k="secondsPerMana" /> s** (o dobro durante a mana em dobro).
- Mana cheia é mana desperdiçada: o jogo deve deixar a barra chamativa (brilho pulsante) quando estiver cheia.

## Cartas e mão

- O deck tem **<Rule k="deckSize" /> tropas**, e a mão mostra **<Rule k="handSize" />** cartas mais a **próxima**.
- Ao jogar uma carta, ela vai para o fim da fila e a próxima entra no lugar.
- No início da partida o deck é embaralhado.

## Invocando tropas

- Arraste uma carta até uma trilha (ou toque na carta e depois na trilha).
- **Zona de invocação:** vai da frente do seu castelo até o que vier **primeiro** entre:
  - a tropa inimiga mais avançada naquela trilha;
  - a linha do meio da arena.
- Enquanto você arrasta, a zona permitida aparece destacada em cada trilha.
- **Construções** só podem ficar na sua metade, e nunca à frente de uma tropa inimiga.
- Cartas com várias cópias (ex.: Esqueletos ×4) aparecem em formação ao redor do ponto escolhido.

## Magias

- Antes da partida você escolhe **<Rule k="spellsPerMatch" /> magias** do seu deus.
- Magias **não gastam mana**. Cada uma tem:
  - **recarga inicial**: segundos desde o início da partida até o primeiro uso;
  - **recarga**: segundos entre usos.
- Os botões das magias ficam à esquerda da mão de cartas, com um anel de recarga e os segundos restantes.
- O alvo depende da magia: ponto, trilha inteira, tropa aliada, arena inteira ou castelo. Veja a [lista de magias](/magias/).

## Combate

### Busca de alvo
A cada instante, cada tropa ataca o inimigo **mais próximo à frente**, na mesma trilha e dentro do alcance, que ela consiga acertar. Sem alvos, ela avança. Ao chegar à frente do castelo inimigo, ataca o castelo.

### Voadores
- Voadores só podem ser atingidos por tropas que **acertam voadores**, pelo castelo e por magias.
- Tropas terrestres de corpo a corpo **passam por baixo** deles.
- Voadores não bloqueiam a passagem de ninguém.

### Ataques
- **Corpo a corpo** (alcance até 40): dano instantâneo.
- **Distância** (alcance de 60 ou mais): dispara um projétil, e o dano só acontece quando ele chega. Se o alvo morrer no caminho, o projétil termina no último ponto, e o dano em área (se houver) ainda acontece ali.
- **Dano em área:** atinge todos os inimigos dentro do raio em volta do impacto.

### Efeitos de controle

| Efeito | Anda? | Ataca? | Recarga do ataque |
|---|---|---|---|
| Lentidão X% | mais devagar | mais devagar se o efeito disser | normal |
| Prisão (raízes) | não | **sim** | normal |
| Atordoamento | não | não | pausa |
| Congelamento | não | não | pausa |
| Empurrão | é deslocado para trás | — | — |

Efeitos iguais **não se somam**: vale o mais forte, e a duração é renovada.

### Escudos e cura
- O escudo absorve dano antes da vida e some quando acaba o tempo.
- A cura nunca passa da vida máxima.
- O Sopro Necrótico (Dragão Ósseo) reduz em 50% a cura e o escudo recebidos.

## Castelo

- A vida depende do nível da conta e do nível do deus (ver [Progressão](/progressao)).
- Atira no inimigo mais próximo da sua frente, em **qualquer trilha**, até **<Rule k="castleRange" /> px**: **<Rule k="castleDamage" />** de dano a cada **<Rule k="castleAttackInterval" /> s**, acertando voadores.
- Leva dano normal de tropas. As magias causam um valor reduzido no castelo, indicado em cada magia.

## Ordem de atualização (para implementação)

A cada quadro:
1. relógio e fase;
2. mana;
3. recargas das magias;
4. IA;
5. tropas (efeitos, alvo, ataque ou movimento);
6. castelos;
7. projéteis;
8. remoção de mortos e efeitos "ao morrer";
9. HUD;
10. verificação de fim.

Isso já é o que o protótipo faz (ver [Arquitetura](/tecnico/arquitetura)).
