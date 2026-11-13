# Animação

## Sistema atual do jogo (verificado em `game/game.js`)
- Troca de textura por quadro; 3 quadros por direção: `0` parado, `1` e `2` passos.
- Índice: `player.frame = 1 + (Math.floor(player.anim) % 2)`; `player.anim` avança 6,5/s andando e 10/s correndo → ~6,5 e 10 trocas por segundo.
- O motor já adiciona **balanço vertical** (+0,08 unidade ≈ 1 px) e **squash & stretch** leve ao andar, e "respiração" parado. Não desenhar esse balanço nos quadros (dobraria o efeito).
- Protagonista: 8 direções (`E, SE, S, SW, W, NW, N, NE`), W/SW/NW espelhadas. Moradores: frente/costas/lado (lado espelhado).
- Animação de criaturas: 2 quadros + pulo feito no motor.

## Recomendações (PROVISÓRIO — exigem mudança pequena no motor; propor antes)
| Animação | Quadros | Ritmo | Observação |
|---|---|---|---|
| Parado | 2–4 | 3–4 fps | respiração sutil (1 px no peito/cabelo), piscar a cada 3–5 s |
| Andar | 4 (contato, passagem, contato, passagem) | 8 fps | hoje o motor só alterna 2 poses |
| Correr | 4–6 | 12 fps | inclinação do tronco +1 px, cabelo/cachecol atrasados |
| Interagir | 2–3 | 8 fps | mão estendida |
Para 4 quadros: trocar `% 2` por `% 4` e montar a lista de texturas — mudança de 1 linha, mas é código do jogo → apresentar antes.

## Regras de continuidade
- Proporções, roupa, cabelo e acessórios idênticos em todos os quadros.
- Linha dos pés fixa (y=63) em andar/parado; variação só em pulo/corrida (usar `--allow-lift`).
- Centro horizontal estável (deriva ≤ 1,5 px); altura do corpo varia ≤ 2 px.
- Elementos secundários (cabelo, cachecol, bolsa) seguem o movimento com 1 quadro de atraso.

## Verificação
```bash
python3 scripts/hd2d_tools.py anim f0.png f1.png f2.png f3.png --gif walk.gif --onion onion.png --fps 8
```
Detecta: tamanhos diferentes, pés flutuando, variação de altura, deriva horizontal, quadros idênticos. Depois, **olhar o GIF e o onion skin** — o script não vê deslizamento de pé nem acessório "pulando".
Achado da auditoria: no ciclo lateral atual do protagonista o quadro 2 é igual ao 0 (só 2 poses reais).
