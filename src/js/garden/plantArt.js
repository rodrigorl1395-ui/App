// Arte das plantas do jardim: nove espécies brasileiras, sete estágios cada.
//
// Tudo é vetor chapado — sem gradiente, sem sombra, sem asset externo. O
// volume vem de formas sólidas sobrepostas em dois ou três tons, porque a
// planta aparece a 60px de altura e qualquer degradê vira borrão nesse
// tamanho. O chão é a base do viewBox (y=130): a planta nasce dali.

const SVG_NS = "http://www.w3.org/2000/svg";
const SECO = [201, 180, 133]; // bege da folha com sede, alvo da mistura

/*
  vigor é estado de módulo, lido por el() na hora de pintar. É de propósito:
  cada espécie desenha com a sua cor real e nenhuma forma escapa da seca por
  esquecimento. O desenho é síncrono, então não há dois vigores no ar.
*/
let vigorAtual = 1;

const f = (v) => String(Math.round(v * 10) / 10);
const grau = (rad) => (rad * 180) / Math.PI;

// Mistura a cor em direção ao bege seco. Só hex entra; "none" e rgb() passam.
function secar(cor) {
  if (vigorAtual > 0.98 || cor[0] !== "#") return cor;
  const limpo = cor.slice(1);
  const cheio = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo;
  const num = parseInt(cheio, 16);
  const t = (1 - vigorAtual) * 0.62;
  const canal = (desloc, alvo) => Math.round((((num >> desloc) & 255) * (1 - t)) + alvo * t);
  return `rgb(${canal(16, SECO[0])}, ${canal(8, SECO[1])}, ${canal(0, SECO[2])})`;
}

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [chave, valor] of Object.entries(attrs)) {
    const bruto = typeof valor === "number" ? f(valor) : String(valor);
    node.setAttribute(chave, chave === "fill" || chave === "stroke" ? secar(bruto) : bruto);
  }
  return node;
}

function poe(pai, tag, attrs) {
  const node = el(tag, attrs);
  pai.appendChild(node);
  return node;
}

/* --- peças reaproveitadas entre as espécies ------------------------------ */

/*
  Folha lanceolada apontando para `ang` (graus, 0 = direita). `curva` faz a
  ponta pender: o sinal acompanha o lado para onde a folha aponta, senão as
  folhas da esquerda arqueariam para cima depois da rotação.
*/
function folha(pai, { x, y, comp, larg, ang, cor, curva = 0 }) {
  const c = curva * (Math.cos((ang * Math.PI) / 180) < 0 ? -1 : 1);
  return poe(pai, "path", {
    d: `M0 0 Q${f(comp * 0.45)} ${f(-larg)} ${f(comp)} ${f(c)} Q${f(comp * 0.45)} ${f(larg + c * 0.5)} 0 0 Z`,
    fill: cor,
    transform: `translate(${f(x)} ${f(y)}) rotate(${f(ang)})`,
  });
}

// Tronco que sai do chão e afina no topo. `arco` empurra o topo para o lado;
// a curva se concentra no alto para o pé continuar firme na terra.
function tronco(pai, { alt, larg, arco = 0, cor, sombra }) {
  const topoY = 130 - alt;
  const topoX = 50 + arco;
  const base = larg / 2;
  const meia = larg * 0.33;
  const cx = 50 + arco * 0.28;
  const cy = 130 - alt * 0.5;
  poe(pai, "path", {
    d: `M${f(50 - base)} 130 Q${f(cx - base * 0.65)} ${f(cy)} ${f(topoX - meia)} ${f(topoY)} L${f(topoX + meia)} ${f(topoY)} Q${f(cx + base * 0.65)} ${f(cy)} ${f(50 + base)} 130 Z`,
    fill: cor,
  });
  poe(pai, "path", {
    d: `M${f(50 + base * 0.25)} 130 Q${f(cx + base * 0.05)} ${f(cy)} ${f(topoX)} ${f(topoY)} L${f(topoX + meia)} ${f(topoY)} Q${f(cx + base * 0.65)} ${f(cy)} ${f(50 + base)} 130 Z`,
    fill: sombra,
  });
  return { x: topoX, y: topoY };
}

function ramo(pai, d, larg, cor) {
  poe(pai, "path", { d, fill: "none", stroke: cor, "stroke-width": larg, "stroke-linecap": "round" });
}

// Seis bolhas sobrepostas: com três a copa lê como trevo. A mancha clara em
// cima à esquerda é a luz batendo — é ela que tira a copa do "adesivo".
const MASSA = [
  [0, 0.12, 1], [-0.62, 0.26, 0.66], [0.62, 0.22, 0.64],
  [-0.36, -0.42, 0.62], [0.38, -0.4, 0.58], [0, -0.62, 0.54],
];

function copaRedonda(pai, { cx, cy, r, cores, achat = 1 }) {
  const [clara, media, escura] = cores;
  for (const [dx, dy, e] of MASSA) {
    poe(pai, "ellipse", {
      cx: cx + dx * r, cy: cy + dy * r * achat,
      rx: r * e, ry: r * e * achat,
      fill: dy > 0.15 ? escura : media,
    });
  }
  poe(pai, "ellipse", {
    cx: cx - r * 0.32, cy: cy - r * 0.36 * achat,
    rx: r * 0.54, ry: r * 0.46 * achat, fill: clara,
  });
}

function fruto(pai, { x, y, r, cor, brilho, alonga = 1, talo }) {
  if (talo) {
    poe(pai, "path", {
      d: `M${f(x)} ${f(y - r * alonga)} L${f(x - 0.6)} ${f(y - r * alonga - 3.4)}`,
      fill: "none", stroke: talo, "stroke-width": 1.3, "stroke-linecap": "round",
    });
  }
  poe(pai, "ellipse", { cx: x, cy: y, rx: r, ry: r * alonga, fill: cor });
  if (brilho) {
    poe(pai, "ellipse", {
      cx: x - r * 0.32, cy: y - r * alonga * 0.34,
      rx: r * 0.3, ry: r * 0.24 * alonga, fill: brilho,
    });
  }
}

function flor(pai, { x, y, r, petala, miolo, petalas = 5 }) {
  for (let i = 0; i < petalas; i++) {
    const a = (i / petalas) * Math.PI * 2;
    poe(pai, "circle", { cx: x + Math.cos(a) * r * 0.76, cy: y + Math.sin(a) * r * 0.76, r: r * 0.6, fill: petala });
  }
  poe(pai, "circle", { cx: x, cy: y, r: r * 0.46, fill: miolo });
}

/* --- estágios 0 a 2: iguais para todas, só muda a cor da folha ----------- */

function terra(pai) {
  poe(pai, "ellipse", { cx: 50, cy: 126, rx: 31, ry: 6.5, fill: "#5D4037" });
  poe(pai, "ellipse", { cx: 50, cy: 123, rx: 24, ry: 5.6, fill: "#795548" });
  poe(pai, "ellipse", { cx: 43, cy: 121, rx: 10, ry: 2.8, fill: "#8D6E63" });
}

function brotoComum(pai, etapa, cores) {
  const [clara, media, escura] = cores;
  if (etapa === 0) {
    poe(pai, "ellipse", { cx: 50, cy: 119.5, rx: 6.5, ry: 4.2, fill: "#4E342E" });
    poe(pai, "ellipse", { cx: 50, cy: 118, rx: 3.6, ry: 3, fill: "#A1887F", transform: "rotate(-18 50 118)" });
    poe(pai, "ellipse", { cx: 48.8, cy: 117, rx: 1.3, ry: 1, fill: "#D7CCC8" });
    return;
  }
  const alt = etapa === 1 ? 13 : 30;
  poe(pai, "path", {
    d: `M48.2 121 L49.2 ${f(121 - alt)} L50.8 ${f(121 - alt)} L51.8 121 Z`,
    fill: escura,
  });
  const topo = 121 - alt;
  if (etapa === 1) {
    // Cotilédones: duas folhas gordas e opostas, o par que rompe a terra.
    folha(pai, { x: 50, y: topo + 1, comp: 12, larg: 5.2, ang: -155, cor: media });
    folha(pai, { x: 50, y: topo + 1, comp: 12, larg: 5.2, ang: -25, cor: clara });
    return;
  }
  // Muda: o par de baixo já é folha de verdade, menor e mais escura.
  folha(pai, { x: 50, y: topo + 12, comp: 13, larg: 4.4, ang: 168, cor: escura, curva: 3 });
  folha(pai, { x: 50, y: topo + 14, comp: 13, larg: 4.4, ang: 12, cor: media, curva: 3 });
  folha(pai, { x: 50, y: topo + 1, comp: 15, larg: 5, ang: -158, cor: media, curva: 2 });
  folha(pai, { x: 50, y: topo + 2, comp: 15, larg: 5, ang: -22, cor: clara, curva: 2 });
}

/* --- as nove espécies ---------------------------------------------------- */

const ESPECIES = {
  coqueiro: {
    folha: ["#9CCC65", "#43A047", "#2E7D32"],
    casca: ["#A1887F", "#6D4C41"],
    desenhar(g, etapa, ctx) {
      const [clara, media, escura] = this.folha;
      const alt = 78 * ctx.porte;
      const topo = tronco(g, { alt, larg: 11 * ctx.porte, arco: -10, cor: this.casca[0], sombra: this.casca[1] });
      // Anéis do estipe: é por eles que o coqueiro se reconhece antes da copa.
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        poe(g, "ellipse", { cx: 50 + (topo.x - 50) * t * t, cy: 130 - alt * t, rx: 5 - t * 1.6, ry: 1.2, fill: this.casca[1] });
      }
      const copa = ctx.copa(g, topo.y);
      for (const ang of [-170, -138, -106, -74, -42, -10, 26, 154]) {
        const comp = (ang > 0 ? 26 : 32) * ctx.porte;
        folha(copa, {
          x: topo.x, y: topo.y + 1, comp, larg: comp * 0.28, ang,
          cor: Math.abs(ang) > 120 ? escura : ang > -60 ? clara : media,
          curva: comp * 0.4 + ctx.queda * 0.6,
        });
      }
      if (ctx.florindo) {
        // Inflorescência: cacho creme pendurado onde a fronde nasce.
        for (let i = 0; i < 7; i++) {
          poe(copa, "circle", { cx: topo.x + 5 + i * 1.6, cy: topo.y + 4 + i * 1.8, r: 1.8, fill: "#FFF8E1" });
        }
      }
      if (ctx.frutificando) {
        for (const [dx, dy] of [[-6, 6], [0, 8], [6, 5], [-1, 2]]) {
          fruto(copa, { x: topo.x + dx, y: topo.y + dy, r: 5, cor: "#795548", brilho: "#A1887F", alonga: 1.1 });
        }
      }
    },
  },

  mangueira: {
    folha: ["#66BB6A", "#2E7D32", "#1B5E20"],
    casca: ["#8D6E63", "#5D4037"],
    desenhar(g, etapa, ctx) {
      const alt = 52 * ctx.porte;
      const topo = tronco(g, { alt, larg: 16 * ctx.porte, cor: this.casca[0], sombra: this.casca[1] });
      for (const lado of [-1, 1]) {
        ramo(g, `M50 ${f(topo.y + 8)} Q${f(50 + lado * 12)} ${f(topo.y + 2)} ${f(50 + lado * 18)} ${f(topo.y - 10)}`, 5 * ctx.porte, this.casca[1]);
      }
      const r = 34 * ctx.porte;
      const cy = topo.y - r * 0.5;
      const copa = ctx.copa(g, topo.y);
      copaRedonda(copa, { cx: 50, cy, r, cores: this.folha, achat: 0.94 });
      if (ctx.florindo) {
        for (const [dx, dy] of [[-0.6, -0.3], [0.1, -0.7], [0.65, -0.1], [-0.3, 0.4], [0.4, 0.45]]) {
          flor(copa, { x: 50 + dx * r, y: cy + dy * r, r: 4, petala: "#FFF9C4", miolo: "#FDD835" });
        }
      }
      if (ctx.frutificando) {
        // Mangas penduradas na borda de baixo da copa, onde o olho as acha.
        for (const [dx, dy] of [[-0.66, 0.42], [-0.2, 0.7], [0.32, 0.64], [0.72, 0.3], [0.05, 0.28]]) {
          fruto(copa, {
            x: 50 + dx * r, y: cy + dy * r, r: 6.2, alonga: 1.25,
            cor: "#FFB300", brilho: "#FFEB3B", talo: "#33691E",
          });
          poe(copa, "ellipse", { cx: 50 + dx * r + 2.4, cy: cy + dy * r + 1.4, rx: 3, ry: 4.4, fill: "#FB8C00" });
        }
      }
    },
  },

  jabuticabeira: {
    folha: ["#81C784", "#388E3C", "#1B5E20"],
    casca: ["#D7CCC8", "#A1887F"],
    desenhar(g, etapa, ctx) {
      const alt = 50 * ctx.porte;
      const topo = tronco(g, { alt, larg: 18 * ctx.porte, cor: this.casca[0], sombra: this.casca[1] });
      for (const lado of [-1, 1]) {
        ramo(g, `M50 ${f(topo.y + 6)} Q${f(50 + lado * 10)} ${f(topo.y)} ${f(50 + lado * 16)} ${f(topo.y - 8)}`, 4.5 * ctx.porte, this.casca[1]);
      }
      const r = 27 * ctx.porte;
      const copa = ctx.copa(g, topo.y);
      copaRedonda(copa, { cx: 50, cy: topo.y - r * 0.45, r, cores: this.folha, achat: 1.02 });
      // A marca da jabuticabeira: flor e fruto nascem colados no tronco, não
      // nos galhos. Por isso ficam fora do grupo da copa, presos à casca.
      const pontos = [];
      for (let i = 0; i < 10; i++) {
        const t = 0.1 + (i % 5) * 0.19;
        pontos.push([50 + (i % 2 ? 5.4 : -5.6) + ((i % 3) - 1) * 1.6, 130 - alt * t * 0.92]);
      }
      if (ctx.florindo) {
        for (const [x, y] of pontos) {
          poe(g, "circle", { cx: x, cy: y, r: 2.6, fill: "#FFFFFF" });
          poe(g, "circle", { cx: x, cy: y, r: 1.1, fill: "#FFF176" });
        }
      }
      if (ctx.frutificando) {
        for (const [x, y] of pontos) {
          fruto(g, { x, y, r: 3.8, cor: "#311B3D", brilho: "#B39DDB" });
        }
      }
    },
  },

  bambuzal: {
    folha: ["#AED581", "#7CB342", "#33691E"],
    casca: ["#9CCC65", "#558B2F"],
    desenhar(g, etapa, ctx) {
      // Touceira: colmos de alturas diferentes, senão lê como cerca.
      const colmos = [[36, 74, 5], [44, 96, 6], [52, 108, 6.5], [60, 88, 5.5], [67, 62, 4.5]];
      const usados = ctx.porte < 1 ? colmos.slice(1, 4) : colmos;
      const copa = ctx.copa(g, 118);
      for (const [x, altura, larg] of usados) {
        const alt = altura * ctx.porte;
        const topoY = 130 - alt;
        poe(g, "rect", { x: x - larg / 2, y: topoY, width: larg, height: alt, fill: this.casca[0], rx: larg * 0.4 });
        poe(g, "rect", { x: x + larg * 0.12, y: topoY, width: larg * 0.38, height: alt, fill: this.casca[1] });
        // Nós: o traço horizontal a cada gomo é o que faz ler "bambu".
        for (let y = topoY + 10; y < 126; y += 13) {
          poe(g, "rect", { x: x - larg * 0.68, y, width: larg * 1.36, height: 2.2, fill: "#33691E", rx: 1 });
        }
        for (const [dy, ang] of [[6, -150], [10, -30], [20, -162], [26, -18], [38, -145]]) {
          if (topoY + dy > 112) continue;
          folha(copa, {
            x, y: topoY + dy, comp: 17, larg: 2.6, ang: ang + ctx.queda,
            cor: dy < 12 ? this.folha[0] : dy < 30 ? this.folha[1] : this.folha[2],
            curva: 3 + ctx.queda * 0.4,
          });
        }
        if (ctx.florindo) {
          for (let i = 0; i < 3; i++) {
            poe(copa, "ellipse", { cx: x - 2 + i * 2.4, cy: topoY - 3 - i * 1.6, rx: 2.4, ry: 1.3, fill: "#F5E9C0", transform: `rotate(${-20 - i * 12} ${f(x)} ${f(topoY)})` });
          }
        }
      }
      if (ctx.frutificando) {
        // O bambu não dá fruto à vista: o que se colhe são os brotos novos.
        for (const [x, h] of [[30, 20], [70, 16], [24, 13]]) {
          poe(g, "path", { d: `M${f(x - 5)} 126 Q${f(x - 3)} ${f(126 - h)} ${f(x)} ${f(124 - h)} Q${f(x + 3)} ${f(126 - h)} ${f(x + 5)} 126 Z`, fill: "#D7CCA0" });
          poe(g, "path", { d: `M${f(x)} ${f(124 - h)} Q${f(x + 3)} ${f(126 - h)} ${f(x + 5)} 126 L${f(x)} 126 Z`, fill: "#A5A05E" });
        }
      }
    },
  },

  maracuja: {
    folha: ["#7CB342", "#388E3C", "#1B5E20"],
    casca: ["#A1887F", "#795548"],
    desenhar(g, etapa, ctx) {
      const alt = 88 * ctx.porte;
      const topoY = 130 - alt;
      for (const x of [26, 74]) {
        poe(g, "rect", { x: x - 3, y: topoY, width: 6, height: alt, fill: this.casca[0] });
        poe(g, "rect", { x: x + 0.6, y: topoY, width: 2.4, height: alt, fill: this.casca[1] });
      }
      const barras = [topoY + 4, topoY + 26, topoY + 48].filter((y) => y < 118);
      for (const y of barras) poe(g, "rect", { x: 18, y, width: 64, height: 5, fill: this.casca[0], rx: 1.5 });
      const trepadeira = ctx.copa(g, 126);
      for (const y of barras) {
        for (const x of [24, 38, 50, 62, 76]) {
          // Folha trilobada do maracujá: três lóbulos saindo do mesmo pecíolo.
          const base = 108 + ((x + y) % 40) + ctx.queda;
          for (const desvio of [-42, 0, 42]) {
            folha(trepadeira, { x, y: y + 4, comp: 11, larg: 4.4, ang: base + desvio - 180, cor: desvio === 0 ? this.folha[1] : desvio < 0 ? this.folha[0] : this.folha[2] });
          }
        }
        // Gavinhas: o cacho de espiral é o que diz "trepadeira" de longe.
        for (const x of [31, 57]) {
          poe(trepadeira, "path", {
            d: `M${f(x)} ${f(y + 5)} c 3 2 5 5 2 6 c -3 1 -4 -2 -1 -3`,
            fill: "none", stroke: this.folha[1], "stroke-width": 1.6, "stroke-linecap": "round",
          });
        }
      }
      if (ctx.florindo) {
        for (const [x, y] of [[40, barras[0] + 12], [66, barras[1] + 10]]) {
          if (y > 120) continue;
          // Flor-do-maracujá: pétalas brancas, coroa roxa em raios, miolo verde.
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            poe(trepadeira, "ellipse", { cx: x + Math.cos(a) * 6.4, cy: y + Math.sin(a) * 6.4, rx: 4.2, ry: 1.8, fill: "#FFFFFF", transform: `rotate(${f(grau(a))} ${f(x + Math.cos(a) * 6.4)} ${f(y + Math.sin(a) * 6.4)})` });
          }
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            poe(trepadeira, "ellipse", { cx: x + Math.cos(a) * 3.6, cy: y + Math.sin(a) * 3.6, rx: 3, ry: 1.1, fill: i % 2 ? "#6A1B9A" : "#CE93D8", transform: `rotate(${f(grau(a))} ${f(x + Math.cos(a) * 3.6)} ${f(y + Math.sin(a) * 3.6)})` });
          }
          poe(trepadeira, "circle", { cx: x, cy: y, r: 2.6, fill: "#AED581" });
        }
      }
      if (ctx.frutificando) {
        for (const [x, i] of [[33, 0], [55, 1], [70, 0]]) {
          const y = barras[Math.min(i, barras.length - 1)] + 16;
          fruto(trepadeira, { x, y, r: 6.4, alonga: 1.12, cor: "#FDD835", brilho: "#FFF59D", talo: "#33691E" });
        }
      }
    },
  },

  ipe: {
    folha: ["#66BB6A", "#388E3C", "#1B5E20"],
    casca: ["#8D6E63", "#4E342E"],
    desenhar(g, etapa, ctx) {
      const alt = 60 * ctx.porte;
      const topo = tronco(g, { alt, larg: 13 * ctx.porte, arco: 7, cor: this.casca[0], sombra: this.casca[1] });
      // Galhada aberta e espalhada: no ipê ela escapa por baixo da copa, o
      // que separa a silhueta dele da árvore de copa fechada ao lado.
      for (const [lado, sobe] of [[-1, 16], [1, 22], [-1, 28], [1, 8]]) {
        ramo(g, `M${f(topo.x)} ${f(topo.y + 6)} Q${f(topo.x + lado * 12)} ${f(topo.y - sobe * 0.4)} ${f(topo.x + lado * 22)} ${f(topo.y - sobe)}`, 4 * ctx.porte, this.casca[1]);
      }
      const r = 32 * ctx.porte;
      const cy = topo.y - r * 0.55;
      const copa = ctx.copa(g, topo.y);
      // Em flor o ipê fica praticamente sem folha: a copa inteira troca de cor.
      const cores = ctx.florindo ? ["#FFF176", "#FFC107", "#F9A825"] : this.folha;
      copaRedonda(copa, { cx: 50, cy, r, cores, achat: 0.74 });
      if (ctx.florindo) {
        for (const [dx, dy] of [[-1, 0.9], [0.4, 1.1], [1, 0.75], [-0.5, 1.15]]) {
          poe(copa, "circle", { cx: 50 + dx * r, cy: cy + dy * r, r: 2.4, fill: "#FFD54F" });
        }
        // Tapete de pétalas caídas: o chão amarelo é meia assinatura do ipê.
        for (const [x, y] of [[26, 127], [36, 124], [62, 125], [74, 127], [48, 122]]) {
          poe(g, "ellipse", { cx: x, cy: y, rx: 3, ry: 1.5, fill: "#FFC107" });
        }
      }
      if (ctx.frutificando) {
        /*
          Vagens compridas penduradas PARA FORA da copa, em tom claro: dentro
          dela, em marrom, o fruto do ipê somia contra a folha escura e a
          árvore madura ficava idêntica à adulta — quem joga precisa ver de
          longe que aquela ali já dá pra colher.
        */
        for (const [dx, dy] of [[-0.82, 0.62], [-0.3, 0.86], [0.3, 0.86], [0.82, 0.58]]) {
          const x = 50 + dx * r;
          const y = cy + dy * r;
          poe(copa, "rect", { x: x - 2.2, y, width: 4.4, height: 19, rx: 2.2, fill: "#EFEBE9" });
          poe(copa, "rect", { x: x - 2.2, y, width: 1.8, height: 19, rx: 0.9, fill: "#BCAAA4" });
          poe(copa, "circle", { cx: x, cy: y + 19, r: 2.2, fill: "#D7CCC8" });
        }
      }
    },
  },

  cafeeiro: {
    folha: ["#43A047", "#1B5E20", "#0B3D14"],
    casca: ["#795548", "#4E342E"],
    desenhar(g, etapa, ctx) {
      const alt = 34 * ctx.porte;
      const topo = tronco(g, { alt, larg: 8 * ctx.porte, cor: this.casca[0], sombra: this.casca[1] });
      const copa = ctx.copa(g, 126);
      // Arbusto de ramos horizontais empilhados: é essa silhueta em camadas,
      // e não uma copa redonda, que diferencia o café das árvores vizinhas.
      const niveis = ctx.porte < 1 ? [0, 12] : [0, 13, 26, 39];
      for (const subida of niveis) {
        const base = 130 - alt - subida;
        for (const lado of [-1, 1]) {
          const ponta = 50 + lado * (30 - subida * 0.3) * ctx.porte;
          ramo(copa, `M50 ${f(base + 4)} Q${f(50 + lado * 14)} ${f(base + 2 + ctx.queda * 0.3)} ${f(ponta)} ${f(base + 8 + ctx.queda * 0.5)}`, 2.6, this.casca[1]);
          for (let i = 1; i <= 3; i++) {
            const t = i / 3.4;
            const fx = 50 + (ponta - 50) * t;
            const fy = base + 4 + t * (4 + ctx.queda * 0.5);
            folha(copa, { x: fx, y: fy, comp: 12, larg: 4.2, ang: -60 + ctx.queda, cor: i === 1 ? this.folha[0] : this.folha[1] });
            folha(copa, { x: fx, y: fy, comp: 12, larg: 4.2, ang: 60 + ctx.queda, cor: this.folha[2] });
            if (ctx.florindo) flor(copa, { x: fx, y: fy + 1, r: 3, petala: "#FFFFFF", miolo: "#FFF59D" });
            if (ctx.frutificando) {
              // Cerejas do café vêm em par colado no ramo, nunca soltas.
              fruto(copa, { x: fx - 1.6, y: fy + 2.4, r: 2.8, cor: "#E53935", brilho: "#FFCDD2" });
              fruto(copa, { x: fx + 2.2, y: fy + 3, r: 2.8, cor: "#C62828", brilho: "#EF9A9A" });
            }
          }
        }
      }
    },
  },

  jequitiba: {
    folha: ["#7CB342", "#2E7D32", "#1B5E20"],
    casca: ["#8D6E63", "#5D4037"],
    desenhar(g, etapa, ctx) {
      const alt = 62 * ctx.porte;
      const larg = 21 * ctx.porte;
      // Raízes tabulares: as abas de madeira no pé são a assinatura do gigante.
      for (const lado of [-1, 1]) {
        for (const [avanco, altura] of [[0.85, 26], [1.45, 15]]) {
          poe(g, "path", {
            d: `M${f(50 + lado * larg * 0.3)} ${f(130 - altura)} L${f(50 + lado * larg * avanco)} 130 L${f(50 + lado * larg * 0.3)} 130 Z`,
            fill: avanco > 1 ? this.casca[1] : this.casca[0],
          });
        }
      }
      const topo = tronco(g, { alt, larg, cor: this.casca[0], sombra: this.casca[1] });
      for (const lado of [-1, 1]) {
        ramo(g, `M50 ${f(topo.y + 10)} Q${f(50 + lado * 16)} ${f(topo.y + 4)} ${f(50 + lado * 28)} ${f(topo.y - 6)}`, 6 * ctx.porte, this.casca[1]);
      }
      const r = 33 * ctx.porte;
      const cy = topo.y - r * 0.42;
      const copa = ctx.copa(g, topo.y);
      // Copa em duas camadas e bem achatada: árvore velha espalha, não sobe.
      copaRedonda(copa, { cx: 50, cy, r, cores: this.folha, achat: 0.62 });
      copaRedonda(copa, { cx: 50, cy: cy - r * 0.3, r: r * 0.62, cores: this.folha, achat: 0.6 });
      if (ctx.florindo) {
        for (const [dx, dy] of [[-0.8, 0.1], [-0.3, -0.3], [0.3, -0.35], [0.8, 0.05], [0, 0.25]]) {
          flor(copa, { x: 50 + dx * r, y: cy + dy * r, r: 3.4, petala: "#FFF8E1", miolo: "#FFD54F" });
        }
      }
      if (ctx.frutificando) {
        /*
          Pixídios: os "copinhos" de madeira do jequitibá, de boca para baixo.
          Em tom claro e na borda de baixo da copa — no meio dela, em marrom
          escuro, a árvore madura não se distinguia da adulta.
        */
        for (const [dx, dy] of [[-0.78, 0.5], [-0.28, 0.66], [0.28, 0.66], [0.78, 0.48]]) {
          const x = 50 + dx * r;
          const y = cy + dy * r * 0.6;
          poe(copa, "path", { d: `M${f(x - 5)} ${f(y)} L${f(x + 5)} ${f(y)} L${f(x + 3.2)} ${f(y + 9)} L${f(x - 3.2)} ${f(y + 9)} Z`, fill: "#D7CCC8" });
          poe(copa, "ellipse", { cx: x, cy: y, rx: 5, ry: 2, fill: "#8D6E63" });
        }
      }
    },
  },

  pitangueira: {
    folha: ["#9CCC65", "#4CAF50", "#2E7D32"],
    casca: ["#A1887F", "#6D4C41"],
    desenhar(g, etapa, ctx) {
      const alt = 22 * ctx.porte;
      const topo = tronco(g, { alt, larg: 7 * ctx.porte, cor: this.casca[0], sombra: this.casca[1] });
      const rx = 30 * ctx.porte;
      const ry = 27 * ctx.porte;
      const cy = topo.y - ry * 0.45;
      const copa = ctx.copa(g, topo.y);
      poe(copa, "ellipse", { cx: 50, cy, rx: rx * 0.86, ry: ry * 0.86, fill: this.folha[2] });
      poe(copa, "ellipse", { cx: 50 - rx * 0.2, cy: cy - ry * 0.25, rx: rx * 0.55, ry: ry * 0.5, fill: this.folha[1] });
      /*
        A pitangueira não leva copa em bolhas: a folhinha miúda é a cara dela.
        Um anel de folhas curtas na borda basta para o olho ler "arbusto
        fechado de folha pequena" mesmo a 60px.
      */
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const dist = 0.6 + (i % 3) * 0.16;
        folha(copa, {
          x: 50 + Math.cos(a) * rx * dist,
          y: cy + Math.sin(a) * ry * dist,
          comp: 7.5, larg: 3.2, ang: grau(a) + ctx.queda,
          cor: i % 3 === 0 ? this.folha[0] : i % 3 === 1 ? this.folha[1] : this.folha[2],
        });
      }
      const pendentes = [[-0.55, 0.3], [-0.1, 0.55], [0.4, 0.42], [0.66, 0.02], [-0.3, -0.2], [0.15, 0.1]];
      if (ctx.florindo) {
        for (const [dx, dy] of pendentes) {
          const x = 50 + dx * rx;
          const y = cy + dy * ry;
          flor(copa, { x, y, r: 3.6, petala: "#FFFFFF", miolo: "#FFF176" });
          // Estames em leque: a flor da pitangueira é quase só eles.
          for (const ang of [-110, -90, -70]) {
            poe(copa, "path", { d: `M${f(x)} ${f(y)} l ${f(Math.cos((ang * Math.PI) / 180) * 4)} ${f(Math.sin((ang * Math.PI) / 180) * 4)}`, fill: "none", stroke: "#FFFFFF", "stroke-width": 1.1, "stroke-linecap": "round" });
          }
        }
      }
      if (ctx.frutificando) {
        for (const [dx, dy] of pendentes) {
          const x = 50 + dx * rx;
          const y = cy + dy * ry;
          fruto(copa, { x, y, r: 5, alonga: 0.86, cor: "#E53935", brilho: "#FFCDD2", talo: "#33691E" });
          // Gomos: as estrias fundas são o que distingue pitanga de qualquer
          // outra bolinha vermelha.
          for (const ex of [-2.2, 0, 2.2]) {
            poe(copa, "ellipse", { cx: x + ex, cy: y + 0.6, rx: 0.7, ry: 3.4, fill: "#B71C1C" });
          }
        }
      }
    },
  },
};

export const ESPECIE_IDS = [
  "coqueiro", "mangueira", "jabuticabeira", "bambuzal", "maracuja",
  "ipe", "cafeeiro", "jequitiba", "pitangueira",
];

export function createPlantArt(speciesId, stage, { vigor = 1 } = {}) {
  const especie = ESPECIES[speciesId] || ESPECIES.coqueiro;
  const etapa = Math.max(0, Math.min(6, Math.round(Number(stage) || 0)));
  vigorAtual = Math.max(0, Math.min(1, Number.isFinite(vigor) ? vigor : 1));

  const svg = el("svg", {
    viewBox: "0 0 100 130",
    preserveAspectRatio: "xMidYMax meet",
    class: "plant-art",
    "aria-hidden": "true",
  });
  // Com sede a planta inteira pende a partir do pé, não só a folhagem.
  const raiz = poe(svg, "g", { transform: `rotate(${f((1 - vigorAtual) * 4)} 50 130)` });

  terra(raiz);
  const murcha = 1 - vigorAtual;
  const ctx = {
    porte: etapa === 3 ? 0.6 : 1,
    florindo: etapa === 5,
    frutificando: etapa === 6,
    queda: murcha * 14, // graus extras de tombo em folha solta
    /*
      Folhagem em grupo próprio: encolhe e tomba sobre o ponto em que se
      prende ao caule enquanto o tronco segue de pé — é assim que a planta
      murcha sem sumir. Murchar não é morrer.
    */
    copa(pai, pivoY) {
      const escala = 0.76 + vigorAtual * 0.24;
      return poe(pai, "g", {
        transform: `rotate(${f(murcha * 7)} 50 ${f(pivoY)}) translate(50 ${f(pivoY)}) scale(${f(escala)}) translate(-50 ${f(-pivoY)})`,
      });
    },
  };

  if (etapa <= 2) brotoComum(raiz, etapa, especie.folha);
  else especie.desenhar(raiz, etapa, ctx);

  vigorAtual = 1;
  return svg;
}

/*
  Quanto de altura cada desenho realmente ocupa, em unidades do viewBox de
  130 — medido rasterizando as 63 combinações, não estimado no olho.

  Quem põe alguma coisa SOBRE a planta (o selo de "tem sede", o de "pode
  colher") precisa saber onde a copa termina: com um valor único, o aviso da
  pitangueira, que é um arbusto de 67, boiava na mesma altura do bambuzal,
  que chega a 117. Se a arte de uma espécie mudar de porte, meça de novo.
*/
const ALTURAS = {
  coqueiro: [16, 27, 43, 63, 105, 105, 105],
  mangueira: [16, 27, 43, 64, 107, 107, 107],
  jabuticabeira: [16, 27, 43, 57, 95, 95, 95],
  bambuzal: [16, 27, 43, 65, 108, 117, 108],
  maracuja: [16, 27, 43, 56, 91, 91, 91],
  ipe: [16, 27, 43, 66, 106, 106, 106],
  cafeeiro: [16, 27, 43, 38, 79, 79, 79],
  jequitiba: [16, 27, 43, 60, 100, 100, 100],
  pitangueira: [16, 27, 43, 43, 67, 67, 67],
};

// Fração da altura do desenho que a planta ocupa, de 0 a 1.
export function alturaDaPlanta(speciesId, stage) {
  const linha = ALTURAS[speciesId] || ALTURAS.coqueiro;
  return linha[Math.max(0, Math.min(6, Math.round(Number(stage) || 0)))] / 130;
}
