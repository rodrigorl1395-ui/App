/*
  Leitura — o app que o "Apoiador de Leitura" destrava.

  Livros com a página em que você parou, e sessões de leitura registradas
  uma a uma. A página atual não é um campo que se edita no vazio: ela é o
  resultado das sessões, então o progresso nunca mente sobre o que foi lido.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getBooks() {
  return [...getState().books].sort((a, b) => {
    if (Boolean(a.finishedAt) !== Boolean(b.finishedAt)) return a.finishedAt ? 1 : -1;
    return b.startedAt.localeCompare(a.startedAt);
  });
}

export function getBook(id) {
  return getState().books.find((livro) => livro.id === id) || null;
}

export function addBook({ title, author, pages }) {
  const nome = (title || "").trim();
  const total = Number(pages);
  if (!nome || !total || total <= 0) return null;

  const livro = {
    id: generateId("livro"),
    title: nome,
    author: (author || "").trim() || null,
    pages: total,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
  setState({ books: [...getState().books, livro] });
  return livro;
}

export function removeBook(id) {
  setState({
    books: getState().books.filter((livro) => livro.id !== id),
    readingSessions: getState().readingSessions.filter((sessao) => sessao.bookId !== id),
  });
}

export function getSessions(bookId = null) {
  return getState()
    .readingSessions.filter((sessao) => !bookId || sessao.bookId === bookId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function logReading(bookId, { pages, minutes, note }) {
  const lidas = Number(pages);
  if (!lidas || lidas <= 0) return null;

  const sessao = {
    id: generateId("leitura"),
    bookId,
    date: todayKey(),
    pages: lidas,
    minutes: Number(minutes) || null,
    note: (note || "").trim() || null,
    createdAt: new Date().toISOString(),
  };
  setState({ readingSessions: [...getState().readingSessions, sessao] });

  // Chegou ao fim do livro? Ele se fecha sozinho — não faz sentido pedir
  // um segundo toque para dizer o que as páginas já disseram.
  const livro = getBook(bookId);
  if (livro && !livro.finishedAt && currentPage(bookId) >= livro.pages) {
    finishBook(bookId);
  }
  return sessao;
}

// A página atual é a soma das sessões, nunca um campo solto.
export function currentPage(bookId) {
  const livro = getBook(bookId);
  const lidas = getSessions(bookId).reduce((soma, sessao) => soma + sessao.pages, 0);
  return livro ? Math.min(livro.pages, lidas) : lidas;
}

export function progressOf(bookId) {
  const livro = getBook(bookId);
  if (!livro) return 0;
  return Math.min(1, currentPage(bookId) / livro.pages);
}

export function finishBook(id) {
  setState({
    books: getState().books.map((livro) =>
      livro.id === id ? { ...livro, finishedAt: new Date().toISOString() } : livro
    ),
  });
}

export function reopenBook(id) {
  setState({
    books: getState().books.map((livro) => (livro.id === id ? { ...livro, finishedAt: null } : livro)),
  });
}

export function getWeekPages() {
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = limite.toISOString().slice(0, 10);
  return getSessions()
    .filter((sessao) => sessao.date > chave)
    .reduce((soma, sessao) => soma + sessao.pages, 0);
}

export function getReadingStreakDays() {
  const dias = new Set(getSessions().map((sessao) => sessao.date));
  let contagem = 0;
  const cursor = new Date();
  // Hoje ainda sem leitura não quebra a sequência: o dia não acabou.
  if (!dias.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(cursor.toISOString().slice(0, 10))) {
    contagem += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return contagem;
}
