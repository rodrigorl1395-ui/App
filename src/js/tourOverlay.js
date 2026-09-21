/*
  A casca visual do tour: um anel apontando pro botão certo da navegação
  (passos "nav"), ou só a instrução (passos "acao", que já acontecem na
  tela onde a pessoa está). Fica montado uma vez só, atualiza sozinho a
  cada mudança de estado ou de rota.
*/

import { createEl } from "./ui.js";
import { getCurrentTourStep, isTourActive, advanceTour, skipTour } from "./tour.js";
import { subscribe } from "./state.js";
import { TOUR_STEPS } from "../data/tour.js";

let mounted = false;

function posicionarAnel(target) {
  const el = document.querySelector(`.nav-item[href="#${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/*
  A bolha some no topo, nunca embaixo — em telas mais longas (a conclusão
  de uma missão, por exemplo) um botão real vive bem perto de onde a barra
  de baixo ficaria. No cabeçalho normal, encosta logo abaixo dele; nas
  telas de tela cheia (o Jardim, sem cabeçalho), o CSS já cuida da folga
  do notch sozinho.
*/
function posicionarTopo() {
  const header = document.querySelector(".app-header");
  if (header && getComputedStyle(header).display !== "none") {
    return header.getBoundingClientRect().bottom + 12;
  }
  return null;
}

export function mountTourOverlay() {
  if (mounted) return;
  mounted = true;

  const overlay = createEl("div", { className: "tour-overlay" });
  overlay.hidden = true;
  document.body.appendChild(overlay);

  function render() {
    const visivel = isTourActive() && !document.body.classList.contains("is-chromeless");
    const step = visivel ? getCurrentTourStep() : null;

    if (!step) {
      overlay.hidden = true;
      overlay.replaceChildren();
      return;
    }

    overlay.hidden = false;
    const indice = TOUR_STEPS.indexOf(step);

    const skip = createEl("button", {
      className: "link-button link-muted",
      text: "Pular tour",
      attrs: { type: "button" },
    });
    skip.addEventListener("click", skipTour);

    const acoes = [skip];
    if (step.type === "nav") {
      const proximo = createEl("button", {
        className: "button button-primary",
        text: "Entendi",
        attrs: { type: "button" },
      });
      proximo.addEventListener("click", advanceTour);
      acoes.push(proximo);
    }

    const topoPx = posicionarTopo();
    const bubble = createEl("div", {
      className: `tour-bubble${step.type === "acao" ? " is-acao" : ""}`,
      attrs: topoPx != null ? { style: `top: ${topoPx}px` } : {},
      children: [
        createEl("span", { className: "tour-bubble-step", text: `${indice + 1} de ${TOUR_STEPS.length}` }),
        createEl("h3", { className: "tour-bubble-title", text: step.title }),
        createEl("p", { className: "tour-bubble-text", text: step.text }),
        createEl("div", { className: "tour-bubble-actions", children: acoes }),
      ],
    });

    const filhos = [bubble];
    if (step.type === "nav") {
      const ponto = posicionarAnel(step.target);
      if (ponto) {
        filhos.unshift(
          createEl("div", {
            className: "tour-ring",
            attrs: { style: `left:${ponto.x}px; top:${ponto.y}px` },
          })
        );
      }
    }

    overlay.replaceChildren(...filhos);
  }

  subscribe(render);
  window.addEventListener("hashchange", () => requestAnimationFrame(render));
  window.addEventListener("resize", render);
  render();
}
