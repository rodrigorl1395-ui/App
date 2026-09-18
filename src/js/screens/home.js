import { createEl, createEmptyState, createSectionHeader, accentStyle, showDiscovery } from "../ui.js";
import { createIcon, createTree } from "../icons.js";
import { navigate, refresh } from "../router.js";
import { getSceneCreatures, getStartPosition, getTreePosition, pickTarget, depthScale } from "../garden.js";
import { getMoodMessage } from "../mood.js";
import { getGreeting, getTouchLine } from "../dialogue.js";
import { collectDiscovery } from "../discoveries.js";
import { getTreeType } from "../../data/trees.js";
import { getElement } from "../../data/animals.js";

const WANDER_MIN_MS = 3200;
const WANDER_MAX_MS = 7000;

export function renderHomeScreen() {
  const creatures = getSceneCreatures();

  if (!creatures.length) {
    return createEl("div", {
      className: "screen",
      children: [
        createSectionHeader("Lar"),
        createEmptyState(
          "Seu lar está vazio. Cada hábito traz uma criatura para morar aqui, com a própria árvore."
        ),
      ],
    });
  }

  const scene = createEl("div", { className: "home-scene" });
  scene.appendChild(createEl("div", { className: "home-ground" }));

  const positions = creatures.map((_, index) => getStartPosition(index, creatures.length));
  const timers = [];

  // Uma árvore por hábito, espalhadas ao fundo; as criaturas circulam na frente.
  const allTrees = creatures.map((creature) => creature.tree);
  allTrees.forEach((item, treeIndex) => {
    const treeType = getTreeType(item.habit.treeType);
    const treePosition = getTreePosition(treeIndex, allTrees.length);
    scene.appendChild(
      createEl("div", {
        className: "home-tree",
        attrs: {
          style: `left: ${treePosition.x}%; top: ${treePosition.y}%; --tree-scale: ${
            0.75 + item.stage.stage * 0.14
          }`,
          title: `${item.habit.name} — ${treeType.name}, ${item.stage.name}`,
        },
        children: [createTree(item.stage.stage, treeType.leaf)],
      })
    );
  });

  creatures.forEach((creature, index) => {
    const position = positions[index];

    const orb = createEl("div", {
      className: "home-creature-orb",
      children: [createIcon(getElement(creature.animal.element).icon)],
    });

    const bubble = createEl("div", {
      className: "home-bubble",
      children: [
        createEl("span", {
          className: "home-bubble-icon",
          children: [createIcon(creature.activity.icon)],
        }),
        createEl("span", { text: creature.activity.verb }),
      ],
    });

    // Quem tem algo para entregar chama atenção: é o que dá vontade de tocar.
    const badge = creature.pendingDiscovery
      ? createEl("span", { className: "home-gift", attrs: { "aria-hidden": "true" } })
      : null;

    const el = createEl("button", {
      className: `home-creature motion-${creature.activity.motion}${creature.done ? " is-done" : ""}`,
      attrs: {
        type: "button",
        style: `${accentStyle(creature.animal.color)}; left: ${position.x}%; top: ${
          position.y
        }%; --depth: ${depthScale(position.y)}`,
        "aria-label": creature.pendingDiscovery
          ? `${creature.animal.name} encontrou algo para você.`
          : `${creature.animal.name}, ${creature.activity.verb}. Tocar para conversar.`,
      },
      children: [
        orb,
        badge,
        bubble,
        createEl("span", { className: "home-creature-name", text: creature.animal.name }),
      ],
    });

    /*
      Tocar na criatura não abre mais a missão direto: ela responde. É o
      segundo motivo de abrir o app — o hábito é uma vez por dia, mas ela
      sempre tem algo a dizer, e às vezes algo a entregar.
    */
    el.addEventListener("click", () => {
      if (creature.pendingDiscovery) {
        const discovery = creature.pendingDiscovery;
        showDiscovery(discovery, creature.animal, () => {
          collectDiscovery(discovery, creature.habit);
          refresh();
        });
        return;
      }
      say(el, bubble, getTouchLine(creature.animal), creature);
    });
    scene.appendChild(el);

    if (creature.wanders) {
      scheduleWander(el, index);
    }
  });

  /*
    Passeio: um alvo novo de tempos em tempos e o CSS faz a viagem. Sem loop
    de animação em JS — barato o suficiente para rodar num celular fraco.
  */
  function scheduleWander(el, index) {
    const delay = WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS);
    const timer = setTimeout(() => {
      const others = positions.filter((_, i) => i !== index);
      const target = pickTarget(positions[index], others);
      positions[index] = target;
      el.style.left = `${target.x}%`;
      el.style.top = `${target.y}%`;
      el.style.setProperty("--depth", String(depthScale(target.y)));
      scheduleWander(el, index);
    }, delay);
    timers.push(timer);
  }

  // A tela é trocada inteira pelo router; sem isso os temporizadores
  // continuariam mexendo em elementos que já saíram da página.
  const observer = new MutationObserver(() => {
    if (!document.body.contains(scene)) {
      timers.forEach(clearTimeout);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // A criatura fala ao chegar, e a fala some sozinha para não virar legenda fixa.
  function say(el, bubble, text, creature) {
    el.classList.add("is-talking");
    bubble.replaceChildren(createEl("span", { text }));
    bubble.classList.add("is-speech");
    clearTimeout(el.dataset.speechTimer);
    const timer = setTimeout(() => {
      bubble.classList.remove("is-speech");
      el.classList.remove("is-talking");
      bubble.replaceChildren(
        createEl("span", { className: "home-bubble-icon", children: [createIcon(creature.activity.icon)] }),
        createEl("span", { text: creature.activity.verb })
      );
    }, 4200);
    timers.push(timer);
    el.dataset.speechTimer = String(timer);
  }

  // A criatura fala assim que a cena abre — a visita nunca começa em silêncio.
  const greeting = createEl("p", {
    className: "home-greeting",
    text: creatures.length ? getGreeting(creatures[0].animal, creatures[0].habit.id) : "",
  });

  const actions = createEl("div", {
    className: "home-actions",
    children: creatures.map((creature) =>
      createEl("button", {
        className: `button ${creature.done ? "button-secondary" : "button-primary"}`,
        text: creature.done
          ? `${creature.habit.name} — já foi hoje`
          : `Cumprir ${creature.habit.name}`,
        attrs: { type: "button" },
      })
    ),
  });
  actions.childNodes.forEach((button, index) => {
    button.addEventListener("click", () => navigate(`/missao?habit=${creatures[index].habit.id}`));
  });

  const faminta = creatures.find((creature) => !creature.done);
  const legend = createEl("p", {
    className: "tree-hint",
    text: faminta
      ? getMoodMessage(faminta.animal, faminta.habit.id)
      : "Todo mundo foi alimentado hoje. O lar está em paz.",
  });

  return createEl("div", {
    className: "screen",
    children: [createSectionHeader("Lar"), greeting, scene, legend, actions],
  });
}
