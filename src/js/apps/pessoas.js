/*
  Pessoas — o app que a ferramenta do mesmo nome destrava.

  Quem importa, e há quantos dias você não fala com cada um. O estado guarda
  só o nome, a frequência combinada e as datas em que houve contato — "há
  quanto tempo" e "quantas conversas no mês" saem dessa lista na hora.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export const FREQUENCIAS = [7, 15, 30];

export function getPeople() {
  return getState().people;
}

export function addPerson({ name, frequency }) {
  if (!name?.trim()) return null;
  const pessoa = {
    id: generateId("pessoa"),
    name: name.trim(),
    frequency: FREQUENCIAS.includes(Number(frequency)) ? Number(frequency) : null,
    contacts: [],
    createdAt: new Date().toISOString(),
  };
  setState({ people: [...getPeople(), pessoa] });
  return pessoa;
}

export function removePerson(id) {
  setState({ people: getPeople().filter((pessoa) => pessoa.id !== id) });
}

// Falar duas vezes no mesmo dia não são dois contatos: a régua do app é o
// dia, e repetir a data só inflaria a contagem do mês.
export function registrarContato(id) {
  const hoje = todayKey();
  setState({
    people: getPeople().map((pessoa) =>
      pessoa.id === id && !pessoa.contacts.includes(hoje)
        ? { ...pessoa, contacts: [...pessoa.contacts, hoje] }
        : pessoa
    ),
  });
}

export function ultimoContato(pessoa) {
  return pessoa.contacts.length ? pessoa.contacts[pessoa.contacts.length - 1] : null;
}

function diasEntre(chave) {
  return Math.floor((Date.now() - new Date(`${chave}T00:00:00`).getTime()) / 86400000);
}

// Sem contato nenhum ainda, conta do cadastro: a pessoa entrou na lista
// justamente porque já fazia tempo.
export function diasSemContato(pessoa) {
  const ultimo = ultimoContato(pessoa);
  return diasEntre(ultimo || pessoa.createdAt.slice(0, 10));
}

export function estaAtrasada(pessoa) {
  return pessoa.frequency ? diasSemContato(pessoa) > pessoa.frequency : false;
}

export function contatosNoMes(pessoa) {
  return pessoa.contacts.filter((data) => diasEntre(data) < 30).length;
}

export function getOrdenadas() {
  return [...getPeople()].sort((a, b) => diasSemContato(b) - diasSemContato(a));
}

export function getEmDia() {
  return getPeople().filter((pessoa) => !estaAtrasada(pessoa)).length;
}

export function getContatos30Dias() {
  return getPeople().reduce((soma, pessoa) => soma + contatosNoMes(pessoa), 0);
}

export function getSumidas() {
  return getPeople().filter((pessoa) => diasSemContato(pessoa) > 30).length;
}
