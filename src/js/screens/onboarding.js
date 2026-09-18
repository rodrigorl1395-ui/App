import { createEl } from "../ui.js";
import { createIcon } from "../icons.js";
import { createProfessorScene } from "../illustrations.js";
import { navigate } from "../router.js";
import { ONBOARDING_STEPS, TEAM } from "../../data/onboarding.js";
import { getAnimalById, getElement } from "../../data/animals.js";

/*
  O onboarding é um monólogo do professor em etapas. Cada passo troca só o
  texto: a ilustração fica, para a sensação ser de alguém falando com você e
  não de cinco telas soltas.
*/
export function renderOnboardingScreen() {
  let step = 0;

  const team = TEAM.map((item) => ({ ...item, animal: getAnimalById(item.animalId) })).filter(
    (item) => item.animal
  );

  const scene = createEl("div", {
    className: "professor-stage",
    children: [createProfessorScene(team.map((item) => item.animal))],
  });

  const dots = createEl("div", {
    className: "step-dots",
    children: ONBOARDING_STEPS.map(() => createEl("span", { className: "step-dot" })),
  });

  const content = createEl("div", { className: "professor-content" });

  const nextButton = createEl("button", {
    className: "button button-primary button-block",
    attrs: { type: "button" },
  });
  nextButton.addEventListener("click", () => {
    if (step === ONBOARDING_STEPS.length - 1) {
      navigate("/escolha-animal");
      return;
    }
    step += 1;
    render();
  });

  const backButton = createEl("button", {
    className: "link-button",
    text: "Voltar",
    attrs: { type: "button" },
  });
  backButton.addEventListener("click", () => {
    if (step === 0) return;
    step -= 1;
    render();
  });

  // Quem chega num aparelho novo com um backup precisa restaurar antes de
  // começar do zero.
  const restoreLink = createEl("a", {
    className: "link-button",
    text: "Já tenho um backup",
    attrs: { href: "#/ajustes" },
  });

  const footerLinks = createEl("div", { className: "onboarding-links" });

  function render() {
    const data = ONBOARDING_STEPS[step];

    const blocks = [
      createEl("h1", { className: "professor-title", text: data.title }),
      createEl("blockquote", { className: "professor-speech", text: data.speech }),
    ];

    if (data.body) blocks.push(createEl("p", { className: "professor-body", text: data.body }));
    if (data.references) blocks.push(renderReferences(data.references));
    if (data.id === "animais") blocks.push(renderTeam(team));
    if (data.missions) blocks.push(renderMissions(data.missions));
    if (data.note) blocks.push(createEl("p", { className: "professor-note", text: data.note }));

    content.replaceChildren(...blocks);
    nextButton.textContent = data.cta;

    dots.childNodes.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === step);
      dot.classList.toggle("is-past", index < step);
    });

    footerLinks.replaceChildren(step > 0 ? backButton : restoreLink);
    scene.classList.toggle("is-compact", step > 0);
  }

  render();

  return createEl("div", {
    className: "screen immersive-screen onboarding",
    children: [
      scene,
      dots,
      content,
      createEl("div", {
        className: "onboarding-actions",
        children: [nextButton, footerLinks],
      }),
    ],
  });
}

function renderReferences(references) {
  return createEl("ul", {
    className: "reference-list",
    children: references.map((reference) =>
      createEl("li", {
        className: "reference",
        children: [
          createEl("span", { className: "reference-source", text: reference.source }),
          createEl("span", { className: "reference-idea", text: reference.idea }),
        ],
      })
    ),
  });
}

// Os mestres e a área de cada um: é aqui que "escolher o animal é escolher o
// hábito" deixa de ser abstrato.
function renderTeam(team) {
  return createEl("div", {
    className: "team-grid",
    children: team.map((item) =>
      createEl("div", {
        className: "team-member",
        attrs: { style: `--color-accent: ${item.animal.color}` },
        children: [
          createEl("span", {
            className: "team-orb",
            children: [createIcon(getElement(item.animal.element).icon)],
          }),
          createEl("span", { className: "team-name", text: item.animal.name }),
          createEl("span", { className: "team-area", text: item.area }),
        ],
      })
    ),
  });
}

function renderMissions(missions) {
  return createEl("ul", {
    className: "reference-list",
    children: missions.map((mission) =>
      createEl("li", {
        className: "reference",
        children: [
          createEl("span", { className: "reference-source", text: `Missão ${mission.label}` }),
          createEl("span", { className: "reference-idea", text: mission.text }),
        ],
      })
    ),
  });
}
