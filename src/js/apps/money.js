/*
  Radar de Compras — o app que a ferramenta do mesmo nome destrava.

  Duas coisas, que são a mesma: o que já saiu (gastos do mês, divididos em
  essencial, desejo e guardado, na proporção 50/30/20) e o que ainda não
  saiu (a lista de espera de 24 horas — nada de decidir compra no impulso).

  O que se guarda é o registro da pessoa. Totais, proporção e o quanto falta
  esperar saem dele na hora.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export const CATEGORIAS = [
  { id: "essencial", label: "Essencial", meta: 50, cor: "#6fb8d1", nota: "Aluguel, mercado, conta, remédio." },
  { id: "desejo", label: "Desejo", meta: 30, cor: "#f2c14e", nota: "O que você quis. É legítimo — só não é essencial." },
  { id: "guardado", label: "Guardado", meta: 20, cor: "#8fae5c", nota: "Reserva, investimento, dívida abatida." },
];

export const ESPERA_HORAS = 24;

export function getCategoria(id) {
  return CATEGORIAS.find((cat) => cat.id === id) || CATEGORIAS[1];
}

export function formatarValor(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* Gastos                                                              */
/* ------------------------------------------------------------------ */

export function getExpenses() {
  return [...getState().expenses].sort((a, b) => b.date.localeCompare(a.date));
}

export function getMonthExpenses(referencia = new Date()) {
  const mes = referencia.toISOString().slice(0, 7);
  return getExpenses().filter((gasto) => gasto.date.startsWith(mes));
}

export function addExpense({ amount, kind, note }) {
  const valor = Number(amount);
  if (!valor || valor <= 0) return null;

  const gasto = {
    id: generateId("gasto"),
    date: todayKey(),
    amount: valor,
    kind: kind || "desejo",
    note: (note || "").trim() || null,
    createdAt: new Date().toISOString(),
  };
  setState({ expenses: [...getState().expenses, gasto] });
  return gasto;
}

export function removeExpense(id) {
  setState({ expenses: getState().expenses.filter((gasto) => gasto.id !== id) });
}

export function getIncome() {
  return getState().settings?.monthlyIncome || 0;
}

export function setIncome(valor) {
  setState({ settings: { ...getState().settings, monthlyIncome: Number(valor) || 0 } });
}

/*
  O resumo do mês. A fatia de cada categoria é medida contra a renda quando
  ela existe — é isso que torna o 50/30/20 uma regra, e não um gráfico de
  pizza do que já saiu. Sem renda declarada, a medida é a do próprio gasto.
*/
export function getMonthSummary() {
  const gastos = getMonthExpenses();
  const renda = getIncome();
  const total = gastos.reduce((soma, gasto) => soma + gasto.amount, 0);
  const base = renda || total || 1;

  const porCategoria = CATEGORIAS.map((categoria) => {
    const valor = gastos
      .filter((gasto) => gasto.kind === categoria.id)
      .reduce((soma, gasto) => soma + gasto.amount, 0);
    return {
      ...categoria,
      valor,
      fatia: (valor / base) * 100,
      acimaDaMeta: (valor / base) * 100 > categoria.meta,
    };
  });

  return { gastos, total, renda, sobrou: renda ? renda - total : null, porCategoria };
}

/*
  Quanto tempo de trabalho custa uma compra. Convertida em horas, uma
  decisão muda mais do que olhando o preço — é a pergunta que a ferramenta
  existe para fazer. 168 horas úteis é o mês cheio padrão.
*/
export function horasDeTrabalho(valor) {
  const renda = getIncome();
  if (!renda) return null;
  return (valor / (renda / 168)).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Lista de espera: a regra das 24 horas                               */
/* ------------------------------------------------------------------ */

export function getWishes() {
  return [...getState().wishlist]
    .filter((desejo) => !desejo.decision)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getDecidedWishes() {
  return getState()
    .wishlist.filter((desejo) => desejo.decision)
    .sort((a, b) => (b.decidedAt || "").localeCompare(a.decidedAt || ""));
}

export function addWish({ name, amount }) {
  const valor = Number(amount);
  if (!name?.trim() || !valor || valor <= 0) return null;

  const desejo = {
    id: generateId("desejo"),
    name: name.trim(),
    amount: valor,
    createdAt: new Date().toISOString(),
    decision: null,
    decidedAt: null,
  };
  setState({ wishlist: [...getState().wishlist, desejo] });
  return desejo;
}

// Horas que faltam para a espera acabar. Zero significa que já dá para
// decidir — o app nunca decide sozinho, só destrava a decisão.
export function horasRestantes(desejo) {
  const passadas = (Date.now() - new Date(desejo.createdAt).getTime()) / 3600000;
  return Math.max(0, ESPERA_HORAS - passadas);
}

export function podeDecidir(desejo) {
  return horasRestantes(desejo) <= 0;
}

/*
  Decidir. "Comprei" vira um gasto de verdade na categoria desejo — o que
  passou pela espera e foi comprado continua sendo dinheiro que saiu.
*/
export function decideWish(id, decision) {
  const desejo = getState().wishlist.find((item) => item.id === id);
  if (!desejo) return;

  if (decision === "comprei") {
    addExpense({ amount: desejo.amount, kind: "desejo", note: desejo.name });
  }

  setState({
    wishlist: getState().wishlist.map((item) =>
      item.id === id ? { ...item, decision, decidedAt: new Date().toISOString() } : item
    ),
  });
}

export function removeWish(id) {
  setState({ wishlist: getState().wishlist.filter((item) => item.id !== id) });
}

// Quanto a espera já economizou: a soma do que foi deixado passar depois de
// dormir sobre o assunto.
export function totalEvitado() {
  return getDecidedWishes()
    .filter((desejo) => desejo.decision === "deixei")
    .reduce((soma, desejo) => soma + desejo.amount, 0);
}
