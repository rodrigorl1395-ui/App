/*
  O jardim: as regras.

  A ideia que segura tudo é uma só — a água vem dos hábitos. Cumprir uma
  missão enche o riacho; o riacho enche o regador; o regador faz a planta
  crescer. Não existe botão que fabrica água, do mesmo jeito que não existe
  botão que fabrica XP no resto do app.

  E o riacho CORRE: só vale a água dos últimos sete dias. O que você não usou
  na semana desceu. É o que impede alguém de sumir um mês e voltar com um
  reservatório cheio — e o que faz regar hoje valer mais do que regar depois.

  Guardado no estado: só o que é escolha da pessoa (o que plantou, o que
  regou, o que tirou do riacho). Quanta água existe, em que estágio a planta
  está, se ela tem sede — tudo isso é lido a partir daí, nunca duplicado.
*/

import { getState, setState } from "../state.js";
import { getHabits } from "../habits.js";
import { generateId, todayKey } from "../utils.js";
import { SPECIES, SPECIES_BY_CATEGORY, getSpecies, getPlantStage, PLANT_STAGES, REPLANT_GROWTH } from "../../data/species.js";
import { POLEN_POR_MUDA } from "../../data/guardians.js";

// O que cada missão cumprida despeja no riacho. Segue os três níveis: quem
// fez o mínimo também regou, só que menos.
const WATER_BY_LEVEL = { minimal: 1, main: 2, bonus: 3 };
const STREAM_WINDOW = 7;
const WATER_GROWTH = 10;
const START_PLOTS = 3;
const MAX_PLOTS = 9;

const VAZIO = {
  plots: [],
  plotCount: START_PLOTS,
  can: 0,
  canMax: 3,
  draws: [],
  compost: 0,
  fruits: 0,
  // Pólen que os guardiões de ar já trouxeram, e o último dia em que o
  // jardim foi acertado (ver runGardenTick em guardianWork.js).
  pollen: 0,
  lastTick: null,
};

export function getGrove() {
  return { ...VAZIO, ...(getState().grove || {}) };
}

function setGrove(patch) {
  setState({ grove: { ...getGrove(), ...patch } });
}

function diasAtras(n) {
  const d = new Date(`${todayKey()}T00:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* O riacho                                                            */
/* ------------------------------------------------------------------ */

export function getStream() {
  const desde = diasAtras(STREAM_WINDOW - 1);
  const caiu = getState()
    .logs.filter((log) => log.date >= desde)
    .reduce((soma, log) => soma + (WATER_BY_LEVEL[log.level] || 1), 0);
  const tirado = getGrove()
    .draws.filter((saque) => saque.date >= desde)
    .reduce((soma, saque) => soma + saque.amount, 0);
  return Math.max(0, caiu - tirado);
}

/*
  Encher o regador. Leva o que couber e o que houver — e devolve quanto
  entrou, porque a tela precisa dizer "o riacho está seco" sem recalcular.
*/
export function fillCan() {
  const grove = getGrove();
  const quanto = Math.min(grove.canMax - grove.can, getStream());
  if (quanto <= 0) return 0;
  setGrove({
    can: grove.can + quanto,
    draws: [...grove.draws.filter((saque) => saque.date >= diasAtras(STREAM_WINDOW * 2)), { date: todayKey(), amount: quanto }],
  });
  return quanto;
}

/* ------------------------------------------------------------------ */
/* Os canteiros                                                        */
/* ------------------------------------------------------------------ */

// Um canteiro por posição da cena: ocupado devolve a planta, livre devolve
// null. A tela desenha os dois casos com o mesmo laço.
export function getPlots() {
  const grove = getGrove();
  return Array.from({ length: grove.plotCount }, (_, slot) => {
    const planta = grove.plots.find((item) => item.slot === slot) || null;
    return { slot, plant: planta && withReading(planta) };
  });
}

// Tudo que a tela pergunta sobre uma planta, calculado num lugar só.
function withReading(planta) {
  const especie = getSpecies(planta.species);
  const stage = getPlantStage(planta.growth);
  const dias = planta.lastWater
    ? Math.round((new Date(`${todayKey()}T00:00:00`) - new Date(`${planta.lastWater}T00:00:00`)) / 86400000)
    : null;
  return {
    ...planta,
    especie,
    stage,
    vigor: vigorDe(dias),
    thirsty: planta.lastWater !== todayKey(),
    // Com praga a planta não morre nem perde o que cresceu: ela só para de
    // crescer até alguém tirar a larva. Perder progresso por ter faltado
    // seria a única coisa que este app nunca faz.
    sick: Boolean(planta.pest),
    ripe: stage.stage >= 6 && !planta.pest,
    days: dias,
  };
}

/*
  Sede: a mesma curva das árvores antigas. Nunca chega a zero — planta
  murcha volta com uma rega, e perder tudo por sumir uma semana seria punir
  a pessoa bem na hora em que ela precisa de motivo pra voltar.
*/
function vigorDe(dias) {
  if (dias === null) return 1;
  if (dias <= 1) return 1;
  if (dias === 2) return 0.78;
  if (dias <= 4) return 0.55;
  if (dias <= 7) return 0.34;
  return 0.18;
}

export function plant(slot, speciesId) {
  const grove = getGrove();
  if (slot >= grove.plotCount || grove.plots.some((item) => item.slot === slot)) return null;
  const muda = {
    id: generateId("planta"),
    slot,
    species: speciesId,
    growth: 0,
    lastWater: null,
    compostLeft: 0,
    plantedAt: new Date().toISOString(),
  };
  setGrove({ plots: [...grove.plots, muda] });
  return muda;
}

/*
  Criar um hábito planta a árvore da área dele, na hora. "Plantar um
  hábito" deixa de ser figura de linguagem: você decide cuidar do corpo e a
  mangueira aparece no canteiro, esperando a primeira rega.

  Se a espécie já está no jardim, não planta de novo — uma árvore por área
  basta, e o segundo hábito de corpo rega a mesma mangueira. Sem canteiro
  livre, devolve null e a tela avisa que falta terra.
*/
export function plantForCategory(category) {
  const speciesId = SPECIES_BY_CATEGORY[category] || SPECIES_BY_CATEGORY.custom;
  const grove = getGrove();
  if (grove.plots.some((planta) => planta.species === speciesId)) return null;

  const ocupados = new Set(grove.plots.map((planta) => planta.slot));
  const slot = Array.from({ length: grove.plotCount }, (_, i) => i).find((i) => !ocupados.has(i));
  if (slot === undefined) return null;

  return plant(slot, speciesId);
}

function atualizar(id, muda) {
  const grove = getGrove();
  setGrove({ plots: grove.plots.map((planta) => (planta.id === id ? muda(planta) : planta)) });
}

/*
  Regar. Uma dose por planta por dia — a planta não cresce mais rápido se
  você afogar ela, e o limite diário é o que faz o jardim ser um hábito e
  não uma sessão de cliques.
*/
export function water(id, { bonus = 0 } = {}) {
  const grove = getGrove();
  const planta = grove.plots.find((item) => item.id === id);
  if (!planta || grove.can < 1 || planta.lastWater === todayKey()) return null;

  const especie = getSpecies(planta.species);
  const adubado = planta.compostLeft > 0;
  // Com praga, a água só mata a sede: o crescimento fica parado até a larva
  // sair. bonus é o que o guardião de luz somou ao dia.
  const ganho = planta.pest
    ? 0
    : Math.round(WATER_GROWTH * especie.rate * (adubado ? 2 : 1) * (1 + bonus));

  setGrove({ can: grove.can - 1 });
  atualizar(id, (item) => ({
    ...item,
    growth: item.growth + ganho,
    lastWater: todayKey(),
    compostLeft: Math.max(0, item.compostLeft - 1),
  }));
  return { ganho, adubado, sick: Boolean(planta.pest) };
}

/*
  Crescer sem regador: é o que o guardião de água faz quando trabalha. Passa
  pela mesma trava da praga — guardião nenhum faz uma árvore doente crescer.
*/
export function growPlant(id, amount) {
  const planta = getGrove().plots.find((item) => item.id === id);
  if (!planta || planta.pest) return 0;
  const ganho = Math.round(amount * getSpecies(planta.species).rate);
  atualizar(id, (item) => ({ ...item, growth: item.growth + ganho, lastWater: todayKey() }));
  return ganho;
}

export function setPest(id, dateKey) {
  atualizar(id, (planta) => ({ ...planta, pest: dateKey }));
}

export function curePest(id) {
  const planta = getGrove().plots.find((item) => item.id === id);
  if (!planta?.pest) return false;
  atualizar(id, (item) => ({ ...item, pest: null }));
  return true;
}

// Frutos a mais na próxima colheita — o que o guardião de terra deixa na
// terra depois de revirar.
export function addYieldBonus(id, amount) {
  atualizar(id, (planta) => ({ ...planta, yieldBonus: (planta.yieldBonus || 0) + amount }));
}

export function addPollen(amount) {
  setGrove({ pollen: getGrove().pollen + amount });
}

/*
  A muda que o vento plantou. Escolhe sozinha um canteiro livre e uma
  espécie já aberta — é presente, então não cobra fruto nenhum.
*/
export function plantFromPollen() {
  const grove = getGrove();
  if (grove.pollen < POLEN_POR_MUDA) return null;

  const ocupados = new Set(grove.plots.map((planta) => planta.slot));
  const slot = Array.from({ length: grove.plotCount }, (_, i) => i).find((i) => !ocupados.has(i));
  if (slot === undefined) return null;

  const abertas = getSeedlings().filter((muda) => muda.unlocked);
  if (!abertas.length) return null;
  // A mais rara primeiro: a que você ainda não tem no jardim.
  const nova = abertas.find((muda) => !ocupados.size || !grove.plots.some((p) => p.species === muda.especie.id)) || abertas[0];

  setGrove({ pollen: grove.pollen - POLEN_POR_MUDA });
  return plant(slot, nova.especie.id);
}

// Adubar vale pelas três próximas regas, não por tempo: quem adubou e sumiu
// não perde o saco de adubo.
export function useCompost(id) {
  const grove = getGrove();
  if (grove.compost < 1) return false;
  setGrove({ compost: grove.compost - 1 });
  atualizar(id, (planta) => ({ ...planta, compostLeft: planta.compostLeft + 3 }));
  return true;
}

export function harvest(id) {
  const grove = getGrove();
  const planta = grove.plots.find((item) => item.id === id);
  if (!planta || getPlantStage(planta.growth).stage < 6) return null;

  const especie = getSpecies(planta.species);
  setGrove({ fruits: grove.fruits + especie.yield });
  atualizar(id, (item) => ({ ...item, growth: REPLANT_GROWTH }));
  return { amount: especie.yield, name: especie.fruitName };
}

// Arrancar libera o canteiro. Sem confirmação dupla: quem plantou pode
// desplantar, e o custo (perder o crescimento) já é a confirmação.
export function uproot(id) {
  setGrove({ plots: getGrove().plots.filter((planta) => planta.id !== id) });
}

/* ------------------------------------------------------------------ */
/* Mudas e loja                                                        */
/* ------------------------------------------------------------------ */

/*
  Uma espécie se abre quando existe um hábito daquela categoria. É assim que
  o jardim continua ligado à vida real sem virar um relatório: você não ganha
  a mangueira por cumprir, ganha por ter decidido cuidar do corpo.
*/
export function getSeedlings() {
  const categorias = new Set(getHabits().map((habit) => habit.category));
  const plantadas = new Set(getGrove().plots.map((planta) => planta.species));
  return SPECIES.map((especie) => ({
    especie,
    unlocked: categorias.has(especie.category),
    cost: plantadas.has(especie.id) ? 5 : 0,
  }));
}

/*
  A loja do jardim gasta frutos colhidos, não as sementes do resto do app:
  economia fechada, pra cuidar das plantas não competir com comprar
  ferramentas. Cada canteiro novo custa mais que o anterior.
*/
export function getShop() {
  const grove = getGrove();
  return [
    {
      id: "adubo",
      name: "Saco de adubo",
      note: "Dobra o crescimento das próximas três regas de uma planta.",
      icon: "sprout",
      cost: 3,
      available: true,
    },
    {
      id: "canteiro",
      name: "Abrir canteiro",
      note: `Você tem ${grove.plotCount} de ${MAX_PLOTS}. Terra nova, pra mais uma árvore.`,
      icon: "tree",
      cost: 8 + (grove.plotCount - START_PLOTS) * 6,
      available: grove.plotCount < MAX_PLOTS,
    },
    {
      id: "defensivo",
      name: "Defensivo natural",
      note: "Tira a larva de uma árvore. Serve para quando não há guardião de fogo livre.",
      icon: "bug",
      cost: 3,
      available: getPlots().some((plot) => plot.plant?.sick),
    },
    {
      id: "regador",
      name: "Regador maior",
      note: `Leva ${grove.canMax} doses por viagem ao riacho. Passa a levar ${grove.canMax + 2}.`,
      icon: "droplet",
      cost: 10 + (grove.canMax - 3) * 8,
      available: grove.canMax < 9,
    },
  ].map((item) => ({ ...item, affordable: item.available && grove.fruits >= item.cost }));
}

export function buy(itemId) {
  const grove = getGrove();
  const item = getShop().find((linha) => linha.id === itemId);
  if (!item?.affordable) return false;

  const gasto = { fruits: grove.fruits - item.cost };
  if (itemId === "adubo") setGrove({ ...gasto, compost: grove.compost + 1 });
  if (itemId === "canteiro") setGrove({ ...gasto, plotCount: grove.plotCount + 1 });
  if (itemId === "regador") setGrove({ ...gasto, canMax: grove.canMax + 2 });
  if (itemId === "defensivo") {
    // Cura a que está doente há mais tempo: é a que trava o jardim.
    const doente = getPlots()
      .map((plot) => plot.plant)
      .filter((planta) => planta?.sick)
      .sort((a, b) => a.pest.localeCompare(b.pest))[0];
    if (!doente) return false;
    setGrove(gasto);
    curePest(doente.id);
  }
  return true;
}

// Comprar a muda extra acontece na hora de plantar, então cobra aqui mesmo.
export function paySeedling(cost) {
  const grove = getGrove();
  if (grove.fruits < cost) return false;
  if (cost) setGrove({ fruits: grove.fruits - cost });
  return true;
}

/* ------------------------------------------------------------------ */
/* Leitura do jardim inteiro                                           */
/* ------------------------------------------------------------------ */

export function getGroveSummary() {
  const grove = getGrove();
  const plantas = getPlots().map((plot) => plot.plant).filter(Boolean);
  return {
    stream: getStream(),
    can: grove.can,
    canMax: grove.canMax,
    fruits: grove.fruits,
    compost: grove.compost,
    plants: plantas.length,
    plots: grove.plotCount,
    thirsty: plantas.filter((planta) => planta.thirsty).length,
    ripe: plantas.filter((planta) => planta.ripe).length,
    // Quantas plantas dá pra regar agora: o número que decide se vale a
    // viagem ao riacho.
    waterable: Math.min(grove.can, plantas.filter((planta) => planta.thirsty).length),
  };
}

export { SPECIES_BY_CATEGORY, PLANT_STAGES, MAX_PLOTS };
