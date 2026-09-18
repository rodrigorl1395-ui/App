import { createEl } from "../ui.js";
import { navigate } from "../router.js";
import { getHabits, updateHabit } from "../habits.js";

/*
  Só o que dá para mudar sem reescrever a história: nome, unidade, metas e
  quantos dias por semana. A criatura e a categoria ficam de fora — elas
  definem o elemento e já geraram registros, conquistas e achados.
*/
const MISSION_FIELDS = [
  { key: "minimal", label: "Mínima" },
  { key: "main", label: "Principal" },
  { key: "bonus", label: "Bônus" },
];

export function renderEditHabitScreen(params) {
  const habit = getHabits().find((item) => item.id === params.habit);
  if (!habit) {
    navigate("/habitos");
    return createEl("div", { className: "screen" });
  }

  const nameInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "edit-name" },
  });
  nameInput.value = habit.name;

  const unitInput = createEl("input", { className: "input", attrs: { type: "text", id: "edit-unit" } });
  unitInput.value = habit.unit;

  const weeklyInput = createEl("input", {
    className: "input",
    attrs: { type: "number", min: "1", max: "7", step: "1", id: "edit-weekly" },
  });
  weeklyInput.value = String(habit.weeklyTarget || 7);

  const missionInputs = {};
  const missionFields = MISSION_FIELDS.map(({ key, label }) => {
    const input = createEl("input", {
      className: "input",
      attrs: { type: "number", min: "0", step: "1", id: `edit-${key}` },
    });
    input.value = String(habit.missions[key]);
    missionInputs[key] = input;
    return createEl("div", {
      className: "form-field",
      children: [
        createEl("label", { className: "form-label", text: label, attrs: { for: `edit-${key}` } }),
        input,
      ],
    });
  });

  const errorText = createEl("p", { className: "form-error" });

  const form = createEl("form", {
    className: "habit-form",
    children: [
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", { className: "form-label", text: "Nome", attrs: { for: "edit-name" } }),
          nameInput,
        ],
      }),
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", { className: "form-label", text: "Unidade", attrs: { for: "edit-unit" } }),
          unitInput,
        ],
      }),
      createEl("div", {
        className: "form-field",
        children: [
          createEl("label", {
            className: "form-label",
            text: "Dias por semana",
            attrs: { for: "edit-weekly" },
          }),
          weeklyInput,
        ],
      }),
      createEl("h3", { className: "form-section-title", text: "Missões do dia" }),
      createEl("div", { className: "form-row", children: missionFields }),
      createEl("p", {
        className: "form-hint",
        text: "Mudar as metas não altera o que já foi registrado: o histórico guarda o que você fez naquele dia.",
      }),
      errorText,
      createEl("button", {
        className: "button button-primary button-block",
        text: "Salvar",
        attrs: { type: "submit" },
      }),
    ],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const missions = {
      minimal: Number(missionInputs.minimal.value),
      main: Number(missionInputs.main.value),
      bonus: Number(missionInputs.bonus.value),
    };

    if (!name) {
      errorText.textContent = "O hábito precisa de um nome.";
      return;
    }
    if (!(missions.main > 0)) {
      errorText.textContent = "A missão principal precisa ser maior que zero.";
      return;
    }
    if (missions.minimal > missions.main || missions.main > missions.bonus) {
      errorText.textContent = "As metas devem crescer: mínima ≤ principal ≤ bônus.";
      return;
    }

    updateHabit(habit.id, {
      name,
      unit: unitInput.value.trim() || "vezes",
      missions,
      weeklyTarget: Math.min(7, Math.max(1, Number(weeklyInput.value) || 7)),
    });
    navigate("/habitos");
  });

  return createEl("div", {
    className: "screen",
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Editar hábito" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/habitos" } }),
        ],
      }),
      form,
    ],
  });
}
