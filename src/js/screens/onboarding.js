import { createEl } from "../ui.js";
import { navigate } from "../router.js";

export function renderOnboardingScreen() {
  const hero = createEl("div", {
    className: "onboarding-hero",
    children: [
      createEl("h1", { className: "onboarding-title", text: "Pocket Habits" }),
      createEl("p", {
        className: "onboarding-pitch",
        text: "Escolha um companheiro elemental e transforme hábitos reais em uma jornada. 1% melhor, todos os dias.",
      }),
    ],
  });

  const startButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Escolher meu companheiro",
  });
  startButton.addEventListener("click", () => navigate("/escolha-animal"));

  const actions = createEl("div", { className: "onboarding-actions", children: [startButton] });

  return createEl("div", {
    className: "screen immersive-screen",
    children: [hero, actions],
  });
}
