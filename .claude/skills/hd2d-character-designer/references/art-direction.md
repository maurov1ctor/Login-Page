# Direção de arte — por que as referências funcionam e o que extrair delas

> Estudo de **princípios**, não de modelos. Nenhum personagem, sprite ou paleta dessas obras deve ser reproduzido.
> As observações abaixo são análise do autor do pipeline (não citações oficiais), salvo onde indicado.

## 1. Octopath Traveler / Octopath Traveler II (Square Enix, "HD-2D")
Fonte verificada: Wikipedia "HD-2D" e entrevistas de desenvolvimento (Unreal Engine) — sprites de pixel art + cenário 3D, iluminação pontual, tilt-shift/profundidade de campo, bloom, névoa; a equipe descreve o risco de os sprites parecerem "folhas de papel" no mundo 3D e resolve com luz e pós-processo.

O que faz os personagens funcionarem em tela:
- **Escala modesta**: o sprite ocupa uma fração pequena da tela; a identidade vem da silhueta e de 2–3 cores dominantes, não de detalhes.
- **Silhueta por "massa de assinatura"**: cada personagem tem um volume que nenhum outro tem (capa longa, chapéu largo, cabelo volumoso, arma vertical).
- **Rosto mínimo**: olhos de 1–2 pixels de altura; a expressão é carregada pelo corpo e pelo retrato.
- **Integração por luz**: sombras projetadas no chão, mesma luz-chave do cenário, profundidade de campo — o sprite "pertence" ao diorama.
- **Retratos separados**: a leitura facial detalhada acontece no retrato de diálogo, liberando o sprite de ter que mostrar tudo.

## 2. Cult of the Lamb (Massive Monster)
Fonte verificada: blog da Unity sobre o jogo — arte 2D em cena 3D com câmera fixa e iluminação customizada. O jogo usa ilustração vetorial/animada (Spine), não pixel art: extraímos linguagem de forma, não técnica.
- **Linguagem de formas clara**: corpos simples (gota, feijão, retângulo arredondado) com UM elemento marcante (chifres, capuz, coroa).
- **Contraste fofo × sinistro** comunicado por formas e cor, não por detalhe.
- **Contorno grosso e escuro** garantindo leitura sobre qualquer fundo.
- **Paleta controlada** por personagem: poucas cores, uma de destaque.

## 3. Referências enviadas pelo usuário (sessão de 13/11)
O usuário enviou dois tipos de imagem como **direção de estilo** (não para importar):
- Sprites chibi em vista 3/4 com contorno colorido, olhos de 2px com brilho, 8 direções de caminhada.
- Retratos de busto em pixel art com cabelo em mechas de vários tons, olhos grandes de íris em degradê, sombreado suave.
Uma das folhas de sprites mostrava personagens oficiais de outra franquia — usar somente a técnica.

## 4. Identidade original proposta para o Monster Quest (PROVISÓRIA — validar com o usuário)
- **Tom**: aventura acolhedora de fim de tarde (o mundo é dourado e quente), com criaturas fofas e um toque de mistério.
- **Personagens humanos**: chibi de 2,2–2,6 cabeças, mãos/pés pequenos, cabeça grande carregando a identidade.
- **Regra da assinatura**: todo personagem tem **1 forma de assinatura** (o chapéu de palha do Caio, a pluma do Guarda Bento, o cachecol do protagonista) + **1 cor de assinatura** que não se repete em outro personagem do mesmo mapa.
- **Função antes de enfeite**: cada peça de roupa responde "por que esta pessoa usa isso?" (profissão, clima, origem).
- **Criaturas**: corpo de forma simples (gota, feijão, besouro) com um elemento de tipo (folha, chama, barbatana, musgo) — ver Brasito, Folhim, Gotinho, Pedrisco já no jogo.

## 5. Armadilhas a evitar
- "RPG genérico": armadura sem motivo, capas em todos, ombreiras gigantes, cintos com fivelas aleatórias.
- Copiar a silhueta de um personagem famoso trocando a cor.
- Detalhe que só existe no conceito e vira ruído a 64px.
- Paletas que brigam com o cenário dourado (verdes ácidos, magentas saturados).
