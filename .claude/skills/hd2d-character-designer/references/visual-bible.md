# Bíblia visual — fonte da verdade para personagens

Legenda: **[CONFIRMADO]** decidido/aprovado pelo usuário · **[EM USO]** está no jogo mas sem aprovação formal · **[PROVISÓRIO]** recomendação a validar.

## 1. Decisões confirmadas
- [CONFIRMADO] Apresentação 2.5D/HD-2D: sprites 2D de pixel art em cenário 3D com luz, sombras e profundidade de campo.
- [CONFIRMADO] Pixel art de verdade (nada de ilustração borrada reduzida).
- [CONFIRMADO] Personagens chibi em vista 3/4 de cima, contorno colorido, olhos pequenos com brilho (direção das referências do usuário).
- [CONFIRMADO] Protagonista com movimento em 8 direções (alavanca analógica).
- [CONFIRMADO] Retratos de diálogo **à esquerda** da caixa de texto, com expressões.
- [CONFIRMADO] Protagonista: cabelo preto bagunçado, cachecol caramelo, suéter creme com mangas marrons, alça transversal com bolsa, calça oliva rasgada no joelho, botas caramelo (arte de referência do usuário).
- [CONFIRMADO] Canvas final de personagem: **64×64 PNG transparente** (pedido do usuário nesta missão) — integração pendente, ver `engine-integration.md`.

## 2. O que existe hoje (auditoria dos assets atuais, `game/sprites2.js`)
Ver `img/audit-hero-v2-board.png` (protagonista atual: zoom, silhueta, 4 fundos, tamanho de jogo).
- [EM USO] Sprites 32×40; personagem ocupa 26–28×40px; cabeça ≈ 20px (50% da altura).
- [EM USO] Luz de forma vinda de cima-esquerda; rampas de 3 tons por material; contorno derivado automaticamente do vizinho (sel-out).
- Medições do validador (sprites atuais exportados): **46–51 cores** por sprite (o sel-out automático multiplica tons de contorno), **34–57 pixels isolados**, ciclo de caminhada lateral com quadro 0 = quadro 2 (só 2 poses reais).
- Leitura de silhueta: cabelo e cabeça formam uma única massa arredondada (efeito "capacete") — confirmado na vista de silhueta.
Conclusão: a direção está certa, a execução precisa de mais resolução, controle de paleta e silhuetas mais distintas — o que motiva o 64×64.

## 3. Proporções (64×64) — [PROVISÓRIO até o primeiro personagem aprovado]
Diagrama: `img/guide-64x64.png`.
- Ocupação-guia: 42–48 px de largura (com braços/acessórios) × 56–60 px de altura. Não é camisa de força: crianças e criaturas variam.
- Cabeça + cabelo: 22–25 px de altura (≈ 2,3–2,6 cabeças no corpo). Linha dos olhos ≈ y 16–19.
- Tronco + braços: 16–18 px. Pernas + pés: 14–17 px. Mãos ≈ 3–4 px; pés ≈ 5–6 px.
- Ombros mais estreitos que a cabeça (chibi); a largura extra vem de cabelo, roupa e acessórios.
- Pés tocam a **última linha (y=63)**; eixo do corpo em x≈32 (pivô do motor).

## 4. Linguagem de forma e silhueta
- Cada personagem: 1 **forma de assinatura** reconhecível em preto puro (chapéu, cabelo, capa, arma, cauda).
- Teste obrigatório: vista de silhueta do `preview` deve distinguir o personagem de todos os outros do elenco lado a lado.
- Espaço negativo: deixar luz entre braços e tronco ou entre pernas em pelo menos uma vista; blocos maciços não leem.
- Formas: redondas = acolhedor/jovem; retas/verticais = rígido/autoridade; triangulares/pontudas = perigo/energia.

## 5. Rosto
- Sprite: olhos de 2×3 px (lápis escuro em cima, íris, 1 px de brilho); boca de 1–2 px ou ausente; blush opcional de 2 px.
- O rosto precisa ler a 1× — se não ler, simplificar, não detalhar.
- Retrato: é onde mora a expressão (neutro, feliz, surpreso + outros por personagem).

## 6. Cabelo
- Construído em **mechas** (aglomerados de 3–6 px) com 3–4 tons e um brilho em arco; nunca uma bola lisa.
- A borda externa do cabelo deve ter recortes (pontas, franja) para separar cabelo de cabeça na silhueta.

## 7. Figurino e materiais
- Cada peça com função (clima, ofício, origem). Máximo de 3 materiais principais por personagem.
- Separação de material por **valor** primeiro (claro/escuro), depois por matiz.
- Tecido: sombras macias em blocos; couro: brilho pequeno e duro; metal: contraste alto, brilho de 1–2 px; cabelo: brilho em arco.

## 8. Cor e paleta
- Paleta-mestre provisória: `palettes/master-palette.json` (+ `img/master-palette.png`), extraída das rampas que o jogo já usa.
- Rampas de 3–5 tons escuro→claro com **hue shift**: sombras puxam para roxo/azul frio, luzes para amarelo quente.
- ≤ 32 cores por sprite (meta 20–28). Uma cor de assinatura por personagem.
- O cenário é dourado/quente e o pós-processo do jogo esquenta as luzes e esfria as sombras: evitar amarelos já muito saturados na roupa (somem na luz) e preferir contraste de valor.
- Cores vizinhas precisam diferir o bastante para sobreviver à posterização de 48 níveis do jogo (o validador avisa).

## 9. Contorno
- Contorno externo escuro **colorido** (tom mais escuro do material vizinho, puxado para roxo). Contornos internos só onde separam formas importantes (braço/tronco, cabelo/rosto).
- Proposta: contorno a partir de uma rampa fixa por material (não gerado pixel a pixel) para não inflar a contagem de cores.

## 10. Densidade de detalhe e compatibilidade com o cenário
- Detalhe mínimo legível: 2 px. Qualquer coisa menor vira ruído após o pós-processo (desfoque fora de foco + posterização).
- Não pintar luz ambiente no sprite (o motor ilumina o sprite com o sol e as lanternas do cenário e aplica sombras). Sombreado de forma estilizado (cima-esquerda) é permitido e desejado.
- Não usar branco puro em áreas grandes: o bloom do jogo estoura acima de ~70% de brilho.
