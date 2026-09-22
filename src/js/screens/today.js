/*
  Hoje: o centro da experiência diária. A pergunta que ela responde, sempre
  em poucos segundos, é "o que eu preciso fazer agora para avançar?" — não
  "o que já fiz" nem "onde estou no geral" (isso é o Perfil do Mestre, em
  Hábitos). Por isso só UM hábito ganha destaque de cada vez: o primeiro
  ainda sem resposta para hoje. Os outros esperam, discretos, mais abaixo.
*/

import {
  createEl,
  createHabitRow,
  createCreatureBadge,
  accentStyle,
} from "../ui.js";
import { createTree } from "../icons.js";
import { navigate, refresh } from "../router.js";
import { getHabits } from "../habits.js";
import { getState } from "../state.js";
import { getCompanionState } from "../companion.js";
import { getMood } from "../mood.js";
import { getPendingDiscovery } from "../discoveries.js";
import { getPendingTool } from "../tools.js";
import { getHabitStats } from "../stats.js";
import { stageName } from "../evolution.js";
import { CATEGORY_LABELS } from "../../data/animals.js";
import { formatDateLong } from "../utils.js";
import { getCreatureStatus, getMasterProfile, vigorAmount } from "../master.js";
import {
  getPriorityHabit,
  getDayStatus,
  getJourneyDay,
  WHEN_OPTIONS,
  WHERE_OPTIONS,
  buildPlanText,
} from "../focus.js";
import {
  MISSION_LEVELS,
  FEELINGS,
  MISS_REASONS,
  getMissReasonLabel,
  completeMission,
  levelForValue,
  getPlanForToday,
  savePlan,
  saveReflection,
  isDoneToday,
  getLogForToday,
  getMissForToday,
  declareMiss,
  undeclareMiss,
} from "../missions.js";

/*
  Estado efêmero da tela — qual hábito está com o painel aberto, em que
  passo, e o que a pessoa já escolheu nele. Nada disto é gravado: um
  recarregamento da página volta tudo a "fechado". Mora fora da função de
  render porque refresh() chama renderTodayScreen() de novo a cada toque, e
  sem isto o painel se fecharia sozinho a cada interação.
*/
let openHabitId = null;
let step = "aberto"; // "aberto" | "concluido"
let selectedLevel = "main";
let plan = { whenId: null, customTime: "", whereId: null };
let lastResult = null;

function openHabit(habitId) {
  openHabitId = habitId;
  step = "aberto";
  selectedLevel = "main";
  plan = { whenId: null, customTime: "", whereId: null };
}

function closeHabit() {
  openHabitId = null;
  step = "aberto";
}

export function renderTodayScreen() {
  const habits = getHabits();

  // Se o hábito aberto já foi resolvido por outro caminho — o perfil, ou a
  // tela de missão de um cartão secundário —, o painel fecha sozinho. Não
  // faz sentido continuar oferecendo uma missão que já aconteceu.
  if (openHabitId && step !== "concluido" && (isDoneToday(openHabitId) || getMissForToday(openHabitId))) {
    closeHabit();
  }

  const dayStatus = getDayStatus(habits);
  const priority = getPriorityHabit(habits);

  let mainBlock;
  if (!habits.length) {
    mainBlock = renderEmptyState();
  } else if (openHabitId && step === "concluido") {
    mainBlock = renderConclusion(habits.find((habit) => habit.id === openHabitId));
  } else if (priority) {
    mainBlock =
      openHabitId === priority.id ? renderOpenFocus(priority) : renderCollapsedFocus(priority, dayStatus);
  } else if (dayStatus.status === "recuperacao") {
    mainBlock = renderRecoveryDay();
  } else {
    mainBlock = renderDayComplete();
  }

  const excludeId = openHabitId || priority?.id || null;

  return createEl("div", {
    className: "screen",
    children: [
      renderHeader(),
      habits.length ? renderMasterStrip() : null,
      mainBlock,
      renderSecondaryHabits(habits, excludeId),
      renderDiscoveryNudge(habits),
      renderToolNudge(),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Cabeçalho e resumo do Mestre                                        */
/* ------------------------------------------------------------------ */

function greetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function renderHeader() {
  const name = getState().user?.name;
  const greeting = name ? `${greetingPrefix()}, ${name}.` : `${greetingPrefix()}.`;

  return createEl("div", {
    className: "today-heading",
    children: [
      createEl("p", { className: "today-greeting", text: greeting }),
      createEl("h1", { className: "today-date", text: formatDateLong() }),
      createEl("div", {
        className: "today-heading-foot",
        children: [
          createEl("p", { className: "today-summary", text: "Hoje é sobre ficar 1% melhor." }),
          createEl("span", { className: "today-journey-day", text: `Dia ${getJourneyDay()} da jornada` }),
        ],
      }),
    ],
  });
}

/*
  O resumo do Mestre aqui é só uma porta de entrada — nome, título e dois
  números. A versão cheia, com quem está mais forte e mais fraco, mora em
  Hábitos; repeti-la aqui competiria com a missão do dia.
*/
function renderMasterStrip() {
  const profile = getMasterProfile();
  const name = getState().user?.name;

  return createEl("a", {
    className: "master-strip",
    attrs: { href: "#/habitos" },
    children: [
      createEl("div", {
        className: "master-strip-identity",
        children: [
          createEl("span", { className: "master-strip-name", text: name || "Mestre" }),
          createEl("span", { className: "master-strip-rank", text: profile.rank.name }),
        ],
      }),
      createEl("div", {
        className: "master-strip-numbers",
        children: [
          createEl("span", { className: "master-strip-stat", text: `${profile.activeDays} dias ativos` }),
          createEl("span", {
            className: "master-strip-stat",
            text: `${profile.habits} ${profile.habits === 1 ? "companheiro" : "companheiros"}`,
          }),
        ],
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Estados sem missão pendente: vazio, dia completo, dia de recuperação */
/* ------------------------------------------------------------------ */

function renderEmptyState() {
  return createEl("section", {
    className: "card focus-card",
    children: [
      createEl("h2", { className: "card-title", text: "Ainda não há hábito nenhum." }),
      createEl("p", {
        className: "card-subtitle",
        text: "Cada hábito traz um guardião para cuidar dele. Comece com um só.",
      }),
      createEl("a", {
        className: "button button-primary button-block",
        text: "Criar meu primeiro hábito",
        attrs: { href: "#/novo-habito" },
      }),
    ],
  });
}

function renderDayComplete() {
  return createEl("section", {
    className: "card focus-card is-complete",
    children: [
      createEl("span", { className: "ritual-step", text: "Dia completo" }),
      createEl("h2", { className: "card-title", text: "Tudo cumprido hoje." }),
      createEl("p", {
        className: "card-subtitle",
        text: "O jardim inteiro foi regado. Cada hábito avançou 1% — volte amanhã.",
      }),
      createEl("a", { className: "link-button", text: "Visitar o jardim", attrs: { href: "#/jardim" } }),
    ],
  });
}

function renderRecoveryDay() {
  return createEl("section", {
    className: "card focus-card is-recovery",
    children: [
      createEl("span", { className: "ritual-step", text: "Dia de recuperação" }),
      createEl("h2", { className: "card-title", text: "Um dia difícil não apaga sua caminhada." }),
      createEl("p", {
        className: "card-subtitle",
        text: "Você apareceu e foi sincero sobre hoje. Isso já é alguma coisa — amanhã as missões abrem de novo.",
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Missão principal — colapsada e aberta                               */
/* ------------------------------------------------------------------ */

function identityBlock(habit, companion) {
  const animal = companion.animal;
  return createEl("div", {
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
      createEl("a", {
        className: "link-button focus-profile-link",
        text: "Perfil",
        attrs: { href: `#/criatura?habit=${habit.id}` },
      }),
    ],
  });
}

/*
  Quando o que aconteceu foi exatamente o combinado, não devia existir uma
  tela no meio do caminho perguntando isso de novo. "Cumprir hoje" registra
  a missão principal direto daqui — um toque a menos entre "fiz" e "está
  registrado". Quem fez diferente do planejado, ou quer combinar quando e
  onde antes, ainda tem "Ajustar" para abrir o painel completo.
*/
function renderCollapsedFocus(habit, dayStatus) {
  const companion = getCompanionState(habit);
  const stats = getHabitStats(habit);
  const existingPlan = getPlanForToday(habit.id);

  const doneButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Cumpri hoje",
    attrs: { type: "button" },
  });
  doneButton.addEventListener("click", () => {
    lastResult = completeMission(habit, "main");
    openHabitId = habit.id;
    step = "concluido";
    refresh();
  });

  const adjustButton = createEl("button", {
    className: "link-button link-muted",
    text: "Fiz diferente, ou quero combinar antes",
    attrs: { type: "button" },
  });
  adjustButton.addEventListener("click", () => {
    openHabit(habit.id);
    refresh();
  });

  return createEl("section", {
    className: "card card-accent focus-card",
    attrs: companion.animal ? { style: accentStyle(companion.animal.color) } : {},
    children: [
      createEl("span", {
        className: "ritual-step",
        text: dayStatus.pending > 1 ? `Missão de hoje · 1 de ${dayStatus.pending} esperando` : "Missão de hoje",
      }),
      identityBlock(habit, companion),
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
      createEl("p", {
        className: "mission-hint",
        text: `Sequência atual: ${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}.`,
      }),
      existingPlan
        ? createEl("p", { className: "form-hint", text: `Combinado: ${existingPlan.text}` })
        : null,
      doneButton,
      adjustButton,
    ],
  });
}

const LEVEL_HINTS = {
  minimal: "Pouco ainda é melhor do que nada. Hoje já conta.",
  main: "O objetivo recomendado para hoje.",
  bonus: "Só se sobrar energia — nunca é obrigatório.",
};

function renderOpenFocus(habit) {
  const companion = getCompanionState(habit);

  const closeLink = createEl("button", {
    className: "link-button link-muted",
    text: "Fechar",
    attrs: { type: "button" },
  });
  closeLink.addEventListener("click", () => {
    closeHabit();
    refresh();
  });

  const header = createEl("div", {
    className: "focus-open-head",
    children: [identityBlock(habit, companion), closeLink],
  });

  const planSection = renderPlanPicker(habit);
  const levelSection = renderLevelPicker(habit);
  const missSection = renderMissInline(habit);

  return createEl("section", {
    className: "card card-accent focus-card is-open",
    attrs: companion.animal ? { style: accentStyle(companion.animal.color) } : {},
    children: [header, planSection, levelSection, missSection],
  });
}

// Quando e onde, em dois toques — nunca um formulário. Cada chip já monta a
// frase sozinha; savePlan segue guardando o mesmo texto livre de sempre.
function renderPlanPicker(habit) {
  const existingPlan = getPlanForToday(habit.id);
  const planHint = createEl("p", {
    className: "form-hint",
    text: existingPlan ? `Combinado: ${existingPlan.text}` : "",
  });

  function commit() {
    const text = buildPlanText(plan);
    if (!text) return;
    savePlan(habit.id, text);
    planHint.textContent = `Combinado: ${text}`;
  }

  const customTimeInput = createEl("input", {
    className: "input",
    attrs: { type: "time" },
  });
  customTimeInput.hidden = plan.whenId !== "custom";
  customTimeInput.value = plan.customTime || "";

  const whenChips = new Map();
  const whenRow = createEl("div", {
    className: "quick-picker",
    children: WHEN_OPTIONS.map((option) => {
      const chip = createEl("button", {
        className: `chip${plan.whenId === option.id ? " is-selected" : ""}`,
        text: option.label,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        plan.whenId = plan.whenId === option.id ? null : option.id;
        whenChips.forEach((el, id) => el.classList.toggle("is-selected", id === plan.whenId));
        customTimeInput.hidden = plan.whenId !== "custom";
        if (plan.whenId === "custom") customTimeInput.focus();
        else commit();
      });
      whenChips.set(option.id, chip);
      return chip;
    }),
  });
  customTimeInput.addEventListener("change", () => {
    plan.customTime = customTimeInput.value;
    commit();
  });

  const whereChips = new Map();
  const whereRow = createEl("div", {
    className: "quick-picker",
    children: WHERE_OPTIONS.map((option) => {
      const chip = createEl("button", {
        className: `chip${plan.whereId === option.id ? " is-selected" : ""}`,
        text: option.label,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        plan.whereId = plan.whereId === option.id ? null : option.id;
        whereChips.forEach((el, id) => el.classList.toggle("is-selected", id === plan.whereId));
        commit();
      });
      whereChips.set(option.id, chip);
      return chip;
    }),
  });

  return createEl("div", {
    className: "focus-plan",
    children: [
      createEl("span", { className: "ritual-step", text: "Quando e onde" }),
      whenRow,
      customTimeInput,
      whereRow,
      planHint,
    ],
  });
}

// O nível da missão, compacto: três botões, o escolhido em destaque. Trocar
// de nível troca também a quantidade mostrada e o XP — nunca os dois juntos
// ficam olhando valores de níveis diferentes.
function renderLevelPicker(habit) {
  const levelGrid = createEl("div", {
    className: "mission-levels",
    children: ["minimal", "main", "bonus"].map((key) => {
      const level = MISSION_LEVELS[key];
      const button = createEl("button", {
        className: `mission-level${key === selectedLevel ? " is-selected" : ""}`,
        attrs: { type: "button" },
        children: [
          createEl("span", { className: "mission-level-label", text: level.label }),
          createEl("span", {
            className: "mission-level-value",
            text: `${habit.missions[key]} ${habit.unit}`,
          }),
          createEl("span", { className: "mission-level-xp", text: `${level.xp} XP` }),
        ],
      });
      button.addEventListener("click", () => {
        selectedLevel = key;
        refresh();
      });
      return button;
    }),
  });

  const realInput = createEl("input", {
    className: "input",
    attrs: {
      type: "number",
      min: "0",
      step: "1",
      placeholder: `${habit.missions[selectedLevel]}`,
    },
  });
  const realRow = createEl("div", { className: "focus-real-row", children: [realInput] });
  realRow.hidden = true;

  const realToggle = createEl("button", {
    className: "link-button link-muted",
    text: "Registrar um valor diferente",
    attrs: { type: "button" },
  });
  realToggle.addEventListener("click", () => {
    realRow.hidden = false;
    realToggle.hidden = true;
    realInput.focus();
  });

  const concludeButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Concluir",
    attrs: { type: "button" },
  });
  concludeButton.addEventListener("click", () => {
    const raw = Number(realInput.value);
    const value = !realRow.hidden && raw > 0 ? raw : null;
    const level = value !== null ? levelForValue(habit, value) : selectedLevel;
    lastResult = completeMission(habit, level, value);
    step = "concluido";
    refresh();
  });

  return createEl("div", {
    className: "focus-levels",
    children: [
      levelGrid,
      createEl("p", { className: "mission-hint", text: LEVEL_HINTS[selectedLevel] }),
      realToggle,
      realRow,
      concludeButton,
    ],
  });
}

/*
  Admitir que hoje não vai dar — a mesma ideia da tela de missão completa,
  em versão mínima: sem campo de texto livre aqui, só o motivo rápido. Quem
  quiser detalhar tem a tela de missão de cada hábito para isso.
*/
function renderMissInline(habit) {
  const miss = getMissForToday(habit.id);

  if (miss) {
    const undo = createEl("button", {
      className: "link-button",
      text: "Desfazer",
      attrs: { type: "button" },
    });
    undo.addEventListener("click", () => {
      undeclareMiss(habit.id);
      refresh();
    });

    const motivo = getMissReasonLabel(miss.reason);
    return createEl("div", {
      className: "focus-miss is-declared",
      children: [
        createEl("p", { className: "mission-hint", text: "Um dia difícil não apaga sua caminhada." }),
        motivo ? createEl("p", { className: "mission-hint", text: `Motivo: ${motivo}` }) : null,
        undo,
      ],
    });
  }

  const link = createEl("button", {
    className: "link-button link-muted",
    text: "Hoje não vai dar",
    attrs: { type: "button" },
  });

  let reason = null;
  const reasonChips = new Map();
  const reasonRow = createEl("div", {
    className: "quick-picker",
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

  const confirmButton = createEl("button", {
    className: "button button-secondary",
    text: "Confirmar",
    attrs: { type: "button" },
  });
  const cancelButton = createEl("button", {
    className: "link-button",
    text: "Cancelar",
    attrs: { type: "button" },
  });

  const form = createEl("div", {
    className: "miss-declare-form",
    attrs: { hidden: "" },
    children: [
      createEl("p", { className: "mission-hint", text: "Um dia difícil não apaga sua caminhada." }),
      reasonRow,
      createEl("div", { className: "ritual-actions", children: [cancelButton, confirmButton] }),
    ],
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
  });
  confirmButton.addEventListener("click", () => {
    declareMiss(habit.id, { reason });
    closeHabit();
    refresh();
  });

  return createEl("div", { className: "miss-declare", children: [link, form] });
}

/* ------------------------------------------------------------------ */
/* Conclusão                                                           */
/* ------------------------------------------------------------------ */

function renderConclusion(habit) {
  if (!habit) return null;

  const log = getLogForToday(habit.id);
  const companion = getCompanionState(habit);
  const stats = getHabitStats(habit);
  const status = getCreatureStatus(habit);
  const result = lastResult || {};
  const animal = companion.animal;

  const xpLine = createEl("p", {
    className: "conclusion-xp",
    text: `+${log?.xpEarned ?? result.xpEarned ?? 0} XP`,
  });

  const evolutionLine = result.evolved
    ? createEl("p", {
        className: "conclusion-evolution",
        text: `${animal?.name || "Seu guardião"} evoluiu para ${stageName(companion.stage, animal?.gender)}.`,
      })
    : createEl("p", {
        className: "mission-hint",
        text: companion.nextStage
          ? `Faltam ${companion.nextStage.minXp - companion.xp} XP para ${stageName(
              companion.nextStage,
              animal?.gender
            )}.`
          : "Forma lendária alcançada.",
      });

  const treeBlock = createEl("div", {
    className: "status-tree",
    children: [
      createEl("div", {
        className: "status-tree-art",
        children: [createTree(stats.treeStage.stage, status.tree.leaf, vigorAmount(status.vigor))],
      }),
      createEl("div", {
        className: "status-tree-body",
        children: [
          createEl("span", { className: "status-tree-name", text: `${status.tree.name} · ${stats.treeStage.name}` }),
          createEl("span", {
            className: "mission-hint",
            text: `Sequência atual: ${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}.`,
          }),
        ],
      }),
    ],
  });

  const percentLine = createEl("p", { className: "conclusion-percent", text: "Você avançou 1% hoje." });

  let feeling = null;
  const feelingChips = new Map();
  const feelingRow = createEl("div", {
    className: "chip-row",
    children: FEELINGS.map((option) => {
      const chip = createEl("button", { className: "chip", text: option.label, attrs: { type: "button" } });
      chip.addEventListener("click", () => {
        feeling = feeling === option.id ? null : option.id;
        feelingChips.forEach((el, id) => el.classList.toggle("is-selected", id === feeling));
      });
      feelingChips.set(option.id, chip);
      return chip;
    }),
  });

  const reflectionInput = createEl("textarea", {
    className: "input",
    attrs: { rows: "2", maxlength: "240", placeholder: "Alguma lembrança de hoje? (opcional)" },
  });

  function persistReflection() {
    const text = reflectionInput.value.trim();
    if (log && text) saveReflection(log.id, text, feeling);
  }

  const nextPending = getPriorityHabit(getHabits().filter((item) => item.id !== habit.id));

  const saveButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Salvar e encerrar",
    attrs: { type: "button" },
  });
  saveButton.addEventListener("click", () => {
    persistReflection();
    closeHabit();
    lastResult = null;
    refresh();
  });

  const actions = [saveButton];
  if (nextPending) {
    const nextButton = createEl("button", {
      className: "button button-secondary button-block",
      text: "Fazer outra missão",
      attrs: { type: "button" },
    });
    nextButton.addEventListener("click", () => {
      persistReflection();
      lastResult = null;
      openHabit(nextPending.id);
      refresh();
    });
    actions.push(nextButton);
  }

  return createEl("section", {
    className: "card card-accent focus-card is-conclusion",
    attrs: animal ? { style: accentStyle(animal.color) } : {},
    children: [
      createEl("span", { className: "ritual-step", text: "Missão concluída" }),
      identityBlock(habit, companion),
      xpLine,
      evolutionLine,
      treeBlock,
      percentLine,
      createEl("span", { className: "form-label", text: "Como foi?" }),
      feelingRow,
      reflectionInput,
      ...actions,
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Hábitos secundários e o segundo motivo de abrir o app                */
/* ------------------------------------------------------------------ */

function renderSecondaryHabits(habits, excludeId) {
  const rest = excludeId ? habits.filter((habit) => habit.id !== excludeId) : habits;
  if (!rest.length) return null;

  const title = excludeId ? `Outros hábitos (${rest.length})` : "Seus hábitos";

  return createEl("section", {
    className: "secondary-habits",
    children: [
      createEl("h2", { className: "section-title", text: title }),
      ...rest.map((habit) => renderSecondaryCard(habit)),
    ],
  });
}

function renderSecondaryCard(habit) {
  const companion = getCompanionState(habit);
  const done = isDoneToday(habit.id);

  const row = createHabitRow(habit, {
    done,
    companion,
    mood: getMood(habit.id),
    onClick: () => navigate(`/missao?habit=${habit.id}`),
  });

  return createEl("div", { className: "habit-item is-secondary", children: [row] });
}

// Igual ao nudge de achado, mas para uma ferramenta — algo com efeito real,
// não só uma peça de coleção. A entrega em si acontece em Ferramentas.
function renderToolNudge() {
  const pendente = getPendingTool();
  if (!pendente) return null;

  return createEl("a", {
    className: "next-step",
    attrs: { href: "#/ferramentas" },
    children: [
      createEl("span", {
        className: "next-step-text",
        text: `Uma ferramenta te espera: ${pendente.tool.name}.`,
      }),
      createEl("span", { className: "link-button", text: "Ver" }),
    ],
  });
}

// O segundo motivo de abrir o app: quando alguém trouxe algo, uma linha
// discreta aponta para o Lar — sem competir com a missão do dia.
function renderDiscoveryNudge(habits) {
  for (const habit of habits) {
    const companion = getCompanionState(habit);
    if (companion.animal && getPendingDiscovery(habit, companion.animal)) {
      return createEl("a", {
        className: "next-step",
        attrs: { href: "#/jardim" },
        children: [
          createEl("span", {
            className: "next-step-text",
            text: `${companion.animal.name} encontrou algo para você.`,
          }),
          createEl("span", { className: "link-button", text: "Ir ao jardim" }),
        ],
      });
    }
  }
  return null;
}
