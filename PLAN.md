# Plano: TCG Idle — Jogo de Cartas Idle no Browser

## Context

Jogo idle no estilo MelvorIdle, mas com tema de TCG colecionável inspirado no Chaotic TCG (não RPG de fantasia). O jogador começa com deck básico, faz expedições para caçar/scanear criaturas, ganha cartas com atributos rolados em range amplo (incentivando farm pela roll perfeita), constrói deck e duela automaticamente contra NPCs até desbloquear "Duelist Masters". O jogo é single-player, browser puro (HTML+CSS+JS, sem build step) e persiste no localStorage.

O objetivo destas primeiras fases é **ver o gameplay loop funcionando o mais rápido possível** em um protótipo navegável, antes de investir em balanceamento, arte e escopo amplo.

Tambem e necessario corrigir a percepcao atual de "prototipo quebrado": ao abrir `index.html`, a interface precisa comunicar claramente que esta funcional, com botoes acionaveis, estados visiveis e feedback imediato de interacao.

---

## Decisões de design consolidadas

### Mecânica de cartas
- **Inspiração**: Chaotic TCG (board 6v6 com batalhas 1v1 resolvidas sequencialmente)
- **Atributos das criaturas**: `Courage`, `Power`, `Wisdom`, `Speed`, `Energy` (HP)
- **Elementos**: Fire, Air, Earth, Water (afinidades por criatura)
- **Tribos** (4, com nomes próprios — não Chaotic original):
  - `Solari` (análogo a OverWorld — Courage alta)
  - `Umbrae` (análogo a UnderWorld — Power alta)
  - `Nomads` (análogo a Mipedian — Speed alta)
  - `Hivekin` (análogo a Danian — Wisdom alta)
- **Tipos de carta**: Creature, Attack, Battlegear (equipamento), Mugic (magia), Location (campo)

### Atributos rolados por drop
- Cada criatura tem **range min/max visível** por atributo (ex.: `Solari Champion — Courage 80–120`)
- Ao dropar, cada atributo rola random dentro do seu range
- **Sistema de duplicatas**: carta duplicada pode ser "dissolvida" em material (`Essence`); essência pode ser gasta em outra cópia da *mesma carta* para re-rolar UM atributo (com chance de melhorar)
- **Limite de deck**: máximo 2 cópias da mesma carta

### Duelo automático
- Board 6v6 (cada jogador posiciona 6 criaturas antes do duelo)
- A cada "tick" do duelo, uma batalha 1v1 acontece entre criaturas ativas
- Resolução 1v1 usa comparação de atributos + ataques equipados + elemento
- **Condição de vitória**: derrotar todas as 6 criaturas do oponente

### Mecânica ativa do jogador presente ("Coaching")
- Mão separada de **Call Cards** (ordens táticas)
- Exemplos: `+20 Power neste turno`, `Trocar criatura ativa`, `Bloquear próximo ataque`, `Usar Mugic`
- Cada Call Card tem cooldown individual
- Jogador AFK → duelo usa IA default (vitórias/derrotas normais)
- Jogador presente → pode inclinar a balança jogando Call Cards nos momentos certos

### Loop idle global
- **Expedições cronometradas**: jogador envia personagem a uma localização por X minutos; ao retornar, recebe pacote de drops (criaturas + essências)
- **Duelos automáticos**: fila de NPCs da zona atual; duelos rodam em sequência enquanto jogador está no app (ou progride offline com cap)
- **Vitórias consecutivas** desbloqueiam enfrentar **Duelist Masters** (bosses da zona)
- **Skills paralelas** (fase posterior): estudar o jogo, estudar scan, trocas com NPCs

### Direcao visual e UX
- **Referencia macro**: UI inspirada em Melvor Idle, com leitura forte de painel de jogo, progresso sempre visivel e navegacao muito clara
- **Referencia de acabamento**: usar inspiracoes de design do Google para limpeza visual, espacamento, hierarquia tipografica e componentes compreensiveis
- **Evitar**: aparencia "lama marrom", excesso de blur, visual amorfo de prototipo generico e telas sem pontos focais
- **Priorizar**:
  - layout de app-game com paineis bem definidos
  - contraste alto entre fundo, superficie e areas interativas
  - botoes com estados claros de hover, ativo, desabilitado e loading
  - informacao principal visivel sem exigir clique exploratorio
  - feedback imediato ao clicar, trocar aba, iniciar expedicao e iniciar duelo
- **Meta de experiencia**: ao abrir pela primeira vez, o jogador precisa entender onde clicar e perceber em poucos segundos que o jogo esta funcionando

---

## Arquitetura de arquivos (HTML+CSS+JS puro)

```
TCGIdle/
├── index.html                  # Shell principal, abas de navegação
├── styles/
│   ├── main.css                # Layout global
│   ├── cards.css               # Estilos de carta (rendering visual)
│   └── duel.css                # Tela de duelo
├── src/
│   ├── main.js                 # Entry point, boot, event loop (tick global)
│   ├── state.js                # GameState singleton + save/load (localStorage)
│   ├── data/
│   │   ├── creatures.js        # Catálogo de criaturas base (ranges min/max)
│   │   ├── attacks.js          # Catálogo de ataques
│   │   ├── tribes.js           # Definição das 4 tribos
│   │   ├── locations.js        # Zonas de expedição
│   │   └── npcs.js             # NPCs/duelistas/masters
│   ├── systems/
│   │   ├── expedition.js       # Timers de expedição + geração de drops
│   │   ├── rolling.js          # Roll de atributos dentro do range
│   │   ├── deck.js             # Validação de deck (2 cópias max)
│   │   ├── duel.js             # Motor de duelo 1v1 sequencial
│   │   ├── duelAI.js           # IA do oponente + default do player AFK
│   │   └── dissolve.js         # Duplicata → essência → reroll
│   └── ui/
│       ├── collection.js       # Tela de coleção (inspecionar cartas + ranges)
│       ├── deckBuilder.js      # Tela de construção de deck
│       ├── expeditions.js      # Tela de expedições (enviar/aguardar)
│       ├── duelView.js         # Tela de duelo (board 6v6, Call Cards)
│       └── worldMap.js         # Tela de mapa (selecionar zona/NPC)
└── PLAN.md                     # Este plano
```

Nenhum framework; sem build step. Basta abrir `index.html` no browser.

---

## Fases de desenvolvimento (incrementais)

### Fase 0 — Setup mínimo (meio-dia)
**Meta**: esqueleto navegável do projeto.
- Criar `index.html` com abas (Coleção / Duelo / Expedições / Deck).
- CSS base, layout responsivo simples.
- `state.js` com GameState singleton + save/load localStorage.
- `main.js` com tick loop (setInterval 1s).
- Aplicar uma base visual inspirada em Melvor Idle com limpeza de interfaces estilo Google, mesmo no prototipo inicial.

**Validação**: abrir index.html, navegar entre abas, recarregar e ver estado persistido.

---

### Fase 1 — Protótipo do gameplay loop (PRIORIDADE MÁXIMA)

**Meta**: em um tiro, ver o loop `expedição → ganhar carta → duelar → ganhar → repetir` funcionando.

Escopo reduzido ao mínimo necessário:
- **1 zona** de expedição (ex.: "Floresta de Solari")
- **6 criaturas** base (1-2 por tribo) em `creatures.js`, cada uma com ranges min/max
- **Deck inicial fixo** de 6 criaturas entregue ao começar novo jogo
- **1 NPC duelista** enfrentável na zona
- **Motor de duelo simplificado**:
  - Board 6v6; duelo resolve sequencialmente, 1v1 por tick
  - Resolução 1v1 = comparar soma ponderada de atributos + random + elemento advantage
  - Sem Mugic, sem Battlegear, sem Call Cards ainda
- **Expedição cronometrada** simples: clicar "Enviar" → timer de 30s → 1-2 cartas dropadas com stats rolados
- **Tela de Coleção** básica: lista de cartas com atributos visíveis e range min/max

**Validação**: começar jogo → enviar expedição → aguardar → inspecionar drops → trocar no deck → duelar NPC → ver resultado. Persistência entre reloads.

**Perguntas que podem surgir aqui**: balanceamento de rolls, estética das cartas. Deixar simples (ASCII/texto + cores por tribo).
Mesmo simples, a apresentacao deve parecer intencional e funcional, nao apenas um bloco vazio estilizado.

---

### Fase 2 — Coaching (Call Cards) + múltiplos NPCs
**Meta**: introduzir a mecânica ativa que recompensa presença.
- Sistema de **Call Cards**: mão separada com cooldowns
- 4-5 Call Cards iniciais (`+20 Power`, `Trocar ativa`, `Escudo`, `Dobrar Speed`, `Canceling Strike`)
- UI: barra de Call Cards na tela de duelo; clicar joga
- **3-4 NPCs** na zona com dificuldade crescente
- **Sistema de vitórias consecutivas** (streak counter)
- **1º Duelist Master** desbloqueado após X vitórias consecutivas

**Validação**: duelar AFK vs duelar com Call Cards mostra diferença mensurável na taxa de vitória.

---

### Fase 3 — Duplicatas, essência e reroll
**Meta**: introduzir o gatilho de farm de longo prazo.
- Sistema de **Essence**: dissolver duplicata → N essências da mesma carta
- Tela de inspeção de carta mostra botão "Upgrade" que gasta essência
- Upgrade re-rola UM atributo da carta (chance configurável de melhorar; mantém se pior)
- Validação de deck: máx 2 cópias da mesma carta

**Validação**: farmar 10+ cópias de uma criatura, dissolver e ver o atributo ficar mais próximo do max.

---

### Fase 4 — Expansão de conteúdo e múltiplas zonas
**Meta**: dar ao jogador mais para explorar.
- **3-4 zonas** de expedição, cada uma desbloqueada por progressão
- Pool de criaturas expandido (20-30 criaturas base, distribuídas nas 4 tribos)
- Cada zona tem seu próprio roster de NPCs e um Master
- **Cartas de ataque** (Attack cards) começam a dropar e são equipáveis em criaturas
- **Elementos** passam a ter efeito real no combate (advantage/disadvantage)

**Validação**: jogador progride por 3 zonas, deckbuilding começa a ter decisões significativas.

---

### Fase 5 — Skills paralelas e sistemas sociais
**Meta**: aprofundar o sabor "MelvorIdle" com múltiplas barras de progressão.
- **Estudar o jogo** (skill): XP passivo; níveis desbloqueiam Call Cards e slots
- **Estudar Scan** (skill): XP por expedição; níveis aumentam chance de drop e melhoram rolls
- **Trocas com NPCs**: NPCs oferecem cartas específicas por duplicatas/essências
- **Battlegear** e **Mugic** introduzidos como novas categorias de carta

---

### Fase 6 — Polimento e longevidade
- Arte/visual das cartas (SVG ou spritesheet; antes disso tudo pode ser texto+CSS)
- Progresso offline com cap (ex.: até 8h)
- Achievements
- Balanceamento de números em playtest real
- Audio/feedback
- Acessibilidade
- Refinamento final da identidade visual, preservando a base Melvor Idle + clean Google definida desde o inicio

---

## Arquivos críticos a criar primeiro (Fase 0 + 1)

| Arquivo | Função |
|---|---|
| `index.html` | Shell + abas |
| `styles/main.css` | Layout base |
| `styles/cards.css` | Render de carta (nome, tribo, stats com range) |
| `src/main.js` | Boot + tick loop |
| `src/state.js` | GameState + save/load |
| `src/data/creatures.js` | 6 criaturas base com ranges |
| `src/data/tribes.js` | 4 tribos |
| `src/data/locations.js` | 1 zona |
| `src/data/npcs.js` | 1 NPC |
| `src/systems/rolling.js` | Função `rollCard(base)` → instância com stats rolados |
| `src/systems/expedition.js` | Start/tick/complete expedição |
| `src/systems/duel.js` | Resolver duelo 6v6 sequencial |
| `src/ui/collection.js` | Listar cartas + inspecionar |
| `src/ui/duelView.js` | Visualizar duelo (textual por ora) |
| `src/ui/expeditions.js` | Botão enviar + timer |

---

## Verificação

### Fase 0
- [ ] Abrir `index.html` no Chrome/Firefox sem erros de console
- [ ] Navegar entre as 4 abas
- [ ] Modificar estado (ex.: dummy counter), recarregar página, ver estado persistido
- [ ] A tela inicial parece claramente interativa e funcional ao primeiro olhar
- [ ] Botoes e abas exibem feedback visual imediato ao uso

### Fase 1 (MVP do loop)
- [ ] Novo jogo inicia com deck fixo de 6 criaturas
- [ ] Enviar expedição → timer visível → ao terminar, 1-2 cartas aparecem na coleção com atributos dentro do range esperado
- [ ] Inspecionar carta mostra stats atuais + range min/max
- [ ] Trocar carta do deck pela nova
- [ ] Iniciar duelo vs NPC → ver resolução tick por tick → ver resultado final (W/L) + recompensa
- [ ] Reload → tudo persiste

### Fase 2
- [ ] Call Cards aparecem em duelo ativo; clicar aplica efeito
- [ ] Streak counter incrementa e zera corretamente
- [ ] Master desbloqueia após N vitórias consecutivas

### Fase 3
- [ ] Dissolver duplicata gera N essências
- [ ] Usar essência em cópia da mesma carta re-rola 1 atributo; mantém se pior
- [ ] Deckbuilder rejeita 3ª cópia da mesma carta

---

## Pontos em aberto para resolver durante implementação

1. **Fórmula exata de resolução 1v1**: começar com `(Power + Courage*0.5 + Speed*elementAdvantage) + random(0..20) vs defensor.Wisdom`; ajustar em playtest.
2. **Quanto re-roll custa**: definir na Fase 3 com base em quantos drops uma hora de farm gera.
3. **Arte das cartas**: adiada — MVP usa retângulos coloridos por tribo + texto.
4. **Lore/nomes das criaturas**: inventar conforme preencher `creatures.js`; pode ser refatorado depois sem mexer no motor.
