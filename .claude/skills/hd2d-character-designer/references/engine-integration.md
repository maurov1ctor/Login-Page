# Integração com o motor (auditado em 13/11; não altere o jogo sem aprovação)

## Arquitetura atual (verificada)
| Item | Como é hoje | Onde |
|---|---|---|
| Motor | sem engine; HTML + JS + Three.js r128 via CDN | `game/index.html` |
| Linguagem | JavaScript (ES2017+), Python só no pipeline | — |
| Câmera | perspectiva fixa inclinada (offset 0, 12.5, 15.5), segue o jogador | `game/game.js` (`CAM_OFF`) |
| Escala | **16 texels = 1 unidade** (`const U = 16`); FOV calculado para 1 texel = 1 pixel interno no plano de foco | `game.js` (`U`, `resize`) |
| Render | resolução interna baixa (PIX ≥ 2) + pós-processo: DOF por profundidade, bloom (limiar ~0,68–0,72), grading quente, vinheta, posterização em 48 níveis | `game.js` (shader `post`) |
| Sprites | gerados em tempo de execução de grades de letras → canvas → `CanvasTexture` com `NearestFilter` | `game/sprites2.js`, `game.js` (`Pix.tex`) |
| Billboard | plano com a rotação da câmera; geometria deslocada para o **pivô ficar no centro inferior** | `game.js` (`spriteGeo`) |
| Material | `MeshLambertMaterial`, `alphaTest 0.5`, normais apontando para cima (recebe a mesma luz do chão), cor multiplicada por 0,78–0,8 | `game.js` (`spriteMat`, criação do herói/NPCs) |
| Sombras | sprites projetam sombra via `customDepthMaterial` com alphaTest; recebem sombra das casas | `game.js` |
| Ordenação | depth test normal (alpha test, sem blending) — sem problemas de ordenação | — |
| Animação | troca de textura; 3 quadros; 8 direções no herói | ver `animation-guidelines.md` |
| Retratos | 48×48 desenhados em canvas, mostrados a **84 px CSS** | `index.html` (`#pf`) |
| Assets em PNG | **nenhum** para personagens | — |

## Conflito 1 — canvas 64×64 × escala do mundo (decisão do usuário necessária)
Hoje o herói tem 40 px de altura = 2,5 unidades. Um personagem de 58 px no canvas 64×64 teria **3,6 unidades (≈1,45×)**. As portas das casas têm ≈1,7–2 unidades: o personagem ficaria bem maior que as portas.
Opções:
1. **Manter 1 texel = 1 pixel** e aceitar personagens maiores, ajustando a escala das casas/props (mudança de arquitetura do cenário; preserva a nitidez). *Recomendada se o objetivo for personagens mais detalhados e protagonistas da tela.*
2. **Encolher o plano do sprite (~0,69×)**: rápido, mas cria pixels de tamanhos diferentes (mixels) e serrilhado — viola o padrão de pixel art. *Não recomendada.*
3. **Afastar a câmera / mudar `U` da câmera para ~23**: o personagem fica nítido, mas as texturas do cenário (16 px/unidade) ficam ampliadas 1,44× de forma irregular. Compromisso visual.
4. **Usar 64×64 só como canvas com margem**, desenhando o personagem com ~40–44 px de altura dentro dele (mantém a escala atual; perde parte do ganho de detalhe).

## Conflito 2 — retratos em escala não inteira (bug visual pequeno)
48 px mostrados a 84 px = 1,75× → pixels de tamanhos desiguais. Correção proposta: mostrar a 96 px (2×) ou desenhar retratos em 42×42 para 84 px. Mudança só de CSS/tamanho — apresentar antes de aplicar.

## Proposta para carregar PNGs (não aplicada)
- `THREE.TextureLoader` com `magFilter = minFilter = NearestFilter`, `generateMipmaps = false`.
- Manifesto `assets/characters/manifest.json`: `{ "hero": { "frame": [64,64], "dirs": ["S","SE","E","NE","N"], "anims": {"idle":[...], "walk":[...]}}}`.
- Tamanho do plano = `frame_w/U × frame_h/U` (respeitando a opção escolhida acima); pivô continua no centro inferior.
- Funciona também no artifact publicado: arquivos ao lado da página são servidos por caminho relativo.
- Manter `sprites2.js` como fallback até todos os personagens migrarem.

## Compatibilidade de cor com o cenário
- O sprite é multiplicado por ~0,8 e iluminado pelo sol + 4 lanternas; o grading esfria sombras e esquenta luzes.
- Testar sempre no jogo (export → screenshot) e no `preview` com os 4 fundos.
