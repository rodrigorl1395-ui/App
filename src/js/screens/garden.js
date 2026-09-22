/*
  Jardim — a tela.

  Um lugar, não uma lista: o terreno ocupa a tela inteira e tudo se faz
  tocando nele. Tocar na planta faz a coisa óbvia (colher se está madura,
  regar se tem sede, abrir a ficha se não há o que fazer), tocar no riacho
  enche o regador, tocar em canteiro vazio planta.

  A cena e a camada de plantas são dois SVG com o MESMO viewBox e o mesmo
  preserveAspectRatio, sobrepostos — é o que garante que a planta caia
  exatamente no canteiro desenhado no fundo, em qualquer tamanho de tela.

  Depois de cada ação a tela não se redesenha inteira: só o canteiro que
  mudou e os números do topo. Um refresh() aqui cortaria a animação da água
  no meio e remontaria o cenário inteiro por causa de uma gota.
*/

import { createEl, showSheet, showDiscovery } from "../ui.js";
import { createIcon } from "../icons.js";
import { createGuardianArt } from "../guardianArt.js";
import { navigate, refresh } from "../router.js";
import { createGardenScene, PLOTS, STREAM, VIEW } from "../garden/sceneArt.js";
import { createPlantArt, alturaDaPlanta } from "../garden/plantArt.js";
import {
  getGroveSummary,
  getPlots,
  getStream,
  fillCan,
  plant,
  water,
  harvest,
  useCompost,
  uproot,
  getSeedlings,
  getShop,
  buy,
  paySeedling,
} from "../garden/grove.js";
import { getGuardians, getTargets, askWork, feedGuardian, runGardenTick, getTodayBonus } from "../garden/guardianWork.js";
import { XP_POR_FRUTO } from "../../data/guardians.js";
import { getStageProgress } from "../../data/species.js";
import { getSceneCreatures } from "../garden.js";
import { collectDiscovery } from "../discoveries.js";
import { getTouchLine } from "../dialogue.js";

const NS = "http://www.w3.org/2000/svg";
const PLANT_W = 150;
const PLANT_H = 200;

/*
  A arte tem viewBox 100×130 numa caixa de 150×200 e ancora pela base, então
  o desenho ocupa 195 unidades de altura — é sobre essa medida que se calcula
  onde a copa termina e o selo começa.
*/
const ALTURA_ARTE = 195;

// A camada e o topo são reescritos fora do ciclo do router, então a tela
// guarda as referências que precisa alcançar depois.
let camada = null;
let chips = null;

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [chave, valor] of Object.entries(attrs)) node.setAttribute(chave, String(valor));
  return node;
}

export function renderGardenScreen() {
  const tema = document.documentElement.getAttribute("data-theme") === "claro" ? "claro" : "escuro";

  /*
    Antes de desenhar: o jardim acerta o dia. Os guardiões que ainda não
    trabalharam trabalham, e as larvas das árvores abandonadas aparecem.
    Roda uma vez por dia — e o que aconteceu vira o recado de boas-vindas,
    que é metade do motivo de abrir o jardim de manhã.
  */
  const noticias = runGardenTick();

  camada = svgEl("svg", {
    class: "grove-layer",
    viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
    preserveAspectRatio: "xMidYMid slice",
  });

  desenharCamada();

  const palco = createEl("div", { className: "grove" });
  const cena = createGardenScene({ theme: tema });
  cena.classList.add("grove-scene");
  palco.append(cena, camada);

  if (noticias.length) requestAnimationFrame(() => mostrarNoticias(noticias));

  return createEl("div", { className: "world-screen", children: [palco, renderHud()] });
}

/*
  O que aconteceu desde a última visita. Só interrompe a tela quando algo
  mudou o jardim de verdade — uma larva, uma muda que nasceu. Trabalho de
  rotina vira um recado que some sozinho: um modal por dia dizendo "o
  axolote regou" cansaria em uma semana.
*/
function mostrarNoticias(noticias) {
  if (!noticias.some((linha) => linha.urgent)) {
    aviso(noticias.length === 1 ? noticias[0].text : `${noticias.length} guardiões trabalharam no jardim.`);
    return;
  }

  showSheet({
    title: "Enquanto você não estava",
    subtitle: "O jardim não para quando você fecha o app.",
    content: [
      createEl("div", {
        className: "app-list",
        children: noticias.map((linha) =>
          createEl("div", {
            className: `app-row${linha.urgent ? " is-late" : " is-quiet"}`,
            children: [
              createEl("div", {
                className: "app-row-body",
                children: [createEl("span", { className: "app-row-note", text: linha.text })],
              }),
            ],
          })
        ),
      }),
    ],
    actions: [{ label: "Ver o jardim", primary: true, onClick: () => {} }],
  });
}

function desenharCamada() {
  camada.replaceChildren();
  camada.appendChild(montarRiacho());
  getPlots().forEach((plot) => camada.appendChild(montarCanteiro(plot)));
  montarGuardioes().forEach((node) => camada.appendChild(node));
}

/* ------------------------------------------------------------------ */
/* O riacho                                                            */
/* ------------------------------------------------------------------ */

/*
  O riacho pulsa quando o regador está vazio e há água correndo. É o único
  tutorial do jardim: a coisa que você precisa fazer agora é a que brilha.
*/
function montarRiacho() {
  const { can, canMax } = getGroveSummary();
  const chamando = can < canMax && getStream() > 0;

  const g = svgEl("g", {
    class: `grove-stream${chamando ? " is-calling" : ""}`,
    transform: `translate(${STREAM.x} ${STREAM.y})`,
    role: "button",
    tabindex: "0",
    "aria-label": "Encher o regador no riacho",
  });
  g.append(
    svgEl("circle", { r: 62, class: "grove-stream-halo" }),
    svgEl("circle", { r: 34, class: "grove-stream-disc" })
  );

  const balde = svgEl("svg", { x: -22, y: -22, width: 44, height: 44, viewBox: "0 0 24 24", class: "grove-stream-icon" });
  balde.appendChild(svgEl("path", { d: "M12 2C9 7 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-4-8-7-13Z", fill: "currentColor" }));
  g.appendChild(balde);

  const agir = () => encher(g);
  g.addEventListener("click", agir);
  g.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") agir();
  });
  return g;
}

function encher(g) {
  const antes = getGroveSummary();
  const quanto = fillCan();
  if (!quanto) {
    aviso(
      antes.can >= antes.canMax
        ? "O regador já está cheio."
        : "O riacho secou. Cumpra um hábito hoje e ele volta a correr."
    );
    return;
  }
  animar(g, "is-splash");
  aviso(`+${quanto} ${quanto === 1 ? "dose" : "doses"} no regador.`);
  atualizarChips();
  // Trocar na hora arrancaria da tela o próprio elemento que está animando.
  setTimeout(() => {
    if (g.isConnected) trocar(g, montarRiacho());
  }, 520);
}

/* ------------------------------------------------------------------ */
/* Canteiros                                                           */
/* ------------------------------------------------------------------ */

function montarCanteiro({ slot, plant: planta }) {
  const ponto = PLOTS[slot];
  const g = svgEl("g", {
    class: `grove-plot${planta ? "" : " is-empty"}`,
    transform: `translate(${ponto.x} ${ponto.y})`,
    "data-slot": slot,
    role: "button",
    tabindex: "0",
    "aria-label": planta ? `${planta.especie.name}, ${planta.stage.name.toLowerCase()}` : "Canteiro vazio",
  });

  // Área de toque generosa: o dedo acerta a árvore inteira, não só o tronco.
  g.appendChild(svgEl("rect", { x: -PLANT_W / 2, y: -PLANT_H, width: PLANT_W, height: PLANT_H + 30, fill: "transparent" }));

  if (planta) {
    const arte = createPlantArt(planta.species, planta.stage.stage, { vigor: planta.vigor });
    arte.setAttribute("x", -PLANT_W / 2);
    arte.setAttribute("y", -PLANT_H);
    arte.setAttribute("width", PLANT_W);
    arte.setAttribute("height", PLANT_H);
    arte.setAttribute("class", "grove-plant");
    g.appendChild(arte);

    // O selo fica logo acima da copa desta planta, não no topo da caixa.
    const alto = -Math.round(alturaDaPlanta(planta.species, planta.stage.stage) * ALTURA_ARTE) - 26;
    // A larva grita mais alto que a sede: árvore doente não cresce nem com
    // água, então é ela que precisa ser resolvida primeiro.
    if (planta.sick) g.appendChild(selo("bug", "is-sick", null, alto));
    else if (planta.ripe) g.appendChild(selo("apple", "is-ripe", planta.especie.fruit, alto));
    else if (planta.thirsty) g.appendChild(selo("droplet", "is-thirsty", null, alto));
  } else {
    // No canteiro vazio o sinal fica rente ao chão: não há árvore nenhuma
    // sobre a qual ele pudesse flutuar.
    g.appendChild(selo("plus", "is-plant", null, -46));
  }

  const agir = () => acao(slot, planta, g);
  g.addEventListener("click", agir);
  g.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") agir();
  });
  return g;
}

// O selo que flutua sobre a planta dizendo o que ela precisa. É o que
// permite atravessar o jardim sem abrir ficha nenhuma.
function selo(icone, classe, cor, altura) {
  /*
    Dois grupos, não um: a animação de flutuar escreve no transform, e num
    grupo só ela apagaria o translate que põe o selo acima da copa — o selo
    caía em cima do tronco. Fora fica o lugar, dentro fica o movimento.
  */
  const lugar = svgEl("g", { transform: `translate(0 ${altura})` });
  const g = svgEl("g", { class: `grove-badge ${classe}` });
  // A cor do fruto vai por style, não por atributo: o fill da folha de
  // estilo vence um atributo de apresentação, e o selo da planta madura
  // ficava escuro sobre escuro — invisível justo no momento da recompensa.
  g.appendChild(svgEl("circle", { r: 19, class: "grove-badge-disc", ...(cor ? { style: `fill: ${cor}` } : {}) }));
  const icone24 = createIcon(icone);
  icone24.setAttribute("x", -11);
  icone24.setAttribute("y", -11);
  icone24.setAttribute("width", 22);
  icone24.setAttribute("height", 22);
  g.appendChild(icone24);
  lugar.appendChild(g);
  return lugar;
}

/*
  Um toque, a coisa óbvia. A ordem importa: fruto maduro primeiro (é a
  recompensa e some se você demorar), depois a sede, e só então a ficha —
  que é onde mora o resto e ninguém precisa abrir pra jogar.
*/
function acao(slot, planta, g) {
  if (!planta) return escolherMuda(slot);
  // Com larva não há gesto rápido: a ficha explica o que houve e quem
  // resolve. Regar por cima seria deixar a pessoa achar que resolveu.
  if (planta.sick) return fichaPlanta(planta);
  if (planta.ripe) return colher(planta, g);
  if (planta.thirsty) return regar(planta, g);
  return fichaPlanta(planta);
}

/*
  Quem tira a larva: um guardião de fogo que ainda não trabalhou hoje. Sem
  nenhum por perto, o galpão vende o defensivo — ninguém fica com a árvore
  travada só por não ter tirado a espécie certa.
*/
function quemCura() {
  const fogo = getGuardians().filter((item) => item.element === "fogo" && !item.doneToday);
  if (fogo.length) return `${fogo[0].name} pode queimar a larva: toque nele e peça.`;
  return "Nenhum guardião de fogo livre hoje. O defensivo do galpão resolve.";
}

function regar(planta, g) {
  const antes = planta.stage.stage;
  const feito = water(planta.id, { bonus: getTodayBonus("nutrir") });
  if (!feito) {
    aviso(
      getGroveSummary().can < 1
        ? "Regador vazio. Toque no riacho para enchê-lo."
        : `${planta.especie.name} já bebeu hoje.`
    );
    return;
  }
  gotas(g);
  animar(g.querySelector(".grove-plant"), "is-drinking");
  atualizarChips();

  /*
    O degrau é a recompensa que o jardim tem para dar, e ela só existe se a
    pessoa vir acontecer: sem isto, subir de muda para árvore jovem seria um
    desenho que trocou enquanto ninguém olhava.
  */
  const depois = getPlots().find((item) => item.slot === planta.slot)?.plant;
  const cresceu = depois && depois.stage.stage > antes;
  if (cresceu) aviso(`${planta.especie.name}: ${depois.stage.name.toLowerCase()}!`);

  // A troca espera a chuva inteira cair (520ms de queda + 210 de atraso da
  // última gota): redesenhar antes arrancaria as gotas do meio do ar.
  setTimeout(() => {
    redesenhar(planta.slot);
    if (cresceu) animar(camada.querySelector(`[data-slot="${planta.slot}"] .grove-plant`), "is-growing");
  }, 760);
}

function colher(planta, g) {
  const colheita = harvest(planta.id);
  if (!colheita) return;
  frutosSubindo(g, planta.especie.fruit, colheita.amount);
  aviso(`+${colheita.amount} ${colheita.name}`);
  atualizarChips();
  setTimeout(() => redesenhar(planta.slot), 700);
}

/*
  Redesenhar é sempre parcial: o cenário é um SVG grande, e remontá-lo por
  causa de uma rega faria o jardim inteiro piscar. Trocamos o canteiro que
  mudou, o riacho (que pulsa conforme o regador) e os números do topo.
*/
function redesenhar(slot) {
  const antigo = camada.querySelector(`[data-slot="${slot}"]`);
  const plot = getPlots().find((item) => item.slot === slot);
  if (antigo && plot) trocar(antigo, montarCanteiro(plot));
  const riacho = camada.querySelector(".grove-stream");
  if (riacho) trocar(riacho, montarRiacho());
  atualizarChips();
}

function trocar(antigo, novo) {
  antigo.replaceWith(novo);
}

/* ------------------------------------------------------------------ */
/* Guardiões passeando                                                 */
/* ------------------------------------------------------------------ */

/*
  Os bichos não cuidam mais das árvores — cuidar virou coisa sua. Eles
  continuam morando aqui porque um jardim sem ninguém dentro é um cenário,
  não um lugar. Ficam entre os canteiros, e tocar neles abre quem são.
*/
function montarGuardioes() {
  return getSceneCreatures().slice(0, 6).map((criatura, indice) => {
    const base = PLOTS[(indice * 2 + 1) % PLOTS.length];
    // Lugar e movimento em grupos separados, como nos selos: a animação
    // escreve no transform e engoliria o translate que põe o bicho no
    // jardim — todos apareciam empilhados no canto de cima.
    const lugar = svgEl("g", {
      transform: `translate(${base.x + (indice % 2 ? 112 : -112)} ${base.y + 6})`,
    });
    const g = svgEl("g", {
      class: "grove-guardian",
      style: `--atraso: ${indice * 0.7}s`,
      role: "button",
      tabindex: "0",
      "aria-label": criatura.animal.name,
    });
    lugar.appendChild(g);

    /*
      Sem a classe guardian-art: ela fixa width/height em 82%, e dentro de
      um SVG a porcentagem é do viewBox inteiro — o bicho virava um monstro
      de 800 unidades cobrindo o jardim. Aqui o tamanho vem dos atributos.
    */
    const arte = createGuardianArt(criatura.animal.id);
    arte.removeAttribute("class");
    arte.setAttribute("x", -32);
    arte.setAttribute("y", -62);
    arte.setAttribute("width", 64);
    arte.setAttribute("height", 64);
    g.append(svgEl("ellipse", { cx: 0, cy: 2, rx: 24, ry: 7, class: "grove-guardian-shadow" }), arte);

    if (criatura.pendingDiscovery) {
      g.appendChild(svgEl("circle", { cx: 24, cy: -58, r: 9, class: "grove-guardian-gift" }));
    }

    g.addEventListener("click", () => abrirGuardiao(criatura));
    return lugar;
  });
}

/*
  A ficha do guardião: quem ele é, o que ele faz no jardim e as duas coisas
  que se fazem com ele — pedir o trabalho do dia e dar de comer. É aqui que
  o bicho deixa de ser enfeite da cena.
*/
function abrirGuardiao(criatura) {
  const { animal, habit, pendingDiscovery } = criatura;
  if (pendingDiscovery) {
    showDiscovery(pendingDiscovery, animal, () => {
      collectDiscovery(pendingDiscovery, habit);
      refresh();
    });
    return;
  }

  const trabalhador = getGuardians().find((item) => item.guardian.id === animal.id);
  const work = trabalhador?.work;
  const frutos = getGroveSummary().fruits;

  showSheet({
    title: animal.name,
    subtitle: work ? `${work.verb} · cuida de ${habit.name}` : `Cuida de ${habit.name}`,
    accent: animal.color,
    content: [
      createEl("div", {
        className: "sheet-portrait",
        children: [createEl("div", { className: "sheet-portrait-orb", children: [createGuardianArt(animal.id)] })],
      }),
      createEl("p", { className: "sheet-speech", text: `"${work?.story || getTouchLine(animal)}"` }),
      createEl("p", {
        className: "sheet-note",
        text: !work
          ? criatura.mood.label
          : trabalhador.doneToday
            ? `Já trabalhou hoje: ${trabalhador.action?.asked ? "a seu pedido" : "por conta própria"}.`
            : work.askText,
      }),
    ],
    actions: [
      work && !trabalhador.doneToday
        ? { label: `Pedir para ${work.verb.toLowerCase()}`, icon: work.icon, primary: true, onClick: () => pedirTrabalho(animal.id) }
        : null,
      frutos
        ? { label: `Alimentar (${frutos} ${frutos === 1 ? "fruto" : "frutos"})`, icon: "apple", onClick: () => abrirAlimentar(animal) }
        : null,
      { label: "Ver perfil", onClick: () => navigate(`/criatura?habit=${habit.id}`) },
    ],
  });
}

/*
  Pedir o trabalho. Com alvo a escolher (regar, proteger, adubar), abre a
  lista de árvores; sem alvo (polinizar, nutrir, abençoar), acontece direto.
*/
function pedirTrabalho(guardianId) {
  const alvos = getTargets(guardianId);
  const trabalhador = getGuardians().find((item) => item.guardian.id === guardianId);
  const precisaAlvo = ["regar", "proteger", "adubar"].includes(trabalhador?.work.id);

  if (!precisaAlvo || alvos.length <= 1) {
    concluirTrabalho(askWork(guardianId, alvos[0]?.planta.id || null));
    return;
  }

  showSheet({
    title: trabalhador.work.verb,
    subtitle: "Em qual árvore?",
    content: [
      createEl("div", {
        className: "app-list",
        children: alvos.map(({ planta, daArea, util }) => {
          const linha = createEl("button", {
            className: `app-row${util ? "" : " is-quiet"}`,
            attrs: { type: "button" },
            children: [
              createEl("div", {
                className: "app-row-body",
                children: [
                  createEl("span", { className: "app-row-name", text: planta.especie.name }),
                  createEl("span", {
                    className: "app-row-note",
                    text: [
                      planta.stage.name.toLowerCase(),
                      planta.sick ? "com larva" : planta.thirsty ? "com sede" : "em dia",
                      daArea ? "da área dele" : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }),
                ],
              }),
            ],
          });
          linha.addEventListener("click", () => {
            document.querySelector(".sheet-overlay")?.remove();
            concluirTrabalho(askWork(guardianId, planta.id));
          });
          return linha;
        }),
      }),
    ],
  });
}

function concluirTrabalho(resultado) {
  if (!resultado) {
    aviso("Não há o que fazer com isso agora.");
    return;
  }
  aviso(resultado.text);
  desenharCamada();
  atualizarChips();
}

function abrirAlimentar(animal) {
  const frutos = getGroveSummary().fruits;
  const porcoes = [1, 3, 10].filter((quanto) => quanto <= frutos);

  showSheet({
    title: `Alimentar ${animal.name}`,
    subtitle: `Cada fruto vale ${XP_POR_FRUTO} XP. Acelera a evolução — não substitui o dia cumprido.`,
    accent: animal.color,
    actions: [
      ...porcoes.map((quanto) => ({
        label: `${quanto} ${quanto === 1 ? "fruto" : "frutos"} · +${quanto * XP_POR_FRUTO} XP`,
        primary: quanto === porcoes[porcoes.length - 1],
        onClick: () => {
          const comeu = feedGuardian(animal.id, quanto);
          if (!comeu) return;
          aviso(`${animal.name} comeu ${comeu.fruits} e ganhou ${comeu.xp} XP${comeu.blessed ? " (abençoado)" : ""}.`);
          atualizarChips();
        },
      })),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Fichas                                                              */
/* ------------------------------------------------------------------ */

function fichaPlanta(planta) {
  const { stage, next, progress } = getStageProgress(planta.growth);
  const grove = getGroveSummary();

  showSheet({
    title: planta.especie.name,
    subtitle: `${stage.name}${planta.compostLeft ? " · adubada" : ""}`,
    accent: planta.especie.leaf,
    content: [
      createEl("div", {
        className: "plot-bars",
        children: [
          barra("Crescimento", progress * 100, "is-crescimento"),
          barra("Água", planta.vigor * 100, "is-agua"),
        ],
      }),
      createEl("p", {
        className: "sheet-note",
        text: planta.sick
          ? "Com larva: ela para de crescer até alguém tirar a praga. Nada do que já cresceu se perde."
          : next
            ? `Próximo estágio: ${next.name.toLowerCase()}.${planta.compostLeft ? ` Adubo vale por mais ${planta.compostLeft} ${planta.compostLeft === 1 ? "rega" : "regas"}.` : ""}`
            : `Madura. Colha os ${planta.especie.fruitName} e ela volta a florir.`,
      }),
      planta.sick ? createEl("p", { className: "sheet-note", text: quemCura() }) : null,
      createEl("p", { className: "sheet-speech", text: `"${planta.especie.story}"` }),
    ],
    actions: [
      planta.thirsty && grove.can > 0 && !planta.sick
        ? {
            label: "Regar",
            icon: "droplet",
            primary: true,
            onClick: () => {
              water(planta.id, { bonus: getTodayBonus("nutrir") });
              redesenhar(planta.slot);
            },
          }
        : null,
      planta.ripe
        ? { label: "Colher", icon: "apple", primary: true, onClick: () => { harvest(planta.id); redesenhar(planta.slot); } }
        : null,
      grove.compost > 0 && !planta.compostLeft
        ? { label: `Adubar (${grove.compost} no galpão)`, icon: "sprout", onClick: () => { useCompost(planta.id); redesenhar(planta.slot); } }
        : null,
      { label: "Arrancar", onClick: () => { uproot(planta.id); redesenhar(planta.slot); } },
    ],
  });
}

function barra(rotulo, valor, classe) {
  return createEl("div", {
    className: "plot-bar",
    children: [
      createEl("span", { className: "plot-bar-label", text: rotulo }),
      createEl("span", {
        className: "plot-bar-track",
        children: [createEl("span", { className: `plot-bar-fill ${classe}`, attrs: { style: `width: ${Math.max(3, Math.round(valor))}%` } })],
      }),
      createEl("span", { className: "plot-bar-value", text: `${Math.round(valor)}%` }),
    ],
  });
}

/*
  Escolher a muda. As espécies fechadas aparecem junto das abertas, dizendo
  o que falta — é assim que a pessoa descobre que criar um hábito de mente
  abre o ipê, sem ninguém explicar.
*/
function escolherMuda(slot) {
  const mudas = getSeedlings();
  const frutos = getGroveSummary().fruits;

  showSheet({
    title: "Plantar",
    subtitle: "Cada espécie se abre com um hábito da área dela.",
    content: [
      createEl("div", {
        className: "seedling-grid",
        children: mudas.map(({ especie, unlocked, cost }) => {
          const pode = unlocked && (cost === 0 || frutos >= cost);
          const cartao = createEl("button", {
            className: `seedling${unlocked ? "" : " is-locked"}`,
            attrs: { type: "button", style: `--folha: ${especie.leaf}` },
            children: [
              createEl("span", { className: "seedling-art" }),
              createEl("span", { className: "seedling-name", text: especie.name }),
              createEl("span", {
                className: "seedling-note",
                text: unlocked ? (cost ? `${cost} frutos` : "Grátis") : "Precisa de um hábito da área",
              }),
            ],
          });
          cartao.querySelector(".seedling-art").appendChild(createPlantArt(especie.id, unlocked ? 4 : 2, { vigor: unlocked ? 1 : 0.4 }));
          cartao.disabled = !pode;
          cartao.addEventListener("click", () => {
            if (!paySeedling(cost)) return;
            plant(slot, especie.id);
            document.querySelector(".sheet-overlay")?.remove();
            redesenhar(slot);
            aviso(`${especie.name} plantada. Agora é regar.`);
          });
          return cartao;
        }),
      }),
    ],
  });
}

function abrirGalpao() {
  const grove = getGroveSummary();
  showSheet({
    title: "Galpão",
    subtitle: `${grove.fruits} ${grove.fruits === 1 ? "fruto colhido" : "frutos colhidos"} · ${grove.compost} de adubo`,
    content: [
      createEl("div", {
        className: "shop-list",
        children: getShop().filter((item) => item.available).map((item) => {
          const botao = createEl("button", {
            className: "button button-secondary shop-buy",
            text: item.affordable ? `Comprar · ${item.cost}` : `${item.cost}`,
            attrs: { type: "button" },
          });
          botao.disabled = !item.affordable;
          botao.addEventListener("click", () => {
            buy(item.id);
            document.querySelector(".sheet-overlay")?.remove();
            // Abrir canteiro muda a quantidade de canteiros, então aqui a
            // camada inteira é remontada — mas o cenário de fundo fica.
            desenharCamada();
            atualizarChips();
          });
          return createEl("article", {
            className: "shop-row",
            children: [
              createEl("span", { className: "shop-row-icon", children: [createIcon(item.icon)] }),
              createEl("div", {
                className: "shop-row-body",
                children: [
                  createEl("span", { className: "shop-row-name", text: item.name }),
                  createEl("span", { className: "shop-row-story", text: item.note }),
                ],
              }),
              botao,
            ],
          });
        }),
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

function renderHud() {
  const grove = getGroveSummary();
  chips = createEl("div", { className: "grove-chips" });
  atualizarChips();

  /*
    O galpão fica no topo, junto dos números, e não num botão flutuante no
    rodapé: lá embaixo ele cobria o canteiro da frente, que é justamente o
    mais fácil de alcançar com o polegar.
  */
  const galpao = createEl("button", {
    className: "world-chip is-galpao",
    attrs: { type: "button", "aria-label": "Galpão" },
    children: [createEl("span", { className: "world-chip-icon", children: [createIcon("tools")] })],
  });
  galpao.addEventListener("click", abrirGalpao);

  const vazio = !grove.plants
    ? createEl("div", {
        className: "world-empty",
        children: [
          createEl("span", { className: "world-empty-title", text: "Terra pronta." }),
          createEl("span", {
            className: "world-empty-text",
            text: grove.stream
              ? "Toque num canteiro para plantar a primeira muda. Depois é só encher o regador no riacho."
              : "Cumpra um hábito hoje: é o que faz o riacho correr, e sem água nada cresce.",
          }),
        ],
      })
    : null;

  chips.appendChild(galpao);
  return createEl("div", { className: "world-hud", children: [chips, vazio] });
}

function atualizarChips() {
  if (!chips) return;
  const grove = getGroveSummary();
  const galpao = chips.querySelector(".is-galpao");
  chips.replaceChildren(
    chip("droplet", `${grove.stream}`, "riacho"),
    chip("coins", `${grove.can}/${grove.canMax}`, "regador"),
    chip("apple", `${grove.fruits}`, "frutos")
  );
  if (galpao) chips.appendChild(galpao);
}

function chip(icone, valor, rotulo) {
  return createEl("span", {
    className: `world-chip is-${rotulo}`,
    attrs: { title: rotulo },
    children: [
      createEl("span", { className: "world-chip-icon", children: [createIcon(icone)] }),
      createEl("span", { text: valor }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Efeitos                                                             */
/* ------------------------------------------------------------------ */

function animar(node, classe) {
  if (!node) return;
  node.classList.remove(classe);
  void node.getBoundingClientRect();
  node.classList.add(classe);
}

function gotas(g) {
  const chuva = svgEl("g", { class: "grove-rain" });
  for (let i = 0; i < 7; i += 1) {
    const gota = svgEl("circle", {
      cx: -36 + i * 12,
      cy: -PLANT_H + 30,
      r: 4.5,
      class: "grove-drop",
      style: `--atraso: ${i * 35}ms`,
    });
    chuva.appendChild(gota);
  }
  g.appendChild(chuva);
  setTimeout(() => chuva.remove(), 780);
}

function frutosSubindo(g, cor, quantos) {
  const voo = svgEl("g", { class: "grove-harvest" });
  for (let i = 0; i < Math.min(6, quantos); i += 1) {
    voo.appendChild(
      svgEl("circle", {
        cx: -40 + i * 16,
        cy: -PLANT_H + 70,
        r: 7,
        fill: cor,
        class: "grove-fruit-fly",
        style: `--atraso: ${i * 70}ms`,
      })
    );
  }
  g.appendChild(voo);
  setTimeout(() => voo.remove(), 1100);
}

// A fichinha que sobe do rodapé dizendo o que acabou de acontecer. Curta, e
// some sozinha: no jardim o retorno é a planta mudando, não um texto.
function aviso(texto) {
  document.querySelector(".harvest-toast")?.remove();
  const nota = createEl("div", { className: "harvest-toast", text: texto });
  document.body.appendChild(nota);
  setTimeout(() => nota.remove(), 1800);
}

export const renderHomeScreen = renderGardenScreen;
