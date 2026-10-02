# Dados do jogo

Todo o conteúdo do jogo (tropas, magias, deuses, progressão, economia e regras) vive em **`src/data/content/`**, em TypeScript. **Essa é a fonte única**:

- a **wiki** importa esses arquivos e gera as tabelas e os cards (por isso os números aqui nunca ficam desatualizados);
- o **jogo** importa os mesmos arquivos (desde a v0.2). Comportamentos especiais ficam em `src/battle/abilities.ts` e `src/battle/spells.ts` (ver [Como estender](/tecnico/estender)).

```
src/data/content/
  types.ts        # tipos: UnitDef, SpellDef, GodDef, WorldDef, ArenaDef…
  worlds.ts       # 3 mundos, 4 raridades, nomes dos papéis
  units.ts        # 24 tropas + 6 arenas
  spells.ts       # 20 magias + describeSpell()
  gods.ts         # 4 deuses (história, estilo, decks sugeridos)
  progression.ts  # custos e curvas de nível
  economy.ts      # recursos, baús, recompensas, coleção inicial
  rules.ts        # regras da batalha (tempo, mana, deck, castelo)
  deck.ts         # analyzeDeck(): custo médio, antiaéreos, tanques, área e avisos
  tutorial.ts     # as 4 batalhas do tutorial (decks, dicas, castelo da IA)
  index.ts        # exporta tudo + validateContent()
```

## Validação

```bash
npm run validate
```

Verifica ids duplicados, referências em `strongAgainst`/`weakAgainst` que não existem, se cada deus tem exatamente 5 magias próprias e se os decks sugeridos têm 8 tropas válidas e magias do deus certo. O build da wiki roda essa validação antes e falha se houver problema.

## Convenções

- **Ids** em minúsculas com hífen (`grifo-real`). Eles viram âncoras na wiki (`/tropas/solar#grifo-real`), então **não mude um id** depois de publicado sem atualizar as referências.
- **Números de tropa** são os do **nível inicial da raridade**. O crescimento por nível é aplicado por `unitStatAt()`.
- **Textos de magia** usam marcadores `{chave}`, preenchidos por `describeSpell(magia, nível)` com os valores de `stats`. As chaves listadas em `scaling` crescem +10% por nível.
- **Unidades:** distâncias em px lógicos (a arena tem 940 px de castelo a castelo e as trilhas ficam a 160 px de distância), tempos em segundos e velocidades em px/s.

## Criar uma tropa nova

1. Adicione a entrada em `UNITS` (`units.ts`), com `strongAgainst` e `weakAgainst`.
2. `npm run validate`.
3. Na página do mundo (`wiki/tropas/<mundo>.md`), acrescente:
   ```md
   #### 🧌 Nome da Tropa {#id-da-tropa}

   <UnitCard id="id-da-tropa" />
   ```
   As tabelas de resumo, a matriz de counters e as arenas se atualizam sozinhas.

## Criar uma magia nova

1. Adicione a entrada em `SPELLS` (`spells.ts`) e o id em `spells` do deus (`gods.ts`).
2. Na página do deus (`wiki/deuses/<deus>.md`), acrescente o título com âncora e o `<SpellCard id="…" />`.

## Componentes da wiki

Ficam em `wiki/.vitepress/theme/components/` e podem ser usados em qualquer página `.md`:

| Componente | Uso |
|---|---|
| `<UnitTable world="solar" />` | Tabela de tropas (sem `world`, mostra todas com filtros) |
| `<UnitCard id="cavaleiro" />` | Ficha completa com controle de nível |
| `<SpellTable god="ignar" />` | Tabela de magias |
| `<SpellCard id="cometa-rubro" />` | Ficha da magia com controle de nível e evoluções |
| `<GodGrid />`, `<GodHeader id="ignar" />`, `<DeckList god="ignar" />` | Deuses |
| `<WorldCards />`, `<CounterMatrix />`, `<ArenaList />`, `<ChestTable />` | Visões gerais |
| `<LevelTable type="unit" \| "spell" \| "god" \| "account" />` | Tabelas de progressão |
| `<Rule k="matchSeconds" />` | Um número de `rules.ts` no meio do texto |

## Rodando a wiki

```bash
npm run wiki:dev      # http://localhost:5181/duelo-magico/
npm run wiki:build    # gera wiki/.vitepress/dist
npm run wiki:preview  # serve o build
```

A cada push na `main`, o GitHub Actions (`.github/workflows/wiki.yml`) publica a wiki em `https://erickeira.github.io/duelo-magico/`.
