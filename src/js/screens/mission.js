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
  levelForValue,
  getLogForToday,
  getPlanForToday,
  savePlan,
  saveReflection,
  getFruits,
  getMissForToday,
  declareMiss,
  undeclareMiss,
  MISS_REASONS,
  getMissReasonLabel,
} from "../missions.js";
import { getTreeType } from "../../data/trees.js";
import { fillNames } from "../../data/quests.js";
import {
  getCurrentQuest,
  getConqueredIds,
  findNewlyConquered,
  getNextSealedQuestId,
} from "../quests.js";
import { getPowerForElement } from "../../data/powers.js";
import { getCharges, getUseForToday, getNextChargeIn, usePower } from "../powers.js";
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
      renderPower(habit, companion.animal, Boolean(todayLog)),
      renderCurrentQuest(habit, companion.animal),
      todayLog ? renderAfter(habit, todayLog) : renderBefore(habit),
      renderFruits(habit),
    ],
  });
}

/*
  O poder da criatura. Nenhum deles marca um dia como cumprido — o descanso
  protege a sequência mas entra no calendário como descanso.
*/
function renderPower(habit, animal, doneToday) {
  const power = getPowerForElement(animal?.element);
  if (!power) return null;

  const charges = getCharges(habit);
  const usedToday = getUseForToday(habit);
  const podeUsar = charges > 0 && !usedToday && !(power.availableWhen === "pendente" && doneToday);

  const estado = usedToday
    ? usedToday.powerId === power.id
      ? `${power.name} em uso hoje.`
      : "Poder já usado hoje."
    : charges > 0
      ? `${charges} ${charges === 1 ? "carga disponível" : "cargas disponíveis"}.`
      : `Sem carga. Faltam ${getNextChargeIn(habit)} dias cumpridos para a próxima.`;

  const button = createEl("button", {
    className: "button button-secondary",
    text: power.verb,
    attrs: { type: "button" },
  });
  button.disabled = !podeUsar;
  button.addEventListener("click", () => {
    // O Vislumbre precisa saber qual missão revelar; os outros não têm alvo.
    const payload =
      power.id === "vislumbre" ? getNextSealedQuestId(habit) : null;
    usePower(habit, animal, payload);
    refresh();
  });

  return createEl("section", {
    className: `power-card${usedToday?.powerId === power.id ? " is-active" : ""}`,
    children: [
      createEl("span", { className: "ritual-step", text: `Poder de ${animal.name}` }),
      createEl("h2", { className: "power-name", text: power.name }),
      createEl("p", { className: "quest-story", text: power.description }),
      createEl("p", { className: "mission-hint", text: `"${power.story}"` }),
      createEl("div", {
        className: "power-footer",
        children: [createEl("span", { className: "mission-xp", text: estado }), button],
      }),
    ],
  });
}

// A missão da Jornada que está valendo agora — o que a criatura pediu.
function renderCurrentQuest(habit, animal) {
  const current = getCurrentQuest(habit);
  if (!current) return null;

  const { quest, main, reserve, steps } = current;

  const stepList = createEl("ul", {
    className: "quest-steps",
    children: steps.map((step) =>
      createEl("li", {
        className: `quest-step${step.progress.done ? " is-done" : ""}`,
        children: [
          createEl("span", { className: "quest-step-mark" }),
          createEl("span", { text: step.text }),
          createEl("span", {
            className: "quest-step-count",
            text: `${step.progress.current}/${step.progress.target}`,
          }),
        ],
      })
    ),
  });

  return createEl("section", {
    className: "quest-card",
    children: [
      createEl("span", { className: "ritual-step", text: "Missão da jornada" }),
      createEl("h2", { className: "quest-name", text: quest.name }),
      createEl("p", { className: "quest-story", text: fillNames(quest.story, animal?.name) }),
      createEl("div", {
        className: "quest-bar",
        children: [
          createEl("span", {
            className: "quest-bar-fill",
            attrs: { style: `width: ${(main.current / main.target) * 100}%` },
          }),
        ],
      }),
      createEl("p", {
        className: "mission-xp",
        text: `${main.current} de ${main.target}`,
      }),
      stepList,
      reserve
        ? createEl("p", {
            className: "quest-reserve",
            text: `Missão reserva — ${quest.reserve.name}: ${fillNames(
              quest.reserve.story,
              animal?.name
            )} (${reserve.current}/${reserve.target})`,
          })
        : null,
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

  /*
    Registrar o que aconteceu de verdade. Sem isto o histórico guardaria
    sempre a meta, e "225 min acumulados" seria um número inventado.
  */
  const realInput = createEl("input", {
    className: "input",
    attrs: { type: "number", min: "0", step: "1", id: "mission-real", placeholder: String(habit.missions.main) },
  });

  const realButton = createEl("button", {
    className: "button button-secondary",
    text: "Registrar",
    attrs: { type: "button" },
  });
  realButton.addEventListener("click", () => {
    const value = Number(realInput.value);
    if (!(value > 0)) return;
    complete(habit, levelForValue(habit, value), value);
  });

  const realRow = createEl("section", {
    className: "ritual-card",
    children: [
      createEl("span", { className: "ritual-step", text: "Foi diferente?" }),
      createEl("p", {
        className: "mission-hint",
        text: `Registre quanto você fez de verdade, em ${habit.unit}. O nível sai do número.`,
      }),
      createEl("div", {
        className: "real-row",
        children: [realInput, realButton],
      }),
    ],
  });

  return createEl("div", {
    className: "ritual",
    children: [
      plan,
      createEl("span", { className: "ritual-step", text: "Agora" }),
      createEl("div", { className: "mission-list", children: tiles }),
      realRow,
      renderMissSection(habit),
    ],
  });
}

/*
  Admitir que hoje não vai dar. Não é um poder — não protege sequência, não
  gasta carga, e não substitui as missões acima: elas continuam abertas, para
  quem mudar de ideia mais tarde. É só a opção de dizer a verdade em vez de
  simplesmente sumir, que é o que o app faria da mesma forma no calendário.
*/
function renderMissSection(habit) {
  const miss = getMissForToday(habit.id);
  if (miss) return renderMissBanner(habit, miss);

  // Já é dia de descanso declarado: essa já é a história de hoje, não faz
  // sentido oferecer as duas ao mesmo tempo.
  const descansando = getUseForToday(habit)?.powerId === "mare-calma";
  if (descansando) return null;

  const link = createEl("button", {
    className: "link-button link-muted",
    text: "Hoje não vai dar",
    attrs: { type: "button" },
  });

  let reason = null;
  const reasonChips = new Map();
  const reasonRow = createEl("div", {
    className: "chip-row",
    children: MISS_REASONS.map((option) => {
      const chip = createEl("button", { className: "chip", text: option.label, attrs: { type: "button" } });
      chip.addEventListener("click", () => {
        reason = reason === option.id ? null : option.id;
        reasonChips.forEach((el, id) => el.classList.toggle("is-selected", id === reason));
      });
      reasonChips.set(option.id, chip);
      return chip;
    }),
  });

  const noteInput = createEl("textarea", {
    className: "input",
    attrs: { rows: "2", maxlength: "140", placeholder: "Mais alguma coisa? (opcional)" },
  });
  const confirmButton = createEl("button", {
    className: "button button-secondary",
    text: "Confirmar",
    attrs: { type: "button" },
  });
  const cancelButton = createEl("button", { className: "link-button", text: "Cancelar", attrs: { type: "button" } });

  const form = createEl("div", {
    className: "miss-declare-form",
    children: [
      createEl("p", { className: "mission-hint", text: "Um dia difícil não apaga sua caminhada." }),
      reasonRow,
      noteInput,
      createEl("div", { className: "ritual-actions", children: [cancelButton, confirmButton] }),
    ],
    attrs: { hidden: "" },
  });

  link.addEventListener("click", () => {
    link.hidden = true;
    form.hidden = false;
  });
  cancelButton.addEventListener("click", () => {
    form.hidden = true;
    link.hidden = false;
    reason = null;
    reasonChips.forEach((el) => el.classList.remove("is-selected"));
    noteInput.value = "";
  });
  confirmButton.addEventListener("click", () => {
    declareMiss(habit.id, { reason, note: noteInput.value });
    refresh();
  });

  return createEl("div", { className: "miss-declare", children: [link, form] });
}

function renderMissBanner(habit, miss) {
  const undoButton = createEl("button", { className: "link-button", text: "Desfazer", attrs: { type: "button" } });
  undoButton.addEventListener("click", () => {
    undeclareMiss(habit.id);
    refresh();
  });

  const motivo = getMissReasonLabel(miss.reason);

  return createEl("section", {
    className: "ritual-card is-miss",
    children: [
      createEl("span", { className: "ritual-step", text: "Você foi sincero" }),
      createEl("p", { className: "mission-hint", text: "Um dia difícil não apaga sua caminhada." }),
      motivo ? createEl("p", { className: "mission-hint", text: `Motivo: ${motivo}` }) : null,
      miss.note ? createEl("p", { className: "mission-hint", text: `"${miss.note}"` }) : null,
      createEl("p", {
        className: "mission-hint",
        text: "As missões acima continuam abertas — se mudar de ideia, ainda dá tempo.",
      }),
      createEl("div", { className: "ritual-actions", children: [undoButton] }),
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

function complete(habit, levelKey, value = null) {
  const questsBefore = getConqueredIds(habit);
  const result = completeMission(habit, levelKey, value);
  const animal = getCompanionState(habit).animal;
  const unlocked = result.unlockedAnimals[0];
  const conquered = findNewlyConquered(habit, questsBefore)[0];

  // A missão da jornada conquistada é a notícia maior do dia: vem antes da
  // evolução, que a pessoa continua vendo no anel e no perfil.
  if (conquered) {
    showCelebration(
      {
        xpEarned: result.xpEarned,
        message: `${conquered.quest.name} conquistada.`,
        animal,
        evolutionText: conquered.byReserve
          ? `Pela missão reserva: ${conquered.quest.reserve.name}`
          : fillNames(conquered.quest.reward, animal?.name),
        note: conquered.byReserve ? fillNames(conquered.quest.reward, animal?.name) : null,
      },
      () => refresh()
    );
    return;
  }

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
