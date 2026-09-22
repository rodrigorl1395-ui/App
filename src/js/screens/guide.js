/*
  O guia: dois passos, de verdade dentro do onboarding — não uma bolha
  flutuando por cima do app depois. Continua o mesmo monólogo do professor
  (mesma cena, mesmo tipo de fala), só que agora com o primeiro hábito já
  existindo, então dá pra ensinar fazendo, não só descrevendo.

  Passo 1 — o que cada botão da navegação é.
  Passo 2 — a missão de hoje, de verdade: cumprida aqui mesmo, com o
  guardião reagindo, antes de a pessoa cair no caderno em uso.

  Só aparece uma vez, ao criar o primeiro hábito (newHabit.js decide isso).
  Pular leva direto pro caderno — a experiência guiada é o caminho
  recomendado, nunca o único.
*/

import { createEl, createCreatureBadge, accentStyle } from "../ui.js";
import { createProfessorScene } from "../illustrations.js";
import { createIcon } from "../icons.js";
import { navigate } from "../router.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { isDoneToday, completeMission, MISSION_LEVELS } from "../missions.js";
import { CATEGORY_LABELS } from "../../data/animals.js";

const BOTOES = [
  { icon: "sun", nome: "Hoje", texto: "O que fazer agora — sua missão do dia." },
  { icon: "tree", nome: "Jardim", texto: "Seu terreno: cumprir hábito enche o riacho, e a água faz as árvores crescerem." },
  { icon: "list", nome: "Hábitos", texto: "Seus hábitos, e o Perfil do Mestre — que é você, não o guardião." },
  { icon: "tools", nome: "Apps", texto: "Objetos com efeito real, que você destrava aos poucos." },
  { icon: "paw", nome: "Santuário", texto: "A coleção de guardiões que ainda estão por vir." },
];

export function renderGuideScreen() {
  const habit = getHabits()[0];
  // Sem hábito nenhum, não há o que guiar — volta pro caminho normal.
  if (!habit) {
    navigate("/hoje");
    return createEl("div", { className: "screen" });
  }

  const companion = getCompanionState(habit);
  const animal = companion.animal;

  let step = 0;
  let resultado = null;

  const scene = createEl("div", {
    className: "professor-stage",
    children: [createProfessorScene(animal ? [animal] : [])],
  });

  const dots = createEl("div", {
    className: "step-dots",
    children: [0, 1].map(() => createEl("span", { className: "step-dot" })),
  });

  const content = createEl("div", { className: "professor-content" });

  const nextButton = createEl("button", {
    className: "button button-primary button-block",
    attrs: { type: "button" },
  });

  const skipLink = createEl("a", {
    className: "link-button",
    text: "Pular, já conheço",
    attrs: { href: "#/hoje" },
  });
  const footerLinks = createEl("div", { className: "onboarding-links", children: [skipLink] });

  nextButton.addEventListener("click", () => {
    if (step === 0) {
      step = 1;
      render();
      return;
    }
    if (!resultado && !isDoneToday(habit.id)) {
      resultado = completeMission(habit, "main");
      render();
      return;
    }
    navigate("/hoje");
  });

  function render() {
    if (step === 0) {
      content.replaceChildren(...renderPasso1());
      nextButton.textContent = "Fazer minha primeira missão";
    } else {
      content.replaceChildren(...renderPasso2());
      const feita = resultado || isDoneToday(habit.id);
      nextButton.textContent = feita ? "Ir para o meu caderno" : "Cumpri hoje";
    }

    dots.childNodes.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === step);
      dot.classList.toggle("is-past", index < step);
    });
    scene.classList.toggle("is-compact", step > 0);
  }

  function renderPasso1() {
    return [
      createEl("h1", { className: "professor-title", text: "Seu caderno tem cinco páginas" }),
      createEl("blockquote", {
        className: "professor-speech",
        text: `${animal?.name || "Seu guardião"} vai te mostrar onde fica cada uma.`,
      }),
      createEl("div", {
        className: "app-list",
        children: BOTOES.map((botao) =>
          createEl("div", {
            className: "app-row",
            children: [
              createEl("span", { className: "app-row-icon", children: [createIcon(botao.icon)] }),
              createEl("div", {
                className: "app-row-body",
                children: [
                  createEl("span", { className: "app-row-name", text: botao.nome }),
                  createEl("span", { className: "app-row-note", text: botao.texto }),
                ],
              }),
            ],
          })
        ),
      }),
    ];
  }

  function renderPasso2() {
    const feita = resultado || isDoneToday(habit.id);

    return [
      createEl("h1", { className: "professor-title", text: "Sua primeira missão" }),
      createEl("blockquote", {
        className: "professor-speech",
        text: feita
          ? `${animal?.name || "Seu guardião"} sentiu esse primeiro cuidado.`
          : `${animal?.name || "Seu guardião"} está esperando. É a missão de verdade que você acabou de criar.`,
      }),
      createEl("section", {
        className: "card card-accent focus-card",
        children: [
          createEl("span", { className: "ritual-step", text: "Missão de hoje" }),
          createEl("div", {
            className: "focus-identity",
            children: [
              animal ? createCreatureBadge({ animal, progress: companion.progress }) : null,
              createEl("div", {
                className: "focus-identity-body",
                children: [
                  createEl("span", { className: "focus-animal-name", text: animal?.name || "Seu guardião" }),
                  createEl("span", {
                    className: "focus-area",
                    text: `${CATEGORY_LABELS[habit.category] || habit.category} · ${habit.name}`,
                  }),
                ],
              }),
            ],
          }),
          createEl("div", {
            className: "focus-mission-line",
            children: [
              createEl("span", {
                className: "mission-level-value",
                text: `${habit.missions.main} ${habit.unit}`,
              }),
              createEl("span", { className: "mission-level-xp", text: `${MISSION_LEVELS.main.xp} XP` }),
            ],
          }),
          feita
            ? createEl("p", {
                className: "professor-note",
                text: resultado ? `+${resultado.xpEarned} XP. Registrado de verdade — é o hábito.` : "Já cumprida hoje.",
              })
            : null,
        ],
      }),
    ];
  }

  render();

  return createEl("div", {
    className: "screen immersive-screen onboarding",
    attrs: animal ? { style: accentStyle(animal.color) } : {},
    children: [scene, dots, content, createEl("div", { className: "onboarding-actions", children: [nextButton, footerLinks] })],
  });
}
