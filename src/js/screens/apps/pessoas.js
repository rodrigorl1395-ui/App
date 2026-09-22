/*
  Pessoas — a tela do app.

  Uma lista só, ordenada por quem está há mais tempo sem contato. Quem
  passou da frequência combinada aparece destacado — o topo da lista é a
  resposta para "com quem eu devia falar hoje?".
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, chipPicker, iconButton, emptyHint, methodCard } from "./kit.js";
import {
  FREQUENCIAS,
  getPeople,
  getOrdenadas,
  getEmDia,
  getContatos30Dias,
  addPerson,
  removePerson,
  registrarContato,
  diasSemContato,
  estaAtrasada,
  contatosNoMes,
  ultimoContato,
} from "../../apps/pessoas.js";

const ACCENT = "#e0709f";

export function renderPessoasApp() {
  const pessoas = getOrdenadas();

  return appShell({
    title: "Pessoas",
    subtitle: "Com quem faz tempo que você não fala",
    icon: "heart",
    accent: ACCENT,
    children: [
      statGrid([
        { value: getPeople().length, label: "pessoas" },
        { value: getEmDia(), label: "em dia" },
        { value: getContatos30Dias(), label: "contatos em 30 dias" },
      ]),

      appCard({
        title: "Sua gente",
        action: iconButton("plus", abrirNovaPessoa, { label: "Nova pessoa" }),
        children: pessoas.length
          ? [createEl("div", { className: "app-list", children: pessoas.map(renderPessoa) })]
          : [emptyHint("Ninguém na lista ainda. Adicione a primeira pessoa com o + acima.")],
      }),

      methodCard("pessoas"),
    ],
  });
}

function renderPessoa(pessoa) {
  const dias = diasSemContato(pessoa);
  const conversas = contatosNoMes(pessoa);
  const nota = [
    ultimoContato(pessoa) ? (dias === 0 ? "falaram hoje" : `${dias} ${dias === 1 ? "dia" : "dias"} sem falar`) : "nunca registrado",
    pessoa.frequency ? `a cada ${pessoa.frequency} dias` : null,
    conversas ? `${conversas} ${conversas === 1 ? "conversa" : "conversas"} no mês` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return createEl("div", {
    className: `app-row${estaAtrasada(pessoa) ? " is-late" : ""}`,
    children: [
      iconButton("check", () => {
        registrarContato(pessoa.id);
        refresh();
      }, { label: `Falei hoje com ${pessoa.name}` }),
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: pessoa.name }),
          createEl("span", { className: "app-row-note", text: nota }),
        ],
      }),
      iconButton("trash", () => {
        removePerson(pessoa.id);
        refresh();
      }, { label: "Remover pessoa", danger: true }),
    ],
  });
}

function abrirNovaPessoa() {
  const nome = textInput({ placeholder: "Nome" });
  const frequencia = chipPicker(
    FREQUENCIAS.map((dias) => ({ id: String(dias), label: `A cada ${dias} dias` })),
    null
  );

  showSheet({
    title: "Nova pessoa",
    subtitle: "A frequência é opcional — só serve pra avisar quando passou do combinado.",
    content: [nome, frequencia.el],
    actions: [
      {
        label: "Adicionar",
        primary: true,
        onClick: () => {
          if (!addPerson({ name: nome.value, frequency: frequencia.value })) return;
          refresh();
        },
      },
    ],
  });
}
