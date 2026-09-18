import { createEl, createEmptyState, createHabitRow, createSectionHeader } from "../ui.js";
import { navigate } from "../router.js";
import { getHabits } from "../habits.js";
import { isDoneToday } from "../missions.js";
import { getCompanionState, getTotalXp } from "../companion.js";
import { formatDateLong } from "../utils.js";

function summaryText(done, total) {
  if (done === 0) return "Nenhum cumprido ainda hoje.";
  if (done === total) return "Tudo cumprido hoje. O jardim agradece.";
  return `${done} de ${total} cumpridos hoje.`;
}

export function renderTodayScreen() {
  const habits = getHabits();

  const newHabitLink = createEl("button", {
    className: "link-button",
    text: "Novo hábito",
    attrs: { type: "button" },
  });
  newHabitLink.addEventListener("click", () => navigate("/novo-habito"));

  const doneCount = habits.filter((habit) => isDoneToday(habit.id)).length;

  const heading = createEl("div", {
    className: "today-heading",
    children: [
      createEl("h1", { className: "today-date", text: formatDateLong() }),
      createEl("p", {
        className: "today-summary",
        text: habits.length ? summaryText(doneCount, habits.length) : `${getTotalXp()} XP acumulado`,
      }),
    ],
  });

  const habitsContent = habits.length
    ? createEl("div", {
        className: "habit-list",
        children: habits.map((habit) =>
          createHabitRow(habit, {
            done: isDoneToday(habit.id),
            companion: getCompanionState(habit),
            onClick: () => navigate(`/missao?habit=${habit.id}`),
          })
        ),
      })
    : createEmptyState(
        "Nenhum hábito ainda. Cada hábito ganha uma criatura que cresce junto com ele."
      );

  return createEl("div", {
    className: "screen",
    children: [heading, createSectionHeader("Hábitos de hoje", newHabitLink), habitsContent],
  });
}
