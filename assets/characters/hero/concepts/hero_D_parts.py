"""Fonte única da geometria da direção D (cabelo H2 + corpo C), separada por material.
A silhueta (concepts/silhouettes/direction_D.py) e o conceito em cor (concepts/color/concept_color.py)
são gerados daqui — assim nunca divergem.

D v4: gola alta preta, braço do perfil ligado ao ombro, bolsa no quadril de trás, barra+tornozelo de 2 px, fio em gancho aberto.
D v3 (decisões do usuário + acabamento do crítico):
- 1A: sem a ponta do cachecol na vista de frente (fica só no perfil/diagonais);
- fio do topo fora do eixo, curvado e caído para o lado, "desajeitado" (2 px de espessura);
- ombros chanfrados (suéter folgado), manga mais "balão" no cotovelo/antebraço, punho e mão;
- lanterna sempre na mão direita; no perfil, afastada da perna da frente.

Formato de cada parte: (material, tipo, dados)
  tipo: "e" elipse [x0,y0,x1,y1] | "r" retângulo | "rr" ret. arredondado [x0,y0,x1,y1,raio] | "p" polígono | "px" lista de pixels
"""

# fio desajeitado: sai do topo fora do centro, sobe 2-3 px e cai para o lado (2 px de espessura)
STRAND_S = [(34, 3), (35, 3), (34, 4), (35, 4), (35, 2), (36, 2), (36, 1), (37, 1), (37, 2), (38, 2), (38, 3), (39, 3), (39, 4), (40, 4), (40, 5), (41, 5)]   # gancho aberto: sobe e cai além da raiz
STRAND_E = [(32, 3), (33, 3), (32, 4), (33, 4), (33, 2), (34, 2), (34, 1), (35, 1), (35, 2), (36, 2), (36, 3), (37, 3), (37, 4), (38, 4), (38, 5), (39, 5)]

PARTS_S = [
    # cabeça
    ("skin", "e", [23, 9, 41, 24]),
    ("hair", "rr", [19, 5, 40, 20, 5]), ("hair", "rr", [26, 7, 45, 20, 5]),
    ("hair", "p", [(19, 17), (17, 20), (17, 24), (20, 24), (22, 19)]),
    ("hair", "r", [41, 19, 45, 21]), ("hair", "p", [(45, 16), (48, 18), (47, 20), (45, 20)]),
    ("hair", "px", STRAND_S),
    # cachecol gola-tubo (sem ponta na frente — decisão 1A)
    ("turtle", "r", [27, 23, 37, 25]),
    ("scarf", "e", [19, 24, 45, 32]),
    # tronco + ombros chanfrados
    ("sweater", "r", [23, 30, 41, 44]),
    ("sweater", "p", [(23, 30), (20, 31), (17, 34), (20, 34)]), ("sweater", "p", [(19, 32), (20, 32), (20, 37), (17, 37), (17, 34)]),
    ("sweater", "p", [(41, 30), (44, 31), (47, 34), (44, 34)]), ("sweater", "p", [(44, 32), (45, 32), (47, 34), (47, 37), (44, 37)]),
    # mangas bufantes (marrom), punho (preto), mão
    ("sleeve", "e", [13, 35, 20, 45]), ("cuff", "r", [14, 45, 19, 46]), ("skin", "r", [15, 47, 18, 49]),
    ("sleeve", "e", [44, 35, 51, 45]), ("cuff", "r", [45, 45, 50, 46]), ("skin", "r", [46, 47, 49, 49]),
    # lanterna na mão direita (lado esquerdo da tela)
    ("metal", "r", [16, 50, 17, 51]), ("metal", "r", [15, 52, 18, 52]), ("glass", "r", [14, 53, 19, 56]), ("metal", "r", [14, 57, 19, 57]),
    # pernas
    ("pants", "p", [(23, 44), (31, 44), (30, 54), (24, 54)]), ("pants", "p", [(33, 44), (41, 44), (40, 54), (34, 54)]),
    ("skin", "r", [25, 55, 29, 58]), ("skin", "r", [35, 55, 39, 58]),
    ("boot", "e", [21, 57, 31, 63]), ("boot", "e", [33, 57, 43, 63]), ("boot", "r", [21, 60, 31, 63]), ("boot", "r", [33, 60, 43, 63]),
]

PARTS_E = [
    ("skin", "e", [27, 9, 42, 24]), ("skin", "p", [(41, 17), (43, 18), (41, 19)]),
    ("hair", "rr", [20, 5, 40, 20, 6]), ("hair", "rr", [24, 7, 42, 20, 5]),
    ("hair", "r", [20, 19, 23, 24]), ("hair", "r", [26, 19, 28, 22]),
    ("hair", "p", [(20, 15), (16, 18), (17, 20), (20, 20)]), ("hair", "r", [20, 15, 22, 20]),
    ("hair", "r", [42, 12, 43, 15]), ("hair", "px", STRAND_E),
    ("turtle", "r", [30, 23, 38, 25]),
    ("scarf", "e", [24, 24, 42, 32]), ("scarf", "p", [(25, 27), (10, 29), (5, 35), (14, 34), (26, 31)]),
    ("sweater", "p", [(25, 30), (39, 30), (40, 44), (24, 44)]),
    ("bag", "r", [21, 40, 26, 46]),
    ("sweater", "p", [(31, 30), (37, 30), (39, 35), (33, 36)]), ("sleeve", "e", [35, 34, 43, 42]),
    ("cuff", "r", [43, 37, 44, 40]), ("skin", "e", [44, 37, 47, 40]),
    ("metal", "r", [46, 41, 47, 43]), ("metal", "r", [45, 44, 48, 44]), ("glass", "r", [45, 45, 49, 48]), ("metal", "r", [45, 49, 49, 49]),
    ("pants", "p", [(26, 44), (32, 44), (30, 54), (23, 54)]), ("pants", "p", [(31, 44), (38, 44), (41, 54), (35, 54)]),
    ("skin", "r", [24, 55, 28, 58]), ("skin", "r", [37, 55, 41, 58]),
    ("boot", "e", [20, 57, 31, 63]), ("boot", "e", [35, 57, 47, 63]), ("boot", "r", [20, 60, 31, 63]), ("boot", "r", [35, 60, 47, 63]),
]

# franja: no rosto, o cabelo só cobre acima desta linha (por coluna); no perfil, a parte de trás da cabeça é toda cabelo
FRINGE_S = {x: 13 + [0, 1, 2, 1, 0, 1, 3, 2, 0, 1, 2, 0, 1, 1, 1, 0, 2, 1, 0][(x - 23) % 19] for x in range(23, 42)}
FRINGE_E = {x: (26 if x < 33 else 13 + [1, 2, 0, 1, 3, 1, 0, 2, 1, 0][(x - 33) % 10]) for x in range(27, 43)}
