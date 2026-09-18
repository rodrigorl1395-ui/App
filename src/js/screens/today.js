import {
  createEl,
  createCard,
  createEmptyState,
  createHabitRow,
  createSectionHeader,
} from "../ui.js";
import { formatDateLong } from "../utils.js";
import { navigate } from "../router.js";
import { getAnimalById } from "../../data/animals.js";
import { getHabits } from "../habits.js";

export function renderTodayScreen(state) {
  const animal = getAnimalById(state.user?.selectedAnimalId);
  const habits = getHabits();

  const greeting = createEl("h1", { text: animal ? `Olá, ${animal.name}.` : "Olá." });
  const dateLine = createEl("p", { className: "card-subtitle", text: formatDateLong() });

  const companionCard = animal
    ? createCard({ title: `${animal.name} · ${animal.elementLabel}`, subtitle: animal.tagline, accent: true })
    : null;

  const newHabitLink = createEl("button", {
    className: "link-button",
    text: "Novo hábito",
    attrs: { type: "button" },
  });
  newHabitLink.addEventListener("click", () => navigate("/novo-habito"));

  const habitsContent = habits.length
    ? createEl("div", { className: "habit-list", children: habits.map((habit) => createHabitRow(habit)) })
    : createEmptyState("Nenhum hábito para hoje. Crie o primeiro e plante sua primeira árvore.");

  return createEl("div", {
    className: "screen",
    children: [
      greeting,
      dateLine,
      companionCard,
      createSectionHeader("Hábitos de hoje", newHabitLink),
      habitsContent,
    ],
  });
}
