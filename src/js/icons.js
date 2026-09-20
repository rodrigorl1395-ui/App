// Glifos SVG simples, desenhados para preenchimento (fill), usados em
// emblemas de animal e de hábito. Um único lugar para todos os ícones.

const ICON_PATHS = {
  flame:
    "M12 2c1 3-2 4-2 7a4 4 0 1 0 8 0c0-1-.5-2-1-2 .5 2-1 3-2 3-1.5 0-2-1.5-1-3-2 .5-3 2.5-3 4a5 5 0 0 0 10 0C21 7 15 5 12 2Z",
  droplet: "M12 2C9 7 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-4-8-7-13Z",
  leaf: "M12 3v6M12 21c-4 0-7-2.5-7-6 2 1 4 1 5-.5C9 12 8 9.5 5 8c3-2 7-1 7 2 0-3 4-4 7-2-3 1.5-4 4-5 6.5 1 1.5 3 1.5 5 .5 0 3.5-3 6-7 6Z",
  book: "M12 6c-2-1.5-4.5-2-7-2v13c2.5 0 5 .5 7 2 2-1.5 4.5-2 7-2V4c-2.5 0-5 .5-7 2Z",
  star: "M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2Z",
  sprout:
    "M11.25 21v-7.5h1.5V21h-1.5Z M12 12c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z M12 12c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z",
  moon: "M20 13.5A8.5 8.5 0 1 1 10.5 4a6.6 6.6 0 0 0 9.5 9.5Z",
  apple:
    "M12 8c3.3 0 5.5 2.4 5.5 6S15 21 12 21s-5.5-3.4-5.5-7S8.7 8 12 8Z M12.5 7c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5Z",
  // Ar: três correntes de vento, a do meio mais longa.
  wind:
    "M2 6h10a2 2 0 1 0-2-2H8a4 4 0 1 1 4 4H2V6Z M2 11h14a2 2 0 1 1-2 2h-2a4 4 0 1 0 4-4H2v2Z M2 16h7a2 2 0 1 1-2 2H5a4 4 0 1 0 4-4H2v2Z",
  // Espírito: faísca de quatro pontas, distinta da estrela de cinco.
  spark: "M12 2c1.2 5 2.8 6.8 8 8-5.2 1.2-6.8 3-8 8-1.2-5-2.8-6.8-8-8 5.2-1.2 6.8-3 8-8Z",
  heart: "M12 20.5S3 14.6 3 8.7C3 5.6 5.4 3.5 8 3.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.6 0 5 2.1 5 5.2 0 5.9-9 11.8-9 11.8Z",

  /* Navegação e apps: glifos cheios, legíveis a 22px. */
  sun: "M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z M11 1.6h2v3.1h-2z M11 19.3h2v3.1h-2z M1.6 11h3.1v2H1.6z M19.3 11h3.1v2h-3.1z M4.3 5.7l1.4-1.4 2.2 2.2-1.4 1.4z M16.1 17.5l1.4-1.4 2.2 2.2-1.4 1.4z M5.7 19.7l-1.4-1.4 2.2-2.2 1.4 1.4z M17.5 7.9l-1.4-1.4 2.2-2.2 1.4 1.4z",
  list: "M3.6 5.2h3v3h-3z M8.8 5.7h11.6v2H8.8z M3.6 10.5h3v3h-3z M8.8 11h11.6v2H8.8z M3.6 15.8h3v3h-3z M8.8 16.3h11.6v2H8.8z",
  tree: "M12 1.8c-4 0-7.2 3.1-7.2 6.9 0 3.1 2.1 5.7 5 6.6L9 22.2h6l-.8-6.9c2.9-.9 5-3.5 5-6.6 0-3.8-3.2-6.9-7.2-6.9Z",
  tools: "M9 2.8h6a2 2 0 0 1 2 2v1.4h3a2 2 0 0 1 2 2v3.2H2V8.2a2 2 0 0 1 2-2h3V4.8a2 2 0 0 1 2-2Zm.2 3.4h5.6V4.9H9.2v1.3ZM2 13.4h7v2.2h6v-2.2h7v5.8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.8Z",
  paw: "M12 13.2c2.6 0 5.2 2.2 5.2 4.6 0 1.7-1.3 2.7-3.1 2.7-1.1 0-1.6-.4-2.1-.4s-1 .4-2.1.4c-1.8 0-3.1-1-3.1-2.7 0-2.4 2.6-4.6 5.2-4.6Z M6.3 7.3c1.1 0 2.1 1.3 2.1 2.8s-1 2.8-2.1 2.8-2.1-1.3-2.1-2.8 1-2.8 2.1-2.8Z M17.7 7.3c1.1 0 2.1 1.3 2.1 2.8s-1 2.8-2.1 2.8-2.1-1.3-2.1-2.8 1-2.8 2.1-2.8Z M9.7 3.1c1.1 0 1.9 1.2 1.9 2.7s-.8 2.7-1.9 2.7-1.9-1.2-1.9-2.7.8-2.7 1.9-2.7Z M14.3 3.1c1.1 0 1.9 1.2 1.9 2.7s-.8 2.7-1.9 2.7-1.9-1.2-1.9-2.7.8-2.7 1.9-2.7Z",
  dumbbell: "M1.8 9.4h2.4v5.2H1.8z M5 7.2h3.2v9.6H5z M9 10.9h6v2.2H9z M15.8 7.2H19v9.6h-3.2z M19.8 9.4h2.4v5.2h-2.4z",
  wallet: "M3 6.4A2.6 2.6 0 0 1 5.6 3.8H17a1.1 1.1 0 0 1 0 2.2H5.9a.6.6 0 0 0 0 1.2H19a2 2 0 0 1 2 2v9.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.4Zm13.3 6.3a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z",
  notebook: "M7.4 2.2H18a2 2 0 0 1 2 2v15.6a2 2 0 0 1-2 2H7.4a2 2 0 0 1-2-2V4.2a2 2 0 0 1 2-2Zm2 4.1v2.1h7V6.3h-7Zm0 4.2v2.1h7v-2.1h-7Zm0 4.2v2.1h4.6v-2.1H9.4Z M3.2 5.1h2.1v2.6H3.2z M3.2 10.6h2.1v2.6H3.2z M3.2 16.1h2.1v2.6H3.2z",
  plus: "M10.9 4.2h2.2v6.7h6.7v2.2h-6.7v6.7h-2.2v-6.7H4.2v-2.2h6.7z",
  check: "M9.6 16.3 5.3 12l-1.5 1.5 5.8 5.8L20.2 8.7l-1.5-1.5z",
  trash: "M9.4 2.6h5.2l1 1.9h4.2v2.1H4.2V4.5h4.2l1-1.9ZM5.7 8.6h12.6l-1 12.8H6.7L5.7 8.6Z",
  timer: "M9 1.4h6v2.1H9z M12 4.4a8.9 8.9 0 1 0 0 17.8 8.9 8.9 0 0 0 0-17.8Zm1.1 4.2v5.3l3.4 2-1 1.8-4.5-2.7V8.6h2.1Z",
  coins: "M12 2.6c4.4 0 8 1.6 8 3.6S16.4 9.8 12 9.8 4 8.2 4 6.2s3.6-3.6 8-3.6Zm8 6.4v2.4c0 2-3.6 3.6-8 3.6s-8-1.6-8-3.6V9c1.8 1.4 4.8 2.2 8 2.2s6.2-.8 8-2.2Zm0 5.2v2.4c0 2-3.6 3.6-8 3.6s-8-1.6-8-3.6v-2.4c1.8 1.4 4.8 2.2 8 2.2s6.2-.8 8-2.2Z",
};

export function createIcon(name) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", ICON_PATHS[name] || ICON_PATHS.sprout);
  svg.appendChild(path);
  return svg;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/*
  Árvore desenhada por estágio: o tronco cresce, a copa ganha volume e, no
  fim, vêm flores e frutos. Tudo em SVG simples para escalar sem asset.
*/
/*
  vigor (0 a 1) é o quanto a árvore está de pé. Ele encolhe a copa, apaga a
  cor e inclina o tronco — a árvore murcha à vista quando a pessoa some, e se
  levanta quando ela volta. Nunca some de todo: murchar não é morrer.
*/
// Clareia uma cor hex em direção ao branco. Usado para o lado iluminado da
// copa: a mesma folha, duas tonalidades, é o que tira a árvore do "adesivo".
function clarear(hex, quanto) {
  const limpo = hex.replace("#", "");
  const cheio = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo;
  const num = parseInt(cheio, 16);
  const canal = (deslocamento) => {
    const base = (num >> deslocamento) & 255;
    return Math.round(base + (255 - base) * quanto);
  };
  return `rgb(${canal(16)}, ${canal(8)}, ${canal(0)})`;
}

// O inverso de clarear: escurece em direção ao preto. Usado para o lado
// sombreado dos blocos de pixel art — a mesma folha, mais escura, no canto
// oposto ao da luz.
function escurecer(hex, quanto) {
  const limpo = hex.replace("#", "");
  const cheio = limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo;
  const num = parseInt(cheio, 16);
  const canal = (deslocamento) => {
    const base = (num >> deslocamento) & 255;
    return Math.round(base * (1 - quanto));
  };
  return `rgb(${canal(16)}, ${canal(8)}, ${canal(0)})`;
}

export function createTree(stage, leafColor, vigor = 1) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 80");
  svg.setAttribute("aria-hidden", "true");

  const trunkHeight = [10, 18, 28, 38, 48, 50, 52][stage] ?? 10;
  // A copa é o que mais sofre com a sede; o tronco quase não muda.
  const canopy = ([5, 9, 14, 19, 23, 24, 25][stage] ?? 5) * (0.55 + vigor * 0.45);
  const folhagem = 0.45 + vigor * 0.45;
  const inclinacao = (1 - vigor) * 7;

  // Tudo dentro de um grupo inclinado pela base: é o que faz a árvore pender.
  const grupo = document.createElementNS(SVG_NS, "g");
  grupo.setAttribute("transform", `rotate(${inclinacao.toFixed(1)} 32 76)`);
  svg.appendChild(grupo);

  const trunkWidth = Math.max(2, trunkHeight * 0.12);
  const trunk = document.createElementNS(SVG_NS, "path");
  const meio = trunkWidth / 2;
  const topo = 76 - trunkHeight;
  // Tronco com a base alargada: uma árvore que encosta no chão em ângulo reto
  // lê como poste. O alargamento é pequeno, mas é o que a planta no lugar.
  trunk.setAttribute(
    "d",
    `M${32 - meio - 1.4} 76 Q${32 - meio} ${76 - trunkHeight * 0.45} ${32 - meio * 0.8} ${topo} L${
      32 + meio * 0.8
    } ${topo} Q${32 + meio} ${76 - trunkHeight * 0.45} ${32 + meio + 1.4} 76 Z`
  );
  trunk.setAttribute("fill", "#5b4a3a");
  grupo.appendChild(trunk);

  // Galhos saindo para a copa, só quando já há tronco que os sustente.
  if (stage >= 3) {
    for (const lado of [-1, 1]) {
      const galho = document.createElementNS(SVG_NS, "path");
      const base = topo + trunkHeight * 0.3;
      galho.setAttribute(
        "d",
        `M32 ${base} Q${32 + lado * canopy * 0.4} ${base - 3} ${32 + lado * canopy * 0.62} ${
          base - canopy * 0.5
        }`
      );
      galho.setAttribute("stroke", "#5b4a3a");
      galho.setAttribute("stroke-width", "2");
      galho.setAttribute("stroke-linecap", "round");
      galho.setAttribute("fill", "none");
      grupo.appendChild(galho);
    }
  }

  if (stage === 0) {
    // Recém-plantada: um par de folhas rompendo a terra. Precisa ser visível,
    // senão o lar de quem acabou de começar parece abandonado.
    const mound = document.createElementNS(SVG_NS, "ellipse");
    mound.setAttribute("cx", "32");
    mound.setAttribute("cy", "75");
    mound.setAttribute("rx", "9");
    mound.setAttribute("ry", "4");
    mound.setAttribute("fill", "#4a3f33");
    grupo.appendChild(mound);

    for (const dx of [-1, 1]) {
      const leaf = document.createElementNS(SVG_NS, "ellipse");
      leaf.setAttribute("cx", String(32 + dx * 6));
      leaf.setAttribute("cy", "64");
      leaf.setAttribute("rx", "6");
      leaf.setAttribute("ry", "3.6");
      leaf.setAttribute("fill", leafColor);
      leaf.setAttribute("opacity", String(folhagem));
      leaf.setAttribute("transform", `rotate(${dx * 28} ${32 + dx * 6} 64)`);
      grupo.appendChild(leaf);
    }
    return svg;
  }

  const canopyY = 76 - trunkHeight - canopy * 0.45;

  /*
    Copa em seis bolhas sobrepostas, não três: com três ela lê como um
    trevo; com seis, vira massa de folha. A sétima, mais clara e deslocada
    para cima e para a esquerda, é a luz batendo — é o que dá volume sem
    precisar de gradiente nem sombra.
  */
  const massa = [
    [0, 0.15, 1],
    [-0.7, 0.3, 0.66],
    [0.7, 0.26, 0.62],
    [-0.38, -0.45, 0.58],
    [0.4, -0.42, 0.55],
    [0, -0.62, 0.52],
  ];

  for (const [dx, dy, escala] of massa) {
    const blob = document.createElementNS(SVG_NS, "circle");
    blob.setAttribute("cx", String(32 + dx * canopy));
    blob.setAttribute("cy", String(canopyY + dy * canopy));
    blob.setAttribute("r", String(Math.max(2.5, canopy * escala)));
    blob.setAttribute("fill", leafColor);
    blob.setAttribute("opacity", String(folhagem));
    grupo.appendChild(blob);
  }

  const luz = document.createElementNS(SVG_NS, "circle");
  luz.setAttribute("cx", String(32 - canopy * 0.28));
  luz.setAttribute("cy", String(canopyY - canopy * 0.3));
  luz.setAttribute("r", String(Math.max(2, canopy * 0.5)));
  luz.setAttribute("fill", clarear(leafColor, 0.32));
  luz.setAttribute("opacity", String(folhagem * 0.55));
  grupo.appendChild(luz);

  /*
    Flores e frutos, quando a árvore chega lá. Também apagam com a sede: uma
    árvore murcha coberta de frutos contaria uma história que não aconteceu.
  */
  if (stage >= 5) {
    const enfeites = [
      [-0.55, -0.1],
      [0.5, -0.25],
      [0.05, -0.55],
      [-0.2, 0.35],
      [0.62, 0.2],
      [-0.7, 0.32],
      [0.25, 0.05],
    ];
    const frutos = stage >= 6;
    const quantos = frutos ? enfeites.length : 5;

    for (const [dx, dy] of enfeites.slice(0, quantos)) {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", String(32 + dx * canopy));
      dot.setAttribute("cy", String(canopyY + dy * canopy));
      dot.setAttribute("r", frutos ? "2.9" : "2.2");
      dot.setAttribute("fill", frutos ? "#e0705f" : "#f7d9e6");
      dot.setAttribute("opacity", String(0.35 + vigor * 0.65));
      grupo.appendChild(dot);
    }
  }

  return svg;
}

/*
  A mesma árvore, em pixel art. Não é um asset — é a mesma lógica de estágio
  e vigor de createTree, só desenhada em blocos quadrados sobre uma grade
  grossa em vez de círculos suaves. É o bloco que engana o olho de longe:
  poucos "pixels" grandes, cantos duros (crispEdges), sem antialiasing.
*/
export function createPixelTree(stage, leafColor, vigor = 1) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 40");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");

  const grupo = document.createElementNS(SVG_NS, "g");
  svg.appendChild(grupo);

  const folhagem = 0.45 + vigor * 0.45;
  const claraFolha = clarear(leafColor, 0.3);
  const escuraFolha = escurecer(leafColor, 0.32);

  function bloco(x, y, w, h, fill, opacity) {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("x", String(x));
    r.setAttribute("y", String(y));
    r.setAttribute("width", String(w));
    r.setAttribute("height", String(h));
    r.setAttribute("fill", fill);
    if (opacity != null) r.setAttribute("opacity", String(opacity));
    grupo.appendChild(r);
    return r;
  }

  if (stage === 0) {
    // Semente: monte de terra e duas folhinhas em bloco — visível o
    // suficiente para o canteiro recém-criado não parecer abandonado.
    bloco(11, 36, 10, 3, "#4a3f33");
    bloco(13, 30, 4, 7, leafColor, folhagem);
    bloco(17, 32, 4, 6, leafColor, folhagem);
    return svg;
  }

  const trunkH = [0, 6, 9, 13, 16, 16, 16][stage] ?? 6;
  const trunkW = stage >= 4 ? 4 : 3;
  const trunkX = 16 - Math.floor(trunkW / 2);
  const trunkY = 38 - trunkH;
  bloco(trunkX, trunkY, trunkW, trunkH, "#5b4a3a");
  bloco(trunkX + trunkW - 1, trunkY, 1, trunkH, "#3d2c1f", 0.75);

  // Copa: um círculo pixelado — grade grossa de blocos 2x2, pintados quando
  // caem dentro do raio. É o teste de distância que dá a forma redonda sem
  // precisar de path nenhum; a grade grossa é o que dá o ar de pixel art.
  const canopyR = [0, 4, 6, 8, 10, 11, 11][stage] ?? 4;
  const cell = 2;
  const cx = 16;
  const cy = trunkY - canopyR * 0.55;

  for (let gy = -canopyR - cell; gy <= canopyR + cell; gy += cell) {
    for (let gx = -canopyR - cell; gx <= canopyR + cell; gx += cell) {
      const dx = gx / canopyR;
      const dy = (gy / canopyR) * 1.15; // achata um pouco: copa mais larga que alta
      if (dx * dx + dy * dy > 1) continue;
      const tom = dx < -0.15 && dy < -0.1 ? claraFolha : dx > 0.25 && dy > 0.15 ? escuraFolha : leafColor;
      bloco(cx + gx - cell / 2, cy + gy - cell / 2, cell, cell, tom, folhagem);
    }
  }

  // Flores e frutos: os mesmos blocos, espalhados em posições fixas dentro
  // da copa — desbotam junto com o vigor, como na versão orgânica.
  if (stage >= 5) {
    const pontos = [
      [-0.55, -0.1], [0.5, -0.25], [0.05, -0.55], [-0.2, 0.35],
      [0.62, 0.2], [-0.7, 0.32], [0.25, 0.05],
    ];
    const frutos = stage >= 6;
    const quantos = frutos ? pontos.length : 5;
    for (const [dx, dy] of pontos.slice(0, quantos)) {
      bloco(
        cx + dx * canopyR - 1,
        cy + dy * canopyR - 1,
        2, 2,
        frutos ? "#e0705f" : "#f7d9e6",
        0.4 + vigor * 0.6
      );
    }
  }

  return svg;
}

/*
  Morada em pixel art: parede, telhado de duas águas e porta, tudo em bloco.
  Substitui a construção isométrica só dentro da cena — o catálogo continua
  usando o preview isométrico, que já é pequeno e não conflita com "3D".
*/
export function createPixelHouse(color, scale = 1) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 40");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");

  const grupo = document.createElementNS(SVG_NS, "g");
  const escala = Math.max(0.6, Math.min(1.15, scale));
  grupo.setAttribute("transform", `translate(16 38) scale(${escala}) translate(-16 -38)`);
  svg.appendChild(grupo);

  function bloco(x, y, w, h, fill) {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("x", String(x));
    r.setAttribute("y", String(y));
    r.setAttribute("width", String(w));
    r.setAttribute("height", String(h));
    r.setAttribute("fill", fill);
    grupo.appendChild(r);
  }

  bloco(9, 22, 14, 16, color);
  bloco(19, 22, 4, 16, escurecer(color, 0.28));
  bloco(6, 12, 20, 3, "#6d4c2f");
  bloco(6, 15, 20, 4, "#8a6440");
  bloco(4, 14, 24, 3, "#5b4029");
  bloco(14, 28, 4, 10, "#2b211a");

  return svg;
}
