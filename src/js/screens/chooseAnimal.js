import { createEl } from "../ui.js";
import { createElementalIcon } from "../icons.js";
import { navigate } from "../router.js";
import { getState, setState } from "../state.js";
import { ANIMALS } from "../../data/animals.js";

export function renderChooseAnimalScreen() {
  let selectedId = null;

  const header = createEl("div", {
    className: "animal-choice-header",
    children: [
      createEl("h1", { text: "Qual elemento é o seu?" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Essa escolha é o coração da sua jornada — mas todo hábito continua disponível, seja qual for o companheiro.",
      }),
    ],
  });

  const cards = new Map();

  const list = createEl("div", {
    className: "animal-choice-list",
    children: ANIMALS.map((animal) => {
      const traits = createEl("div", {
        className: "animal-card-traits",
        children: animal.traits.map((trait) => createEl("span", { className: "badge", text: trait })),
      });

      const body = createEl("div", {
        className: "animal-card-body",
        children: [
          createEl("span", { className: "animal-card-name", text: `${animal.name} · ${animal.elementLabel}` }),
          createEl("span", { className: "animal-card-tagline", text: animal.tagline }),
          traits,
        ],
      });

      const orb = createEl("div", { className: "animal-orb" });
      orb.appendChild(createElementalIcon(animal.element));

      const check = createEl("span", { className: "animal-card-check" });

      const card = createEl("button", {
        className: "animal-card",
        attrs: { type: "button", "data-animal": animal.id },
        children: [orb, body, check],
      });

      card.addEventListener("click", () => selectAnimal(animal.id));
      cards.set(animal.id, card);
      return card;
    }),
  });

  const confirmButton = createEl("button", {
    className: "button button-primary button-block",
    attrs: { type: "button", disabled: "true" },
    text: "Confirmar companheiro",
  });
  confirmButton.disabled = true;
  confirmButton.addEventListener("click", () => {
    if (!selectedId) return;
    const state = getState();
    setState({
      user: {
        ...state.user,
        selectedAnimalId: selectedId,
        createdAt: state.user?.createdAt || new Date().toISOString(),
      },
    });
    document.body.dataset.animal = selectedId;
    navigate("/hoje");
  });

  function selectAnimal(id) {
    selectedId = id;
    cards.forEach((card, cardId) => {
      card.classList.toggle("is-selected", cardId === id);
    });
    confirmButton.disabled = false;
  }

  const actions = createEl("div", { className: "onboarding-actions", children: [confirmButton] });

  return createEl("div", {
    className: "screen immersive-screen",
    children: [header, list, actions],
  });
}
