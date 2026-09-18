import { createEl, createCard, createEmptyState } from "../ui.js";
import { formatDateLong } from "../utils.js";

export function renderTodayScreen(state) {
  const greeting = createEl("h1", { text: "Olá." });
  const dateLine = createEl("p", {
    className: "card-subtitle",
    text: formatDateLong(),
  });

  const firstOpened = state.meta?.firstOpenedAt
    ? new Date(state.meta.firstOpenedAt)
    : null;

  const statusCard = createCard({
    title: "Fundação do app",
    subtitle: firstOpened
      ? `Este dispositivo usa o Pocket Habits desde ${formatDateLong(firstOpened)}.`
      : "Preparando seu espaço.",
    accent: true,
  });

  const nextStepsCard = createCard({
    title: "Próximos passos",
    children: [
      createEmptyState(
        "Em breve: escolha do seu animal-companheiro e criação do primeiro hábito."
      ),
    ],
  });

  return createEl("div", {
    className: "screen",
    children: [greeting, dateLine, statusCard, nextStepsCard],
  });
}
