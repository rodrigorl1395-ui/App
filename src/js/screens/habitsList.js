import {
  createEl,
  createHabitRow,
  createEmptyState,
  createSectionHeader,
  createCreatureBadge,
  accentStyle,
} from "../ui.js";
import { createTree } from "../icons.js";
import { navigate, refresh } from "../router.js";
import { getHabits, removeHabit } from "../habits.js";
import { showReorderHabits } from "./reorderHabits.js";
import { getCompanionState, getAvailableAnimals } from "../companion.js";
import { getMood } from "../mood.js";
import { getFruits } from "../missions.js";
import {
  getMasterProfile,
  getTreeVigor,
  describeVigor,
  vigorAmount,
  getLifeRadar,
  readLifeRadar,
  RADAR_WINDOW,
} from "../master.js";
import { createLifeRadar } from "../radar.js";
import { getTreeType, getTreeStage } from "../../data/trees.js";

export function renderHabitsScreen() {
  const habits = getHabits();
  const available = getAvailableAnimals();

  const newButton = createEl("button", {
    className: "button button-primary button-block",
    text: available.length ? "Novo hábito" : "Conquiste outra criatura para um novo hábito",
    attrs: { type: "button" },
  });
  newButton.disabled = !available.length;
  newButton.addEventListener("click", () => navigate("/novo-habito"));

  const content = habits.length
    ? createEl("div", { className: "habit-list", children: habits.map(renderHabitItem) })
    : createEmptyState("Nenhum hábito ainda. Cada criatura cuida de um, e cresce com ele.");

  const reorderButton = createEl("button", {
    className: "link-button",
    text: "Reordenar",
    attrs: { type: "button" },
  });
  reorderButton.addEventListener("click", () => {
    showReorderHabits(() => refresh());
  });

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Meus hábitos"),
      habits.length ? renderMaster() : null,
      habits.length
        ? createEl("div", {
            className: "section-header",
            children: [
              createEl("h2", { className: "section-title", text: "Suas criaturas" }),
              habits.length > 1 ? reorderButton : null,
            ],
          })
        : null,
      content,
      newButton,
    ],
  });
}

/*
  O Perfil do Mestre. As criaturas contam cada uma a sua história; aqui é a
  única tela que responde pelo jogador inteiro — onde ele está forte, onde
  está fraco e quanto do jardim ele regou hoje.

  O título do Mestre vem de presença (dias em que apareceu), não de XP: XP é
  mérito da criatura, presença é mérito de quem abriu o app e fez.
*/
function renderMaster() {
  const perfil = getMasterProfile();
  const { rank } = perfil;

  const barra = createEl("div", {
    className: "master-bar",
    children: [
      createEl("span", {
        className: "master-bar-fill",
        attrs: { style: `width: ${Math.round(rank.progress * 100)}%` },
      }),
    ],
  });

  const proximo = rank.next
    ? `Faltam ${rank.next.minDays - perfil.activeDays} dias ativos para ${rank.next.name}`
    : "Você chegou ao topo da escada. Agora é só continuar.";

  const numeros = [
    { valor: perfil.activeDays, rotulo: "dias ativos" },
    { valor: perfil.totalXp, rotulo: "XP no total" },
    { valor: perfil.bestStreak, rotulo: "melhor sequência" },
    { valor: `${perfil.regadasHoje}/${perfil.habits}`, rotulo: "regadas hoje" },
    { valor: `${perfil.conquistadas}/${perfil.conquistaveis}`, rotulo: "criaturas" },
    { valor: perfil.achados, rotulo: perfil.achados === 1 ? "achado" : "achados" },
  ];

  return createEl("section", {
    className: "master",
    children: [
      createEl("div", {
        className: "master-head",
        children: [
          createEl("div", {
            className: "master-title",
            children: [
              createEl("h2", { className: "card-title", text: "Perfil do Mestre" }),
              createEl("p", {
                className: "card-subtitle",
                text: "O mestre é você. As criaturas são o que você treina.",
              }),
            ],
          }),
          createEl("span", { className: "master-rank", text: rank.name }),
        ],
      }),
      barra,
      createEl("p", { className: "mission-xp", text: proximo }),
      createEl("div", {
        className: "master-numbers",
        children: numeros.map((item) =>
          createEl("div", {
            className: "indicator",
            children: [
              createEl("span", { className: "indicator-value", text: String(item.valor) }),
              createEl("span", { className: "indicator-label", text: item.rotulo }),
            ],
          })
        ),
      }),
      renderRadar(),
      renderForcas(perfil),
    ],
  });
}

/*
  A roda da vida. Fica no Perfil do Mestre porque é o único lugar que fala do
  jogador inteiro — cada criatura conta um hábito, esta roda conta a vida em
  volta deles.
*/
function renderRadar() {
  const axes = getLifeRadar();
  const leitura = readLifeRadar(axes);

  return createEl("div", {
    className: "master-radar",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h3", { className: "master-radar-title", text: "Sua roda da vida" }),
          createEl("span", { className: "badge", text: `últimos ${RADAR_WINDOW} dias` }),
        ],
      }),
      createLifeRadar(axes),
      createEl("p", { className: "tree-hint", text: leitura.text }),
    ],
  });
}

function renderForcas(perfil) {
  // Com um hábito só não existe "mais forte" nem "mais fraco" — dizer isso é
  // mais honesto do que apontar a única área como as duas coisas ao mesmo tempo.
  if (!perfil.maisForte) {
    return createEl("p", {
      className: "tree-hint",
      text: "Com uma criatura só ainda não dá para comparar áreas. Conquiste outra e o Mestre começa a enxergar onde você é forte e onde precisa de ajuda.",
    });
  }

  // A criatura mais desenvolvida costuma ser também a mais constante. Repetir
  // o mesmo cartão duas vezes seguidas lê como defeito, então nesse caso as
  // duas leituras viram uma linha só.
  const mesmaArea = perfil.maisDesenvolvida?.habit.id === perfil.maisForte.habit.id;

  const linhas = [
    mesmaArea
      ? {
          rotulo: "Mais desenvolvida, e onde você está mais forte",
          area: perfil.maisForte,
          nota: (a) => `${a.xp} XP · ${a.stageLabel} · ${a.consistency}% de consistência`,
        }
      : {
          rotulo: "Mais desenvolvida",
          area: perfil.maisDesenvolvida,
          nota: (a) => `${a.xp} XP · ${a.stageLabel}`,
        },
    mesmaArea
      ? null
      : {
          rotulo: "Você está mais forte em",
          area: perfil.maisForte,
          nota: (a) => `${a.consistency}% de consistência`,
        },
    {
      rotulo: "Você está mais fraco em",
      area: perfil.maisFraca,
      nota: (a) => `${a.consistency}% de consistência · ${a.vigorLabel.toLowerCase()}`,
    },
  ].filter(Boolean);

  return createEl("div", {
    className: "master-areas",
    children: linhas
      .filter((linha) => linha.area && linha.area.animal)
      .map((linha) =>
        createEl("a", {
          className: "master-area",
          attrs: {
            href: `#/criatura?habit=${linha.area.habit.id}`,
            style: accentStyle(linha.area.animal.color),
          },
          children: [
            createCreatureBadge({ animal: linha.area.animal, progress: linha.area.progress }),
            createEl("div", {
              className: "master-area-body",
              children: [
                createEl("span", { className: "master-area-label", text: linha.rotulo }),
                createEl("span", { className: "master-area-name", text: linha.area.habit.name }),
                createEl("span", { className: "master-area-note", text: linha.nota(linha.area) }),
              ],
            }),
          ],
        })
      ),
  });
}

function renderHabitItem(habit) {
  const fruits = getFruits(habit.id).length;
  const companion = getCompanionState(habit);

  const profileLink = createEl("a", {
    className: "link-button",
    text: "Perfil",
    attrs: { href: `#/criatura?habit=${habit.id}` },
  });

  const row = createHabitRow(habit, {
    action: profileLink,
    companion,
    mood: getMood(habit.id),
  });

  return createEl("div", {
    className: "habit-item",
    children: [
      row,
      renderTreeLine(habit, companion),
      fruits
        ? createEl("p", {
            className: "tree-hint",
            text: `${fruits} ${fruits === 1 ? "fruto guardado" : "frutos guardados"}.`,
          })
        : null,
      createEl("div", {
        className: "habit-item-actions",
        children: [
          createEl("a", {
            className: "link-button",
            text: "Editar",
            attrs: { href: `#/editar-habito?habit=${habit.id}` },
          }),
          createRemoveAction(habit),
        ],
      }),
    ],
  });
}

// A árvore de cada hábito aparece já na lista, e murcha à vista: é o aviso
// mais direto de que aquele lado do jardim está com sede.
function renderTreeLine(habit, companion) {
  const tree = getTreeType(habit.treeType);
  const stage = getTreeStage(companion.habitXp);
  const vigor = getTreeVigor(habit.id);

  return createEl("div", {
    className: "habit-tree-line",
    children: [
      createEl("span", {
        className: "habit-tree-art",
        children: [createTree(stage.stage, tree.leaf, vigorAmount(vigor))],
      }),
      createEl("div", {
        className: "habit-tree-body",
        children: [
          createEl("span", { className: "habit-tree-name", text: `${tree.name} · ${stage.name}` }),
          createEl("span", { className: "habit-tree-note", text: describeVigor(vigor) }),
        ],
      }),
    ],
  });
}

// Remoção em dois toques: o segundo clique confirma, evitando apagar sem querer.
function createRemoveAction(habit) {
  const button = createEl("button", {
    className: "link-button link-danger",
    text: "Remover",
    attrs: { type: "button" },
  });

  let armed = false;
  button.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      button.textContent = "Confirmar?";
      return;
    }
    removeHabit(habit.id);
    refresh();
  });

  return button;
}
