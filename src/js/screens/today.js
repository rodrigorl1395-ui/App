import { createEl, createCard, createEmptyState } from "../ui.js";
import { formatDateLong } from "../utils.js";
import { getAnimalById } from "../../data/animals.js";

export function renderTodayScreen(state) {
  const animal = getAnimalById(state.user?.selectedAnimalId);

  const greeting = createEl("h1", { text: animal ? `Olá, ${animal.name}.` : "Olá." });
  const dateLine = createEl("p", {
    className: "card-subtitle",
    text: formatDateLong(),
  });

  const companionCard = animal
    ? createCard({
        title: `${animal.name} · ${animal.elementLabel}`,
        subtitle: animal.tagline,
        accent: true,
      })
    : null;

  const nextStepsCard = createCard({
    title: "Próximos passos",
    children: [
      createEmptyState("Em breve: criação do seu primeiro hábito e a missão do dia."),
    ],
  });

  return createEl("div", {
    className: "screen",
    children: [greeting, dateLine, companionCard, nextStepsCard],
  });
}
