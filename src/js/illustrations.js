// Ilustrações desenhadas em SVG. Sem asset externo: o app precisa continuar
// funcionando offline e leve.
//
// O professor é uma silhueta encapuzada com lanterna, iluminada de lado. A
// escolha é deliberada: um personagem cartunesco desenhado à mão em path
// sairia torto, enquanto uma silhueta com luz lê como guia, combina com a
// linguagem de orbes do resto do app e não fica infantil.

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/*
  A equipe: o professor ao centro e os animais em arco atrás, cada um na cor
  do seu elemento. Recebe a lista já pronta para a cena não precisar conhecer
  o catálogo.
*/
export function createProfessorScene(animals = []) {
  const svg = el("svg", {
    viewBox: "0 0 360 250",
    class: "professor-scene",
    "aria-hidden": "true",
  });

  const defs = el("defs", {});

  const lanternGlow = el("radialGradient", { id: "lantern-glow" });
  lanternGlow.appendChild(el("stop", { offset: "0%", "stop-color": "#ffd9a0", "stop-opacity": "0.95" }));
  lanternGlow.appendChild(el("stop", { offset: "100%", "stop-color": "#ffb057", "stop-opacity": "0" }));
  defs.appendChild(lanternGlow);

  const groundGlow = el("radialGradient", { id: "ground-glow" });
  groundGlow.appendChild(el("stop", { offset: "0%", "stop-color": "#ffc27a", "stop-opacity": "0.22" }));
  groundGlow.appendChild(el("stop", { offset: "100%", "stop-color": "#ffc27a", "stop-opacity": "0" }));
  defs.appendChild(groundGlow);

  svg.appendChild(defs);

  // Chão: só uma mancha de luz, para a cena não flutuar no vazio.
  svg.appendChild(el("ellipse", { cx: 180, cy: 214, rx: 150, ry: 26, fill: "url(#ground-glow)" }));

  /*
    Os animais ficam em dois grupos, um de cada lado. Um arco único deixava
    metade deles escondida atrás do professor — em grupo eles lêem como
    equipe e todos aparecem.
  */
  const metade = Math.ceil(animals.length / 2);
  animals.forEach((animal, index) => {
    const naEsquerda = index < metade;
    const posicao = naEsquerda ? index : index - metade;
    const x = naEsquerda ? 28 + posicao * 30 : 246 + posicao * 30;
    // Alturas alternadas dão profundidade sem precisar de perspectiva.
    const y = 176 + (posicao % 2 === 0 ? 0 : -13);
    const r = 15 - (posicao % 2 === 0 ? 0 : 2);

    svg.appendChild(el("circle", { cx: x, cy: y, r: r + 8, fill: animal.color, opacity: 0.16 }));
    svg.appendChild(el("circle", { cx: x, cy: y, r, fill: animal.color, opacity: 0.9 }));
    // Brilho especular: é o que faz o círculo virar esfera.
    svg.appendChild(
      el("circle", { cx: x - r * 0.3, cy: y - r * 0.35, r: r * 0.28, fill: "#fff", opacity: 0.4 })
    );
  });

  // Manto, com ombro marcado para ler como figura e não como barraca.
  svg.appendChild(
    el("path", {
      d: "M180 106 C168 108, 158 117, 152 133 C146 153, 140 187, 136 217 L224 217 C220 187, 214 153, 208 133 C202 117, 192 108, 180 106 Z",
      fill: "#161c2c",
    })
  );

  // Luz da lanterna na borda direita: uma lâmina fina acompanhando o contorno,
  // não uma faixa atravessando o corpo.
  svg.appendChild(
    el("path", {
      d: "M208 133 C214 153, 220 187, 224 217 L216 217 C212 187, 206 154, 200 135 Z",
      fill: "#ffc27a",
      opacity: 0.55,
    })
  );

  // Cabeça na sombra, sob a aba
  svg.appendChild(el("path", { d: "M169 96 L191 96 L189 110 L171 110 Z", fill: "#0e1322" }));

  // Chapéu de aba larga
  svg.appendChild(el("path", { d: "M163 97 C166 67, 194 67, 197 97 Z", fill: "#1b2338" }));
  svg.appendChild(el("ellipse", { cx: 180, cy: 98, rx: 43, ry: 8, fill: "#1b2338" }));
  svg.appendChild(
    // Começa abaixo do topo da cúpula, senão a luz escapa da silhueta.
    el("path", { d: "M187 79 C192 84, 195 90, 196 97 L190 97 C189 90, 187 84, 184 80 Z", fill: "#ffc27a", opacity: 0.4 })
  );

  // Cajado com a lanterna, na mão direita
  svg.appendChild(el("rect", { x: 238, y: 116, width: 3, height: 101, rx: 1.5, fill: "#4a3f2e" }));
  svg.appendChild(el("circle", { cx: 239.5, cy: 110, r: 32, fill: "url(#lantern-glow)" }));
  svg.appendChild(el("circle", { cx: 239.5, cy: 110, r: 8, fill: "#ffd9a0" }));
  svg.appendChild(el("circle", { cx: 239.5, cy: 110, r: 3.5, fill: "#fff6e4" }));

  return svg;
}
