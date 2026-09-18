import { createEl, createCreatureBadge, accentStyle } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate } from "../router.js";
import { HABIT_TEMPLATES, CUSTOM_TEMPLATE } from "../../data/habits.js";
import { getTreeType } from "../../data/trees.js";
import { CATEGORY_ELEMENT, CATEGORY_LABELS, getElement } from "../../data/animals.js";
import { createHabit } from "../habits.js";
import { getAvailableAnimals } from "../companion.js";

const MISSION_FIELDS = [
  { key: "minimal", label: "Mínima", hint: "O menor passo que mantém o vínculo." },
  { key: "main", label: "Principal", hint: "O objetivo planejado do dia." },
  { key: "bonus", label: "Bônus", hint: "Quando o dia render mais que o esperado." },
];

export function renderNewHabitScreen() {
  const available = getAvailableAnimals();

  const backLink = createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } });
  const header = createEl("div", {
    className: "screen-header",
    children: [createEl("h1", { className: "section-title", text: "Novo hábito" }), backLink],
  });

  // Sem criatura livre não há hábito novo: é o freio que faz construir aos poucos.
  if (!available.length) {
    return createEl("div", {
      className: "screen",
      children: [
        header,
        createEl("section", {
          className: "card",
          children: [
            createEl("h2", { className: "card-title", text: "Todas as suas criaturas já têm um hábito" }),
            createEl("p", {
              className: "card-subtitle",
              text: "Cada criatura cuida de um hábito só. Para assumir mais um, conquiste a próxima criatura mantendo a constância no que você já começou.",
            }),
            createEl("a", {
              className: "button button-primary button-block",
              text: "Ver o santuário",
              attrs: { href: "#/santuario" },
            }),
          ],
        }),
      ],
    });
  }

  let animal = available[0];
  let template = null;

  const animalCards = new Map();
  const animalPicker = createEl("div", {
    className: "companion-picker",
    children: available.map((option) => {
      const card = createEl("button", {
        className: "companion-option",
        attrs: { type: "button", style: accentStyle(option.color) },
        children: [
          createCreatureBadge({ animal: option, progress: 0 }),
          createEl("span", { className: "companion-option-name", text: option.name }),
        ],
      });
      card.addEventListener("click", () => selectAnimal(option));
      animalCards.set(option.id, card);
      return card;
    }),
  });

  const animalHint = createEl("p", { className: "tree-hint" });
  const chipRow = createEl("div", { className: "chip-row" });
  const chips = new Map();

  const nameInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "habit-name", placeholder: "Ex.: Ir à academia" },
  });
  const unitInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "habit-unit", placeholder: "min" },
  });

  const weeklyInput = createEl("input", {
    className: "input",
    attrs: { type: "number", min: "1", max: "7", step: "1", id: "habit-weekly" },
  });
  weeklyInput.value = "7";

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

  const form = createEl("form", {
    className: "habit-form",
    children: [
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", { className: "form-label", text: "Nome do hábito", attrs: { for: "habit-name" } }),
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
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", {
            className: "form-label",
            text: "Quantos dias por semana",
            attrs: { for: "habit-weekly" },
          }),
          weeklyInput,
          createEl("span", {
            className: "form-hint",
            text: "O que você combina consigo. Um dia fora da meta não é falha.",
          }),
        ],
      }),
      createEl("h3", { className: "form-section-title", text: "Missões do dia" }),
      createEl("div", { className: "form-row", children: missionFields }),
      treeHint,
      errorText,
      createEl("button", {
        className: "button button-primary button-block",
        text: "Criar hábito",
        attrs: { type: "submit" },
      }),
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  /*
    A criatura define o terreno: só aparecem os hábitos cujo domínio é o
    elemento dela, mais o livre. É o que amarra "meu animal é de energia,
    então meus hábitos são de energia".
  */
  function selectAnimal(option) {
    animal = option;
    animalCards.forEach((card, id) => card.classList.toggle("is-selected", id === option.id));

    const element = getElement(option.element);
    const matching = HABIT_TEMPLATES.filter(
      (item) => CATEGORY_ELEMENT[item.category] === option.element
    );
    const categorias = [...new Set(matching.map((item) => CATEGORY_LABELS[item.category]))].join(" e ");

    animalHint.textContent = `${option.name} é de ${element.label.toLowerCase()} e cuida de hábitos de ${categorias}.`;

    chips.clear();
    chipRow.replaceChildren();
    for (const item of [...matching, CUSTOM_TEMPLATE]) {
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
      chipRow.appendChild(chip);
    }

    applyTemplate(matching[0] || CUSTOM_TEMPLATE);
  }

  function applyTemplate(item) {
    template = item;
    chips.forEach((chip, id) => chip.classList.toggle("is-selected", id === item.id));
    nameInput.value = item.name;
    unitInput.value = item.unit;
    for (const { key } of MISSION_FIELDS) {
      missionInputs[key].value = item.missions[key];
    }
    treeHint.textContent = `Este hábito planta: ${getTreeType(item.treeType).name}.`;
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
      animalId: animal.id,
      weeklyTarget: Math.min(7, Math.max(1, Number(weeklyInput.value) || 7)),
    });
    navigate("/hoje");
  }

  selectAnimal(animal);

  return createEl("div", {
    className: "screen",
    children: [
      header,
      createEl("h3", { className: "form-section-title", text: "Quem vai cuidar dele" }),
      animalPicker,
      animalHint,
      chipRow,
      form,
    ],
  });
}
