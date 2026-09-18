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

const ELEMENT_ICONS = {
  fogo: "flame",
  agua: "droplet",
  terra: "leaf",
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

export function createElementalIcon(element) {
  return createIcon(ELEMENT_ICONS[element] || "leaf");
}
