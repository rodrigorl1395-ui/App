/*
  Moradas do jardim, desenhadas por um gerador isométrico procedural
  (vendored em vendor/iso-building-generator, MIT — ver LICENSE lá dentro).
  Mesma semente, mesma casa, sempre: cada morada plantada guarda o próprio
  id, então ela não muda de forma a cada vez que a tela recarrega.
*/

import { generateBuilding } from "./vendor/iso-building-generator/index.js";

export function createIsoDwelling(seed, opts = {}) {
  const { svg: markup } = generateBuilding(seed, {
    style: "cozy",
    detail: "medium",
    padding: 4,
    ...opts,
  });

  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const svg = template.content.firstElementChild;
  // Sem width/height fixos: o CSS do container decide o tamanho, e
  // preserveAspectRatio mantém a casa "no chão" (base) em vez de centralizada.
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}
