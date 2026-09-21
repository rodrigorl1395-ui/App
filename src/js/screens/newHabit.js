/*
  Criar um hábito, um passo por vez.

  A tela antiga pedia tudo de uma vez: guardião, nome, unidade, dias da
  semana e três metas numéricas, na ordem inversa da que a pessoa pensa.
  Aqui a ordem é a da cabeça de quem chega: primeiro o que se quer praticar,
  depois o tamanho de cada dia, e só então quem cuida disso.

  Quando o guardião já veio escolhido (vindo da escolha inicial ou do
  Santuário), ele não vira uma pergunta de novo: o fluxo encolhe para dois
  passos e ele aparece no cabeçalho, já resolvido.
*/

import { createEl, createCreatureBadge, accentStyle } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate } from "../router.js";
import { HABIT_TEMPLATES, CUSTOM_TEMPLATE } from "../../data/habits.js";
import { getTreeType } from "../../data/trees.js";
import { CATEGORY_ELEMENT, getElement } from "../../data/animals.js";
import { createHabit, getHabits } from "../habits.js";
import { getAvailableAnimals, getGuardianDomain } from "../companion.js";
import { MISSION_LEVELS } from "../missions.js";

const UNIT_OPTIONS = ["min", "horas", "vezes", "páginas", "copos", "porções", "km"];

const GOAL_FIELDS = [
  { key: "minimal", label: "Mínima", hint: "O menor passo que ainda conta." },
  { key: "main", label: "Principal", hint: "O objetivo de um dia normal." },
  { key: "bonus", label: "Bônus", hint: "Quando o dia render mais." },
];

export function renderNewHabitScreen(params = {}) {
  const available = getAvailableAnimals();

  if (!available.length) return renderNoGuardianScreen();

  /*
    Guardião travado: veio da escolha inicial ou do Santuário já apontando
    para uma criatura livre. Perguntar de novo quem cuida seria desfazer uma
    escolha que a pessoa acabou de fazer.
  */
  const locked = available.find((option) => option.id === params.animal) || null;
  const steps = locked ? ["habito", "tamanho"] : ["habito", "tamanho", "guardiao"];

  const state = {
    template: null,
    name: "",
    unit: "",
    missions: { minimal: 0, main: 0, bonus: 0 },
    weekly: 7,
    animal: locked,
    guardianName: "",
  };

  let stepIndex = 0;

  // Guardiões livres que podem cuidar de um hábito daquela categoria. O
  // "Do meu jeito" não tem elemento, então qualquer um serve.
  function guardiansFor(category) {
    const element = CATEGORY_ELEMENT[category];
    const pool = locked ? [locked] : available;
    return element ? pool.filter((option) => option.element === element) : pool;
  }

  function applyTemplate(item) {
    state.template = item;
    state.name = item.id === "custom" ? "" : item.name;
    state.unit = item.unit;
    state.missions = { ...item.missions };
    const guardians = guardiansFor(item.category);
    // Com um candidato só, escolher não é uma decisão — é burocracia.
    state.animal = locked || (guardians.length === 1 ? guardians[0] : null);
  }

  /*
    As metas se empurram entre si para que mínima ≤ principal ≤ bônus seja
    sempre verdade enquanto se mexe, em vez de virar um erro depois de
    enviar. Nenhum toque no − ou + pode deixar o conjunto inválido.
  */
  function setGoal(key, value) {
    const goals = state.missions;
    const next = Math.max(0, value);
    goals[key] = next;

    if (key === "minimal") {
      goals.main = Math.max(goals.main, next);
      goals.bonus = Math.max(goals.bonus, goals.main);
    } else if (key === "main") {
      goals.minimal = Math.min(goals.minimal, next);
      goals.bonus = Math.max(goals.bonus, next);
    } else {
      goals.main = Math.min(goals.main, next);
      goals.minimal = Math.min(goals.minimal, goals.main);
    }
  }

  const progress = createEl("div", { className: "wizard-progress" });
  const body = createEl("div", { className: "wizard-body habit-form" });
  const screen = createEl("div", { className: "screen" });

  // A cor do guardião tinge o fluxo inteiro assim que ele é conhecido — a
  // barra de progresso, o destaque da missão principal e o resumo. Antes de
  // saber quem cuida, a tela fica na cor neutra do app.
  function aplicarAccent() {
    if (state.animal) screen.setAttribute("style", accentStyle(state.animal.color));
  }

  function goTo(index) {
    stepIndex = index;
    render();
    progress.scrollIntoView({ block: "start" });
  }

  function render() {
    aplicarAccent();
    progress.replaceChildren(
      createEl("span", {
        className: "wizard-progress-label",
        text: `Passo ${stepIndex + 1} de ${steps.length}`,
      }),
      createEl("div", {
        className: "wizard-progress-bars",
        children: steps.map((_, index) =>
          createEl("span", {
            className: `wizard-progress-bar${index <= stepIndex ? " is-done" : ""}`,
          })
        ),
      })
    );

    const step = steps[stepIndex];
    if (step === "habito") body.replaceChildren(renderStepHabit());
    else if (step === "tamanho") body.replaceChildren(renderStepSize());
    else body.replaceChildren(renderStepGuardian());
  }

  // --- passo 1: o que praticar ---------------------------------------------

  function renderStepHabit() {
    const templates = [
      ...HABIT_TEMPLATES.filter((item) => guardiansFor(item.category).length),
      CUSTOM_TEMPLATE,
    ];

    const grid = createEl("div", {
      className: "template-grid",
      children: templates.map((item) => {
        const custom = item.id === "custom";
        const card = createEl("button", {
          className: `template-card${state.template?.id === item.id ? " is-selected" : ""}`,
          attrs: { type: "button", style: `--habit-color: ${item.color}` },
          children: [
            createEl("span", { className: "template-icon", children: [createIcon(item.icon)] }),
            createEl("span", {
              className: "template-name",
              text: custom ? "Do meu jeito" : item.name,
            }),
            createEl("span", {
              className: "template-goal",
              text: custom
                ? "Você escolhe o nome e a medida"
                : `${item.missions.main} ${item.unit} por dia`,
            }),
          ],
        });
        card.addEventListener("click", () => {
          applyTemplate(item);
          goTo(stepIndex + 1);
        });
        return card;
      }),
    });

    return createEl("div", {
      className: "wizard-step",
      children: [
        createEl("h2", { className: "wizard-title", text: "O que você quer praticar?" }),
        createEl("p", {
          className: "wizard-subtitle",
          text: "Escolha um ponto de partida. Dá para ajustar tudo no passo seguinte.",
        }),
        grid,
      ],
    });
  }

  // --- passo 2: o tamanho de cada dia --------------------------------------

  function renderStepSize() {
    const nameInput = createEl("input", {
      className: "input",
      attrs: { type: "text", id: "habit-name", placeholder: "Ex.: Ir à academia", maxlength: "40" },
    });
    nameInput.value = state.name;

    const unitRow = createEl("div", { className: "quick-picker" });
    const customUnit = createEl("input", {
      className: "input",
      attrs: { type: "text", placeholder: "outra medida", maxlength: "12" },
    });
    customUnit.hidden = UNIT_OPTIONS.includes(state.unit);
    customUnit.value = customUnit.hidden ? "" : state.unit;

    const unitChips = new Map();
    for (const option of [...UNIT_OPTIONS, "outra"]) {
      const chip = createEl("button", {
        className: "chip",
        text: option,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        if (option === "outra") {
          customUnit.hidden = false;
          state.unit = customUnit.value.trim();
          customUnit.focus();
        } else {
          customUnit.hidden = true;
          state.unit = option;
        }
        marcarUnidade();
        refreshGoals();
      });
      unitChips.set(option, chip);
      unitRow.appendChild(chip);
    }

    function marcarUnidade() {
      const conhecida = UNIT_OPTIONS.includes(state.unit);
      unitChips.forEach((chip, id) =>
        chip.classList.toggle("is-selected", conhecida ? id === state.unit : id === "outra")
      );
    }
    marcarUnidade();

    customUnit.addEventListener("input", () => {
      state.unit = customUnit.value.trim();
      refreshGoals();
    });

    // Metas: passo do stepper acompanha a escala. Minutos andam de 5 em 5;
    // copos, porções e horas, de 1 em 1 — senão a mesma seta serve mal aos dois.
    const stepSize = () => (state.missions.main > 12 ? 5 : 1);

    const goalRows = new Map();
    const goalList = createEl("div", {
      className: "goal-list",
      children: GOAL_FIELDS.map(({ key, label, hint }) => {
        const value = createEl("span", { className: "goal-value" });
        const minus = createEl("button", {
          className: "stepper-button",
          text: "−",
          attrs: { type: "button", "aria-label": `Diminuir missão ${label.toLowerCase()}` },
        });
        const plus = createEl("button", {
          className: "stepper-button",
          text: "+",
          attrs: { type: "button", "aria-label": `Aumentar missão ${label.toLowerCase()}` },
        });
        minus.addEventListener("click", () => {
          setGoal(key, state.missions[key] - stepSize());
          refreshGoals();
        });
        plus.addEventListener("click", () => {
          setGoal(key, state.missions[key] + stepSize());
          refreshGoals();
        });

        const row = createEl("div", {
          className: `goal-row${key === "main" ? " is-main" : ""}`,
          children: [
            createEl("div", {
              className: "goal-text",
              children: [
                createEl("span", { className: "goal-label", text: label }),
                createEl("span", { className: "goal-hint", text: hint }),
              ],
            }),
            createEl("div", {
              className: "stepper",
              children: [minus, value, plus],
            }),
            createEl("span", { className: "goal-xp", text: `${MISSION_LEVELS[key].xp} XP` }),
          ],
        });
        goalRows.set(key, value);
        return row;
      }),
    });

    const weekRow = createEl("div", { className: "quick-picker week-picker" });
    const weekChips = new Map();
    for (let dias = 1; dias <= 7; dias += 1) {
      const chip = createEl("button", {
        className: `chip${state.weekly === dias ? " is-selected" : ""}`,
        text: String(dias),
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        state.weekly = dias;
        weekChips.forEach((el, id) => el.classList.toggle("is-selected", id === dias));
        refreshGoals();
      });
      weekChips.set(dias, chip);
      weekRow.appendChild(chip);
    }

    const ultimo = stepIndex === steps.length - 1;
    const hint = createEl("p", { className: "form-hint" });
    const summary = createEl("div", { className: "wizard-summary-slot" });
    const nextButton = createEl("button", {
      className: "button button-primary",
      text: ultimo ? "Criar hábito" : "Continuar",
      attrs: { type: "button" },
    });

    // O resumo é o espelho do estado: qualquer toque em meta, nome, medida ou
    // dias da semana o reescreve na hora. Um resumo que não acompanha mente.
    function refreshGoals() {
      const unidade = state.unit || "vezes";
      goalRows.forEach((node, key) => {
        node.textContent = `${state.missions[key]} ${unidade}`;
      });
      const pronto = Boolean(state.name.trim()) && state.missions.main > 0;
      nextButton.disabled = !pronto;
      hint.textContent = pronto
        ? ""
        : !state.name.trim()
          ? "Dê um nome ao hábito para continuar."
          : "A missão principal precisa ser maior que zero.";
      if (ultimo) summary.replaceChildren(renderSummary());
    }

    nameInput.addEventListener("input", () => {
      state.name = nameInput.value;
      refreshGoals();
    });

    nextButton.addEventListener("click", () => {
      if (ultimo) submit();
      else goTo(stepIndex + 1);
    });

    refreshGoals();
    if (state.template?.id === "custom" && !state.name) setTimeout(() => nameInput.focus(), 0);

    return createEl("div", {
      className: "wizard-step",
      children: [
        createEl("h2", { className: "wizard-title", text: "Qual o tamanho de cada dia?" }),
        createEl("p", {
          className: "wizard-subtitle",
          text: "Três tamanhos, para o dia bom e para o dia ruim. Cumprir a mínima já mantém a sequência viva.",
        }),
        createEl("div", {
          className: "form-field",
          children: [
            createEl("label", {
              className: "form-label",
              text: "Nome do hábito",
              attrs: { for: "habit-name" },
            }),
            nameInput,
          ],
        }),
        createEl("div", {
          className: "form-field",
          children: [
            createEl("span", { className: "form-label", text: "Medido em" }),
            unitRow,
            customUnit,
          ],
        }),
        goalList,
        createEl("div", {
          className: "form-field",
          children: [
            createEl("span", { className: "form-label", text: "Dias por semana" }),
            weekRow,
            createEl("span", {
              className: "form-hint",
              text: "O que você combina consigo. Um dia fora da meta não é falha.",
            }),
          ],
        }),
        summary,
        hint,
        renderActions(nextButton),
      ],
    });
  }

  // --- passo 3: quem cuida --------------------------------------------------

  function renderStepGuardian() {
    const guardians = guardiansFor(state.template.category);
    const power = createEl("div", { className: "guardian-power" });
    const domain = createEl("p", { className: "tree-hint" });
    const summary = createEl("div", { className: "wizard-summary-slot" });

    const nameInput = createEl("input", {
      className: "input",
      attrs: { type: "text", id: "guardian-name", maxlength: "24" },
    });
    nameInput.value = state.guardianName;
    nameInput.addEventListener("input", () => {
      state.guardianName = nameInput.value;
      summary.replaceChildren(renderSummary());
    });

    const createButton = createEl("button", {
      className: "button button-primary",
      text: "Criar hábito",
      attrs: { type: "button" },
    });
    createButton.addEventListener("click", submit);

    const cards = new Map();
    const picker = createEl("div", {
      className: "companion-picker",
      children: guardians.map((option) => {
        const card = createEl("button", {
          className: `companion-option${state.animal?.id === option.id ? " is-selected" : ""}`,
          attrs: { type: "button", style: accentStyle(option.color) },
          children: [
            createCreatureBadge({ animal: option, progress: 0 }),
            createEl("span", { className: "companion-option-name", text: option.name }),
          ],
        });
        card.addEventListener("click", () => select(option));
        cards.set(option.id, card);
        return card;
      }),
    });

    function select(option) {
      state.animal = option;
      cards.forEach((card, id) => card.classList.toggle("is-selected", id === option.id));

      const element = getElement(option.element);
      const { power: poder, categorias } = getGuardianDomain(option);
      domain.textContent = `${option.name} é de ${element.label.toLowerCase()} e cuida de hábitos de ${categorias}.`;
      power.replaceChildren(
        poder ? createEl("span", { className: "guardian-power-name", text: poder.name }) : null,
        poder ? createEl("span", { className: "guardian-power-text", text: poder.description }) : null
      );
      nameInput.placeholder = option.name;
      createButton.disabled = false;
      aplicarAccent();
      summary.replaceChildren(renderSummary());
    }

    if (state.animal) select(state.animal);
    else {
      createButton.disabled = true;
      domain.textContent = "Escolha quem vai cuidar deste hábito.";
    }

    return createEl("div", {
      className: "wizard-step",
      children: [
        createEl("h2", { className: "wizard-title", text: "Quem vai cuidar dele?" }),
        createEl("p", {
          className: "wizard-subtitle",
          text: "O guardião cresce com este hábito, e só com ele.",
        }),
        picker,
        domain,
        power,
        createEl("div", {
          className: "form-field",
          children: [
            createEl("label", {
              className: "form-label",
              text: "Nome do guardião (opcional)",
              attrs: { for: "guardian-name" },
            }),
            nameInput,
            createEl("span", {
              className: "form-hint",
              text: "Em branco, ele segue com o nome da espécie.",
            }),
          ],
        }),
        summary,
        renderActions(createButton),
      ],
    });
  }

  // --- resumo e ações -------------------------------------------------------

  /*
    O resumo fecha o fluxo dizendo em voz alta o que vai ser criado. Sem ele,
    o último botão é um salto no escuro: a pessoa decidiu três coisas em
    telas diferentes e não viu nenhuma vez as três juntas.
  */
  function renderSummary() {
    const unidade = state.unit || "vezes";
    const guardiao = state.animal;
    const nomeGuardiao = state.guardianName.trim() || guardiao?.name;
    const arvore = getTreeType(state.template.treeType).name;

    const linhas = [
      `${state.name.trim() || "Hábito sem nome"} — ${state.missions.main} ${unidade} por dia`,
      state.weekly === 7 ? "Todos os dias da semana" : `${state.weekly} dias por semana`,
      guardiao
        ? `${nomeGuardiao} cuida deste hábito${nomeGuardiao !== guardiao.name ? ` (${guardiao.name})` : ""}.`
        : null,
      `Planta uma ${arvore} no Jardim.`,
    ].filter(Boolean);

    return createEl("div", {
      className: "wizard-summary",
      attrs: guardiao ? { style: accentStyle(guardiao.color) } : {},
      children: [
        createEl("span", { className: "ritual-step", text: "Você vai criar" }),
        ...linhas.map((texto) => createEl("p", { className: "wizard-summary-line", text: texto })),
      ],
    });
  }

  function renderActions(primary) {
    const back = createEl("button", {
      className: "link-button",
      text: "Voltar",
      attrs: { type: "button" },
    });
    back.addEventListener("click", () => {
      if (stepIndex === 0) navigate("/hoje");
      else goTo(stepIndex - 1);
    });

    return createEl("div", { className: "wizard-actions", children: [back, primary] });
  }

  function submit() {
    if (!state.animal || !state.name.trim() || !(state.missions.main > 0)) return;

    // Só o hábito de verdade dispara o tour — a checagem precisa vir antes
    // de criar este, senão getHabits() já não estaria mais vazio.
    const primeiroHabito = getHabits().length === 0;

    createHabit({
      name: state.name.trim(),
      unit: state.unit.trim() || "vezes",
      missions: state.missions,
      color: state.template.color,
      icon: state.template.icon,
      treeType: state.template.treeType,
      category: state.template.category,
      animalId: state.animal.id,
      weeklyTarget: state.weekly,
      guardianName: state.guardianName.trim() || null,
    });
    navigate(primeiroHabito ? "/guia" : "/hoje");
  }

  render();

  screen.append(
    createEl("div", {
      className: "screen-header",
      children: [
        createEl("h1", { className: "section-title", text: "Novo hábito" }),
        createEl("a", { className: "link-button", text: "Sair", attrs: { href: "#/hoje" } }),
      ],
    }),
    ...(locked ? [renderLockedGuardian(locked)] : []),
    progress,
    body
  );

  return screen;

  /*
    Quem já foi escolhido lá atrás aparece resolvido, não como pergunta nova.
    O batismo mora aqui junto dele: sem este atalho, quem chega com o guardião
    já definido nunca veria o campo de nome, que só existe no passo de escolha.
  */
  function renderLockedGuardian(animal) {
    const nameInput = createEl("input", {
      className: "input",
      attrs: { type: "text", id: "guardian-name", maxlength: "24", placeholder: animal.name },
    });
    nameInput.hidden = true;
    nameInput.addEventListener("input", () => {
      state.guardianName = nameInput.value;
    });

    const batizar = createEl("button", {
      className: "link-button",
      text: "Dar um nome",
      attrs: { type: "button" },
    });
    batizar.addEventListener("click", () => {
      nameInput.hidden = false;
      batizar.hidden = true;
      nameInput.focus();
    });

    return createEl("div", {
      className: "wizard-guardian",
      attrs: { style: accentStyle(animal.color) },
      children: [
        createEl("div", {
          className: "wizard-guardian-chip",
          children: [
            createCreatureBadge({ animal, progress: 0 }),
            createEl("div", {
              className: "wizard-guardian-text",
              children: [
                createEl("span", { className: "wizard-guardian-name", text: animal.name }),
                createEl("span", {
                  className: "wizard-guardian-role",
                  text: "vai cuidar deste hábito",
                }),
              ],
            }),
            batizar,
          ],
        }),
        nameInput,
      ],
    });
  }
}

// Sem criatura livre não há hábito novo: é o freio que faz construir aos poucos.
function renderNoGuardianScreen() {
  return createEl("div", {
    className: "screen",
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Novo hábito" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } }),
        ],
      }),
      createEl("section", {
        className: "card",
        children: [
          createEl("h2", {
            className: "card-title",
            text: "Todos os seus guardiões já têm um hábito",
          }),
          createEl("p", {
            className: "card-subtitle",
            text: "Cada guardião cuida de um hábito só. Para assumir mais um, conquiste o próximo guardião mantendo a constância no que você já começou.",
          }),
          createEl("a", {
            className: "button button-primary button-block",
            text: "Ver o santuário",
            attrs: { href: "#/santuario" },
          }),
        ],
      }),
    ],
  });
}
