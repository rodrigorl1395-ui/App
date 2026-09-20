/*
  Leitura — a tela do app.

  Os livros com a página em que você parou, e o registro de cada sessão. A
  página atual nunca é digitada direto: ela é a soma do que foi lido, então
  a barra de progresso não consegue mentir.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import {
  appShell,
  statGrid,
  appCard,
  textInput,
  fieldRow,
  primaryButton,
  iconButton,
  emptyHint,
  methodCard,
  progressBar,
  dataCurta,
} from "./kit.js";
import {
  getBooks,
  getBook,
  addBook,
  removeBook,
  getSessions,
  logReading,
  currentPage,
  progressOf,
  finishBook,
  reopenBook,
  getWeekPages,
  getReadingStreakDays,
} from "../../apps/reading.js";

const ACCENT = "#6db3f2";

export function renderReadingApp() {
  const livros = getBooks();
  const lendo = livros.filter((livro) => !livro.finishedAt);
  const lidos = livros.filter((livro) => livro.finishedAt);

  return appShell({
    title: "Leitura",
    subtitle: "Livros, páginas e sessões",
    icon: "book",
    accent: ACCENT,
    children: [
      statGrid([
        { value: getWeekPages(), label: "páginas em 7 dias" },
        { value: getReadingStreakDays(), label: "dias seguidos" },
        { value: lidos.length, label: "livros terminados" },
      ]),

      appCard({
        title: "Lendo agora",
        action: iconButton("plus", abrirNovoLivro, { label: "Novo livro" }),
        children: lendo.length
          ? lendo.map(renderLivro)
          : [emptyHint("Nenhum livro em andamento. Adicione um com o + acima.")],
      }),

      lidos.length
        ? appCard({
            title: "Terminados",
            children: [
              createEl("div", {
                className: "app-list is-quiet",
                children: lidos.map((livro) =>
                  createEl("div", {
                    className: "app-row",
                    children: [
                      createEl("div", {
                        className: "app-row-body",
                        children: [
                          createEl("span", { className: "app-row-name", text: livro.title }),
                          createEl("span", {
                            className: "app-row-note",
                            text: `${livro.pages} páginas${livro.author ? ` · ${livro.author}` : ""}`,
                          }),
                        ],
                      }),
                      iconButton("plus", () => {
                        reopenBook(livro.id);
                        refresh();
                      }, { label: "Voltar a ler" }),
                    ],
                  })
                ),
              }),
            ],
          })
        : null,

      methodCard("apoiador-leitura"),
    ],
  });
}

function renderLivro(livro) {
  const pagina = currentPage(livro.id);
  const progresso = progressOf(livro.id);

  const cartao = createEl("article", {
    className: "book-card",
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: livro.title }),
          createEl("span", {
            className: "app-row-note",
            text: livro.author ? livro.author : "Sem autor anotado",
          }),
        ],
      }),
      progressBar(progresso, { color: ACCENT }),
      createEl("div", {
        className: "book-foot",
        children: [
          createEl("span", {
            className: "app-row-note",
            text: `Página ${pagina} de ${livro.pages} · ${Math.round(progresso * 100)}%`,
          }),
          primaryButton("Registrar leitura", () => abrirSessao(livro.id), { block: false }),
        ],
      }),
    ],
  });

  cartao.querySelector(".app-row-body").addEventListener("click", () => abrirLivro(livro.id));
  return cartao;
}

function abrirSessao(bookId) {
  const livro = getBook(bookId);
  const paginas = textInput({ placeholder: "Páginas lidas", type: "number", inputmode: "numeric" });
  const minutos = textInput({ placeholder: "Minutos (opcional)", type: "number", inputmode: "numeric" });
  const nota = textInput({ placeholder: "Uma linha sobre o que leu (opcional)" });

  showSheet({
    title: livro.title,
    subtitle: `Você parou na página ${currentPage(bookId)} de ${livro.pages}.`,
    content: [fieldRow([paginas, minutos]), nota],
    actions: [
      {
        label: "Registrar",
        primary: true,
        onClick: () => {
          if (!logReading(bookId, { pages: paginas.value, minutes: minutos.value, note: nota.value })) return;
          refresh();
        },
      },
    ],
  });
}

function abrirLivro(bookId) {
  const livro = getBook(bookId);
  const sessoes = getSessions(bookId);

  showSheet({
    title: livro.title,
    subtitle: `${currentPage(bookId)} de ${livro.pages} páginas`,
    content: [
      sessoes.length
        ? createEl("div", {
            className: "app-list",
            children: sessoes.slice(0, 8).map((sessao) =>
              createEl("div", {
                className: "app-row",
                children: [
                  createEl("div", {
                    className: "app-row-body",
                    children: [
                      createEl("span", {
                        className: "app-row-name",
                        text: `${sessao.pages} ${sessao.pages === 1 ? "página" : "páginas"}`,
                      }),
                      createEl("span", {
                        className: "app-row-note",
                        text: [dataCurta(sessao.date), sessao.minutes ? `${sessao.minutes} min` : null, sessao.note]
                          .filter(Boolean)
                          .join(" · "),
                      }),
                    ],
                  }),
                ],
              })
            ),
          })
        : emptyHint("Nenhuma sessão registrada ainda."),
    ],
    actions: [
      {
        label: "Registrar leitura",
        primary: true,
        onClick: () => abrirSessao(bookId),
      },
      {
        label: "Marcar como terminado",
        onClick: () => {
          finishBook(bookId);
          refresh();
        },
      },
      {
        label: "Remover livro",
        onClick: () => {
          removeBook(bookId);
          refresh();
        },
      },
    ],
  });
}

function abrirNovoLivro() {
  const titulo = textInput({ placeholder: "Título" });
  const autor = textInput({ placeholder: "Autor (opcional)" });
  const paginas = textInput({ placeholder: "Total de páginas", type: "number", inputmode: "numeric" });

  showSheet({
    title: "Novo livro",
    subtitle: "O total de páginas é o que permite medir o progresso.",
    content: [titulo, autor, paginas],
    actions: [
      {
        label: "Adicionar",
        primary: true,
        onClick: () => {
          if (!addBook({ title: titulo.value, author: autor.value, pages: paginas.value })) return;
          refresh();
        },
      },
    ],
  });
}
