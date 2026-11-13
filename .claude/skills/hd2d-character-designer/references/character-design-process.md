# Processo de design de personagem (fases A–G)

## A. Brief
Preencher `templates/character-spec.md`. Para cada campo, marcar a origem: **[usuário]**, **[proposta]** ou **[em aberto]**.
- Essencial perguntar (se faltar): função na história, idade aproximada, papel em combate (se houver), qualquer elemento já prometido pelo usuário.
- Pode propor sem perguntar: detalhes de roupa, paleta inicial, acessórios — sempre marcados como proposta.
- Nunca registrar lore inventada como fato.

## B. Pesquisa visual
Tabela por categoria (anatomia, silhueta, traje, cabelo, rosto, materiais, cor, execução). Para cada referência: o que observar e **por que** serve. Extrair princípios (`art-direction.md`), nunca colar elementos de um personagem existente.
Imagens do usuário têm prioridade durante todo o processo.

## C. Silhuetas (3 direções)
- Variar de verdade: proporção, volume de roupa, forma do cabelo, posição do equipamento, postura. Três cortes de cabelo no mesmo corpo **não** são 3 direções.
- Entregar em preto puro, lado a lado com o elenco atual (exporte o elenco com `export_runtime_sprites.js`).
- Critério: reconhecível em preto; distinto dos outros; forma de assinatura evidente.

## D. Conceito (3 direções completas)
Cada direção: corpo inteiro, rosto, cabelo, roupa, equipamento, acessórios, paleta, materiais, elementos distintivos + 3–5 linhas de justificativa. Comparar criticamente e recomendar uma — **o usuário decide**.

### Como produzir imagens de conceito neste ambiente
Verificado na auditoria:
1. **Pixel art direta por código** (sempre disponível): grade de letras → PNG (como `game/sprites2.js`). Ótimo para silhuetas e sprites; limitado para ilustração de conceito.
2. **Figma `generate_image`** (integração conectada, verificada com `whoami`): gera imagem por texto num arquivo Figma. **Pago (créditos de IA da Figma) → só com autorização explícita do usuário a cada uso.** Imagem gerada = rascunho de conceito, nunca sprite final.
3. **Ferramenta externa do usuário** (Midjourney, etc.): preparar prompts. Modelo:
   ```
   Original fantasy character concept sheet, [idade/papel], [forma de assinatura], [roupa funcional + materiais],
   palette [3–5 cores com hex], chibi proportions 2.4 heads, front view full body + head close-up,
   clean flat lighting from top-left, plain light background, no text, no existing franchise characters.
   ```
   O usuário traz a imagem; ela entra em `assets/characters/<nome>/concepts/`.
Nunca substituir arte pedida por descrição textual sem avisar que não houve imagem.

## E. Refino
Lista numerada de problemas (anatomia, traje, hierarquia, excesso de detalhe, silhueta, cor, material). Corrigir em ordem de impacto. Preservar o aprovado.

## F. Model sheet
Frente, costas, lado (ortogonais), close do rosto, expressões, detalhes de roupa/equipamento, paleta com hex, materiais. Conferir peça por peça que nada muda entre vistas (lado da bolsa, cor da alça, comprimento do cabelo).
Atenção: o motor espelha o lado direito para obter o esquerdo — detalhes assimétricos (bolsa num lado) **trocam de lado** no espelho. Ou o design aceita isso, ou as 8 direções precisam ser desenhadas (custo maior).

## G. Tradução para pixel art 64×64
Ordem de prioridade: silhueta → proporção → cabelo → rosto → roupa principal → acessórios principais → detalhes secundários.
Passos:
1. (Opcional) `blockout` do conceito aprovado como camada de referência — **nunca** entregue.
2. Desenhar por cima: massas → contorno → rampas → rosto → detalhes.
3. `validate` sem erros; `preview` revisado (silhueta e tamanho de jogo).
4. Avaliação do `hd2d-art-critic`; corrigir < 7.
5. Se o design não couber em 64×64, explicar o que se perde e propor simplificação.
