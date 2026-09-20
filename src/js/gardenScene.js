/*
  O Jardim em pixel art 2D — cena parada, sem WebGL: cada canteiro e cada
  enfeite é DOM, desenhado com as árvores em blocos quadrados de icons.js.

  A cena não é mais uma grade de cartões (isso lia como vitrine de loja) —
  é uma trilha: os elementos ficam espalhados ao longo de um caminho que
  serpenteia jardim abaixo, cada um com a sua placa, do jeito que um jardim
  de verdade se anda, não se cataloga. Quanto mais se planta, mais a trilha
  desce e mais alto o jardim fica — esse é o "espaço amplo" pedido.

  Cada árvore continua sendo "ponto próprio": tocar abre uma fichinha com o
  que dá pra fazer ali (ver o hábito, colher os frutos quando maduros,
  gravar uma marca no tronco). Colher é só o gesto: as sementes continuam
  nascendo sozinhas de frutos guardados, em segundo plano, como sempre.
*/

import { createEl, createScenePortal, showTreeSheet } from "./ui.js";
import { createIcon, createPixelTree, createPixelHouse } from "./icons.js";
import { describeVigor } from "./master.js";
import { getTreeMark, setTreeMark, TREE_MARK_OPTIONS } from "./treeMarks.js";

const ROW_H = 172;
const TOP_PAD = 76;
const BOTTOM_PAD = 56;

// Um número estável por id: o mesmo item nasce no mesmo lugar a cada visita,
// em vez de reembaralhar o jardim a cada render.
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  A trilha: um vaivém em onda (seno) descendo o jardim, com um leve desvio
  próprio de cada item — é o que faz o caminho serpentear em vez de ziguezaguear
  em linha reta, e o que dá a cada planta um lugar que não muda de visita
  em visita.
*/
function trilha(items) {
  return items.map((item, i) => {
    const desvio = (semente(item.habit ? item.habit.id : item.id) - 0.5) * 14;
    const x = clamp(50 + Math.sin(i * 1.15) * 30 + desvio, 13, 87);
    const y = TOP_PAD + i * ROW_H;
    return { ...item, x, y };
  });
}

// Curva suave passando por cada ponto: quadráticas com controle no próprio
// ponto e fim no meio do próximo — o truque clássico de "path por pontos".
function caminhoSvg(pontos) {
  if (pontos.length < 2) return "";
  let d = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const atual = pontos[i];
    const proximo = pontos[i + 1];
    const meioX = (atual.x + proximo.x) / 2;
    const meioY = (atual.y + proximo.y) / 2;
    d += ` Q ${atual.x} ${atual.y} ${meioX} ${meioY}`;
  }
  const ultimo = pontos[pontos.length - 1];
  d += ` T ${ultimo.x} ${ultimo.y}`;
  return d;
}

function habitSubtitle(item) {
  const nota = describeVigor(item.vigorBruto);
  return `${item.stage.name} · ${nota}`;
}

function playHarvest(bed) {
  const fruto = createEl("span", { className: "harvest-fx", text: "🍎 +" });
  bed.appendChild(fruto);
  setTimeout(() => fruto.remove(), 850);
}

function openMarkPicker(habit, onChanged) {
  const atual = getTreeMark(habit.id);
  showTreeSheet({
    title: "Gravar uma marca",
    subtitle: `Fica na casca da árvore de ${habit.name} até você trocar ou apagar.`,
    actions: [
      ...TREE_MARK_OPTIONS.map((option) => ({
        label: atual?.id === option.id ? `${option.label} (gravada)` : option.label,
        primary: atual?.id === option.id,
        onClick: () => {
          setTreeMark(habit.id, option.id);
          onChanged();
        },
      })),
      atual
        ? {
            label: "Apagar marca",
            onClick: () => {
              setTreeMark(habit.id, null);
              onChanged();
            },
          }
        : null,
    ].filter(Boolean),
  });
}

function openTreeSheet(item, bed, { onNavigate, onChanged }) {
  const maduro = item.stage.stage >= 6;
  showTreeSheet({
    title: item.habit.name,
    subtitle: habitSubtitle(item),
    actions: [
      maduro
        ? { label: "Colher frutos", primary: true, keepOpen: true, onClick: () => playHarvest(bed) }
        : null,
      { label: "Ver hábito", primary: !maduro, onClick: () => onNavigate(item.habit.id) },
      { label: "Marcar tronco", onClick: () => openMarkPicker(item.habit, onChanged) },
    ].filter(Boolean),
  });
}

function renderSign(name) {
  return createEl("span", { className: "garden-plot-sign", text: name });
}

function renderPlot(item, { onNavigate, onChanged }) {
  const maduro = item.stage.stage >= 6;
  const mark = getTreeMark(item.habit.id);

  const bed = createEl("div", {
    className: `garden-plot-bed${item.vigor < 0.5 ? " is-murcha" : ""}`,
    children: [
      createEl("span", { className: "garden-plot-shadow", attrs: { "aria-hidden": "true" } }),
      createEl("span", {
        className: "garden-plot-tree",
        children: [createPixelTree(item.stage.stage, item.leaf, item.vigor)],
      }),
      mark
        ? createEl("span", { className: "garden-plot-mark", children: [createIcon(mark.icon)] })
        : null,
      maduro ? createEl("span", { className: "garden-plot-fruit", attrs: { "aria-hidden": "true" } }) : null,
    ],
  });

  const plot = createEl("button", {
    className: "garden-plot",
    attrs: {
      type: "button",
      style: `left: ${item.x}%; top: ${item.y}px`,
      "aria-label": `${item.habit.name}, ${habitSubtitle(item)}`,
    },
    children: [bed, renderSign(item.habit.name)],
  });

  plot.addEventListener("click", () => openTreeSheet(item, bed, { onNavigate, onChanged }));
  return plot;
}

function renderDecorPlot(item) {
  const preview =
    item.kind === "morada" ? createPixelHouse(item.color, item.scale) : createPixelTree(4, item.color, 1);

  return createEl("div", {
    className: "garden-plot is-decor",
    attrs: { style: `left: ${item.x}%; top: ${item.y}px` },
    children: [
      createEl("div", {
        className: "garden-plot-bed is-decor",
        children: [
          createEl("span", { className: "garden-plot-shadow", attrs: { "aria-hidden": "true" } }),
          preview,
        ],
      }),
      renderSign(item.name),
    ],
  });
}

/*
  A cena inteira: porta para o Lar, depois a trilha — hábitos e enfeites
  intercalados (é o que faz a árvore séria e a cerejeira de enfeite
  dividirem o mesmo caminho, como num jardim de verdade), com o desenho do
  caminho por baixo de tudo. Sem câmera, sem loop de render: é posição
  absoluta sobre um chão que cresce conforme mais é plantado.
*/
export function createGardenScene(trees, decor, { onNavigate, onChanged, firstGuardianIcon }) {
  const sequencia = [];
  const max = Math.max(trees.length, decor.length);
  for (let i = 0; i < max; i += 1) {
    if (trees[i]) sequencia.push({ tipo: "tree", data: trees[i] });
    if (decor[i]) sequencia.push({ tipo: "decor", data: decor[i] });
  }

  const pontos = trilha(sequencia.map(({ data }) => data));
  const alturaChao = pontos.length ? pontos[pontos.length - 1].y + BOTTOM_PAD : TOP_PAD + BOTTOM_PAD;

  const palco = createEl("div", { className: "garden-scene" });
  palco.appendChild(
    createScenePortal({ href: "#/lar", label: "Lar", side: "left", icon: firstGuardianIcon })
  );

  const chao = createEl("div", {
    className: "garden-scene-ground",
    attrs: { style: `height: ${alturaChao}px` },
  });

  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("class", "garden-scene-path");
  svg.setAttribute("viewBox", `0 0 100 ${alturaChao}`);
  svg.setAttribute("preserveAspectRatio", "none");
  chao.appendChild(svg);

  const d = caminhoSvg(pontos);
  for (const [classe, largura] of [["is-border", 5], ["is-fill", 2.6]]) {
    const path = document.createElementNS(svgNs, "path");
    path.setAttribute("class", `garden-path-line ${classe}`);
    path.setAttribute("d", d);
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("stroke-width", String(largura));
    svg.appendChild(path);
  }

  sequencia.forEach((entrada, i) => {
    const item = pontos[i];
    chao.appendChild(
      entrada.tipo === "tree"
        ? renderPlot(item, { onNavigate, onChanged })
        : renderDecorPlot(item)
    );
  });

  palco.appendChild(chao);
  return palco;
}
