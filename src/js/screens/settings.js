import { createEl } from "../ui.js";
import { getState, hydrate, setState } from "../state.js";
import { todayKey } from "../utils.js";
import { getHabits } from "../habits.js";
import { checkDevPassword, simulateDays, advanceTime, getDevLogCount, clearDevData } from "../dev.js";
import { THEME_MODES, getThemeMode, setThemeMode } from "../theme.js";

// Escuro, claro ou automático. Um clique troca e aplica na hora — sem
// recarregar, porque o tema é só CSS reagindo a um atributo.
function renderThemeCard() {
  const options = createEl("div", { className: "theme-options" });

  function paint() {
    const atual = getThemeMode();
    options.replaceChildren(
      ...THEME_MODES.map((mode) => {
        const button = createEl("button", {
          className: `theme-option${mode.id === atual ? " is-active" : ""}`,
          text: mode.label,
          attrs: { type: "button" },
        });
        button.addEventListener("click", () => {
          setThemeMode(mode.id);
          paint();
        });
        return button;
      })
    );
  }
  paint();

  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "Aparência" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Automático segue o tema do seu aparelho.",
      }),
      options,
    ],
  });
}

/*
  Tudo vive no navegador. Limpar os dados do site, trocar de aparelho ou usar
  uma aba anônima leva meses de histórico junto — e o histórico é a única
  coisa que este app tem de valor. Por isso o backup não é um extra.
*/
function resumoText() {
  const state = getState();
  return `${state.habits.length} hábito(s), ${state.logs.length} registro(s), ${state.collected.length} achado(s) guardado(s).`;
}

// Nome opcional: sem ele, a tela Hoje e as saudações seguem funcionando
// normalmente, só sem o toque pessoal. Ninguém é obrigado a passar por
// aqui antes de usar o app.
function renderNameCard() {
  const nameInput = createEl("input", {
    className: "input",
    attrs: { type: "text", id: "user-name", placeholder: "Como posso te chamar?", maxlength: "40" },
  });
  nameInput.value = getState().user?.name || "";

  const saved = createEl("p", { className: "form-hint" });
  let timer = null;
  nameInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const name = nameInput.value.trim();
      setState({ user: { ...getState().user, name: name || null } });
      saved.textContent = name ? "Guardado." : "";
    }, 400);
  });

  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "Seu nome" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Usado só na saudação da tela Hoje. É opcional.",
      }),
      nameInput,
      saved,
    ],
  });
}

/*
  Modo dev: gera e envelhece dados reais só para testar mais rápido — nunca
  inventa um número solto. Atrás de senha porque não é para uso do dia a
  dia, só para quem está mexendo no app.
*/
function renderDevPanel() {
  const passwordInput = createEl("input", {
    className: "input",
    attrs: { type: "password", placeholder: "Senha do modo dev", autocomplete: "off" },
  });
  const unlockButton = createEl("button", {
    className: "button button-secondary",
    text: "Desbloquear",
    attrs: { type: "button" },
  });
  const gateHint = createEl("p", { className: "form-hint" });
  const gate = createEl("div", {
    children: [
      createEl("div", { className: "form-row", children: [passwordInput, unlockButton] }),
      gateHint,
    ],
  });

  const habits = getHabits();
  const habitSelect = createEl("select", {
    className: "input",
    children: [
      createEl("option", { text: "Todos os hábitos", attrs: { value: "all" } }),
      ...habits.map((habit) =>
        createEl("option", { text: habit.name, attrs: { value: habit.id } })
      ),
    ],
  });

  const daysInput = createEl("input", {
    className: "input",
    attrs: { type: "number", min: "1", max: "120", value: "7" },
  });
  const reflectionsCheck = createEl("input", { attrs: { type: "checkbox", id: "dev-reflections" } });
  reflectionsCheck.checked = true;
  const simulateButton = createEl("button", {
    className: "button button-primary",
    text: "Simular dias cumpridos",
    attrs: { type: "button" },
  });
  simulateButton.disabled = !habits.length;

  const advanceInput = createEl("input", {
    className: "input",
    attrs: { type: "number", min: "1", max: "365", value: "3" },
  });
  const advanceButton = createEl("button", {
    className: "button button-secondary",
    text: "Adiantar todo o histórico",
    attrs: { type: "button" },
  });

  const clearButton = createEl("button", {
    className: "button button-secondary link-danger",
    text: "Remover registros de teste",
    attrs: { type: "button" },
  });

  const devStatus = createEl("p", { className: "form-hint" });
  function refreshStatus() {
    const count = getDevLogCount();
    devStatus.textContent = count
      ? `${count} registro(s) de teste ativo(s) agora.`
      : "Nenhum registro de teste ativo agora.";
  }

  simulateButton.addEventListener("click", () => {
    const days = Number(daysInput.value) || 0;
    const { added } = simulateDays(habitSelect.value, days, {
      withReflections: reflectionsCheck.checked,
    });
    devStatus.textContent = `${added} dia(s) simulado(s). XP, sequência, sementes e evolução recalculam sozinhos a partir daqui — atualize a tela para ver.`;
  });

  advanceButton.addEventListener("click", () => {
    const days = Number(advanceInput.value) || 0;
    advanceTime(days);
    devStatus.textContent = `Histórico adiantado ${days} dia(s). Nada novo foi inventado — só envelheceu o que já existia.`;
  });

  clearButton.addEventListener("click", () => {
    const { removed } = clearDevData();
    refreshStatus();
    if (removed) devStatus.textContent = `${removed} registro(s) de teste removido(s).`;
  });

  const controls = createEl("div", {
    className: "dev-controls",
    children: [
      createEl("p", {
        className: "card-subtitle",
        text: "Sementes e XP não têm campo próprio para editar — eles sempre vêm dos registros. O botão abaixo gera dias cumpridos de verdade para adiantá-los.",
      }),
      createEl("label", { className: "form-label", text: "Hábito" }),
      habitSelect,
      createEl("label", { className: "form-label", text: "Dias" }),
      daysInput,
      createEl("label", {
        className: "form-row",
        children: [
          reflectionsCheck,
          createEl("span", { text: "Incluir reflexões (gera sementes)" }),
        ],
      }),
      simulateButton,
      createEl("hr"),
      createEl("label", { className: "form-label", text: "Adiantar o tempo (dias)" }),
      advanceInput,
      advanceButton,
      createEl("p", {
        className: "form-hint",
        text: "Envelhece hábitos, registros, sequências e o jardim — bom para testar árvore com sede ou o mês seguinte no calendário. Baixe um backup antes, se quiser voltar atrás.",
      }),
      createEl("hr"),
      clearButton,
      devStatus,
    ],
  });
  controls.style.display = "none";

  unlockButton.addEventListener("click", () => {
    if (checkDevPassword(passwordInput.value)) {
      gate.style.display = "none";
      controls.style.display = "flex";
      refreshStatus();
    } else {
      gateHint.textContent = "Senha incorreta.";
    }
  });
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockButton.click();
  });

  return createEl("section", {
    className: "card dev-panel",
    children: [
      createEl("h2", { className: "card-title", text: "Modo dev" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Só para testar o app mais rápido. Fica atrás de senha porque mexe em dados de verdade.",
      }),
      gate,
      controls,
    ],
  });
}

export function renderSettingsScreen() {
  const status = createEl("p", { className: "form-hint" });
  const resumo = createEl("p", { className: "tree-hint", text: resumoText() });
  const nameCard = renderNameCard();

  const exportButton = createEl("button", {
    className: "button button-secondary button-block",
    text: "Baixar meus dados",
    attrs: { type: "button" },
  });
  exportButton.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = createEl("a", {
      attrs: { href: url, download: `pocket-habits-${todayKey()}.json` },
    });
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = "Arquivo gerado. Guarde num lugar seguro.";
  });

  const fileInput = createEl("input", {
    className: "input",
    attrs: { type: "file", accept: "application/json", id: "import-file" },
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      // Confere o mínimo antes de trocar: um arquivo errado apagaria tudo.
      if (!Array.isArray(parsed.habits) || !Array.isArray(parsed.logs)) {
        status.textContent = "Este arquivo não parece um backup do Pocket Habits.";
        return;
      }
      hydrate(parsed);
      // hydrate só mexe na memória; um setState grava e avisa a interface.
      setState({});
      status.textContent = `Backup restaurado: ${parsed.habits.length} hábito(s) e ${parsed.logs.length} registro(s).`;
      // Sem redesenhar a tela: um refresh aqui apagaria a confirmação que a
      // pessoa precisa ler. Só o resumo acima precisa acompanhar.
      resumo.textContent = resumoText();
    } catch (err) {
      console.warn("[ajustes] backup inválido", err);
      status.textContent = "Não consegui ler este arquivo.";
    }
  });

  const backup = createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "Seus dados" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Tudo fica guardado neste navegador. Baixe uma cópia de vez em quando — se limpar os dados do site, o histórico vai junto.",
      }),
      exportButton,
      createEl("label", {
        className: "form-label",
        text: "Restaurar de um arquivo",
        attrs: { for: "import-file" },
      }),
      fileInput,
      status,
    ],
  });

  const resetButton = createEl("button", {
    className: "button button-secondary button-block link-danger",
    text: "Apagar tudo e recomeçar",
    attrs: { type: "button" },
  });

  let armed = false;
  resetButton.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      resetButton.textContent = "Tem certeza? Isto apaga o histórico inteiro";
      return;
    }
    localStorage.removeItem("pocket-habits:state:v1");
    window.location.hash = "/onboarding";
    window.location.reload();
  });

  const danger = createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "Recomeçar" }),
      createEl("p", {
        className: "card-subtitle",
        text: "Apaga criaturas, hábitos, registros e achados. Não tem como desfazer — baixe uma cópia antes.",
      }),
      resetButton,
    ],
  });


  return createEl("div", {
    className: "screen",
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Ajustes" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } }),
        ],
      }),
      resumo,
      nameCard,
      renderThemeCard(),
      backup,
      danger,
      renderDevPanel(),
    ],
  });
}
