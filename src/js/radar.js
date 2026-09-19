/*
  A roda da vida do Mestre, desenhada em SVG.

  Seis eixos, um por elemento, e cada eixo é uma área da vida. O que o
  desenho precisa dizer sem legenda nenhuma: onde você apareceu neste mês,
  onde você sumiu, e onde nunca houve nada — três estados diferentes que um
  gráfico comum colapsaria num zero só.

  Por isso o eixo sem hábito nenhum é desenhado apagado e pontilhado: um
  vazio que você nunca prometeu preencher não é uma falha sua.
*/

const SVG_NS = "http://www.w3.org/2000/svg";

const CX = 150;
const CY = 132;
const RADIUS = 78;
const RINGS = 4;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

// Topo é o primeiro eixo, e daí no sentido horário.
function pointAt(index, total, distance) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return [CX + Math.cos(angle) * distance, CY + Math.sin(angle) * distance];
}

function polygon(total, distance) {
  return Array.from({ length: total }, (_, i) => pointAt(i, total, distance))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

export function createLifeRadar(axes) {
  const total = axes.length;
  const svg = el("svg", {
    viewBox: "0 0 300 264",
    class: "life-radar",
    role: "img",
    "aria-label": axes
      .map((axis) => `${axis.area}: ${axis.days} de 30 dias`)
      .join(". "),
  });

  // Teia de fundo: anéis e raios, para o valor ter contra o que ser lido.
  for (let ring = RINGS; ring >= 1; ring -= 1) {
    svg.appendChild(
      el("polygon", {
        points: polygon(total, (RADIUS * ring) / RINGS),
        class: "life-radar-ring",
      })
    );
  }

  axes.forEach((_, index) => {
    const [x, y] = pointAt(index, total, RADIUS);
    svg.appendChild(el("line", { x1: CX, y1: CY, x2: x, y2: y, class: "life-radar-spoke" }));
  });

  /*
    O polígono dos dados. Um eixo em zero encosta no centro, então a área
    vira um estilhaço fino em vez de uma forma cheia — que é exatamente a
    leitura certa para quem cuidou de uma área só.
  */
  const shape = axes
    .map((axis, index) => {
      const [x, y] = pointAt(index, total, Math.max(RADIUS * axis.ratio, 1.5));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  svg.appendChild(el("polygon", { points: shape, class: "life-radar-shape" }));

  axes.forEach((axis, index) => {
    const [px, py] = pointAt(index, total, Math.max(RADIUS * axis.ratio, 1.5));
    svg.appendChild(
      el("circle", {
        cx: px,
        cy: py,
        r: axis.started ? 3.4 : 2.4,
        fill: axis.started ? axis.color : "transparent",
        stroke: axis.color,
        "stroke-width": 1.4,
        opacity: axis.started ? 1 : 0.45,
      })
    );

    // Rótulo do lado de fora, alinhado conforme o lado da roda em que cai —
    // centralizar tudo empurraria os textos laterais por cima do desenho.
    const [lx, ly] = pointAt(index, total, RADIUS + 24);
    const cos = Math.cos(-Math.PI / 2 + (index * 2 * Math.PI) / total);
    const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";

    const label = el("text", {
      x: lx,
      y: ly,
      class: `life-radar-label${axis.started ? "" : " is-empty"}`,
      "text-anchor": anchor,
    });
    label.textContent = axis.short;
    svg.appendChild(label);

    const value = el("text", {
      x: lx,
      y: ly + 13,
      class: `life-radar-value${axis.started ? "" : " is-empty"}`,
      "text-anchor": anchor,
      fill: axis.started ? axis.color : "currentColor",
    });
    value.textContent = axis.started ? `${axis.days}d` : "—";
    svg.appendChild(value);
  });

  return svg;
}
