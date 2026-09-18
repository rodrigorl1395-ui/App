import { createEl, createEmptyState, createHabitRow, createSectionHeader } from "../ui.js";
import { navigate } from "../router.js";
import { getHabits } from "../habits.js";
import { isDoneToday } from "../missions.js";
import { getCompanionState } from "../companion.js";
import { getMood } from "../mood.js";
import { getCurrentQuest } from "../quests.js";
import { getPendingDiscovery } from "../discoveries.js";
import { formatDateLong } from "../utils.js";

function summaryText(done, total) {
  if (done === 0) return "Nenhum cumprido ainda hoje.";
  if (done === total) return "Tudo cumprido hoje. O jardim agradece.";
  return `${done} de ${total} cumpridos hoje.`;
}

// A missão da jornada em uma linha: o que falta para a próxima conquista.
function questLine(habit) {
  const current = getCurrentQuest(habit);
  if (!current) return null;

  return createEl("p", {
    className: "tree-hint",
    text: `${current.quest.name} — ${current.main.current} de ${current.main.target}`,
  });
}

/*
  Cumprir o hábito levava a um beco sem saída: o dia acabava e não havia mais
  nada a fazer. Aqui a tela oferece o que ainda tem vida — a criatura esperando
  no Lar, um achado por receber, a história até agora.
*/
function renderNextSteps(habits, doneCount) {
  if (!habits.length) return null;

  const pendentes = [];
  const comAchado = habits.filter((habit) => {
    const animal = getCompanionState(habit).animal;
    return getPendingDiscovery(habit, animal);
  });

  if (comAchado.length) {
    pendentes.push({
      text: `${getCompanionState(comAchado[0]).animal?.name} encontrou algo para você`,
      action: "Ir ao Lar",
      path: "/lar",
    });
  }

  if (doneCount === habits.length) {
    pendentes.push({
      text: "Sua criatura está livre no Lar. Ela responde se você tocar.",
      action: "Visitar o Lar",
      path: "/lar",
    });
  }

  pendentes.push({
    text: "Veja a jornada, o calendário e a história do seu hábito.",
    action: "Abrir perfil",
    path: `/criatura?habit=${habits[0].id}`,
  });

  return createEl("section", {
    className: "next-steps",
    children: [
      createEl("h2", { className: "section-title", text: "E agora" }),
      ...pendentes.map((item) => {
        const button = createEl("button", {
          className: "next-step",
          attrs: { type: "button" },
          children: [
            createEl("span", { className: "next-step-text", text: item.text }),
            createEl("span", { className: "link-button", text: item.action }),
          ],
        });
        button.addEventListener("click", () => navigate(item.path));
        return button;
      }),
    ],
  });
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
        text: habits.length
          ? summaryText(doneCount, habits.length)
          : "Comece criando o primeiro hábito.",
      }),
    ],
  });

  const habitsContent = habits.length
    ? createEl("div", {
        className: "habit-list",
        children: habits.map((habit) =>
          createEl("div", {
            className: "habit-item",
            children: [
              createHabitRow(habit, {
                done: isDoneToday(habit.id),
                companion: getCompanionState(habit),
                mood: getMood(habit.id),
                onClick: () => navigate(`/missao?habit=${habit.id}`),
              }),
              questLine(habit),
            ],
          })
        ),
      })
    : createEmptyState(
        "Nenhum hábito ainda. Cada hábito ganha uma criatura que cresce junto com ele."
      );

  return createEl("div", {
    className: "screen",
    children: [
      heading,
      createSectionHeader("Hábitos de hoje", newHabitLink),
      habitsContent,
      renderNextSteps(habits, doneCount),
    ],
  });
}
