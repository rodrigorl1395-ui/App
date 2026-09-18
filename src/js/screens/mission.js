import { createEl, showCelebration, createCompanion } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate, refresh } from "../router.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getMoodMessage, getStreak } from "../mood.js";
import { stageName } from "../evolution.js";
import {
  MISSION_LEVELS,
  FEELINGS,
  completeMission,
  getLogForToday,
  getPlanForToday,
  savePlan,
  saveReflection,
  getFruits,
} from "../missions.js";
import { getAnimalById } from "../../data/animals.js";
import { getTreeType } from "../../data/trees.js";
import { todayKey } from "../utils.js";

const LEVEL_ORDER = [
  { key: "main", variant: "main", label: "Missão principal", hint: "O que você planejou para hoje." },
  {
    key: "minimal",
    variant: "minimal",
    label: "Missão mínima",
    hint: "Num dia difícil, isto já mantém a corrente viva.",
  },
  { key: "bonus", variant: "bonus", label: "Missão bônus", hint: "Quando sobrar energia, vá além." },
];

export function renderMissionScreen(params) {
  const habit = getHabits().find((item) => item.id === params.habit);

  if (!habit) {
    navigate("/hoje");
    return createEl("div", { className: "screen" });
  }

  const companion = getCompanionState(habit);
  const todayLog = getLogForToday(habit.id);

  const header = createEl("div", {
    className: "screen-header",
    children: [
      createEl("div", {
        className: "habit-icon",
        attrs: { style: `--habit-color: ${habit.color}` },
        children: [createIcon(habit.icon)],
      }),
      createEl("div", {
        className: "header-actions",
        children: [
          createEl("a", {
            className: "link-button",
            text: "Perfil",
            attrs: { href: `#/criatura?habit=${habit.id}` },
          }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } }),
        ],
      }),
    ],
  });

  const hero = companion.animal
    ? createCompanion({
        animal: companion.animal,
        stageName: companion.stageLabel,
        progress: companion.progress,
        caption: companion.nextStage
          ? `${companion.xp} de ${companion.nextStage.minXp} XP para ${stageName(
              companion.nextStage,
              companion.animal.gender
            )}`
          : `${companion.xp} XP na forma lendária`,
      })
    : null;

  const streak = getStreak(habit.id);
  const intro = createEl("div", {
    className: "mission-intro",
    children: [
      createEl("h1", { className: "mission-title", text: habit.name }),
      createEl("p", {
        className: "mission-mood",
        text: getMoodMessage(companion.animal, habit.id),
      }),
      streak > 1
        ? createEl("p", { className: "mission-hint", text: `Sequência atual: ${streak} dias.` })
        : null,
    ],
  });

  return createEl("div", {
    className: "screen immersive-screen",
    children: [
      header,
      hero,
      intro,
      todayLog ? renderAfter(habit, todayLog) : renderBefore(habit),
      renderFruits(habit),
    ],
  });
}

// Ato 1 e 2: combinar o encontro e cumprir.
function renderBefore(habit) {
  const existingPlan = getPlanForToday(habit.id);

  const planInput = createEl("input", {
    className: "input",
    attrs: {
      type: "text",
      id: "mission-plan",
      placeholder: "Às 7h, no parque perto de casa",
      maxlength: "120",
    },
  });
  planInput.value = existingPlan?.text || "";

  const planSaved = createEl("p", { className: "form-hint" });
  const planButton = createEl("button", {
    className: "button button-secondary",
    text: existingPlan ? "Atualizar combinado" : "Combinar",
    attrs: { type: "button" },
  });
  planButton.addEventListener("click", () => {
    const text = planInput.value.trim();
    if (!text) return;
    savePlan(habit.id, text);
    planButton.textContent = "Atualizar combinado";
    planSaved.textContent = "Combinado guardado para hoje.";
  });

  const plan = createEl("section", {
    className: "ritual-card",
    children: [
      createEl("span", { className: "ritual-step", text: "Antes" }),
      createEl("h2", { className: "card-title", text: "Combine com você" }),
      createEl("p", {
        className: "mission-hint",
        text: "Dizer onde e quando é o que mais aumenta a chance de acontecer.",
      }),
      planInput,
      createEl("div", { className: "ritual-actions", children: [planButton] }),
      planSaved,
    ],
  });

  const tiles = LEVEL_ORDER.map(({ key, variant, label, hint }) => {
    const tile = createEl("button", {
      className: `mission-tile mission-tile-${variant}`,
      attrs: { type: "button", style: `--habit-color: ${habit.color}` },
      children: [
        createEl("span", { className: "mission-label", text: label }),
        createEl("span", { className: "mission-goal", text: `${habit.missions[key]} ${habit.unit}` }),
        createEl("span", { className: "mission-hint", text: hint }),
        createEl("span", { className: "mission-xp", text: `${MISSION_LEVELS[key].xp} XP` }),
      ],
    });
    tile.addEventListener("click", () => complete(habit, key));
    return tile;
  });

  return createEl("div", {
    className: "ritual",
    children: [
      plan,
      createEl("span", { className: "ritual-step", text: "Agora" }),
      createEl("div", { className: "mission-list", children: tiles }),
    ],
  });
}

// Ato 3: guardar a lembrança do dia, que vira fruto.
function renderAfter(habit, log) {
  const plan = getPlanForToday(habit.id);

  if (log.reflection) {
    return createEl("section", {
      className: "ritual-card is-complete",
      children: [
        createEl("span", { className: "ritual-step", text: "Guardado" }),
        createEl("h2", { className: "card-title", text: "A lembrança de hoje" }),
        createEl("p", { className: "fruit-text", text: log.reflection }),
      ],
    });
  }

  const input = createEl("textarea", {
    className: "input",
    attrs: { id: "mission-reflection", rows: "3", maxlength: "240", placeholder: "O que foi bom nisso hoje?" },
  });

  let feeling = null;
  const feelingButtons = new Map();
  const feelingRow = createEl("div", {
    className: "feeling-row",
    children: FEELINGS.map((option) => {
      const chip = createEl("button", {
        className: "chip",
        text: option.label,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        feeling = feeling === option.id ? null : option.id;
        feelingButtons.forEach((el, id) => el.classList.toggle("is-selected", id === feeling));
      });
      feelingButtons.set(option.id, chip);
      return chip;
    }),
  });

  const saveButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Guardar lembrança",
    attrs: { type: "button" },
  });
  saveButton.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    saveReflection(log.id, text, feeling);
    refresh();
  });

  return createEl("section", {
    className: "ritual-card",
    children: [
      createEl("span", { className: "ritual-step", text: "Depois" }),
      createEl("h2", { className: "card-title", text: "Guarde uma lembrança" }),
      createEl("p", {
        className: "mission-hint",
        text: plan
          ? `Você combinou: ${plan.text}. Como foi?`
          : "Uma linha sobre o que foi bom. Ela vira um fruto na sua árvore.",
      }),
      input,
      createEl("span", { className: "form-label", text: "Como você se sentiu?" }),
      feelingRow,
      saveButton,
    ],
  });
}

// O fruto de hoje já aparece no fecho do ritual; aqui ficam só os anteriores.
function renderFruits(habit) {
  const today = todayKey();
  const fruits = getFruits(habit.id).filter((fruit) => fruit.date !== today);
  if (!fruits.length) return null;

  return createEl("section", {
    className: "fruit-list",
    attrs: { style: `--color-accent: ${habit.color}` },
    children: [
      createEl("h2", { className: "section-title", text: `Frutos guardados (${fruits.length})` }),
      ...fruits.slice(0, 5).map((fruit) =>
        createEl("article", {
          className: "fruit",
          children: [
            createEl("p", { className: "fruit-text", text: fruit.reflection }),
            createEl("span", { className: "fruit-date", text: formatFruitDate(fruit.date) }),
          ],
        })
      ),
    ],
  });
}

function formatFruitDate(dateKey) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(
    new Date(`${dateKey}T00:00:00`)
  );
}

function complete(habit, levelKey) {
  const result = completeMission(habit, levelKey);
  const animal = getAnimalById(habit.animalId);
  const unlocked = result.unlockedAnimals[0];

  showCelebration(
    {
      xpEarned: result.xpEarned,
      message: `${habit.name} registrado. ${getTreeType(habit.treeType).name} recebeu água.`,
      animal: unlocked || (result.evolved ? animal : null),
      evolutionText: unlocked
        ? `${unlocked.name} se juntou ao seu santuário`
        : result.evolved
          ? `${animal ? animal.name : "Seu companheiro"} agora é ${stageName(
              result.currentStage,
              animal?.gender
            )}`
          : null,
      note: unlocked
        ? `${unlocked.tagline} Crie um hábito para ela cuidar.`
        : "Agora guarde uma lembrança deste dia.",
    },
    // Fica na própria tela: é onde o terceiro ato do ritual acontece.
    () => refresh()
  );
}
