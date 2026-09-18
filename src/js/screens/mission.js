import { createEl, showCelebration } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate } from "../router.js";
import { getState } from "../state.js";
import { getHabits } from "../habits.js";
import { getAnimalById } from "../../data/animals.js";
import { MISSION_LEVELS, completeMission, isDoneToday } from "../missions.js";
import { getTreeType } from "../../data/trees.js";

const LEVEL_ORDER = [
  {
    key: "main",
    variant: "main",
    label: "Missão principal",
    hint: "O que você planejou para hoje.",
  },
  {
    key: "minimal",
    variant: "minimal",
    label: "Missão mínima",
    hint: "Num dia difícil, isto já mantém a corrente viva.",
  },
  {
    key: "bonus",
    variant: "bonus",
    label: "Missão bônus",
    hint: "Quando sobrar energia, vá além.",
  },
];

export function renderMissionScreen(params) {
  const habit = getHabits().find((item) => item.id === params.habit);

  if (!habit) {
    navigate("/hoje");
    return createEl("div", { className: "screen" });
  }

  const backLink = createEl("a", {
    className: "link-button",
    text: "Voltar",
    attrs: { href: "#/hoje" },
  });

  const header = createEl("div", {
    className: "screen-header",
    children: [
      createEl("div", {
        className: "habit-icon",
        attrs: { style: `--habit-color: ${habit.color}` },
        children: [createIcon(habit.icon)],
      }),
      backLink,
    ],
  });

  const intro = createEl("div", {
    className: "mission-intro",
    children: [
      createEl("h1", { className: "mission-title", text: habit.name }),
      createEl("p", {
        className: "mission-hint",
        text: isDoneToday(habit.id)
          ? "Você já cumpriu este hábito hoje. Pode registrar de novo se quiser ir além."
          : "Escolha o tamanho do passo de hoje. Qualquer um deles conta.",
      }),
    ],
  });

  const tiles = LEVEL_ORDER.map(({ key, variant, label, hint }) => {
    const tile = createEl("button", {
      className: `mission-tile mission-tile-${variant}`,
      attrs: { type: "button", style: `--habit-color: ${habit.color}` },
      children: [
        createEl("span", { className: "mission-label", text: label }),
        createEl("span", {
          className: "mission-goal",
          text: `${habit.missions[key]} ${habit.unit}`,
        }),
        createEl("span", { className: "mission-hint", text: hint }),
        createEl("span", { className: "mission-xp", text: `${MISSION_LEVELS[key].xp} XP` }),
      ],
    });

    tile.addEventListener("click", () => complete(key));
    return tile;
  });

  function complete(levelKey) {
    const result = completeMission(habit, levelKey);
    const animal = getAnimalById(getState().user?.selectedAnimalId);

    showCelebration(
      {
        xpEarned: result.xpEarned,
        message: `${habit.name} registrado. ${getTreeType(habit.treeType).name} recebeu água.`,
        element: animal?.element,
        evolutionText: result.evolved
          ? `${animal ? animal.name : "Seu companheiro"} agora é ${result.currentStage.name}`
          : null,
        note: result.evolved ? null : "Cada registro aproxima a próxima evolução.",
      },
      () => navigate("/hoje")
    );
  }

  return createEl("div", {
    className: "screen immersive-screen",
    children: [
      header,
      intro,
      createEl("div", { className: "mission-list", children: tiles }),
    ],
  });
}
