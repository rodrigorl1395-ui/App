/*
  Perfil da criatura — o diário de evolução de um hábito.

  A tela juntava dez seções numa rolagem só: identidade, estado, hábito, dez
  indicadores, achados, jornada, calendário, linha do tempo e registros. Tudo
  estava lá, mas nada tinha peso — a pessoa rolava procurando.

  Agora há uma cabeça fixa (quem é a criatura) e quatro abas, cada uma
  respondendo a uma pergunta:

    Estado    — como ela está agora, e o que falta hoje
    Progresso — como eu venho indo, em números e no calendário
    Jornada   — o que ela ainda tem para conquistar e o que já trouxe
    História  — o que já aconteceu, do primeiro dia até o último registro

  A aba é estado local da tela e não entra no hash: trocar de aba redesenha
  só o painel, então a cabeça não pisca e a rolagem não salta.
*/

import { createEl, createCompanion, accentStyle } from "../ui.js";
import { createTree, createIcon } from "../icons.js";
import { getCollectionFor } from "../discoveries.js";
import { getPowerForElement } from "../../data/powers.js";
import { getCharges, getNextChargeIn, getRevealedQuests } from "../powers.js";
import { navigate } from "../router.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getMoodMessage } from "../mood.js";
import { stageName } from "../evolution.js";
import { getHabitStats, getMonthCalendar, getTimeline, getHabitLogs } from "../stats.js";
import { MISSION_LEVELS, getFeelingLabel, getFruits } from "../missions.js";
import { getTreeType } from "../../data/trees.js";
import { fillNames } from "../../data/quests.js";
import { getJourney } from "../quests.js";
import { CATEGORY_LABELS } from "../../data/animals.js";
import { getCreatureStatus, vigorAmount } from "../master.js";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

const TABS = [
  { id: "estado", label: "Estado", render: renderEstado },
  { id: "progresso", label: "Progresso", render: renderProgresso },
  { id: "jornada", label: "Jornada", render: renderJornada },
  { id: "historia", label: "História", render: renderHistoria },
];

export function renderCreatureScreen(params) {
  const habit = getHabits().find((item) => item.id === params.habit);
  if (!habit) {
    navigate("/hoje");
    return createEl("div", { className: "screen" });
  }

  // Um contexto só, montado uma vez: as abas leem dele em vez de cada seção
  // recalcular as mesmas estatísticas.
  const view = {
    habit,
    companion: getCompanionState(habit),
    stats: getHabitStats(habit),
    tree: getTreeType(habit.treeType),
  };
  view.animal = view.companion.animal;

  const panel = createEl("div", { className: "profile-panel" });
  const tabBar = createTabBar(view, panel);

  return createEl("div", {
    className: "screen profile",
    attrs: view.animal ? { style: accentStyle(view.animal.color) } : {},
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Perfil" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/habitos" } }),
        ],
      }),
      renderIdentity(view),
      tabBar,
      panel,
    ],
  });
}

// Barra de abas. Só o painel é redesenhado na troca — a cabeça fica parada.
function createTabBar(view, panel) {
  const buttons = new Map();

  function select(id) {
    const tab = TABS.find((item) => item.id === id) || TABS[0];
    buttons.forEach((button, buttonId) => {
      const active = buttonId === tab.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    panel.replaceChildren(...tab.render(view).filter(Boolean));
  }

  const bar = createEl("div", {
    className: "profile-tabs",
    attrs: { role: "tablist" },
    children: TABS.map((tab) => {
      const button = createEl("button", {
        className: "profile-tab",
        text: tab.label,
        attrs: { type: "button", role: "tab", "aria-selected": "false" },
      });
      button.addEventListener("click", () => select(tab.id));
      buttons.set(tab.id, button);
      return button;
    }),
  });

  select(TABS[0].id);
  return bar;
}

/* ------------------------------------------------------------------ */
/* Cabeça: quem é ela                                                  */
/* ------------------------------------------------------------------ */

/*
  A identidade era cinco parágrafos centralizados empilhados. Ficou o orbe
  (que é a âncora emocional da tela) e uma tira de três fatos — guardiã, o
  hábito e a categoria. O resto da personalidade desceu para a aba Estado,
  onde ela tem contexto em vez de competir com o nome.
*/
function renderIdentity(view) {
  const { companion, animal, stats, tree, habit } = view;
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

  const fatos = [
    `${animal.gender === "f" ? "Guardiã" : "Guardião"} ${tree.guardianOf}`,
    habit.name,
    capitalize(CATEGORY_LABELS[habit.category] || habit.category),
  ];

  return createEl("section", {
    className: "profile-identity",
    children: [
      hero,
      createEl("div", {
        className: "profile-facts",
        children: fatos.map((texto) => createEl("span", { className: "profile-fact", text: texto })),
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Aba Estado                                                          */
/* ------------------------------------------------------------------ */

function renderEstado(view) {
  return [
    renderStatus(view),
    renderTodayCard(view),
    renderPowerCard(view),
    renderWhoCard(view),
  ];
}

/*
  Estado agora: a resposta rápida para "como ela está?", sem obrigar a pessoa
  a ler números. Ela já fez hoje? Está feliz ou com fome? E a árvore de onde
  ela come, está de pé?

  A ligação entre as três coisas é a ideia toda: cumprir o hábito é regar a
  árvore, a árvore dá o fruto, e o fruto é o que alimenta a criatura. Por isso
  não existe botão de água — regar é fazer.
*/
function renderStatus(view) {
  const status = getCreatureStatus(view.habit);

  const linhas = [
    {
      rotulo: "Atividade de hoje",
      // "Hoje não deu" é diferente de "ainda não": é uma admissão, não um
      // aviso — por isso tem cor própria, nem verde nem laranja de alerta.
      valor: status.doneToday ? "Cumprida" : status.missToday ? "Hoje não deu" : "Ainda não",
      estado: status.doneToday ? "bom" : status.missToday ? "sincero" : "atencao",
    },
    {
      rotulo: "Como ela está",
      valor: capitalize(status.mood.label),
      estado: status.doneToday ? "bom" : status.mood.id === "faminta" ? "atencao" : "neutro",
    },
    {
      rotulo: "Sequência",
      valor: `${status.streak} ${status.streak === 1 ? "dia" : "dias"}`,
      estado: status.streak > 0 ? "bom" : "neutro",
    },
    {
      rotulo: "Esta semana",
      valor: `${status.weekDays} de ${status.weeklyTarget}`,
      estado: status.weekDays >= status.weeklyTarget ? "bom" : "neutro",
    },
  ];

  // A árvore que nunca foi regada não tem o que medir — a barra só aparece
  // depois do primeiro dia cumprido.
  const medidor =
    status.vigor === null
      ? null
      : createEl("div", {
          className: "vigor-bar",
          children: [
            createEl("span", {
              className: "vigor-bar-fill",
              attrs: { style: `width: ${Math.round(status.vigor * 100)}%` },
            }),
          ],
        });

  return createEl("section", {
    className: `card status-card is-${status.doneToday ? "alimentada" : "esperando"}`,
    children: [
      createEl("h2", { className: "card-title", text: "Estado agora" }),
      createEl("div", {
        className: "status-grid",
        children: linhas.map((linha) =>
          createEl("div", {
            className: `status-item is-${linha.estado}`,
            children: [
              createEl("span", { className: "status-item-label", text: linha.rotulo }),
              createEl("span", { className: "status-item-value", text: linha.valor }),
            ],
          })
        ),
      }),
      createEl("div", {
        className: "status-tree",
        children: [
          createEl("div", {
            className: "status-tree-art",
            children: [
              createTree(status.treeStage.stage, status.tree.leaf, vigorAmount(status.vigor)),
            ],
          }),
          createEl("div", {
            className: "status-tree-body",
            children: [
              createEl("span", {
                className: "status-tree-name",
                text: `${status.tree.name} · ${status.treeStage.name}`,
              }),
              createEl("span", { className: "status-tree-state", text: status.vigorLabel }),
              medidor,
            ],
          }),
        ],
      }),
      createEl("p", { className: "status-feeding", text: status.feeding }),
      status.missNote
        ? createEl("p", { className: "status-miss-note", text: `Você disse: "${status.missNote}"` })
        : null,
    ],
  });
}

/*
  O hábito do dia. As três missões ficam lado a lado com o valor de cada uma,
  porque é isso que a pessoa precisa saber na hora de decidir — e o mínimo
  visível é o que evita o "se não posso fazer tudo, não faço nada".
*/
function renderTodayCard(view) {
  const { habit, stats } = view;

  const niveis = ["minimal", "main", "bonus"]
    .filter((key) => habit.missions[key])
    .map((key) =>
      createEl("div", {
        className: `mission-level${key === "main" ? " is-main" : ""}`,
        children: [
          createEl("span", { className: "mission-level-label", text: MISSION_LEVELS[key].label }),
          createEl("span", {
            className: "mission-level-value",
            text: `${habit.missions[key]} ${habit.unit}`,
          }),
          createEl("span", { className: "mission-level-xp", text: `${MISSION_LEVELS[key].xp} XP` }),
        ],
      })
    );

  const weekBar = createEl("div", {
    className: "week-bar",
    children: Array.from({ length: stats.weeklyTarget }, (_, index) =>
      createEl("span", { className: `week-pip${index < stats.weekDays ? " is-filled" : ""}` })
    ),
  });

  // Cumprido o dia, o botão deixa de ser a coisa mais gritante da tela: ele
  // continua ali para quem quer registrar de novo, sem cobrar nada.
  const feito = isToday(habit);
  const acao = createEl("a", {
    className: `button ${feito ? "button-secondary" : "button-primary"} button-block`,
    text: feito ? "Registrar de novo" : "Cumprir hoje",
    attrs: { href: `#/missao?habit=${habit.id}` },
  });

  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "O hábito" }),
      createEl("div", { className: "mission-levels", children: niveis }),
      createEl("p", {
        className: "card-subtitle",
        text: `Meta da semana: ${stats.weeklyTarget} ${
          stats.weeklyTarget === 1 ? "vez" : "vezes"
        }. Você está em ${stats.weekDays}.`,
      }),
      weekBar,
      acao,
    ],
  });
}

// O poder é parte da identidade: é o que faz escolher uma criatura em vez
// de outra pesar de verdade, e não ser só a cor.
function renderPowerCard(view) {
  const { habit, animal } = view;
  const power = getPowerForElement(animal?.element);
  if (!power) return null;

  const charges = getCharges(habit);
  return createEl("section", {
    className: "card",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "card-title", text: "Poder" }),
          charges
            ? createEl("span", {
                className: "badge",
                text: `${charges} ${charges === 1 ? "carga" : "cargas"}`,
              })
            : createEl("span", {
                className: "fruit-date",
                text: `em ${getNextChargeIn(habit)} dias cumpridos`,
              }),
        ],
      }),
      createEl("p", { className: "power-name", text: power.name }),
      createEl("p", { className: "card-subtitle", text: power.description }),
    ],
  });
}

function renderWhoCard(view) {
  const { animal, habit } = view;
  if (!animal) return null;

  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: `Quem é ${animal.name}` }),
      createEl("p", { className: "card-subtitle", text: animal.personality }),
      createEl("p", { className: "creature-mood", text: getMoodMessage(animal, habit.id) }),
      createEl("p", {
        className: "fruit-date",
        text: `${animal.gender === "f" ? "Escolhida" : "Escolhido"} em ${formatDate(
          habit.createdAt.slice(0, 10)
        )}`,
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Aba Progresso                                                       */
/* ------------------------------------------------------------------ */

function renderProgresso(view) {
  return [renderIndicators(view), renderCalendar(view)];
}

/*
  Dez indicadores numa grade lisa não dizem o que importa. Separados em dois
  grupos, dizem: constância é com que frequência você aparece, esforço é o
  tamanho do que você fez. São perguntas diferentes e melhoram em ritmos
  diferentes — quem volta depois de sumir recupera a constância devagar e o
  esforço na hora.
*/
function renderIndicators(view) {
  const { stats, habit, animal } = view;

  const delta =
    stats.lastMonthDays === 0
      ? stats.monthDays > 0
        ? "primeiro mês"
        : "sem registros ainda"
      : `${stats.monthDelta >= 0 ? "+" : ""}${stats.monthDelta} vs. mês passado`;

  const grupos = [
    {
      titulo: "Constância",
      nota: "Com que frequência você aparece.",
      tiles: [
        { valor: stats.currentStreak, rotulo: "dias seguidos agora" },
        { valor: stats.bestStreak, rotulo: "melhor sequência" },
        { valor: `${stats.consistency}%`, rotulo: "de consistência" },
        { valor: stats.activeDays, rotulo: "dias ativos" },
      ],
    },
    {
      titulo: "Esforço",
      nota: "O tamanho do que você fez.",
      tiles: [
        { valor: stats.total, rotulo: stats.total === 1 ? "registro" : "registros" },
        // A unidade vai no rótulo: concordar com "min", "páginas" ou "porções"
        // no meio da frase daria errado, e valor longo quebra a grade.
        { valor: stats.amount, rotulo: `${habit.unit} no total` },
        { valor: stats.xp, rotulo: "XP acumulado", nota: stageName(stats.stage, animal?.gender) },
        { valor: stats.monthDays, rotulo: "neste mês", nota: delta },
      ],
    },
  ];

  return createEl("div", {
    className: "indicator-groups",
    children: grupos.map((grupo) =>
      createEl("section", {
        className: "indicator-group",
        children: [
          createEl("div", {
            className: "indicator-group-head",
            children: [
              createEl("h2", { className: "section-title", text: grupo.titulo }),
              createEl("p", { className: "fruit-date", text: grupo.nota }),
            ],
          }),
          createEl("div", {
            className: "indicator-grid",
            children: grupo.tiles.map((tile) =>
              createEl("div", {
                className: "indicator",
                children: [
                  createEl("span", { className: "indicator-value", text: String(tile.valor) }),
                  createEl("span", { className: "indicator-label", text: tile.rotulo }),
                  tile.nota
                    ? createEl("span", { className: "indicator-note", text: tile.nota })
                    : null,
                ],
              })
            ),
          }),
        ],
      })
    ),
  });
}

function renderCalendar(view) {
  const calendar = getMonthCalendar(view.habit.id);

  return createEl("section", {
    className: "calendar",
    children: [
      createEl("h2", { className: "section-title", text: capitalize(calendar.label) }),
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
          legendItem("descanso", "descanso"),
          legendItem("assumido", "admitido"),
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

/* ------------------------------------------------------------------ */
/* Aba Jornada                                                         */
/* ------------------------------------------------------------------ */

function renderJornada(view) {
  return [renderJourney(view), renderCollection(view)];
}

function renderJourney(view) {
  const { habit, animal } = view;
  const journey = getJourney(habit);
  const conquered = journey.filter((state) => state.conquered).length;
  const revealed = getRevealedQuests(habit.id);

  return createEl("section", {
    className: "journey",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "section-title", text: "Jornada" }),
          createEl("span", { className: "fruit-date", text: `${conquered} de ${journey.length}` }),
        ],
      }),
      ...journey.map((state) => {
        const { quest, status, main, reserve, byReserve } = state;

        // A missão trancada não entrega a história — a não ser que o
        // Vislumbre tenha revelado esta.
        const revelada = revealed.includes(quest.id);
        const body =
          status === "trancada" && !revelada
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
                  text: status === "trancada" && !revelada ? "Missão selada" : quest.name,
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

// O que a criatura já trouxe: a prova mais concreta de que ela esteve
// fazendo algo enquanto você vivia sua vida.
function renderCollection(view) {
  const items = getCollectionFor(view.habit, view.animal);

  if (!items.length) {
    return createEl("section", {
      className: "collection",
      children: [
        createEl("h2", { className: "section-title", text: "Achados" }),
        createEl("p", {
          className: "tree-hint",
          text: `Nada ainda. ${
            view.animal?.name || "Sua criatura"
          } encontra coisas enquanto você cumpre o hábito — visite o Lar para receber.`,
        }),
      ],
    });
  }

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

/* ------------------------------------------------------------------ */
/* Aba História                                                        */
/* ------------------------------------------------------------------ */

function renderHistoria(view) {
  return [renderTimeline(view), renderFruits(view), renderHistory(view)];
}

function renderTimeline(view) {
  const events = getTimeline(view.habit, view.animal);

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

// Os frutos são as lembranças guardadas. Estavam escondidos como um número
// solto na grade de indicadores; aqui eles aparecem com o texto, que é a
// única forma de um fruto valer alguma coisa.
function renderFruits(view) {
  const fruits = getFruits(view.habit.id);
  if (!fruits.length) return null;

  return createEl("section", {
    className: "fruits",
    children: [
      createEl("h2", { className: "section-title", text: `Frutos (${fruits.length})` }),
      ...fruits.slice(0, 10).map((log) =>
        createEl("article", {
          className: "fruit-row",
          children: [
            createEl("span", { className: "fruit-icon", children: [createIcon("apple")] }),
            createEl("div", {
              className: "fruit-body",
              children: [
                createEl("p", { className: "fruit-text", text: log.reflection }),
                createEl("span", { className: "fruit-date", text: formatDate(log.date) }),
              ],
            }),
          ],
        })
      ),
    ],
  });
}

function renderHistory(view) {
  const { habit } = view;
  const logs = getHabitLogs(habit.id).slice().reverse();
  if (!logs.length) return null;

  return createEl("section", {
    className: "history",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "section-title", text: "Registros" }),
          createEl("span", {
            className: "fruit-date",
            text: logs.length > 20 ? `últimos 20 de ${logs.length}` : `${logs.length} no total`,
          }),
        ],
      }),
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

/* ------------------------------------------------------------------ */

function isToday(habit) {
  return getHabitLogs(habit.id).some((log) => log.date === new Date().toISOString().slice(0, 10));
}

function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(`${dateKey}T00:00:00`)
  );
}
