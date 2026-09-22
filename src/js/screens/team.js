/*
  Equipe — sub-página do Santuário. Enquanto o Santuário mostra o catálogo
  inteiro (o que existe para conquistar), a Equipe mostra só quem já está
  com você: os guardiões conquistados, prontos ou já cuidando de um hábito.

  Pose parada, sem animação — a mesma arte estática do Santuário. Ver a
  criatura viva, se movendo pelo terreno, é papel do Jardim.
*/

import { createEl, createCreatureBadge, createSectionHeader, accentStyle } from "../ui.js";
import { getElement } from "../../data/animals.js";
import { getUnlockedAnimals, getUnlockableAnimals, getAnimalXp, getHabitOfAnimal } from "../companion.js";
import { getStage, getStageProgress, stageName } from "../evolution.js";

export function renderTeamScreen() {
  const total = getUnlockableAnimals().length;
  const team = getUnlockedAnimals();

  const intro = createEl("p", {
    className: "tree-hint",
    text: team.length
      ? `${team.length} de ${total} guardiões já estão com você.`
      : "Ainda não há guardiões conquistados. O Santuário mostra o caminho até o primeiro.",
  });

  const backLink = createEl("a", {
    className: "link-button",
    text: "← Ver todos no Santuário",
    attrs: { href: "#/santuario" },
  });

  const cards = team.map((animal) => {
    const xp = getAnimalXp(animal.id);
    const habit = getHabitOfAnimal(animal.id);
    const displayName = habit?.guardianName || animal.name;

    const lines = [
      createEl("span", { className: "sanctuary-name", text: displayName }),
      habit?.guardianName
        ? createEl("span", { className: "sanctuary-lock", text: animal.name })
        : null,
      createEl("span", {
        className: "sanctuary-stage",
        text: habit ? stageName(getStage(xp), animal.gender) : getElement(animal.element).label,
      }),
      createEl("span", {
        className: habit ? "sanctuary-xp" : "sanctuary-xp is-ready",
        text: habit ? `${xp} XP` : "Pronta — toque para dar um hábito a ela",
      }),
    ];

    const badge = createCreatureBadge({
      animal,
      progress: habit ? getStageProgress(xp) : 0,
    });

    const href = habit ? `#/criatura?habit=${habit.id}` : `#/novo-habito?animal=${animal.id}`;

    return createEl("a", {
      className: "sanctuary-card",
      attrs: { style: accentStyle(animal.color), href },
      children: [badge, createEl("div", { className: "sanctuary-body", children: lines })],
    });
  });

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Equipe"),
      intro,
      backLink,
      createEl("div", { className: "sanctuary-grid", children: cards }),
    ],
  });
}
