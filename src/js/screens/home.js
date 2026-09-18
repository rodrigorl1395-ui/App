import { createEl, createEmptyState, createSectionHeader, accentStyle } from "../ui.js";
import { createIcon, createTree } from "../icons.js";
import { navigate } from "../router.js";
import { getSceneCreatures, getStartPosition, getTreePosition, pickTarget, depthScale } from "../garden.js";
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
  const allTrees = creatures.flatMap((creature) => creature.trees);
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

    // Só quem já cumpriu mostra o balão do que está fazendo. Com todos
    // mostrando, os balões se sobrepõem e a cena vira uma parede de texto.
    const bubble = creature.done
      ? createEl("div", {
          className: "home-bubble",
          children: [
            createEl("span", {
              className: "home-bubble-icon",
              children: [createIcon(creature.activity.icon)],
            }),
            createEl("span", { text: creature.activity.verb }),
          ],
        })
      : null;

    const el = createEl("button", {
      className: `home-creature motion-${creature.activity.motion}${creature.done ? " is-done" : ""}`,
      attrs: {
        type: "button",
        style: `${accentStyle(creature.animal.color)}; left: ${position.x}%; top: ${
          position.y
        }%; --depth: ${depthScale(position.y)}`,
        "aria-label": `${creature.animal.name}, ${creature.activity.verb}. Abrir missão de ${creature.targetHabit.name}.`,
      },
      children: [orb, bubble, createEl("span", { className: "home-creature-name", text: creature.animal.name })],
    });

    el.addEventListener("click", () => navigate(`/missao?habit=${creature.targetHabit.id}`));
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

  const legend = createEl("p", {
    className: "tree-hint",
    text: creatures.every((creature) => creature.done)
      ? "Todo mundo cumpriu hoje. O lar está em paz."
      : "Quem ainda não cumpriu o hábito de hoje está te esperando.",
  });

  return createEl("div", {
    className: "screen",
    children: [createSectionHeader("Lar"), scene, legend],
  });
}
