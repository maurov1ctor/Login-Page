---
name: hd2d-character-designer
description: Pipeline de produção de personagens HD-2D do Monster Quest (sprites de pixel art 2D em mundo 3D Three.js). Use ao criar, redesenhar, avaliar, animar, validar ou integrar personagens, NPCs, retratos de diálogo ou sprites do jogo — e sempre que o usuário falar de character design, model sheet, silhueta, paleta, sprite 64x64, animação de caminhada ou retratos.
---

# HD-2D Character Designer — estúdio de personagens do Monster Quest

Este skill coordena o pipeline. Os detalhes ficam nas referências; leia **só** a que a etapa atual pede.

## Fatos do projeto (verificados na auditoria — ver `references/engine-integration.md`)
- Sem engine: `game/index.html` + `game/game.js` + Three.js r128 (CDN). Personagens são **billboards** (planos virados para a câmera).
- Hoje **não existe nenhum PNG de personagem**: sprites e retratos são gerados em tempo de execução a partir de grades de letras em `game/sprites2.js`.
- Escala do mundo: **16 texels = 1 unidade**; câmera calibrada para 1 texel de sprite = 1 pixel interno. Pivô = **centro inferior**. Alfa binário (`alphaTest 0.5`).
- O padrão novo pedido pelo usuário é **canvas 64×64**. Ele conflita com a escala atual (personagem ficaria ~1,45× maior que hoje). **Não integre sprites 64×64 no jogo sem o usuário escolher uma das opções** descritas em `engine-integration.md`.

## Regras inegociáveis
1. Personagens **originais**. Referências (Octopath, Cult of the Lamb, imagens do usuário) informam princípios, nunca são copiadas.
2. O usuário é a autoridade final. Nada é "aprovado" sem ele dizer.
3. Nunca sobrescrever arte aprovada: versões novas ganham sufixo `_v2`, `_v3`…; a anterior fica.
4. Nunca chamar uma redução automática de "arte final" (`blockout` só serve de base para redesenho).
5. Nunca afirmar que gerou/melhorou uma imagem sem mostrá-la e compará-la.
6. Não alterar código de gameplay para um experimento artístico; propor antes.
7. Geração de imagem paga (Figma `generate_image` consome créditos) só com autorização explícita.

## Fluxo (fases e portões)
| Fase | O que fazer | Referência | Portão |
|---|---|---|---|
| A. Brief | Preencher `templates/character-spec.md`; separar fatos dados pelo usuário de propostas | `character-design-process.md` | perguntar só o essencial |
| B. Pesquisa | Referências por categoria (silhueta, traje, cabelo, rosto, cor) e o *porquê* de cada uma | `art-direction.md` | — |
| C. Silhuetas | 3 direções realmente distintas, testadas em preto puro | `character-design-process.md` | usuário escolhe |
| D. Conceito | 3 direções completas (corpo, rosto, traje, paleta) com justificativa | `character-design-process.md` | usuário escolhe |
| E. Refino | Corrigir problemas sem redesenhar o aprovado | `visual-bible.md` | crítico + usuário |
| F. Model sheet | Frente/costas/lado, rosto, expressões, detalhes, paleta | `character-design-process.md` | identidade igual em todas as vistas |
| G. Pixel art 64×64 | Tradução intencional, prioridade: silhueta > proporção > cabelo > rosto > traje > acessórios | `pixel-art-standards.md`, `sprite-production.md` | validador sem erros + crítico ≥7 |
| H. Animação | Só depois de checar o sistema de animação real | `animation-guidelines.md` | `anim` sem erros + revisão visual |
| Integração | Proposta escrita antes de tocar no jogo | `engine-integration.md` | aprovação do usuário |

## Avaliação independente
O designer não aprova o próprio trabalho. Depois de cada entrega visual (fases C, D, F, G, H), acione o subagente **`hd2d-art-critic`** passando os caminhos dos PNGs e da spec. Rubrica e regras de evidência em `references/quality-checklist.md`. Nota < 7 em qualquer categoria ⇒ revisar. Duas iterações sem melhora real ⇒ parar e repensar a abordagem com o usuário.

## Ferramentas (testadas — Python 3 + Pillow + numpy; Node + Playwright)
```bash
T=.claude/skills/hd2d-character-designer/scripts
python3 $T/hd2d_tools.py validate sprite.png            # padrão 64x64, alfa binário, pés em y=63, ≤32 cores…
python3 $T/hd2d_tools.py preview  sprite.png --out board.png   # zoom, SILHUETA, 4 fundos, tamanho de jogo
python3 $T/hd2d_tools.py palette  a.png b.png --out swatch.png # cores agrupadas por matiz
python3 $T/hd2d_tools.py anim f0.png f1.png f2.png f3.png --gif walk.gif --onion onion.png
python3 $T/hd2d_tools.py sheet f*.png --cols 4 --out sheet.png --meta sheet.json   # ou --unpack
python3 $T/hd2d_tools.py blockout conceito.png --out base.png --key-bg            # SÓ referência
python3 $T/hd2d_tools.py guide --out guide.png                                     # grade de proporção 64x64
node    $T/export_runtime_sprites.js /tmp/saida --pad64   # exporta os sprites atuais do jogo para PNG
```
Validação técnica ≠ aprovação artística: um sprite pode passar no validador e ser feio.

## Onde ficam os arquivos (proposta — ver `sprite-production.md`)
`assets/characters/<nome>/{references,concepts,model_sheets,sprites,animations,palettes}/` + `character-spec.md`. A pasta ainda **não existe**; crie só quando o primeiro personagem entrar em produção.
