/*
  O trabalho dos guardiões.

  Cada guardião cuida da árvore da área dele, e cuida do jeito do seu
  elemento: a água rega, o ar leva pólen, o fogo queima a larva, a luz
  nutre, a terra aduba, o espírito abençoa. Um trabalho por guardião por
  dia — ou ele faz sozinho, ou você pede.

  Pedir vale mais do que deixar acontecer: sozinho ele resolve o que estiver
  mais urgente e rende pouco; pedido, você escolhe a árvore e o efeito é
  duas a três vezes maior. É o que mantém o jogo andando em dia corrido sem
  tirar o sentido de aparecer.

  Trabalho atrasado não acumula. Quem some uma semana não volta com sete
  regas de presente — encontra o jardim do jeito que o deixou, com as larvas
  que nasceram. O guardião trabalha no dia em que você abre o jardim.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";
import { getHabits } from "../habits.js";
import { getAnimalById, CATEGORY_ELEMENT } from "../../data/animals.js";
import { getWork, DIAS_ATE_PRAGA, DIAS_DE_IMUNIDADE, POLEN_POR_MUDA, XP_POR_FRUTO } from "../../data/guardians.js";
import { SPECIES_BY_CATEGORY } from "../../data/species.js";
import {
  getGrove,
  getPlots,
  growPlant,
  addPollen,
  plantFromPollen,
  setPest,
  curePest,
  addYieldBonus,
} from "./grove.js";

function diasEntre(de, ate) {
  return Math.round((new Date(`${ate}T00:00:00`) - new Date(`${de}T00:00:00`)) / 86400000);
}

export function getActions() {
  return getState().guardianActions;
}

function registrar(acao) {
  setState({ guardianActions: [...getActions(), { id: generateId("trabalho"), ...acao }] });
}

/* ------------------------------------------------------------------ */
/* Quem trabalha hoje                                                  */
/* ------------------------------------------------------------------ */

/*
  Um guardião por hábito, e um hábito por guardião: quem cuida de "Correr"
  é o mesmo bicho o tempo todo. Aqui só interessa o elemento dele e se ele
  já trabalhou hoje.
*/
export function getGuardians() {
  const hoje = todayKey();
  const feitas = getActions().filter((acao) => acao.date === hoje);

  return getHabits()
    .map((habit) => {
      const guardiao = getAnimalById(habit.animalId);
      if (!guardiao) return null;
      const acao = feitas.find((item) => item.guardianId === guardiao.id) || null;
      return {
        habit,
        guardian: guardiao,
        name: habit.guardianName || guardiao.name,
        element: guardiao.element,
        work: getWork(guardiao.element),
        doneToday: Boolean(acao),
        action: acao,
      };
    })
    .filter(Boolean);
}

// As árvores da área de um elemento: é nelas que aquele guardião trabalha.
function arvoresDoElemento(element) {
  const especies = new Set(
    Object.entries(CATEGORY_ELEMENT)
      .filter(([, elemento]) => elemento === element)
      .map(([categoria]) => SPECIES_BY_CATEGORY[categoria])
  );
  return getPlots()
    .map((plot) => plot.plant)
    .filter((planta) => planta && especies.has(planta.species));
}

/*
  Onde ele age sozinho: primeiro a árvore da própria área, e dentro dela a
  que mais precisa do trabalho dele — o fogo procura larva, a água procura
  sede. Sem árvore da área, ele ajuda onde der: guardião parado olhando o
  jardim morrer seria pior do que guardião fora da especialidade.
*/
function alvoAutomatico(element, effect) {
  const daArea = arvoresDoElemento(element);
  const todas = getPlots().map((plot) => plot.plant).filter(Boolean);
  const pool = daArea.length ? daArea : todas;
  if (!pool.length) return null;

  if (effect === "proteger") {
    // Larva primeiro; sem nenhuma, monta guarda na que está mais perto de
    // pegar uma. O fogo serve para a larva NÃO chegar, não só para apagar
    // incêndio — guardião de fogo em jardim saudável não fica de braços
    // cruzados.
    return (
      pool.find((planta) => planta.sick) ||
      pool.filter((planta) => !planta.sick).sort((a, b) => a.vigor - b.vigor)[0] ||
      null
    );
  }
  if (effect === "regar") {
    const sedentas = pool.filter((planta) => planta.thirsty && !planta.sick);
    return sedentas.sort((a, b) => a.vigor - b.vigor)[0] || null;
  }
  if (effect === "adubar") {
    return pool.filter((planta) => !planta.sick).sort((a, b) => b.growth - a.growth)[0] || null;
  }
  // Polinizar, nutrir e abençoar valem para o jardim inteiro: não precisam
  // de alvo, mas só acontecem se houver jardim.
  return pool[0] || null;
}

/* ------------------------------------------------------------------ */
/* O efeito em si                                                      */
/* ------------------------------------------------------------------ */

/*
  Aplica o trabalho. Devolve o que aconteceu em uma frase, porque quem
  chama (a tela, o noticiário do dia) precisa contar a história e não
  recalcular nada.
*/
function aplicar(effect, quanto, planta) {
  if (effect === "regar" && planta) {
    const ganho = growPlant(planta.id, quanto);
    return ganho ? `regou ${planta.especie.name.toLowerCase()} (+${ganho})` : null;
  }
  if (effect === "polinizar") {
    addPollen(quanto);
    const nova = plantFromPollen();
    return nova
      ? `trouxe pólen e nasceu ${nova.species}`
      : `trouxe pólen (${getGrove().pollen}/${POLEN_POR_MUDA})`;
  }
  if (effect === "proteger" && planta) {
    const nome = planta.especie.name.toLowerCase();
    // Curou ou montou guarda, o registro é o mesmo — e é dele que sai a
    // imunidade que runGardenTick consulta antes de criar uma larva nova.
    return curePest(planta.id) ? `queimou a larva de ${nome}` : `montou guarda em ${nome}`;
  }
  if (effect === "adubar" && planta) {
    addYieldBonus(planta.id, quanto);
    return `adubou ${planta.especie.name.toLowerCase()} (+${quanto} na colheita)`;
  }
  // Nutrir e abençoar não mexem em planta nenhuma: valem pelo registro, que
  // getTodayBonus lê na hora de regar e de alimentar.
  if (effect === "nutrir") return "deixou o jardim mais fértil hoje";
  if (effect === "abencoar") return "abençoou os frutos de hoje";
  return null;
}

/*
  Bônus que valem pelo dia inteiro, lidos do registro em vez de guardados
  num campo: nutrir multiplica o que cada rega faz crescer, abençoar
  multiplica o XP do fruto dado a um guardião.
*/
export function getTodayBonus(effect) {
  return getActions()
    .filter((acao) => acao.date === todayKey() && acao.effect === effect)
    .reduce((total, acao) => total + acao.amount, 0);
}

/* ------------------------------------------------------------------ */
/* Pedir o trabalho                                                    */
/* ------------------------------------------------------------------ */

export function askWork(guardianId, plantId = null) {
  const guardiao = getGuardians().find((item) => item.guardian.id === guardianId);
  if (!guardiao || guardiao.doneToday) return null;

  const { work } = guardiao;
  const planta = plantId
    ? getPlots().map((plot) => plot.plant).find((item) => item?.id === plantId)
    : alvoAutomatico(guardiao.element, work.id);

  const texto = aplicar(work.id, work.asked, planta);
  if (!texto) return null;

  registrar({
    guardianId,
    element: guardiao.element,
    effect: work.id,
    date: todayKey(),
    plantId: planta?.id || null,
    amount: work.asked,
    asked: true,
  });
  return { text: `${guardiao.name} ${texto}.`, work };
}

/*
  As árvores que fazem sentido para este guardião agora — é o que a tela
  oferece quando você pede o trabalho. Fora da área dele a lista ainda
  aparece: ajudar a árvore do vizinho é pior que a própria, nunca proibido.
*/
export function getTargets(guardianId) {
  const guardiao = getGuardians().find((item) => item.guardian.id === guardianId);
  if (!guardiao) return [];

  const daArea = new Set(arvoresDoElemento(guardiao.element).map((planta) => planta.id));
  const util = (planta) => {
    if (guardiao.work.id === "proteger") return planta.sick;
    if (guardiao.work.id === "regar") return !planta.sick;
    return !planta.sick;
  };

  return getPlots()
    .map((plot) => plot.plant)
    .filter(Boolean)
    .map((planta) => ({ planta, daArea: daArea.has(planta.id), util: util(planta) }))
    .sort((a, b) => Number(b.util) - Number(a.util) || Number(b.daArea) - Number(a.daArea));
}

/* ------------------------------------------------------------------ */
/* Alimentar                                                           */
/* ------------------------------------------------------------------ */

/*
  Dar fruto ao guardião. É a outra ponta do jardim: o que a árvore produz
  volta para quem cuida dela. O XP daqui soma ao dos hábitos (companion.js)
  — acelera a evolução, não substitui o dia cumprido.

  O guardião de espírito, quando abençoa, faz o fruto do dia render mais.
*/
export function feedGuardian(guardianId, fruits) {
  const grove = getGrove();
  const quanto = Math.min(Math.max(1, Math.round(fruits)), grove.fruits);
  if (!quanto) return null;

  const bencao = getTodayBonus("abencoar");
  const xp = Math.round(quanto * XP_POR_FRUTO + bencao);

  setState({
    grove: { ...grove, fruits: grove.fruits - quanto },
    feedings: [
      ...getState().feedings,
      { id: generateId("refeicao"), guardianId, fruits: quanto, xp, date: todayKey() },
    ],
  });
  return { fruits: quanto, xp, blessed: bencao > 0 };
}

export function getFeedings(guardianId) {
  return getState().feedings.filter((refeicao) => refeicao.guardianId === guardianId);
}

/* ------------------------------------------------------------------ */
/* O dia que passou                                                    */
/* ------------------------------------------------------------------ */

/*
  Acerta o jardim com o dia de hoje: nascem as larvas das árvores que
  ficaram sem água, e cada guardião que ainda não trabalhou trabalha
  sozinho. Roda ao abrir o Jardim, uma vez por dia — o marcador lastTick é
  o que garante que abrir a tela dez vezes não rende dez trabalhos.

  Devolve o noticiário: é o que a tela mostra como "o que aconteceu por
  aqui", e é o que faz valer a pena abrir o jardim de manhã.
*/
export function runGardenTick() {
  const grove = getGrove();
  const hoje = todayKey();
  if (grove.lastTick === hoje) return [];

  const noticias = [];

  // 1. As larvas. Só em árvore que já foi regada alguma vez e está há
  //    tempo demais sem água, e desde que ninguém a tenha protegido.
  for (const planta of getPlots().map((plot) => plot.plant).filter(Boolean)) {
    if (planta.pest || !planta.lastWater) continue;
    if (diasEntre(planta.lastWater, hoje) < DIAS_ATE_PRAGA) continue;
    const protegida = getActions().some(
      (acao) =>
        acao.effect === "proteger" &&
        acao.plantId === planta.id &&
        diasEntre(acao.date, hoje) < DIAS_DE_IMUNIDADE
    );
    if (protegida) continue;
    setPest(planta.id, hoje);
    noticias.push({ text: `Larvas apareceram em ${planta.especie.name.toLowerCase()}.`, urgent: true });
  }

  // 2. O trabalho de quem ainda não trabalhou hoje.
  for (const guardiao of getGuardians()) {
    if (guardiao.doneToday) continue;
    const planta = alvoAutomatico(guardiao.element, guardiao.work.id);
    const texto = aplicar(guardiao.work.id, guardiao.work.auto, planta);
    if (!texto) continue;
    registrar({
      guardianId: guardiao.guardian.id,
      element: guardiao.element,
      effect: guardiao.work.id,
      date: hoje,
      plantId: planta?.id || null,
      amount: guardiao.work.auto,
      asked: false,
    });
    /*
      Nem toda notícia merece interromper. Trabalho de rotina (regou,
      polinizou) é recado; o que mudou o jardim de verdade — uma muda que
      nasceu — pede a mesma atenção que uma larva.
    */
    noticias.push({ text: `${guardiao.name} ${texto}.`, urgent: texto.startsWith("trouxe pólen e nasceu") });
  }

  setState({ grove: { ...getGrove(), lastTick: hoje } });
  return noticias;
}
