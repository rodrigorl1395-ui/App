/*
  Cenário do jardim — um vale tropical brasileiro em flat design vetorial.

  Este arquivo desenha só o FUNDO. Quem chama posiciona as plantas por cima
  usando PLOTS e um botão invisível sobre STREAM, então cada canteiro
  aparece aqui como terra arada e cada um tem ~180 unidades livres acima:
  é o corredor onde a planta cresce sem esbarrar em nada.

  Regras deste arquivo:
    · Formas chapadas. Um <linearGradient> só, no céu; nada de filtro nem
      sombra — volume vem de sobrepor 2-3 tons da mesma cor.
    · Nada de Math.random: tudo que é espalhado sai de um PRNG com semente
      fixa (mesmo gerador de world/sprites.js), senão o jardim mudaria de
      cara a cada abertura.
    · A composição é uma só; o tema troca apenas a tabela de cores.
*/

const NS = "http://www.w3.org/2000/svg";

export const VIEW = { w: 1000, h: 1900 };

/*
  Nove canteiros em três patamares. O y é o centro da base da planta.

  A zona segura é estreita de propósito: x entre 180 e 820 porque o "slice"
  corta as laterais em tela mais estreita que o viewBox, e y entre 420 e
  1700 porque a barra de chips cobre o topo e a navegação cobre o rodapé.
  Acima de cada canteiro sobram ~200 unidades livres — a planta tem 200 de
  altura e é ancorada pela base neste ponto.
*/
export const PLOTS = [
  { x: 250, y: 640 }, { x: 500, y: 622 }, { x: 750, y: 644 },
  { x: 230, y: 1190 }, { x: 500, y: 1172 }, { x: 770, y: 1186 },
  { x: 290, y: 1650 }, { x: 515, y: 1664 }, { x: 745, y: 1642 },
];

// Linha do meio do riacho: y depende só de x, então dá para saber onde a
// água está em qualquer ponto sem ter que consultar o desenho.
const leitoY = (x) => 848 + x * 0.05 + 68 * Math.sin(x / 150 + 0.5);
// Meia-largura. O remanso — trecho largo e parado, com nenúfares — é onde
// o jogador enche o regador, por isso ele é o único ponto que engorda.
const leitoW = (x) => 42 + 34 * Math.exp(-(((x - 400) / 140) ** 2));

export const STREAM = { x: 400, y: Math.round(leitoY(400)) };

/* ------------------------------------------------------------------ */
/* Cores                                                               */
/* ------------------------------------------------------------------ */

const PALETAS = {
  claro: {
    ceuTopo: "#5cbdf2", ceuBase: "#cdf0ff", astro: "#fff2ab", nuvem: "#ffffff",
    morroLonge: "#82b49c", morroPerto: "#5a9878",
    mataEscura: "#2c6b41", mataMedia: "#3d8c4f", mataClara: "#5aad5d",
    gramaFundo: "#479441", gramaMeio: "#5aa94c", gramaFrente: "#70c159",
    gramaClara: "#9bda77", gramaEscura: "#2f6f37",
    folhaEscura: "#357a3c", folha: "#4d9b45", folhaClara: "#84c962",
    trilha: "#e6c88f", trilhaBorda: "#c9a36c",
    terraFunda: "#5c3c23", terra: "#7d5432", terraClara: "#9a6b3e", sulco: "#54371f",
    margem: "#c8ab78", aguaFunda: "#2b96bf", agua: "#4dbcdc", aguaClara: "#a9e7f4", espuma: "#ffffff",
    pedraEscura: "#6d757d", pedra: "#98a1a9", pedraClara: "#c2c9ce",
    madeira: "#a9743f", madeiraClara: "#c99055",
    florA: "#ff5c46", florB: "#ffb43d", florC: "#e857a0", nenufar: "#4ea85a",
  },
  escuro: {
    ceuTopo: "#46295f", ceuBase: "#ff9a5c", astro: "#ffd591", nuvem: "#d9765f",
    morroLonge: "#6a4a72", morroPerto: "#443a63",
    mataEscura: "#123020", mataMedia: "#1c472c", mataClara: "#2b6440",
    gramaFundo: "#1e472f", gramaMeio: "#275637", gramaFrente: "#316741",
    gramaClara: "#4d8c50", gramaEscura: "#122f1f",
    folhaEscura: "#1d4429", folha: "#2c6238", folhaClara: "#488c4c",
    trilha: "#9a7850", trilhaBorda: "#6d5238",
    terraFunda: "#2e1d11", terra: "#4a3020", terraClara: "#5f3f28", sulco: "#241509",
    margem: "#8d6d4c", aguaFunda: "#2b4470", agua: "#456490", aguaClara: "#e8a473", espuma: "#ffdcb5",
    pedraEscura: "#443f52", pedra: "#655f74", pedraClara: "#8b8299",
    madeira: "#6e4b2c", madeiraClara: "#8d6339",
    florA: "#e8523f", florB: "#e09a34", florC: "#c44a8a", nenufar: "#2f6b3c",
  },
};

/* ------------------------------------------------------------------ */
/* Primitivas                                                          */
/* ------------------------------------------------------------------ */

function el(tag, attrs, pai) {
  const no = document.createElementNS(NS, tag);
  for (const chave in attrs) no.setAttribute(chave, attrs[chave]);
  if (pai) pai.appendChild(no);
  return no;
}

const cam = (pai) => el("g", null, pai);
const via = (d, fill, pai, extra) => el("path", { d, fill, ...extra }, pai);
const oval = (cx, cy, rx, ry, fill, pai, extra) => el("ellipse", { cx, cy, rx, ry, fill, ...extra }, pai);
const caixa = (x, y, w, h, fill, pai, extra) => el("rect", { x, y, width: w, height: h, fill, ...extra }, pai);
const linha = (d, cor, larg, pai, extra) =>
  via(d, "none", pai, { stroke: cor, "stroke-width": larg, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra });

// Gerador estável, o mesmo padrão de world/sprites.js.
function rng(semente) {
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

const n2 = (v) => Math.round(v * 10) / 10;

/*
  Polígono de uma faixa (riacho, trilha) a partir da linha do meio: cada
  ponto carrega a própria meia-largura e o contorno sai deslocado na
  perpendicular. Evita escrever "d" gigante na mão e deixa a largura variar.
*/
function faixa(pontos, extra = 0) {
  const esq = [];
  const dir = [];
  pontos.forEach((pt, i) => {
    const a = pontos[Math.max(0, i - 1)];
    const b = pontos[Math.min(pontos.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const norma = Math.hypot(dx, dy) || 1;
    const m = pt.w + extra;
    esq.push(`${n2(pt.x - (dy / norma) * m)} ${n2(pt.y + (dx / norma) * m)}`);
    dir.unshift(`${n2(pt.x + (dy / norma) * m)} ${n2(pt.y - (dx / norma) * m)}`);
  });
  return `M${esq.join("L")}L${dir.join("L")}Z`;
}

// Curva suave por uma polilinha: cada vértice vira controle de uma
// quadrática entre os pontos médios. É o jeito barato de tirar o "quebrado".
function suave(pontos) {
  let d = `M${pontos[0].x} ${pontos[0].y}`;
  for (let i = 1; i < pontos.length - 1; i += 1) {
    const mx = (pontos[i].x + pontos[i + 1].x) / 2;
    const my = (pontos[i].y + pontos[i + 1].y) / 2;
    d += `Q${pontos[i].x} ${pontos[i].y} ${n2(mx)} ${n2(my)}`;
  }
  const fim = pontos[pontos.length - 1];
  return `${d}L${fim.x} ${fim.y}`;
}

const pt = (x, y) => ({ x, y });

/* ------------------------------------------------------------------ */
/* Elementos repetidos                                                 */
/* ------------------------------------------------------------------ */

const morro = (pai, cx, base, w, h, cor) =>
  via(`M${cx - w} ${base}Q${n2(cx - w * 0.55)} ${n2(base - h)} ${cx} ${n2(base - h * 0.9)}Q${n2(cx + w * 0.6)} ${n2(base - h)} ${cx + w} ${base}Z`, cor, pai);

const lamina = (pai, x, y, dx, dy, larg, cor) =>
  via(`M${n2(x - larg)} ${n2(y)}L${n2(x + dx)} ${n2(y + dy)}L${n2(x + larg)} ${n2(y)}Z`, cor, pai);

function tufo(pai, x, y, s, c) {
  oval(n2(x), n2(y), n2(24 * s), n2(8 * s), c.folhaEscura, pai);
  [[-27, -30], [27, -32], [-13, -46], [14, -48], [0, -58]].forEach(([dx, dy], i) =>
    lamina(pai, x, y, dx * s, dy * s, 9 * s, i > 2 ? c.gramaClara : c.folhaEscura));
}

function moita(pai, x, y, s, c) {
  oval(n2(x), n2(y), n2(44 * s), n2(17 * s), c.mataEscura, pai);
  oval(n2(x - 18 * s), n2(y - 16 * s), n2(28 * s), n2(21 * s), c.folhaEscura, pai);
  oval(n2(x + 19 * s), n2(y - 12 * s), n2(25 * s), n2(19 * s), c.folhaEscura, pai);
  oval(n2(x - 2 * s), n2(y - 29 * s), n2(29 * s), n2(22 * s), c.folha, pai);
  oval(n2(x - 11 * s), n2(y - 37 * s), n2(14 * s), n2(10 * s), c.folhaClara, pai);
}

function folhaLonga(pai, x, y, ang, comp, c) {
  const gira = { transform: `rotate(${n2(ang)} ${n2(x)} ${n2(y)})` };
  oval(n2(x), n2(y), n2(comp), n2(comp * 0.34), c.folhaEscura, pai, gira);
  oval(n2(x), n2(y), n2(comp * 0.84), n2(comp * 0.24), c.folhaClara, pai, gira);
}

function pedra(pai, x, y, s, c) {
  oval(n2(x), n2(y), n2(23 * s), n2(12 * s), c.pedraEscura, pai);
  oval(n2(x), n2(y - 5 * s), n2(20 * s), n2(13 * s), c.pedra, pai);
  oval(n2(x - 6 * s), n2(y - 10 * s), n2(10 * s), n2(5 * s), c.pedraClara, pai);
}

// Helicônia: o ziguezague das brácteas é a leitura da flor; sem alternar
// os lados ela vira um graveto colorido.
function heliconia(pai, x, y, s, c) {
  folhaLonga(pai, x - 26 * s, y - 13 * s, -22, 34 * s, c);
  folhaLonga(pai, x + 27 * s, y - 15 * s, 24, 32 * s, c);
  linha(`M${n2(x)} ${n2(y - 4 * s)}q${n2(-5 * s)} ${n2(-22 * s)} ${n2(3 * s)} ${n2(-44 * s)}`, c.folhaEscura, n2(8 * s), pai);
  // Brácteas sobrepostas: é o encaixe entre elas que faz a "garra" da
  // helicônia; espaçadas demais viram bandeirinha.
  for (let i = 0; i < 5; i += 1) {
    const lado = i % 2 ? 1 : -1;
    const yy = y - 24 * s - i * 12 * s;
    via(`M${n2(x - lado * 4 * s)} ${n2(yy)}l${n2(lado * 38 * s)} ${n2(-7 * s)}l${n2(-lado * 32 * s)} ${n2(-19 * s)}z`, i % 2 ? c.florB : c.florA, pai);
  }
}

// Bromélia: roseta de folhas rígidas abrindo em leque, com o miolo aceso.
function bromelia(pai, x, y, s, c) {
  oval(n2(x), n2(y), n2(26 * s), n2(9 * s), c.folhaEscura, pai);
  for (let i = 0; i < 7; i += 1) {
    const ang = ((-152 + i * 21) * Math.PI) / 180;
    lamina(pai, x, y - 4 * s, Math.cos(ang) * 42 * s, Math.sin(ang) * 42 * s, 10 * s, i % 2 ? c.folhaClara : c.folhaEscura);
  }
  oval(n2(x), n2(y - 18 * s), n2(13 * s), n2(15 * s), c.florC, pai);
  oval(n2(x), n2(y - 30 * s), n2(7 * s), n2(8 * s), c.florB, pai);
}

const FLORA = { moita, tufo, pedra, heliconia, bromelia };

/* ------------------------------------------------------------------ */
/* Camadas da cena                                                     */
/* ------------------------------------------------------------------ */

let sequencia = 0;

function ceu(pai, c) {
  const id = `pgCeu${(sequencia += 1)}`;
  const defs = el("defs", null, pai);
  const grad = el("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0", "stop-color": c.ceuTopo }, grad);
  el("stop", { offset: "1", "stop-color": c.ceuBase }, grad);
  caixa(0, 0, 1000, 450, `url(#${id})`, pai);

  oval(718, 196, 96, 96, c.astro, pai, { opacity: 0.28 });
  oval(718, 196, 62, 62, c.astro, pai);

  // Nuvens: três elipses achatadas por nuvem. No tema escuro a mesma forma
  // com cor quente lê como faixa de céu de fim de tarde.
  const r = rng("nuvens");
  [[210, 112, 1.15], [560, 86, 0.85], [820, 148, 1], [330, 210, 0.7]].forEach(([x, y, s]) => {
    const g = cam(pai);
    for (let i = 0; i < 3; i += 1) {
      const dx = (i - 1) * 42 * s + (r() - 0.5) * 20;
      oval(n2(x + dx), n2(y + (r() - 0.5) * 8), n2((46 - Math.abs(i - 1) * 12) * s), n2((13 - Math.abs(i - 1) * 3) * s), c.nuvem, g, { opacity: 0.85 });
    }
  });
}

function fundoDoVale(pai, c) {
  [[120, 344, 250, 170], [430, 344, 285, 210], [760, 344, 262, 178], [995, 344, 210, 142]]
    .forEach(([x, b, w, h]) => morro(pai, x, b, w, h, c.morroLonge));
  [[30, 380, 222, 126], [325, 380, 252, 150], [665, 380, 272, 136], [965, 380, 198, 106]]
    .forEach(([x, b, w, h]) => morro(pai, x, b, w, h, c.morroPerto));

  // Mata fechada: três fileiras de copas, cada uma um verde mais claro que
  // a de trás. O recorte irregular das copas é o que dá o ar de mata.
  const r = rng("mata");
  [[344, 46, 32, 50, c.mataEscura], [374, 40, 28, 43, c.mataMedia], [400, 32, 24, 35, c.mataClara]]
    .forEach(([base, passo, alturaFaixa, raio, cor]) => {
      caixa(0, base, 1000, alturaFaixa + 6, cor, pai);
      for (let x = -20; x < 1030; x += passo) {
        const rr = raio * (0.62 + r() * 0.5);
        oval(n2(x + (r() - 0.5) * 12), n2(base + 4 - rr * 0.22), n2(rr * 0.92), n2(rr), cor, pai);
      }
    });

  // Pé da mata: a barra de copas termina numa reta; esta fileira de moitas
  // escuras quebra ela e emenda a mata no gramado.
  for (let x = -10; x < 1020; x += 54) {
    const s = 0.5 + r() * 0.4;
    oval(n2(x), n2(424 + r() * 10), n2(46 * s), n2(18 * s), c.mataEscura, pai);
  }
}

const LIPS = {
  meio: [pt(0, 1024), pt(200, 986), pt(420, 1004), pt(650, 1028), pt(850, 998), pt(1000, 1012)],
  frente: [pt(0, 1400), pt(220, 1356), pt(460, 1382), pt(700, 1404), pt(880, 1372), pt(1000, 1386)],
};

function terreno(pai, c) {
  caixa(0, 418, 1000, 1482, c.gramaFundo, pai);
  const r = rng("patamares");
  [[LIPS.meio, c.gramaMeio], [LIPS.frente, c.gramaFrente]].forEach(([pontos, cor]) => {
    const topo = suave(pontos);
    via(`${topo}L1000 1900L0 1900Z`, cor, pai);
    linha(topo, c.gramaEscura, 16, pai);
    // Fio claro logo abaixo da quina: é a luz batendo no topo do degrau.
    linha(suave(pontos.map((p) => pt(p.x, p.y + 11))), c.gramaClara, 5, pai, { opacity: 0.5 });
    // Tufos na quina do patamar: é a borda de capim que denuncia o degrau.
    for (let i = 0; i < pontos.length - 1; i += 1) {
      for (let k = 0; k < 4; k += 1) {
        const t = (k + r() * 0.7) / 4;
        const x = pontos[i].x + (pontos[i + 1].x - pontos[i].x) * t;
        const y = pontos[i].y + (pontos[i + 1].y - pontos[i].y) * t;
        tufo(pai, x, y + 4, 0.3 + r() * 0.22, c);
      }
    }
  });
}

/*
  Manchas de capim: elipses chapadas mais claras e mais escuras espalhadas
  pelo gramado. Sem elas o terreno é um retângulo verde — é a sujeira grande
  que dá relevo antes de qualquer detalhe pequeno entrar.
*/
function manchas(pai, c) {
  const r = rng("manchas");
  for (let i = 0; i < 42; i += 1) {
    const x = -40 + r() * 1080;
    const y = 424 + r() * 1440;
    const claro = r() > 0.45;
    oval(n2(x), n2(y), n2(60 + r() * 110), n2(20 + r() * 30), claro ? c.gramaClara : c.gramaEscura, pai, { opacity: claro ? 0.22 : 0.18 });
  }
}

function riacho(pai, c) {
  const pontos = [];
  for (let x = -70; x <= 1070; x += 38) pontos.push({ x, y: n2(leitoY(x)), w: n2(leitoW(x)) });

  via(faixa(pontos, 17), c.margem, pai);
  via(faixa(pontos), c.aguaFunda, pai);
  via(faixa(pontos.map((p) => ({ ...p, y: p.y - 5, w: p.w * 0.82 })), 0), c.agua, pai);

  // Reflexo: lentes achatadas ao longo do leito. No escuro elas são o céu
  // alaranjado batendo na água.
  const r = rng("reflexo");
  for (let i = 0; i < 30; i += 1) {
    const x = -40 + r() * 1080;
    const w = leitoW(x);
    oval(n2(x), n2(leitoY(x) + (r() - 0.5) * w * 1.1), n2(10 + r() * 22), n2(3 + r() * 2), c.aguaClara, pai, { opacity: 0.75 });
  }

  // Duas quedinhas: a água desce um degrau e espuma.
  [512, 872].forEach((x) => {
    const y = leitoY(x);
    const w = leitoW(x);
    linha(`M${n2(x - w)} ${n2(y - 16)}q${n2(w)} ${16} ${n2(w * 2)} 0`, c.pedraEscura, 8, pai, { opacity: 0.5 });
    for (let i = 0; i < 3; i += 1) linha(`M${n2(x - w * 0.96)} ${n2(y - 6 + i * 8)}q${n2(w)} ${14} ${n2(w * 1.92)} 0`, c.espuma, 5 - i, pai, { opacity: 0.85 - i * 0.2 });
    for (let i = 0; i < 4; i += 1) oval(n2(x - w * 0.6 + i * w * 0.4), n2(y + 16 + (i % 2) * 8), n2(10 - i * 1.5), 3.5, c.espuma, pai, { opacity: 0.7 });
  });

  // Pedras arredondadas dentro e na margem da água.
  const rp = rng("pedras-riacho");
  for (let i = 0; i < 18; i += 1) {
    const x = -20 + rp() * 1040;
    const w = leitoW(x);
    const y = leitoY(x) + (rp() - 0.5) * w * 1.9;
    const s = 0.45 + rp() * 0.55;
    oval(n2(x), n2(y + 7 * s), n2(28 * s), n2(9 * s), c.espuma, pai, { opacity: 0.45 });
    pedra(pai, x, y, s, c);
  }

  // Nenúfares só no remanso — água parada é o único lugar onde eles param.
  const rn = rng("nenufares");
  for (let i = 0; i < 6; i += 1) {
    const x = 302 + rn() * 198;
    const y = leitoY(x) + (rn() - 0.5) * 48;
    const s = 0.7 + rn() * 0.5;
    oval(n2(x), n2(y), n2(24 * s), n2(15 * s), c.nenufar, pai);
    via(`M${n2(x)} ${n2(y)}l${n2(20 * s)} ${n2(-9 * s)}l0 ${n2(15 * s)}z`, c.agua, pai);
    if (i % 2) oval(n2(x - 6 * s), n2(y - 9 * s), n2(6 * s), n2(5 * s), c.florC, pai);
  }
}

// Trilha de terra clara: um traçado principal do pé do jardim até a ponte,
// um desvio até o remanso (onde se enche o regador) e um ramal no patamar
// de cima. Junta os nove canteiros sem passar por cima de nenhum.
const TRILHAS = [
  // Principal: sobe do pé do jardim pela esquerda, contorna a fileira da
  // frente, corta o patamar do meio e sai na ponte, rumo à mata.
  [pt(620, 1900), pt(598, 1856), pt(505, 1848), pt(400, 1832), pt(300, 1802), pt(214, 1748), pt(162, 1680),
    pt(146, 1598), pt(152, 1518), pt(168, 1466), pt(240, 1400), pt(380, 1388), pt(520, 1392), pt(660, 1384),
    pt(782, 1392), pt(872, 1362), pt(898, 1300), pt(886, 1254), pt(838, 1240), pt(742, 1250), pt(648, 1246),
    pt(634, 1176), pt(638, 1104), pt(644, 1034), pt(646, 958), pt(640, 900), pt(632, 830),
    pt(640, 770), pt(656, 734), pt(660, 690), pt(636, 614), pt(622, 540), pt(616, 466)],
  // Desvio até o remanso: é ali que se enche o regador.
  [pt(646, 952), pt(566, 952), pt(492, 942), pt(440, 930)],
  // Ramal do patamar do meio, passando pelos canteiros da esquerda.
  [pt(648, 1246), pt(506, 1258), pt(364, 1252), pt(252, 1242), pt(188, 1226)],
  // Ramal do patamar de cima, entre os canteiros e a barranca do riacho.
  [pt(682, 700), pt(560, 716), pt(430, 720), pt(320, 712), pt(228, 700)],
];

function trilha(pai, c) {
  TRILHAS.forEach((pontos, i) => {
    const largura = i ? 17 : 26;
    const comLargura = pontos.map((p, k) => ({ ...p, w: largura * (i && k === pontos.length - 1 ? 0.7 : 1) }));
    via(faixa(comLargura, 6), c.trilhaBorda, pai);
    via(faixa(comLargura), c.trilha, pai);
  });
}

function ponte(pai, c) {
  const g = cam(pai);
  const cx = 640;
  const y = leitoY(cx);
  const base = y + 50;
  caixa(cx - 100, y - 8, 200, 58, c.pedra, g, { rx: 6 });
  // Fiadas de pedra na face: sem elas a ponte é um bloco cinza.
  for (let i = 0; i < 3; i += 1) {
    linha(`M${cx - 94} ${n2(y + 2 + i * 15)}h188`, c.pedraEscura, 2.5, g, { opacity: 0.4 });
    for (let k = -2; k <= 2; k += 1) linha(`M${cx + k * 38 + (i % 2) * 19} ${n2(y + 2 + i * 15)}v15`, c.pedraEscura, 2.5, g, { opacity: 0.3 });
  }
  // O vão em arco é recortado por cima da face: é ele que mostra a água
  // passando e faz a ponte parecer ponte, e não uma tábua.
  via(`M${cx - 50} ${n2(base)}a50 52 0 0 1 100 0z`, c.pedraEscura, g);
  via(`M${cx - 42} ${n2(base)}a42 44 0 0 1 84 0z`, c.aguaFunda, g);
  oval(cx, n2(base - 4), 34, 9, c.agua, g);
  caixa(cx - 108, y - 30, 216, 24, c.pedraClara, g, { rx: 9 });
  caixa(cx - 108, y - 46, 216, 18, c.pedra, g, { rx: 8 });
  [-86, -29, 29, 86].forEach((dx) => caixa(cx + dx - 16, y - 46, 32, 18, c.pedraClara, g, { rx: 6, opacity: 0.55 }));
  [-70, 0, 70].forEach((dx) => linha(`M${cx + dx} ${y - 28}v22`, c.pedraEscura, 2.5, g, { opacity: 0.25 }));
}

function cerca(pai, x0, x1, y, c) {
  const g = cam(pai);
  for (let x = x0; x <= x1; x += 48) {
    caixa(x - 5, y - 32, 10, 46, c.madeira, g, { rx: 3 });
    caixa(x - 5, y - 32, 10, 9, c.madeiraClara, g, { rx: 3 });
  }
  [[-24, c.madeiraClara], [-8, c.madeira]].forEach(([dy, cor]) => caixa(x0 - 8, y + dy, x1 - x0 + 16, 8, cor, g, { rx: 4 }));
}

function canteiro(pai, { x, y }, c) {
  const g = cam(pai);
  oval(x, y + 8, 106, 42, c.gramaEscura, g);
  oval(x, y + 4, 100, 38, c.terraFunda, g);
  oval(x, y - 1, 94, 33, c.terra, g);
  oval(x, y - 6, 80, 25, c.terraClara, g);
  // Sulcos do arado: arcos paralelos. Anéis concêntricos viravam alvo.
  for (let i = 0; i < 4; i += 1) {
    const yy = y - 16 + i * 11;
    linha(`M${x - 72 + i * 4} ${yy}q${n2(72 - i * 4)} ${9 + i * 2} ${n2(144 - i * 8)} 0`, c.sulco, 4, g, { opacity: 0.62 });
  }
  const r = rng(`torroes${x}`);
  for (let i = 0; i < 4; i += 1) oval(n2(x - 70 + r() * 140), n2(y - 12 + r() * 26), n2(4 + r() * 4), n2(3 + r() * 2), c.terraFunda, g, { opacity: 0.6 });
}

const CERCA = { x0: 180, x1: 424, y: 754 };

// Distância de um ponto a um segmento — só serve para manter o mato longe
// da trilha sem ter que listar à mão onde a trilha passa.
function distSeg(x, y, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
}

/*
  Onde o mato pode nascer. Em vez de listar cantinhos, o terreno inteiro é
  candidato e estas quatro regras recortam o que é proibido — a principal
  delas é o corredor de ~190 unidades acima de cada canteiro, que pertence
  à planta.
*/
function livre(x, y) {
  if (Math.abs(y - leitoY(x)) < leitoW(x) + 34) return false;
  if (PLOTS.some((p) => Math.abs(p.x - x) < 152 && y > p.y - 212 && y < p.y + 76)) return false;
  if (x > CERCA.x0 - 40 && x < CERCA.x1 + 40 && y > CERCA.y - 52 && y < CERCA.y + 26) return false;
  return TRILHAS.every((t) => t.every((_, i) => i === 0 || distSeg(x, y, t[i - 1], t[i]) > 58));
}

function flora(pai, c) {
  const r = rng("flora");
  const postos = [];
  for (let i = 0; i < 560 && postos.length < 98; i += 1) {
    const x = 18 + r() * 964;
    const y = 424 + r() * 1452;
    const sorte = r();
    if (!livre(x, y) || postos.some((p) => Math.hypot(p.x - x, p.y - y) < 72)) continue;
    postos.push({ x, y, sorte, s: 0.72 + r() * 0.42 });
  }
  // Pintar de trás para a frente: o que está mais embaixo cobre o de cima.
  postos.sort((a, b) => a.y - b.y).forEach(({ x, y, sorte, s }) => {
    const tipo = sorte < 0.34 ? "moita" : sorte < 0.54 ? "tufo" : sorte < 0.68 ? "pedra" : sorte < 0.86 ? "heliconia" : "bromelia";
    // Perto da frente tudo cresce: é a única pista de profundidade num
    // desenho sem perspectiva de verdade.
    FLORA[tipo](pai, x, y, s * (0.8 + (y / 1900) * 0.5), c);
  });
}

/* ------------------------------------------------------------------ */

export function createGardenScene({ theme = "escuro" } = {}) {
  const c = PALETAS[theme] || PALETAS.escuro;
  const svg = el("svg", {
    xmlns: NS,
    viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
    preserveAspectRatio: "xMidYMid slice",
    class: "garden-scene",
    "aria-hidden": "true",
  });

  ceu(svg, c);
  fundoDoVale(svg, c);
  terreno(svg, c);
  manchas(svg, c);
  trilha(svg, c);   // antes da água: onde a trilha chega ao riacho, a água manda
  riacho(svg, c);
  ponte(svg, c);
  flora(svg, c);
  cerca(svg, CERCA.x0, CERCA.x1, CERCA.y, c);
  PLOTS.forEach((p) => canteiro(svg, p, c));

  return svg;
}
