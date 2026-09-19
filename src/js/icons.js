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

  const trunk = document.createElementNS(SVG_NS, "path");
  const trunkWidth = Math.max(2, trunkHeight * 0.12);
  trunk.setAttribute(
    "d",
    `M${32 - trunkWidth / 2} 76 L${32 - trunkWidth / 2} ${76 - trunkHeight} h${trunkWidth} L${
      32 + trunkWidth / 2
    } 76 Z`
  );
  trunk.setAttribute("fill", "#5b4a3a");
  grupo.appendChild(trunk);

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
  for (const [dx, dy, scale] of [
    [0, 0, 1],
    [-canopy * 0.55, canopy * 0.35, 0.72],
    [canopy * 0.55, canopy * 0.3, 0.68],
  ]) {
    const blob = document.createElementNS(SVG_NS, "circle");
    blob.setAttribute("cx", String(32 + dx));
    blob.setAttribute("cy", String(canopyY + dy));
    blob.setAttribute("r", String(Math.max(3, canopy * scale)));
    blob.setAttribute("fill", leafColor);
    blob.setAttribute("opacity", String(folhagem));
    grupo.appendChild(blob);
  }

  if (stage >= 5) {
    for (const [cx, cy] of [
      [24, canopyY - 2],
      [40, canopyY + 4],
      [32, canopyY - 10],
    ]) {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", String(cx));
      dot.setAttribute("cy", String(cy));
      dot.setAttribute("r", stage >= 6 ? "3.4" : "2.4");
      dot.setAttribute("fill", stage >= 6 ? "#e0705f" : "#f5d0e0");
      grupo.appendChild(dot);
    }
  }

  return svg;
}

/*
  Morada: uma casinha simples, no mesmo espírito minimalista da árvore —
  telhado e base, sem porta trancada nem janela. O que muda entre as
  moradas do catálogo é a cor e o tamanho (scale), nunca a forma; é a mesma
  receita da árvore, que escala por cor em vez de crescer um SVG por tipo.
*/
export function createDwelling(color, scale = 1) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 80");
  svg.setAttribute("aria-hidden", "true");

  const baseWidth = 34 * scale;
  const baseHeight = 26 * scale;
  const roofHeight = 20 * scale;
  const roofOverhang = 5 * scale;
  const baseY = 76 - baseHeight;
  const baseX = 32 - baseWidth / 2;

  const base = document.createElementNS(SVG_NS, "rect");
  base.setAttribute("x", String(baseX));
  base.setAttribute("y", String(baseY));
  base.setAttribute("width", String(baseWidth));
  base.setAttribute("height", String(baseHeight));
  base.setAttribute("rx", "3");
  base.setAttribute("fill", color);
  base.setAttribute("opacity", "0.85");
  svg.appendChild(base);

  const roof = document.createElementNS(SVG_NS, "path");
  roof.setAttribute(
    "d",
    `M${baseX - roofOverhang} ${baseY} L32 ${baseY - roofHeight} L${
      baseX + baseWidth + roofOverhang
    } ${baseY} Z`
  );
  roof.setAttribute("fill", color);
  svg.appendChild(roof);

  const doorWidth = baseWidth * 0.28;
  const doorHeight = baseHeight * 0.62;
  const door = document.createElementNS(SVG_NS, "rect");
  door.setAttribute("x", String(32 - doorWidth / 2));
  door.setAttribute("y", String(76 - doorHeight));
  door.setAttribute("width", String(doorWidth));
  door.setAttribute("height", String(doorHeight));
  door.setAttribute("rx", "1.5");
  door.setAttribute("fill", "#060912");
  door.setAttribute("opacity", "0.55");
  svg.appendChild(door);

  return svg;
}
