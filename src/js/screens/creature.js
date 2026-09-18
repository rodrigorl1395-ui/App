import { createEl, createCompanion, accentStyle } from "../ui.js";
import { createTree, createIcon } from "../icons.js";
import { getCollectionFor } from "../discoveries.js";
import { navigate } from "../router.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getMoodMessage } from "../mood.js";
import { stageName } from "../evolution.js";
import { getHabitStats, getMonthCalendar, getTimeline, getHabitLogs } from "../stats.js";
import { MISSION_LEVELS, getFeelingLabel } from "../missions.js";
import { getTreeType } from "../../data/trees.js";
import { fillNames } from "../../data/quests.js";
import { getJourney } from "../quests.js";
import { CATEGORY_LABELS } from "../../data/animals.js";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function renderCreatureScreen(params) {
  const habit = getHabits().find((item) => item.id === params.habit);
  if (!habit) {
    navigate("/hoje");
    return createEl("div", { className: "screen" });
  }

  const companion = getCompanionState(habit);
  const animal = companion.animal;
  const stats = getHabitStats(habit);
  const tree = getTreeType(habit.treeType);

  return createEl("div", {
    className: "screen profile",
    attrs: animal ? { style: accentStyle(animal.color) } : {},
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Perfil" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } }),
        ],
      }),
      renderIdentity(habit, companion, animal, tree, stats),
      renderHabitCard(habit, stats, tree),
      renderIndicators(stats, habit),
      renderCollection(habit, animal),
      renderJourney(habit, animal),
      renderCalendar(habit),
      renderTimeline(habit, animal),
      renderHistory(habit),
    ],
  });
}

function renderIdentity(habit, companion, animal, tree, stats) {
  if (!animal) return null;

  const hero = createCompanion({
    animal,
    stageName: companion.stageLabel,
    progress: companion.progress,
    caption: companion.nextStage
      ? `Faltam ${companion.nextStage.minXp - stats.xp} XP para ${stageName(
          companion.nextStage,
          animal.gender
        )}`
      : "Forma lendária alcançada",
  });

  const guardian = `${animal.gender === "f" ? "Guardiã" : "Guardião"} ${tree.guardianOf}`;

  return createEl("section", {
    className: "profile-identity",
    children: [
      hero,
      createEl("p", { className: "profile-guardian", text: guardian }),
      createEl("p", { className: "profile-personality", text: animal.personality }),
      createEl("p", { className: "profile-mood", text: getMoodMessage(animal, habit.id) }),
      createEl("p", {
        className: "fruit-date",
        text: `${animal.gender === "f" ? "Escolhida" : "Escolhido"} em ${formatDate(
          habit.createdAt.slice(0, 10)
        )}`,
      }),
    ],
  });
}

function renderHabitCard(habit, stats, tree) {
  const weekBar = createEl("div", {
    className: "week-bar",
    children: Array.from({ length: stats.weeklyTarget }, (_, index) =>
      createEl("span", {
        className: `week-pip${index < stats.weekDays ? " is-filled" : ""}`,
      })
    ),
  });

  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: habit.name }),
      createEl("p", {
        className: "card-subtitle",
        text: `Hábito de ${CATEGORY_LABELS[habit.category] || habit.category}. Objetivo do dia: ${
          habit.missions.main
        } ${habit.unit}.`,
      }),
      createEl("p", {
        className: "card-subtitle",
        text: `Meta: ${stats.weeklyTarget} ${stats.weeklyTarget === 1 ? "vez" : "vezes"} por semana. Esta semana: ${
          stats.weekDays
        } de ${stats.weeklyTarget}.`,
      }),
      weekBar,
      createEl("div", {
        className: "profile-tree",
        children: [
          createEl("div", {
            className: "profile-tree-art",
            children: [createTree(stats.treeStage.stage, tree.leaf)],
          }),
          createEl("div", {
            className: "habit-body",
            children: [
              createEl("span", { className: "habit-name", text: tree.name }),
              createEl("span", { className: "habit-goal", text: stats.treeStage.name }),
            ],
          }),
        ],
      }),
    ],
  });
}

/*
  A pergunta não é "quantas vezes você fez", e sim "como você está em relação
  a você mesmo" — por isso a comparação com o mês passado fica lado a lado
  com o total.
*/
function renderIndicators(stats, habit) {
  const delta =
    stats.lastMonthDays === 0
      ? stats.monthDays > 0
        ? "primeiro mês"
        : "sem registros ainda"
      : `${stats.monthDelta >= 0 ? "+" : ""}${stats.monthDelta} vs. mês passado`;

  const tiles = [
    { valor: stats.total, rotulo: stats.total === 1 ? "registro" : "registros" },
    // A unidade vai no rótulo: concordar com "min", "páginas" ou "porções" no
    // meio da frase daria errado, e valor longo quebra a grade em duas linhas.
    { valor: stats.amount, rotulo: `${habit.unit} no total` },
    { valor: `${stats.consistency}%`, rotulo: "de consistência" },
    { valor: stats.currentStreak, rotulo: "dias seguidos agora" },
    { valor: stats.bestStreak, rotulo: "melhor sequência" },
    { valor: stats.activeDays, rotulo: "dias ativos" },
    { valor: stats.monthDays, rotulo: "neste mês", nota: delta },
    { valor: stats.fruits, rotulo: stats.fruits === 1 ? "fruto guardado" : "frutos guardados" },
  ];

  return createEl("section", {
    className: "indicator-grid",
    children: tiles.map((tile) =>
      createEl("div", {
        className: "indicator",
        children: [
          createEl("span", { className: "indicator-value", text: String(tile.valor) }),
          createEl("span", { className: "indicator-label", text: tile.rotulo }),
          tile.nota ? createEl("span", { className: "indicator-note", text: tile.nota }) : null,
        ],
      })
    ),
  });
}

// O que a criatura já trouxe. Fica logo abaixo dela porque é a prova mais
// concreta de que ela esteve fazendo algo enquanto você vivia sua vida.
function renderCollection(habit, animal) {
  const items = getCollectionFor(habit, animal);
  if (!items.length) return null;

  return createEl("section", {
    className: "collection",
    children: [
      createEl("h2", { className: "section-title", text: `Achados (${items.length})` }),
      createEl("div", {
        className: "collection-grid",
        children: items.map((item) =>
          createEl("article", {
            className: "collection-item",
            attrs: { title: item.story },
            children: [
              createEl("span", { className: "collection-icon", children: [createIcon(item.icon)] }),
              createEl("span", { className: "collection-name", text: item.name }),
            ],
          })
        ),
      }),
    ],
  });
}

function renderJourney(habit, animal) {
  const journey = getJourney(habit);
  const conquered = journey.filter((state) => state.conquered).length;

  return createEl("section", {
    className: "journey",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "section-title", text: "Jornada" }),
          createEl("span", {
            className: "fruit-date",
            text: `${conquered} de ${journey.length}`,
          }),
        ],
      }),
      ...journey.map((state) => {
        const { quest, status, main, reserve, byReserve } = state;

        // A missão trancada não entrega a história: o que vem depois é
        // justamente o que dá vontade de voltar amanhã.
        const body =
          status === "trancada"
            ? [createEl("p", { className: "quest-locked-text", text: "Ainda não revelada." })]
            : [
                createEl("p", {
                  className: "quest-story",
                  text: fillNames(quest.story, animal?.name),
                }),
                status === "atual"
                  ? createEl("p", {
                      className: "mission-xp",
                      text: reserve
                        ? `${main.current} de ${main.target} · reserva ${reserve.current} de ${reserve.target}`
                        : `${main.current} de ${main.target}`,
                    })
                  : createEl("p", {
                      className: "quest-reward",
                      text: byReserve
                        ? `Conquistada pela missão reserva: ${quest.reserve.name}`
                        : fillNames(quest.reward, animal?.name),
                    }),
              ];

        return createEl("article", {
          className: `quest-row is-${status}`,
          children: [
            createEl("span", { className: "quest-row-mark" }),
            createEl("div", {
              className: "quest-row-body",
              children: [
                createEl("span", {
                  className: "quest-row-name",
                  text: status === "trancada" ? "Missão selada" : quest.name,
                }),
                ...body,
              ],
            }),
          ],
        });
      }),
    ],
  });
}

function renderCalendar(habit) {
  const calendar = getMonthCalendar(habit.id);

  return createEl("section", {
    className: "calendar",
    children: [
      createEl("h2", { className: "section-title", text: calendar.label }),
      createEl("div", {
        className: "calendar-grid",
        children: [
          ...WEEKDAYS.map((letter) =>
            createEl("span", { className: "calendar-weekday", text: letter })
          ),
          ...calendar.days.map((day) =>
            day
              ? createEl("span", {
                  className: `calendar-day is-${day.status}`,
                  text: String(day.day),
                  attrs: { title: `${day.day}: ${day.status}` },
                })
              : createEl("span", { className: "calendar-day is-empty" })
          ),
        ],
      }),
      createEl("div", {
        className: "calendar-legend",
        children: [
          legendItem("cumprido", "cumprido"),
          legendItem("parcial", "só a mínima"),
          legendItem("vazio", "sem registro"),
        ],
      }),
    ],
  });
}

function legendItem(status, label) {
  return createEl("span", {
    className: "calendar-legend-item",
    children: [
      createEl("span", { className: `calendar-dot is-${status}` }),
      createEl("span", { text: label }),
    ],
  });
}

function renderTimeline(habit, animal) {
  const events = getTimeline(habit, animal);

  return createEl("section", {
    className: "timeline",
    children: [
      createEl("h2", { className: "section-title", text: "Sua história" }),
      ...events.map((event) =>
        createEl("article", {
          className: "timeline-event",
          children: [
            createEl("span", { className: "timeline-date", text: formatDate(event.date) }),
            createEl("p", { className: "timeline-text", text: event.text }),
          ],
        })
      ),
    ],
  });
}

function renderHistory(habit) {
  const logs = getHabitLogs(habit.id).slice().reverse();
  if (!logs.length) return null;

  return createEl("section", {
    className: "history",
    children: [
      createEl("h2", { className: "section-title", text: "Registros" }),
      ...logs.slice(0, 20).map((log) => {
        const feeling = getFeelingLabel(log.feeling);
        return createEl("article", {
          className: "history-row",
          children: [
            createEl("div", {
              className: "history-main",
              children: [
                createEl("span", {
                  className: "history-value",
                  text: `${log.value} ${habit.unit}`,
                }),
                createEl("span", {
                  className: "history-meta",
                  text: `${formatDate(log.date)}${log.time ? `, ${log.time}` : ""}`,
                }),
                log.reflection
                  ? createEl("p", { className: "history-note", text: log.reflection })
                  : null,
              ],
            }),
            createEl("div", {
              className: "history-side",
              children: [
                createEl("span", {
                  className: "badge",
                  text: MISSION_LEVELS[log.level]?.label || log.level,
                }),
                createEl("span", { className: "history-xp", text: `${log.xpEarned} XP` }),
                feeling ? createEl("span", { className: "history-xp", text: feeling }) : null,
              ],
            }),
          ],
        });
      }),
    ],
  });
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(`${dateKey}T00:00:00`)
  );
}
