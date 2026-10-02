# Progressão

Quatro coisas sobem de nível: **tropas**, **magias**, **deuses** e a **conta**. Todos os números desta página vêm de `src/data/content/progression.ts`.

```
Vitória ─▶ ouro + troféus + baú
Baú ─────▶ ouro + cartas de tropa + essência + fragmentos de magia
cartas + ouro ─────▶ nível de TROPA ─▶ XP de conta ─▶ nível de CONTA (vida do castelo)
essência ──────────▶ nível de DEUS ──▶ libera magias + vida do castelo
fragmentos + ouro ─▶ nível de MAGIA ─▶ +poder e evoluções
troféus ───────────▶ ARENAS ────────▶ novas tropas nos baús e novos deuses
```

## Tropas

- Níveis de **1 a 10**. Cada raridade **começa** num nível diferente: comum 1, rara 3, épica 5, lendária 7.
- Subir de nível custa **cartas repetidas** daquela tropa e **ouro**.
- Cada nível dá **+8% de vida e dano**, calculado sobre o valor no nível inicial da raridade.
- Cada upgrade dá **XP de conta**.

<LevelTable type="unit" />

> Exemplo: o Cavaleiro (650 de vida no nível 1) chega a 650 × (1 + 0,08 × 9) = **1.118** de vida no nível 10.

## Magias

- Níveis de **1 a 5**. O nível 1 vem ao liberar a magia (pelo nível do deus).
- Custa **fragmentos daquela magia** e **ouro**.
- Cada nível dá **+10%** em dano, cura, escudo e vida invocada. Durações e porcentagens não mudam, exceto nas evoluções.
- **Evoluções** nos níveis 3 e 5 (descritas em cada magia).

<LevelTable type="spell" />

## Deuses {#deuses}

- Níveis de **1 a 10**, subidos com **essência divina**, que é compartilhada entre todos os deuses (você escolhe em qual gastar).
- O nível do deus **libera as magias** dele e aumenta a **vida do castelo** em 2% por nível quando você joga com ele.
- Deuses novos são liberados por **troféus** (ver [Economia](/economia#arenas)).

<LevelTable type="god" />

## Conta

- XP vem de subir tropas de nível.
- Cada nível de conta dá **+6%** de vida do castelo, valendo para qualquer deus.

<LevelTable type="account" />

## Pareamento contra a IA

Para a progressão não deixar a IA fácil ou impossível demais (`enemyLoadout` em `src/battle/Loadout.ts`):

- **Níveis das tropas:** calcula-se quantos níveis, em média, as tropas do seu deck estão acima do nível inicial da raridade. A IA usa essa mesma vantagem (arredondada), −1 no Fácil e +1 no Difícil.
- **Níveis das magias:** a média das suas duas magias, ±1 pela dificuldade.
- **Vida do castelo:** igual à sua.
- **Cartas:** só tropas da **sua arena atual e das anteriores**. As tropas do deck sugerido que ainda não existem na sua arena são trocadas por outras permitidas.
- **Magias:** só as liberadas até o nível do **seu** deus (ver [IA do oponente](/ia)).

## Princípios

- **Habilidade > nível:** com níveis iguais, quem joga melhor vence. A diferença entre níveis vizinhos (+8%) pesa, mas não decide sozinha.
- **Sem paywall na v1:** tudo se obtém jogando. Compras ficam para quando houver PvP online, e só com itens cosméticos ou de conveniência.
