# Padrão técnico de pixel art

## Canvas e formato (verificado pelo `hd2d_tools.py validate`)
| Regra | Valor | Motivo |
|---|---|---|
| Canvas | 64×64 PNG RGBA | pedido do usuário |
| Fundo | transparente | billboard no mundo 3D |
| Alfa | **apenas 0 ou 255** | o jogo usa `alphaTest 0.5`; semitransparência vira serrilhado imprevisível |
| Pés | última linha (y=63) | pivô do motor = centro inferior do plano |
| Eixo | centro do corpo em x≈32 (±2,5) | pivô horizontal |
| Cores | ≤ 32 por sprite (meta 20–28) | coesão e controle |
| Margem | não encostar nas bordas laterais/topo | espaço para animação |
| Escala | sempre 1:1; ampliar só por inteiro (×2, ×3…) com vizinho mais próximo | nitidez |

## Clusters
- Pixels se agrupam em **clusters** de forma clara; 1 pixel solto só quando é intencional (brilho do olho, brilho de metal).
- Evitar "banding" (faixas paralelas de mesma largura acompanhando o contorno).
- Evitar "pillow shading" (sombra acompanhando a borda por todos os lados) — a luz tem direção: cima-esquerda.
- Linhas: inclinações limpas (1:1, 1:2, 2:1); evitar degraus irregulares ("jaggies").

## Contornos
- Externo: 1 px, escuro e colorido (derivado do material, puxado para roxo).
- Interno: só para separar volumes importantes; em áreas pequenas, separar por valor em vez de linha.
- Selective outline (sel-out) permitido para suavizar o lado iluminado — mas com tons fixos da rampa.

## Rampas e sombreado
- 3–5 tons por material, escuro→claro, com hue shift (≤ ~20° por passo).
- Saturação máxima no meio da rampa; não combinar saturação alta com brilho alto.
- Sombra principal em blocos; meio-tom só nas transições grandes.
- Brilho especular: só metal, olhos, couro polido; 1–2 px.

## Anti-aliasing e dithering
- AA manual permitido apenas em curvas grandes internas (cabelo, rosto), com 1 tom intermediário; **nunca** AA para o fundo transparente.
- Dithering: evitar em sprites (vira ruído com o pós-processo); no máximo em texturas grandes e planas.

## Leitura
- Rosto: olhos 2×3 px; boca 1–2 px.
- Material separado primeiro por valor; o validador avisa cores que se fundem após a posterização do jogo.
- Teste em 4 fundos (calçamento, grama, noite, claro) e no tamanho real de jogo (painel do `preview`).

## Proibido como resultado final
- Redução automática de ilustração (mesmo bem feita) — `blockout` gera só base de redesenho e o validador a recusa.
- Texturas fotográficas, ruído, gradientes suaves de muitos tons.
- Pixels misturados de tamanhos diferentes (mixels) por escala não inteira.
