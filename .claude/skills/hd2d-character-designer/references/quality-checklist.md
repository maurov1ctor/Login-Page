# Qualidade: validação técnica e crítica artística (são coisas separadas)

## 1. Validação técnica (automática — `hd2d_tools.py`)
- [ ] `validate`: PNG íntegro, 64×64, alfa binário, pés em y=63, centro ±2,5 px, ≤32 cores, sem marca de blockout.
- [ ] Avisos revisados: ocupação fora da faixa, cores quase iguais, cores que se fundem na posterização, pixels isolados.
- [ ] `anim` (se animação): mesmos tamanhos, pés estáveis, altura ±2 px, deriva ≤1,5 px, sem quadros duplicados não intencionais.
- [ ] `sheet` com `.json` coerente (ordem dos quadros, pivô).
Passar aqui **não** significa que a arte é boa.

## 2. Crítica artística (subagente `hd2d-art-critic`, independente do designer)
Notas 0–10, **cada uma com evidência visual concreta** (região/coordenada/vista):
| Categoria | Pergunta |
|---|---|
| Originalidade | lembra algum personagem existente ou arquétipo genérico? |
| Silhueta | reconhecível em preto? distinta do elenco? forma de assinatura clara? |
| Anatomia | proporções coerentes com a bíblia e entre vistas? |
| Figurino | cada peça tem função? excesso de enfeite? |
| Identidade facial | rosto legível a 1×? expressão coerente? |
| Harmonia de cor | rampas coerentes, cor de assinatura, convive com o cenário dourado? |
| Execução de pixel art | clusters, contorno, banding, pillow shading, ruído? |
| Leitura em resolução nativa | funciona no painel "tamanho de jogo" do `preview`? |
| Coerência narrativa | o visual comunica o brief? |
| Consistência com a bíblia | segue `visual-bible.md`? |

Regras:
- Qualquer nota < 7 ⇒ revisão obrigatória daquele ponto.
- Nota sem evidência não vale. Exemplos de evidência válida: "na silhueta, cabelo e cabeça viram uma massa só (linhas 4–26)"; "a alça (x 22→11, y 23→30) some sobre o suéter no fundo claro".
- Se o crítico não conseguiu abrir/ver a imagem, deve dizer isso e não pontuar.
- Proibido inventar defeito para parecer rigoroso.

## 3. Iteração controlada
Cada rodada: (1) problemas específicos, (2) prioridade, (3) preservar o aprovado, (4) nova versão, (5) reavaliar, (6) comparar lado a lado com a anterior (`preview` das duas).
Duas rodadas sem melhora real ⇒ parar e repensar a abordagem com o usuário. Nunca afirmar melhora sem comparação visual.

## 4. Aprovação
Designer entrega → crítico avalia → diretor de arte (sessão principal) consolida → **usuário aprova** → artista técnico (validador) confere os arquivos finais → registro em `APPROVED.md`.
