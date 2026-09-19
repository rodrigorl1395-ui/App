import { createEl } from "../ui.js";
import { getState, hydrate, setState } from "../state.js";
import { todayKey } from "../utils.js";

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
      backup,
      danger,
    ],
  });
}
