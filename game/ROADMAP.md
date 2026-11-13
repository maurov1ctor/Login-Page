# Monster Quest — Roteiro e ideias guardadas

Este arquivo guarda as ideias combinadas que ainda não entraram no jogo.

## Já no jogo
- Vila Âmbar em 2.5D: praça, terraço com escadaria, casas em enxaimel, fonte central.
- Protagonista baseado na arte de referência (cabelo preto, suéter creme, cachecol caramelo).
- Moradores andando: Lia, Caio, Seu Joaquim. Fixos: Guarda Bento, Dona Rosa, Tito.
- Primeiras criaturas originais: **Brasito** (fogo), **Folhim** (planta), **Gotinho** (água), **Pedrisco** (pedra).
- Pombos que voam quando o jogador chega perto.
- Muretas de pedra separando o mato da vila; portão para o Jardim Selvagem.
- Vara de pesca na fonte + minijogo de tempo (fisgada "!" → barra de precisão).
- Segredo: Carpa Âmbar (lendária) — garantida na 5ª pesca bem-sucedida, ou 5% de chance antes.

## Pesca (próximos passos)
- Pescar criaturas de verdade e adicioná-las ao time (Gotinho, Lanternix).
- Diário de pesca / Monstropédia com tudo que já foi pescado.
- Pontos de pesca em outros mapas (rio, lago da floresta, mar) com tabelas próprias.
- Iscas diferentes que mudam o que aparece; criaturas que só aparecem à noite.
- Torneio de pesca na vila (minijogo cronometrado com ranking).

## Minijogos secretos (ideias)
- Carpa Âmbar: entregar à Lia desbloqueia uma conversa sobre o avô e uma recompensa.
- Jogar uma Moeda Antiga de volta na fonte → "pedido" que muda algo na vila.
- Acordar o Pedrisco (sequência secreta de botões) → ele vira parceiro.
- Caça aos pombos: espantar todos os pombos em X segundos.

## Grandes etapas
1. Batalha por turnos em 2.5D (tipos: Fogo, Planta, Água, Pedra…).
2. Time / captura / Monstropédia.
3. Interiores das casas (ferreiro, pousada, herbalista).
4. Ciclo de dia e noite, clima (chuva, folhas).
5. Salvar progresso.
6. Novas áreas: Rota 1 / Campos Sussurrantes, floresta, rio.

## Atualização — personagens, controle e mapa
- Personagens redesenhados à mão (24x32) no estilo chibi de RPG clássico: proporções de cabeça grande,
  cabelo em mechas, sombreado em 3 tons e contorno colorido. Arquivo: `game/chars.js`.
- Alavanca analógica no lugar do D-pad (velocidade proporcional ao quanto se empurra).
- Vila cercada por muralha com torres; Portão Leste aberto → estrada → Rota 1 / Campos Sussurrantes (mato alto, cercas);
  Portão Norte fechado (Estrada Real) — gancho para o futuro; tronco caído no fim da estrada (Bosque Murmurante).
- Pendente (pedido do usuário): revisar o contorno externo da vila e as casas.

## Sprites e retratos (direção de arte definida pelas referências do usuário)
- Sprites 32x40, vista 3/4, chibi; protagonista em 8 direções com caminhada (`game/sprites2.js`).
- Moradores redesenhados no mesmo padrão (frente/costas/lado para quem anda).
- Retratos 48x48 à ESQUERDA da caixa de diálogo, com expressões: neutro, feliz, surpreso (tag `[happy]` etc. na fala).
- Próximos: mais quadros de animação (4 por direção), diagonais para os moradores, retratos em 64x64 com mais tons.
