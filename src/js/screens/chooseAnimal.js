import { createEl, createCreatureBadge, accentStyle } from "../ui.js";
import { navigate } from "../router.js";
import { getState, setState } from "../state.js";
import { getElement } from "../../data/animals.js";
import { getUnlockedAnimals } from "../companion.js";

export function renderChooseAnimalScreen() {
  let selectedId = null;

  const header = createEl("div", {
    className: "animal-choice-header",
    children: [
      createEl("h1", { text: "Quem começa com você?" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Cada hábito seu terá uma criatura que cresce junto com ele. Esta é a primeira — outras se juntam conforme sua constância.",
      }),
    ],
  });

  const cards = new Map();

  const list = createEl("div", {
    className: "animal-choice-list",
    children: getUnlockedAnimals().map((animal) => {
      const body = createEl("div", {
        className: "animal-card-body",
        children: [
          createEl("span", { className: "animal-card-name", text: animal.name }),
          createEl("span", {
            className: "animal-card-element",
            text: getElement(animal.element).label,
          }),
          createEl("span", { className: "animal-card-tagline", text: animal.tagline }),
        ],
      });

      const card = createEl("button", {
        className: "animal-card",
        attrs: { type: "button", style: accentStyle(animal.color) },
        children: [
          createCreatureBadge({ animal, progress: 0 }),
          body,
          createEl("span", { className: "animal-card-check" }),
        ],
      });

      card.addEventListener("click", () => selectAnimal(animal.id));
      cards.set(animal.id, card);
      return card;
    }),
  });

  const confirmButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Começar com esta criatura",
    attrs: { type: "button" },
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
    navigate("/hoje");
  });

  function selectAnimal(id) {
    selectedId = id;
    cards.forEach((card, cardId) => card.classList.toggle("is-selected", cardId === id));
    confirmButton.disabled = false;
  }

  const actions = createEl("div", { className: "onboarding-actions", children: [confirmButton] });

  return createEl("div", {
    className: "screen immersive-screen",
    children: [header, list, actions],
  });
}
