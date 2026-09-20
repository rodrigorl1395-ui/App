/*
  Sprites do mundo — pixel art desenhada em canvas.

  Por que canvas e não SVG: num mundo montado com SVGs, cada elemento é
  escalado por conta própria e os "pixels" de um não batem com os do outro —
  é o que fazia a cena anterior parecer desenho vetorial fingindo ser pixel
  art. Aqui existe uma grade só: o canvas tem resolução lógica baixa (uns
  170px de largura) e é ampliado inteiro, então árvore, água, chão e bicho
  compartilham o mesmo pixel. É essa unidade que engana o olho.

  Regras deste arquivo:
    · Tudo desenha em coordenadas inteiras (Math.round nas bordas).
    · Nada de gradiente, sombra suave ou círculo com antialias: só blocos.
    · Silhueta com contorno mais escuro — é o que separa um objeto do fundo
      em pixel art, mais do que a cor dele.
*/

export const COR = {
  gramaBase: "#4d8b3f",
  gramaClara: "#5ca04a",
  gramaEscura: "#3e7433",
  gramaSombra: "#356529",

  terra: "#b98f5c",
  terraClara: "#cfa671",
  terraEscura: "#8d6a41",

  solo: "#6b4b31",
  soloClaro: "#7d5a3b",

  agua: "#3d84c4",
  aguaClara: "#5aa6e0",
  aguaEscura: "#2b6296",

  madeira: "#8a6440",
  madeiraEscura: "#5f4229",
  madeiraClara: "#a67c50",

  pedra: "#8b8b96",
  pedraClara: "#a5a5b0",
  pedraEscura: "#67676f",

  tronco: "#6b4a2f",
  troncoEscuro: "#4a3220",
  troncoClaro: "#815a3a",

  noite: "#1b2a4a",
  fogo: "#ffcf6b",
};

/* ------------------------------------------------------------------ */
/* Primitivas                                                          */
/* ------------------------------------------------------------------ */

export function bloco(ctx, x, y, w, h, cor) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/*
  Círculo pixelado: uma faixa horizontal por linha, com a meia-largura
  saindo do próprio raio. É o jeito de ter curva sem antialias — o mesmo
  algoritmo que um editor de sprites usa.
*/
export function circulo(ctx, cx, cy, r, cor) {
  ctx.fillStyle = cor;
  const raio = Math.round(r);
  for (let dy = -raio; dy <= raio; dy += 1) {
    const meia = Math.round(Math.sqrt(Math.max(0, raio * raio - dy * dy)));
    if (!meia) continue;
    ctx.fillRect(Math.round(cx - meia), Math.round(cy + dy), meia * 2, 1);
  }
}

export function elipse(ctx, cx, cy, rx, ry, cor) {
  ctx.fillStyle = cor;
  const ry2 = Math.round(ry);
  for (let dy = -ry2; dy <= ry2; dy += 1) {
    const t = ry2 ? dy / ry2 : 0;
    const meia = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    if (!meia) continue;
    ctx.fillRect(Math.round(cx - meia), Math.round(cy + dy), meia * 2, 1);
  }
}

// Gerador estável: o mesmo mundo nasce igual a cada abertura.
export function rng(semente) {
  let h = 2166136261;
  const texto = String(semente);
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function clarear(hex, quanto) {
  return misturar(hex, "#ffffff", quanto);
}

export function escurecer(hex, quanto) {
  return misturar(hex, "#000000", quanto);
}

function canais(hex) {
  const limpo = hex.replace("#", "");
  const cheio = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo;
  const n = parseInt(cheio, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/*
  Sempre devolve hex. Não é detalhe de estilo: clarear() e escurecer()
  releem a cor que sai daqui, e um "rgb(...)" faria parseInt devolver NaN —
  o canvas ignora fillStyle inválido e repinta com a cor anterior, que foi
  exatamente o bug das copas manchadas de marrom.
*/
export function misturar(a, b, quanto) {
  const [r1, g1, b1] = canais(a);
  const [r2, g2, b2] = canais(b);
  const mix = (x, y) => Math.max(0, Math.min(255, Math.round(x + (y - x) * quanto)));
  const hex = (n) => n.toString(16).padStart(2, "0");
  return `#${hex(mix(r1, r2))}${hex(mix(g1, g2))}${hex(mix(b1, b2))}`;
}

/* ------------------------------------------------------------------ */
/* Chão                                                                */
/* ------------------------------------------------------------------ */

/*
  Grama: base chapada, manchas de dois tons por cima e tufos de três pixels
  espalhados. Sem as manchas o chão vira um retângulo verde e o mundo
  inteiro perde o chão de vista.
*/
export function desenharGrama(ctx, largura, altura, semente = "chao") {
  bloco(ctx, 0, 0, largura, altura, COR.gramaBase);
  const rand = rng(semente);

  for (let i = 0; i < Math.round((largura * altura) / 900); i += 1) {
    const x = rand() * largura;
    const y = rand() * altura;
    const r = 4 + rand() * 9;
    elipse(ctx, x, y, r, r * 0.55, rand() > 0.5 ? COR.gramaClara : COR.gramaEscura);
  }

  for (let i = 0; i < Math.round((largura * altura) / 260); i += 1) {
    const x = Math.round(rand() * largura);
    const y = Math.round(rand() * altura);
    const cor = rand() > 0.45 ? COR.gramaEscura : COR.gramaSombra;
    bloco(ctx, x, y, 1, 2, cor);
    bloco(ctx, x + 1, y - 1, 1, 2, cor);
    bloco(ctx, x + 2, y, 1, 2, cor);
  }
}

/*
  A trilha: bolhas de terra sobrepostas ao longo da curva, contorno escuro
  primeiro e o miolo claro por cima. Pedrinhas soltas nas bordas tiram o ar
  de "linha desenhada" e dão o de caminho batido.
*/
export function desenharTrilha(ctx, pontos, semente = "trilha") {
  if (pontos.length < 2) return;
  const rand = rng(semente);

  const passos = [];
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const a = pontos[i];
    const b = pontos[i + 1];
    const distancia = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(2, Math.round(distancia / 3));
    for (let s = 0; s < n; s += 1) {
      const t = s / n;
      passos.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }

  for (const p of passos) elipse(ctx, p.x, p.y, 11, 7, COR.terraEscura);
  for (const p of passos) elipse(ctx, p.x, p.y, 9, 5.5, COR.terra);
  for (const p of passos) {
    if (rand() > 0.82) {
      bloco(ctx, p.x + (rand() - 0.5) * 12, p.y + (rand() - 0.5) * 6, 2, 1, COR.terraClara);
    }
  }
}

/*
  Lago: contorno de terra molhada, dois tons de água e brilhos que andam com
  o tempo. As vitórias-régias ficam paradas — é o reflexo que se move, não
  a planta.
*/
export function desenharLago(ctx, x, y, rx, ry, t) {
  elipse(ctx, x, y, rx + 2, ry + 2, COR.terraEscura);
  elipse(ctx, x, y, rx, ry, COR.aguaEscura);
  elipse(ctx, x, y - 1, rx - 2, ry - 2, COR.agua);

  for (let i = 0; i < 3; i += 1) {
    const fase = t * 0.4 + i * 2.1;
    const dx = Math.sin(fase) * (rx * 0.3);
    const dy = -ry * 0.4 + i * (ry * 0.45);
    const largura = Math.round(rx * (0.28 + 0.1 * Math.sin(fase * 1.7)));
    bloco(ctx, x + dx - largura / 2, y + dy, largura, 1, COR.aguaClara);
  }

  const pads = [
    [-rx * 0.45, -ry * 0.1],
    [rx * 0.4, ry * 0.25],
    [rx * 0.05, -ry * 0.5],
  ];
  for (const [dx, dy] of pads) {
    circulo(ctx, x + dx, y + dy, 3, "#3f7a35");
    bloco(ctx, x + dx, y + dy - 3, 1, 3, COR.agua);
  }
  bloco(ctx, x + rx * 0.4 - 1, y + ry * 0.25 - 4, 2, 2, "#f2c1d8");
}

/* ------------------------------------------------------------------ */
/* Enfeites de chão                                                    */
/* ------------------------------------------------------------------ */

export function desenharArbusto(ctx, x, y, cor = "#417a37") {
  const escuro = escurecer(cor, 0.35);
  circulo(ctx, x, y, 6, escuro);
  circulo(ctx, x - 4, y + 1, 5, escuro);
  circulo(ctx, x + 4, y + 1, 5, escuro);
  circulo(ctx, x, y - 1, 5, cor);
  circulo(ctx, x - 4, y, 4, cor);
  circulo(ctx, x + 4, y, 4, cor);
  circulo(ctx, x - 2, y - 3, 2, clarear(cor, 0.25));
}

export function desenharFlores(ctx, x, y, cor) {
  const rand = rng(`${x},${y},flor`);
  for (let i = 0; i < 5; i += 1) {
    const fx = Math.round(x + (rand() - 0.5) * 14);
    const fy = Math.round(y + (rand() - 0.5) * 8);
    bloco(ctx, fx, fy + 1, 1, 2, COR.gramaSombra);
    bloco(ctx, fx, fy - 1, 2, 2, cor);
    bloco(ctx, fx, fy - 1, 1, 1, clarear(cor, 0.4));
  }
}

export function desenharPedra(ctx, x, y) {
  elipse(ctx, x, y, 6, 4, COR.pedraEscura);
  elipse(ctx, x, y - 1, 5, 3, COR.pedra);
  bloco(ctx, x - 2, y - 3, 3, 1, COR.pedraClara);
}

export function desenharCogumelo(ctx, x, y) {
  bloco(ctx, x, y - 2, 2, 3, "#e8e0cf");
  elipse(ctx, x + 1, y - 3, 3, 2, "#c4453f");
  bloco(ctx, x, y - 4, 1, 1, "#f0d0c4");
}

/*
  Cerca de madeira: mourões a cada dez pixels e duas travessas. Fecha o
  terreno — sem ela o gramado some na borda da tela e o jardim parece um
  recorte, não um lugar.
*/
export function desenharCerca(ctx, x0, x1, y) {
  bloco(ctx, x0, y - 5, x1 - x0, 2, COR.madeiraClara);
  bloco(ctx, x0, y - 1, x1 - x0, 2, COR.madeira);
  for (let x = x0; x < x1; x += 11) {
    bloco(ctx, x, y - 9, 3, 12, COR.madeiraEscura);
    bloco(ctx, x, y - 9, 1, 12, COR.madeira);
  }
}

// O canteiro embaixo da árvore do hábito: terra revirada, com a borda mais
// clara. É o que marca "isto aqui é plantado", sem precisar de caixote.
export function desenharCanteiro(ctx, x, y, raio) {
  elipse(ctx, x, y, raio + 1, raio * 0.42 + 1, COR.soloClaro);
  elipse(ctx, x, y, raio, raio * 0.42, COR.solo);
  const rand = rng(`${x},${y},solo`);
  for (let i = 0; i < 5; i += 1) {
    bloco(ctx, x + (rand() - 0.5) * raio * 1.6, y + (rand() - 0.5) * raio * 0.6, 1, 1, COR.soloClaro);
  }
}

export function desenharPlaca(ctx, x, y) {
  bloco(ctx, x - 1, y - 7, 2, 8, COR.madeiraEscura);
  bloco(ctx, x - 8, y - 14, 16, 8, COR.madeiraEscura);
  bloco(ctx, x - 7, y - 13, 14, 6, COR.madeira);
  bloco(ctx, x - 6, y - 12, 12, 1, COR.madeiraClara);
}

/* ------------------------------------------------------------------ */
/* Árvore                                                              */
/* ------------------------------------------------------------------ */

const ALTURA_TRONCO = [0, 7, 11, 16, 21, 23, 24];
const RAIO_COPA = [0, 5, 7, 10, 13, 14, 15];

/*
  A árvore do hábito. O estágio manda no porte, o vigor manda no estado:
  copa menor, cor lavada e um tom mais cinza quando a pessoa some. As duas
  coisas são independentes — uma árvore adulta com sede continua grande.

  A copa são bolhas sobrepostas: contorno escuro em volta de todas, massa
  por cima, luz no alto à esquerda e sombra embaixo à direita. Quatro
  camadas é o mínimo para uma copa não ler como adesivo.
*/
export function desenharArvore(ctx, x, chao, { stage, leaf, vigor = 1, t = 0, semente = "a" }) {
  const rand = rng(semente);
  const folha = misturar(leaf, "#8a8a6a", (1 - vigor) * 0.55);
  const folhaEscura = escurecer(folha, 0.18);
  const folhaClara = clarear(folha, 0.26);
  const contorno = escurecer(folha, 0.62);

  if (stage <= 0) {
    bloco(ctx, x - 1, chao - 4, 2, 4, COR.troncoClaro);
    bloco(ctx, x - 5, chao - 6, 4, 2, folha);
    bloco(ctx, x + 1, chao - 7, 4, 2, folha);
    bloco(ctx, x - 4, chao - 7, 2, 1, folhaClara);
    return;
  }

  const alturaTronco = ALTURA_TRONCO[stage] ?? 8;
  const raio = Math.round((RAIO_COPA[stage] ?? 6) * (0.72 + vigor * 0.28));
  const larguraTronco = stage >= 4 ? 5 : stage >= 2 ? 4 : 3;
  const topo = chao - alturaTronco;

  // Sombra projetada no chão: sem ela a árvore flutua.
  elipse(ctx, x + 2, chao - 1, raio * 0.8, raio * 0.3, "rgba(30, 50, 25, 0.28)");

  // Tronco com raiz alargada, aresta escura à direita e luz à esquerda.
  bloco(ctx, x - larguraTronco / 2 - 1, chao - 3, larguraTronco + 2, 3, COR.troncoEscuro);
  bloco(ctx, x - larguraTronco / 2, topo, larguraTronco, alturaTronco, COR.tronco);
  bloco(ctx, x - larguraTronco / 2, topo, 1, alturaTronco, COR.troncoClaro);
  bloco(ctx, x + larguraTronco / 2 - 1, topo, 1, alturaTronco, COR.troncoEscuro);
  if (stage >= 3) {
    bloco(ctx, x - larguraTronco / 2 - 2, topo + 4, 2, 1, COR.tronco);
    bloco(ctx, x + larguraTronco / 2, topo + 7, 2, 1, COR.tronco);
  }

  // O balanço é de um pixel só, e inteiro: meio pixel tremeria a copa.
  const balanco = Math.round(Math.sin(t * 0.9 + rand() * 6) * 1);
  const cy = topo - raio * 0.55;

  const bolhas = [
    [0, 0, 1],
    [-raio * 0.66, raio * 0.3, 0.68],
    [raio * 0.66, raio * 0.26, 0.64],
    [-raio * 0.36, -raio * 0.52, 0.62],
    [raio * 0.4, -raio * 0.48, 0.58],
    [0, -raio * 0.68, 0.5],
  ];

  for (const [dx, dy, escala] of bolhas) {
    circulo(ctx, x + dx + balanco, cy + dy, raio * escala + 1, contorno);
  }
  for (const [dx, dy, escala] of bolhas) {
    circulo(ctx, x + dx + balanco, cy + dy, raio * escala, folha);
  }
  circulo(ctx, x + raio * 0.52 + balanco, cy + raio * 0.5, raio * 0.42, folhaEscura);
  circulo(ctx, x - raio * 0.42 + balanco, cy - raio * 0.42, raio * 0.4, folhaClara);
  circulo(ctx, x - raio * 0.28 + balanco, cy - raio * 0.58, raio * 0.22, clarear(folha, 0.42));

  // Flor no estágio 5, fruto no 6 — os dois desbotam junto com o vigor.
  if (stage >= 5) {
    const fruto = stage >= 6;
    const corFruto = fruto ? "#e05a4a" : "#f5c6da";
    const quantos = fruto ? 6 : 5;
    for (let i = 0; i < quantos; i += 1) {
      const ang = rand() * Math.PI * 2;
      const dist = raio * (0.45 + rand() * 0.6);
      const fx = Math.round(x + Math.cos(ang) * dist + balanco);
      const fy = Math.round(cy + Math.sin(ang) * dist * 0.8);
      bloco(ctx, fx, fy, 2, 2, misturar(corFruto, "#8a8a6a", (1 - vigor) * 0.5));
      bloco(ctx, fx, fy, 1, 1, clarear(corFruto, 0.4));
    }
  }
}

/* ------------------------------------------------------------------ */
/* Construções                                                         */
/* ------------------------------------------------------------------ */

/*
  Morada: parede, telhado de duas águas com fileiras de telha, porta e
  janela. À noite a janela acende e a chaminé solta fumaça — é o detalhe
  que faz a casa parecer habitada em vez de um bloco.
*/
export function desenharCasa(ctx, x, chao, { cor = "#c9a26a", escala = 1, t = 0, noite = false }) {
  const l = Math.round(22 * escala);
  const h = Math.round(18 * escala);
  const esquerda = Math.round(x - l / 2);
  const topo = chao - h;

  elipse(ctx, x + 2, chao, l * 0.55, 3, "rgba(30, 50, 25, 0.28)");

  bloco(ctx, esquerda, topo, l, h, escurecer(cor, 0.45));
  bloco(ctx, esquerda + 1, topo + 1, l - 2, h - 1, cor);
  bloco(ctx, esquerda + 1, topo + 1, 2, h - 1, clarear(cor, 0.18));
  bloco(ctx, esquerda + l - 4, topo + 1, 3, h - 1, escurecer(cor, 0.2));

  // Telhado: da cumeeira para baixo, uma fileira por vez.
  const alturaTelhado = Math.round(9 * escala);
  for (let i = 0; i < alturaTelhado; i += 1) {
    const largura = Math.round((l + 6) * (i / alturaTelhado)) + 2;
    const tom = i % 3 === 0 ? COR.madeiraClara : COR.madeiraEscura;
    bloco(ctx, x - largura / 2, topo - alturaTelhado + i, largura, 1, tom);
  }
  bloco(ctx, x - (l + 8) / 2, topo - 1, l + 8, 2, COR.madeira);

  // Porta e janela.
  const portaL = Math.round(5 * escala);
  bloco(ctx, x - portaL / 2, chao - Math.round(9 * escala), portaL, Math.round(9 * escala), "#4a3423");
  bloco(ctx, x - portaL / 2, chao - Math.round(9 * escala), 1, Math.round(9 * escala), "#63482f");
  bloco(ctx, x + portaL / 2 - 2, chao - Math.round(5 * escala), 1, 1, COR.fogo);

  const janelaX = esquerda + 3;
  const janelaY = topo + 3;
  bloco(ctx, janelaX, janelaY, 5, 5, "#3a2c1d");
  bloco(ctx, janelaX + 1, janelaY + 1, 3, 3, noite ? COR.fogo : "#8fc7e8");

  // Chaminé e fumaça.
  const chamineX = esquerda + l - 6;
  bloco(ctx, chamineX, topo - alturaTelhado - 3, 4, 6, COR.pedraEscura);
  bloco(ctx, chamineX, topo - alturaTelhado - 3, 4, 1, COR.pedra);
  for (let i = 0; i < 3; i += 1) {
    const fase = (t * 0.5 + i * 0.6) % 3;
    const fy = topo - alturaTelhado - 5 - fase * 6;
    const raioFumaca = 1 + fase * 0.8;
    circulo(ctx, chamineX + 2 + Math.sin(fase * 2) * 2, fy, raioFumaca, "rgba(220, 220, 220, 0.34)");
  }
}

/* ------------------------------------------------------------------ */
/* Criaturas                                                           */
/* ------------------------------------------------------------------ */

/*
  O guardião no mundo. A arte detalhada dele (guardianArt.js) é vetorial e
  destoaria no meio da grade de pixels — aqui ele vira um bichinho de
  dezesseis pixels na cor dele, com orelha, olho e barriga clara. A arte
  cheia continua aparecendo nas fichas, onde ela cabe.
*/
export function desenharCriatura(ctx, x, chao, { cor, t = 0, dormindo = false, olhando = 1 }) {
  const escuro = escurecer(cor, 0.45);
  const claro = clarear(cor, 0.3);
  const pulo = dormindo ? 0 : Math.round(Math.abs(Math.sin(t * 2.4)) * 2);
  const y = chao - pulo;

  elipse(ctx, x, chao, 6, 2, "rgba(30, 50, 25, 0.3)");

  if (dormindo) {
    const respiro = Math.round(Math.sin(t * 1.1) * 0.5);
    elipse(ctx, x, y - 4 + respiro, 7, 4.5, escuro);
    elipse(ctx, x, y - 4 + respiro, 6, 3.5, cor);
    elipse(ctx, x - 4, y - 6 + respiro, 4, 3.5, escuro);
    elipse(ctx, x - 4, y - 6 + respiro, 3, 2.5, cor);
    bloco(ctx, x - 6, y - 9 + respiro, 2, 3, escuro);
    bloco(ctx, x - 5, y - 6 + respiro, 2, 1, escurecer(cor, 0.7));
    elipse(ctx, x + 2, y - 3 + respiro, 3, 2, claro);
    // Zs subindo, cada um numa fase diferente.
    for (let i = 0; i < 2; i += 1) {
      const fase = (t * 0.6 + i * 0.5) % 1;
      const zy = y - 11 - fase * 8;
      const tamanho = i === 0 ? 3 : 2;
      ctx.globalAlpha = 1 - fase;
      bloco(ctx, x + 4 + i * 2, zy, tamanho, 1, "#e8f0ff");
      bloco(ctx, x + 4 + i * 2, zy + tamanho - 1, tamanho, 1, "#e8f0ff");
      bloco(ctx, x + 4 + i * 2 + tamanho - 2, zy + 1, 1, 1, "#e8f0ff");
      ctx.globalAlpha = 1;
    }
    return;
  }

  // Corpo com contorno, orelhas e barriga.
  bloco(ctx, x - 4, y - 12, 2, 4, escuro);
  bloco(ctx, x + 2, y - 12, 2, 4, escuro);
  circulo(ctx, x, y - 6, 6, escuro);
  circulo(ctx, x, y - 6, 5, cor);
  elipse(ctx, x, y - 4, 3, 2.5, claro);
  bloco(ctx, x - 3, y - 8, 1, 1, "#20161c");
  bloco(ctx, x + 2, y - 8, 1, 1, "#20161c");
  bloco(ctx, x - 1 + olhando, y - 6, 2, 1, escuro);
  bloco(ctx, x - 6, y - 5, 2, 1, cor);
  bloco(ctx, x + 4, y - 5, 2, 1, cor);
}

/* ------------------------------------------------------------------ */
/* Atmosfera                                                           */
/* ------------------------------------------------------------------ */

/*
  A hora do dia de verdade entra na cena: amanhecer alaranjado, meio-dia
  limpo, entardecer quente, noite azul com vagalumes. É o que faz abrir o
  app às 22h parecer diferente de abrir às 9h.
*/
export function tomDoDia(hora) {
  if (hora < 5) return { cor: "#16244a", alfa: 0.52, noite: true };
  if (hora < 8) return { cor: "#f0a05a", alfa: 0.2, noite: false };
  if (hora < 17) return { cor: "#ffffff", alfa: 0, noite: false };
  if (hora < 20) return { cor: "#e8804a", alfa: 0.24, noite: false };
  return { cor: "#16244a", alfa: 0.46, noite: true };
}

export function aplicarTom(ctx, largura, altura, tom) {
  if (!tom.alfa) return;
  ctx.save();
  ctx.globalAlpha = tom.alfa;
  ctx.globalCompositeOperation = "source-atop";
  bloco(ctx, 0, 0, largura, altura, tom.cor);
  ctx.restore();
}

export function desenharVagalumes(ctx, largura, altura, t) {
  const rand = rng("vagalumes");
  for (let i = 0; i < 14; i += 1) {
    const baseX = rand() * largura;
    const baseY = rand() * altura;
    const fase = rand() * 6;
    const brilho = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + fase));
    const x = baseX + Math.sin(t * 0.5 + fase) * 8;
    const y = baseY + Math.cos(t * 0.4 + fase * 1.7) * 6;
    ctx.globalAlpha = brilho;
    bloco(ctx, x, y, 1, 1, "#f5f0a0");
    ctx.globalAlpha = brilho * 0.3;
    bloco(ctx, x - 1, y - 1, 3, 3, "#f5f0a0");
  }
  ctx.globalAlpha = 1;
}
