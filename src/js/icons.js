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
  Canteiro: a moldura de madeira em que cada árvore do jardim fica plantada.
  Desenhado em leve perspectiva (frente mais larga que o fundo) para a cena
  ler como um jardim cultivado, e não como árvores soltas no gramado.
*/
export function createGardenBed() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 120 52");
  svg.setAttribute("aria-hidden", "true");

  const shape = (points, fill, opacity) => {
    const node = document.createElementNS(SVG_NS, "polygon");
    node.setAttribute("points", points);
    node.setAttribute("fill", fill);
    if (opacity != null) node.setAttribute("opacity", String(opacity));
    svg.appendChild(node);
  };

  // Madeira de cima, terra por dentro, e a frente mais escura fazendo a altura.
  shape("12,8 108,8 120,42 0,42", "#8a6440");
  shape("22,14 98,14 106,37 14,37", "#3b2f26");
  shape("22,14 98,14 100,20 20,20", "#4a3a2c", 0.8);

  // Sulcos na terra: sem eles o canteiro lê como uma placa marrom lisa.
  for (const [y, recuo] of [
    [23, 3],
    [28, 1],
    [33, -1],
  ]) {
    const sulco = document.createElementNS(SVG_NS, "path");
    sulco.setAttribute("d", `M${24 + recuo} ${y} H${96 - recuo}`);
    sulco.setAttribute("stroke", "#2c231c");
    sulco.setAttribute("stroke-width", "1.6");
    sulco.setAttribute("stroke-linecap", "round");
    sulco.setAttribute("opacity", "0.55");
    svg.appendChild(sulco);
  }

  shape("0,42 120,42 120,50 0,50", "#6d4c2f");
  shape("0,42 120,42 120,44 0,44", "#a87b4e", 0.55);
  // Tábuas da frente, marcadas por dois cortes.
  for (const x of [40, 80]) {
    const corte = document.createElementNS(SVG_NS, "path");
    corte.setAttribute("d", `M${x} 42 V50`);
    corte.setAttribute("stroke", "#5a3e26");
    corte.setAttribute("stroke-width", "1.2");
    svg.appendChild(corte);
  }

  return svg;
}
