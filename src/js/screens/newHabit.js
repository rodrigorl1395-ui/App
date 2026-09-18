import { createEl, createCreatureBadge, accentStyle } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate } from "../router.js";
import { HABIT_TEMPLATES, CUSTOM_TEMPLATE } from "../../data/habits.js";
import { getTreeType } from "../../data/trees.js";
import { CATEGORY_LABELS, getElement } from "../../data/animals.js";
import { createHabit } from "../habits.js";
import { getUnlockedAnimals, getSuggestedElement } from "../companion.js";

const MISSION_FIELDS = [
  { key: "minimal", label: "Mínima", hint: "O menor passo que mantém o vínculo." },
  { key: "main", label: "Principal", hint: "O objetivo planejado do dia." },
  { key: "bonus", label: "Bônus", hint: "Quando o dia render mais que o esperado." },
];

export function renderNewHabitScreen() {
  let template = HABIT_TEMPLATES[0];

  const backLink = createEl("a", {
    className: "link-button",
    text: "Voltar",
    attrs: { href: "#/hoje" },
  });

  const header = createEl("div", {
    className: "screen-header",
    children: [createEl("h1", { className: "section-title", text: "Novo hábito" }), backLink],
  });

  const chips = new Map();
  const chipRow = createEl("div", {
    className: "chip-row",
    children: [...HABIT_TEMPLATES, CUSTOM_TEMPLATE].map((item) => {
      const chip = createEl("button", {
        className: "chip",
        attrs: { type: "button", style: `--habit-color: ${item.color}` },
        children: [
          createEl("span", { className: "chip-icon", children: [createIcon(item.icon)] }),
          createEl("span", { text: item.id === "custom" ? "Do meu jeito" : item.name }),
        ],
      });
      chip.addEventListener("click", () => applyTemplate(item));
      chips.set(item.id, chip);
      return chip;
    }),
  });

  const nameInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "habit-name", placeholder: "Ex.: Correr" },
  });
  const unitInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "habit-unit", placeholder: "min" },
  });

  const missionInputs = {};
  const missionFields = MISSION_FIELDS.map(({ key, label, hint }) => {
    const input = createEl("input", {
      className: "input",
      attrs: { type: "number", min: "0", step: "1", id: `habit-${key}` },
    });
    missionInputs[key] = input;
    return createEl("div", {
      className: "form-field",
      children: [
        createEl("label", { className: "form-label", text: label, attrs: { for: `habit-${key}` } }),
        input,
        createEl("span", { className: "form-hint", text: hint }),
      ],
    });
  });

  const treeHint = createEl("p", { className: "tree-hint" });
  const errorText = createEl("p", { className: "form-error" });
  const companionHint = createEl("p", { className: "tree-hint" });

  // Só criaturas já conquistadas. As do elemento da categoria vêm primeiro,
  // porque são as que combinam com o que este hábito treina.
  let selectedAnimalId = null;
  const companionCards = new Map();
  const companionPicker = createEl("div", { className: "companion-picker" });

  function buildCompanionPicker(category) {
    const preferred = getSuggestedElement(category);
    const available = getUnlockedAnimals().slice().sort((a, b) => {
      const rank = (animal) => (animal.element === preferred ? 0 : 1);
      return rank(a) - rank(b);
    });

    companionCards.clear();
    companionPicker.replaceChildren();

    for (const animal of available) {
      const card = createEl("button", {
        className: "companion-option",
        attrs: { type: "button", style: accentStyle(animal.color) },
        children: [
          createCreatureBadge({ animal, progress: 0 }),
          createEl("span", { className: "companion-option-name", text: animal.name }),
        ],
      });
      card.addEventListener("click", () => selectCompanion(animal.id));
      companionCards.set(animal.id, card);
      companionPicker.appendChild(card);
    }

    selectCompanion(available[0].id);

    const preferredLabel = preferred ? getElement(preferred).label.toLowerCase() : null;
    companionHint.textContent = preferredLabel
      ? `Hábitos de ${CATEGORY_LABELS[category] || category} alimentam o elemento ${preferredLabel} e liberam criaturas desse elemento.`
      : "Escolha quem vai crescer junto com este hábito.";
  }

  function selectCompanion(id) {
    selectedAnimalId = id;
    companionCards.forEach((card, cardId) => {
      card.classList.toggle("is-selected", cardId === id);
    });
  }

  const saveButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Criar hábito",
    attrs: { type: "submit" },
  });

  const form = createEl("form", {
    className: "habit-form",
    children: [
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", {
            className: "form-label",
            text: "Nome do hábito",
            attrs: { for: "habit-name" },
          }),
          nameInput,
        ],
      }),
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", {
            className: "form-label",
            text: "Unidade de medida",
            attrs: { for: "habit-unit" },
          }),
          unitInput,
        ],
      }),
      createEl("h3", { className: "form-section-title", text: "Missões do dia" }),
      createEl("div", { className: "form-row", children: missionFields }),
      treeHint,
      createEl("h3", { className: "form-section-title", text: "Quem cresce com este hábito" }),
      companionHint,
      companionPicker,
      errorText,
      saveButton,
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  function applyTemplate(item) {
    template = item;
    chips.forEach((chip, id) => chip.classList.toggle("is-selected", id === item.id));
    nameInput.value = item.name;
    unitInput.value = item.unit;
    for (const { key } of MISSION_FIELDS) {
      missionInputs[key].value = item.missions[key];
    }
    treeHint.textContent = `Este hábito planta: ${getTreeType(item.treeType).name}.`;
    buildCompanionPicker(item.category);
    errorText.textContent = "";
  }

  function submit() {
    const name = nameInput.value.trim();
    const unit = unitInput.value.trim() || "vezes";
    const missions = {
      minimal: Number(missionInputs.minimal.value),
      main: Number(missionInputs.main.value),
      bonus: Number(missionInputs.bonus.value),
    };

    if (!name) {
      errorText.textContent = "Dê um nome ao hábito.";
      nameInput.focus();
      return;
    }
    if (!(missions.main > 0)) {
      errorText.textContent = "A missão principal precisa ser maior que zero.";
      missionInputs.main.focus();
      return;
    }
    if (missions.minimal > missions.main || missions.main > missions.bonus) {
      errorText.textContent = "As metas devem crescer: mínima ≤ principal ≤ bônus.";
      return;
    }

    createHabit({
      name,
      unit,
      missions,
      color: template.color,
      icon: template.icon,
      treeType: template.treeType,
      category: template.category,
      animalId: selectedAnimalId,
    });
    navigate("/hoje");
  }

  applyTemplate(template);

  return createEl("div", { className: "screen", children: [header, chipRow, form] });
}
