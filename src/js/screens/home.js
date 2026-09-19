import {
  createEl,
  createEmptyState,
  createSectionHeader,
  createScenePortal,
  accentStyle,
  showDiscovery,
} from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate, refresh } from "../router.js";
import {
  getSceneCreatures,
  getStartPosition,
  getFeedingActivity,
  pickTarget,
  depthScale,
} from "../garden.js";
import { getMoodMessage } from "../mood.js";
import { getGreeting, getTouchLine } from "../dialogue.js";
import { collectDiscovery } from "../discoveries.js";
import { getSeedsAvailable } from "../decor.js";
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
        createEmptyState("Seu lar está vazio. Cada hábito traz uma criatura para morar aqui."),
      ],
    });
  }

  const scene = createEl("div", { className: "home-scene" });
  scene.appendChild(createEl("div", { className: "home-ground" }));
  // O Jardim é o terreno vizinho, não outra tela: a porta fica colada na
  // borda da cena, com um vislumbre — brotar aqui, e há mais do outro lado.
  scene.appendChild(
    createScenePortal({
      href: "#/jardim",
      label: "Jardim",
      side: "right",
      icon: createIcon("sprout"),
    })
  );

  const positions = creatures.map((_, index) => getStartPosition(index, creatures.length));
  const bubbles = [];
  // A atividade muda durante a visita (ela sai para comer e volta), então o
  // balão precisa saber o que está valendo agora, não só o que valia ao abrir.
  const activities = creatures.map((creature) => creature.activity);
  const passeios = creatures.map(() => 0);
  const timers = [];

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
      say(el, bubble, getTouchLine(creature.animal), index);
    });
    bubbles[index] = bubble;
    scene.appendChild(el);

    if (creature.wanders) {
      scheduleWander(el, index);
    }
  });

  /*
    Passeio: um alvo novo de tempos em tempos e o CSS faz a viagem. Sem loop
    de animação em JS — barato o suficiente para rodar num celular fraco.

    A árvore de cada hábito mora no Jardim agora, não aqui — mas o estado
    dela continua aparecendo na criatura: a cada três paradas, o balão conta
    como anda a fome dela (comendo bem, com sede, dormindo com fome), o
    mesmo estado que a árvore de lá está mostrando.
  */
  function scheduleWander(el, index) {
    const delay = WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS);
    const timer = setTimeout(() => {
      passeios[index] += 1;
      const checaFome = passeios[index] % 3 === 0;

      const target = pickTarget(
        positions[index],
        positions.filter((_, i) => i !== index)
      );

      positions[index] = target;
      el.style.left = `${target.x}%`;
      el.style.top = `${target.y}%`;
      el.style.setProperty("--depth", String(depthScale(target.y)));

      setActivity(
        el,
        index,
        checaFome ? getFeedingActivity(creatures[index]) : creatures[index].activity
      );

      scheduleWander(el, index);
    }, delay);
    timers.push(timer);
  }

  // Troca o que a criatura está fazendo: a classe de movimento e o balão.
  function setActivity(el, index, activity) {
    const anterior = activities[index];
    el.classList.remove(`motion-${anterior.motion}`);
    el.classList.add(`motion-${activity.motion}`);
    activities[index] = activity;
    if (!bubbles[index].classList.contains("is-speech")) restoreBubble(index);
  }

  function restoreBubble(index) {
    const activity = activities[index];
    bubbles[index].replaceChildren(
      createEl("span", {
        className: "home-bubble-icon",
        children: [createIcon(activity.icon)],
      }),
      createEl("span", { text: activity.verb })
    );
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
  function say(el, bubble, text, index) {
    el.classList.add("is-talking");
    bubble.replaceChildren(createEl("span", { text }));
    bubble.classList.add("is-speech");
    clearTimeout(el.dataset.speechTimer);
    const timer = setTimeout(() => {
      bubble.classList.remove("is-speech");
      el.classList.remove("is-talking");
      // Volta para o que ela está fazendo agora, que pode ter mudado enquanto
      // ela falava — se voltasse para a atividade inicial, comer sumiria.
      restoreBubble(index);
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
  const regadas = creatures.filter((creature) => creature.done).length;
  const legend = createEl("div", {
    className: "home-legend",
    children: [
      createEl("p", {
        className: "tree-hint",
        text: faminta
          ? getMoodMessage(faminta.animal, faminta.habit.id)
          : "Todo mundo comeu hoje. O lar está em paz.",
      }),
      createEl("p", {
        className: "tree-hint",
        text: `${regadas} de ${creatures.length} ${
          creatures.length === 1 ? "árvore regada" : "árvores regadas"
        } hoje. Cumprir o hábito é a água — visite o Jardim para ver como cada uma está.`,
      }),
    ],
  });

  return createEl("div", {
    className: "screen",
    children: [createSectionHeader("Lar"), greeting, scene, legend, actions, renderGardenNudge()],
  });
}

/*
  O Jardim virou uma tela própria — separado do Lar de propósito, já que um
  é onde os guardiões vivem e o outro é só o que se planta por cima disso.
  Aqui fica só um lembrete discreto de que há sementes esperando, para quem
  ainda não descobriu a aba nova.
*/
function renderGardenNudge() {
  const seeds = getSeedsAvailable();
  if (!seeds) return null;

  return createEl("a", {
    className: "next-step",
    attrs: { href: "#/jardim" },
    children: [
      createEl("span", {
        className: "next-step-text",
        text: `${seeds} ${seeds === 1 ? "semente esperando" : "sementes esperando"} no Jardim.`,
      }),
      createEl("span", { className: "link-button", text: "Ir ao Jardim" }),
    ],
  });
}
