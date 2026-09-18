import {
  createEl,
  createEmptyState,
  createHabitRow,
  createSectionHeader,
  createCompanion,
} from "../ui.js";
import { navigate } from "../router.js";
import { getAnimalById } from "../../data/animals.js";
import { getHabits } from "../habits.js";
import { isDoneToday } from "../missions.js";
import { getStage, getNextStage, getStageProgress } from "../evolution.js";

function summaryText(done, total) {
  if (done === 0) return "Nenhum cumprido ainda hoje.";
  if (done === total) return "Tudo cumprido hoje. O jardim agradece.";
  return `${done} de ${total} cumpridos hoje.`;
}

export function renderTodayScreen(state) {
  const animal = getAnimalById(state.user?.selectedAnimalId);
  const habits = getHabits();
  const xp = state.user?.xp || 0;

  const stage = getStage(xp);
  const nextStage = getNextStage(xp);

  const companion = animal
    ? createCompanion({
        animal,
        stageName: stage.name,
        progress: getStageProgress(xp),
        caption: nextStage
          ? `${xp} de ${nextStage.minXp} XP para ${nextStage.name}`
          : `${xp} XP na forma lendária`,
      })
    : null;

  const newHabitLink = createEl("button", {
    className: "link-button",
    text: "Novo hábito",
    attrs: { type: "button" },
  });
  newHabitLink.addEventListener("click", () => navigate("/novo-habito"));

  const doneCount = habits.filter((habit) => isDoneToday(habit.id)).length;
  const summary = habits.length
    ? createEl("p", {
        className: "tree-hint",
        text: summaryText(doneCount, habits.length),
      })
    : null;

  const habitsContent = habits.length
    ? createEl("div", {
        className: "habit-list",
        children: habits.map((habit) =>
          createHabitRow(habit, {
            done: isDoneToday(habit.id),
            onClick: () => navigate(`/missao?habit=${habit.id}`),
          })
        ),
      })
    : createEmptyState("Nenhum hábito ainda. Crie o primeiro e plante sua primeira árvore.");

  return createEl("div", {
    className: "screen",
    children: [
      companion,
      createSectionHeader("Hábitos de hoje", newHabitLink),
      summary,
      habitsContent,
    ],
  });
}
