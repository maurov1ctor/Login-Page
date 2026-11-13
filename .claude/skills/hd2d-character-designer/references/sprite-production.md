# Produção de sprites

## Caminhos de autoria (o que é viável neste ambiente)
| Caminho | Situação | Uso |
|---|---|---|
| Grade de letras no código (`game/sprites2.js`) | **em uso** no jogo | rápido, versionável, mas difícil de desenhar bem em 64×64 |
| PNG desenhado em editor (Aseprite, LibreSprite, Piskel, Pixelorama) | **nenhum instalado** (verificado) — exige ação do usuário (Piskel é gratuito no navegador) | qualidade máxima |
| PNG gerado por script (Pillow) a partir de grade/camadas | disponível | personagens novos versionados como PNG |
| `blockout` de conceito | disponível | só camada-guia; validador recusa |

Recomendação: arte final como **PNG** em `assets/characters/<nome>/sprites/` (fonte da verdade) + exportação para o formato que o jogo consome. Hoje o jogo não carrega PNGs: ver `engine-integration.md` antes de mudar isso.

## Estrutura proposta (criar só quando o 1º personagem entrar em produção)
```
assets/characters/<nome>/
  character-spec.md        (templates/character-spec.md)
  references/              imagens de referência + notas
  concepts/                explorações (v1, v2…)
  model_sheets/            folha aprovada (versionada)
  sprites/                 <nome>_<dir>_<anim>_<quadro>.png  ex.: hero_S_walk_01.png
  animations/              folhas montadas + .json (hd2d_tools.py sheet)
  palettes/                <nome>.json (rampas usadas)
  APPROVED.md              lista do que foi aprovado, por quem e quando
```
Direções: `S, SE, E, NE, N` desenhadas; `SW, W, NW` = espelho (convenção já usada no jogo).

## Proteção de arte aprovada
- Nunca sobrescrever arquivo listado em `APPROVED.md`; nova versão = novo arquivo `_v2`.
- Reverter = trocar o arquivo apontado, nunca apagar o antigo.
- Commit separado por personagem/etapa, com mensagem dizendo o que foi aprovado.

## Checklist de entrega de um sprite
1. `python3 scripts/hd2d_tools.py validate <png>` → sem ERRO.
2. `preview` gerado e olhado (silhueta + 4 fundos + tamanho de jogo).
3. Paleta conferida (`palette`); cores de assinatura presentes.
4. Crítica independente registrada (`templates/critique-report.md`).
5. Aprovação do usuário registrada em `APPROVED.md`.
