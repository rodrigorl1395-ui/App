/*
  O mundo: a cena inteira do Jardim.

  Uma coisa só ocupa a tela toda — o terreno onde as árvores dos hábitos
  crescem e onde os guardiões moram. Não há mais "Lar" separado: o bicho
  come o fruto da árvore dele, então os dois vivem no mesmo lugar.

  Como roda:
    · Resolução lógica fixa (LARGURA px de largura). O canvas é ampliado
      pelo CSS, então um pixel lógico vira uns dois e meio na tela — é
      daí que vem o ar de jogo, e não de desenho vetorial esticado.
    · Camada estática (grama, trilha, cerca, enfeites, canteiros, placas)
      desenhada uma vez num canvas de memória; o laço só redesenha o que
      se mexe (árvores balançando, água, bichos, fumaça, vagalumes).
    · Doze quadros por segundo. Pixel art não precisa de sessenta, e o
      celular agradece.
*/

import {
  COR,
  bloco,
  elipse,
  rng,
  desenharGrama,
  desenharTrilha,
  desenharLago,
  desenharArbusto,
  desenharFlores,
  desenharPedra,
  desenharCogumelo,
  desenharCerca,
  desenharCanteiro,
  desenharArvore,
  desenharCasa,
  desenharCriatura,
  tomDoDia,
  aplicarTom,
  desenharVagalumes,
} from "./sprites.js";

export const LARGURA = 168;
const LINHA = 62;
const TOPO = 82;
const RODAPE = 46;
const FPS = 12;

const CORES_FLOR = ["#e8607d", "#f0c94a", "#d48ae0", "#f2f2f2", "#e88a4a"];

// A trilha é uma senoide: x depende só de y, então dá para plantar qualquer
// coisa "ao lado do caminho" sem procurar onde o caminho está.
function xDaTrilha(y) {
  return LARGURA / 2 + Math.sin(y / 74) * 26;
}

/*
  Onde cada item nasce. Os itens se alternam à esquerda e à direita da
  trilha, uma linha por item — é o que faz o caminho parecer que passa
  entre eles, em vez de eles estarem enfileirados numa grade.
*/
function posicionar(items) {
  return items.map((item, i) => {
    const y = TOPO + i * LINHA;
    const lado = i % 2 === 0 ? -1 : 1;
    const rand = rng(item.chave);
    const x = xDaTrilha(y) + lado * (30 + rand() * 8);
    return { ...item, x: Math.max(26, Math.min(LARGURA - 26, Math.round(x))), y: Math.round(y) };
  });
}

/*
  Enfeites de chão: tufos, flores, pedras, cogumelos e arbustos espalhados
  por toda a área, menos em cima da trilha e dos itens. Sem isso o gramado
  é um retângulo verde — é a sujeira miúda que faz o lugar parecer cuidado.
*/
function espalharProps(altura, ocupados) {
  const rand = rng("props");
  const props = [];
  const livre = (x, y, raio) =>
    Math.abs(x - xDaTrilha(y)) > 16 &&
    ocupados.every((o) => Math.hypot(o.x - x, o.y - y) > raio);

  for (let i = 0; i < Math.round(altura / 9); i += 1) {
    const x = 10 + rand() * (LARGURA - 20);
    const y = 16 + rand() * (altura - 40);
    if (!livre(x, y, 22)) continue;
    const sorte = rand();
    if (sorte > 0.74) props.push({ tipo: "arbusto", x, y });
    else if (sorte > 0.46) props.push({ tipo: "flores", x, y, cor: CORES_FLOR[Math.floor(rand() * CORES_FLOR.length)] });
    else if (sorte > 0.3) props.push({ tipo: "pedra", x, y });
    else if (sorte > 0.18) props.push({ tipo: "cogumelo", x, y });
  }
  return props;
}

export function createWorld(container, { trees = [], decor = [], creatures = [], onPick }) {
  const canvas = document.createElement("canvas");
  canvas.className = "world-canvas";
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const camada = document.createElement("canvas");
  const ctxEstatico = camada.getContext("2d", { alpha: false });
  ctxEstatico.imageSmoothingEnabled = false;

  const rotulos = document.createElement("div");
  rotulos.className = "world-labels";

  container.appendChild(canvas);
  container.appendChild(rotulos);

  let altura = 0;
  let escala = 1;
  let arvores = [];
  let enfeites = [];
  let props = [];
  let bichos = [];
  let lago = null;
  let alvos = [];
  let frame = null;
  let ultimo = 0;
  const inicio = performance.now();

  /* ---------------------------------------------------------------- */
  /* Montagem                                                          */
  /* ---------------------------------------------------------------- */

  function montar() {
    const larguraCaixa = container.clientWidth || LARGURA;
    const alturaCaixa = container.clientHeight || 400;
    escala = larguraCaixa / LARGURA;

    // Itens em linhas alternadas; a altura do mundo sai do último deles,
    // nunca menor que a tela — um jardim novo não pode nascer com o chão
    // pela metade.
    const itens = [
      ...trees.map((t) => ({ tipo: "arvore", chave: t.habit.id, dados: t })),
      ...decor.map((d) => ({ tipo: "enfeite", chave: d.id, dados: d })),
    ];
    const postos = posicionar(itens);

    altura = Math.max(Math.ceil(alturaCaixa / escala), TOPO + itens.length * LINHA + RODAPE);

    arvores = postos.filter((p) => p.tipo === "arvore");
    enfeites = postos.filter((p) => p.tipo === "enfeite");

    // O lago entra numa folga da trilha, do lado oposto ao item mais perto,
    // e só quando há espaço de sobra para ele não encostar em nada.
    lago = null;
    const yLago = TOPO + LINHA * 1.5;
    if (altura > yLago + 70) {
      const folga = (x) => Math.min(...postos.map((p) => Math.hypot(p.x - x, p.y - yLago)), 999);
      const candidatos = [-1, 1]
        .map((lado) => ({ x: xDaTrilha(yLago) + lado * 36, folga: 0 }))
        .map((c) => ({ ...c, folga: folga(c.x) }))
        .sort((a, b) => b.folga - a.folga);
      if (candidatos[0].folga > 30) {
        lago = { x: candidatos[0].x, y: yLago, rx: 20, ry: 11 };
      }
    }

    const ocupados = [...postos, ...(lago ? [{ x: lago.x, y: lago.y }] : [])];
    props = espalharProps(altura, ocupados);

    // Cada guardião mora em volta da árvore do hábito dele.
    bichos = creatures.map((c) => {
      const casa = arvores.find((a) => a.dados.habit.id === c.habit.id);
      const paraATrilha = casa && casa.x < LARGURA / 2 ? 1 : -1;
      const base = casa
        ? { x: casa.x + paraATrilha * 17, y: casa.y + 4 }
        : { x: LARGURA / 2, y: TOPO };
      return {
        dados: c,
        base,
        x: base.x + 10,
        y: base.y + 6,
        alvoX: base.x + 10,
        alvoY: base.y + 6,
        olhando: 1,
        espera: Math.random() * 2,
      };
    });

    canvas.width = LARGURA;
    canvas.height = altura;
    camada.width = LARGURA;
    camada.height = altura;
    canvas.style.height = `${altura * escala}px`;

    desenharEstatico();
    montarRotulos();
    montarAlvos();
  }

  function desenharEstatico() {
    const c = ctxEstatico;
    desenharGrama(c, LARGURA, altura);

    const pontos = [];
    for (let y = -10; y <= altura + 10; y += 14) pontos.push({ x: xDaTrilha(y), y });
    desenharTrilha(c, pontos);

    desenharCerca(c, -4, LARGURA + 4, 10);
    desenharCerca(c, -4, LARGURA + 4, altura - 4);

    for (const prop of props) {
      if (prop.tipo === "arbusto") desenharArbusto(c, prop.x, prop.y);
      else if (prop.tipo === "flores") desenharFlores(c, prop.x, prop.y, prop.cor);
      else if (prop.tipo === "pedra") desenharPedra(c, prop.x, prop.y);
      else desenharCogumelo(c, prop.x, prop.y);
    }

    // Canteiro embaixo de cada árvore de hábito. O nome dela é o rótulo de
    // DOM logo abaixo — desenhar uma placa aqui também seria dizer a mesma
    // coisa duas vezes, uma delas ilegível.
    for (const item of arvores) {
      desenharCanteiro(c, item.x, item.y, 13);
    }
    for (const item of enfeites) {
      if (item.dados.kind !== "morada") desenharCanteiro(c, item.x, item.y, 9);
    }
  }

  /*
    Os nomes são DOM por cima do canvas: texto desenhado pixel a pixel
    ficaria ilegível neste tamanho, e leitura vem antes de pureza estética.
  */
  function montarRotulos() {
    rotulos.replaceChildren();
    for (const item of arvores) {
      const rotulo = document.createElement("span");
      rotulo.className = "world-label";
      rotulo.textContent = item.dados.habit.name;
      rotulo.style.left = `${(item.x / LARGURA) * 100}%`;
      rotulo.style.top = `${(item.y + 13) * escala}px`;
      rotulos.appendChild(rotulo);
    }
  }

  function montarAlvos() {
    alvos = [
      ...arvores.map((item) => ({
        x: item.x,
        y: item.y - 14,
        raio: 20,
        tipo: "arvore",
        dados: item.dados,
      })),
      ...enfeites.map((item) => ({
        x: item.x,
        y: item.y - 10,
        raio: 16,
        tipo: "enfeite",
        dados: item.dados,
      })),
    ];
  }

  /* ---------------------------------------------------------------- */
  /* Laço                                                              */
  /* ---------------------------------------------------------------- */

  function passearBichos(dt, t) {
    for (const bicho of bichos) {
      if (bicho.dados.dormindo) continue;
      bicho.espera -= dt;
      if (bicho.espera <= 0) {
        const rand = Math.random;
        bicho.alvoX = bicho.base.x + (rand() - 0.5) * 34;
        bicho.alvoY = bicho.base.y + (rand() - 0.5) * 20;
        bicho.espera = 1.5 + rand() * 3;
      }
      const dx = bicho.alvoX - bicho.x;
      const dy = bicho.alvoY - bicho.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const passo = Math.min(dist, 9 * dt);
        bicho.x += (dx / dist) * passo;
        bicho.y += (dy / dist) * passo;
        bicho.olhando = dx > 0 ? 1 : -1;
      }
      bicho.andando = dist > 1;
      void t;
    }
  }

  function desenhar(t) {
    ctx.drawImage(camada, 0, 0);

    if (lago) desenharLago(ctx, lago.x, lago.y, lago.rx, lago.ry, t);

    const hora = new Date().getHours();
    const tom = tomDoDia(hora);

    /*
      Ordem de pintura pelo y: quem está mais embaixo é desenhado por
      último e aparece na frente. É o truque de profundidade dos jogos 2D
      — sem ele uma árvore do fundo passa por cima do bicho da frente.
    */
    const cena = [
      ...enfeites.map((item) => ({ y: item.y, desenhar: () => pintarEnfeite(item, t, tom.noite) })),
      ...arvores.map((item) => ({ y: item.y, desenhar: () => pintarArvore(item, t) })),
      ...bichos.map((bicho) => ({ y: bicho.y, desenhar: () => pintarBicho(bicho, t) })),
    ].sort((a, b) => a.y - b.y);

    for (const item of cena) item.desenhar();

    aplicarTom(ctx, LARGURA, altura, tom);
    if (tom.noite) desenharVagalumes(ctx, LARGURA, altura, t);
  }

  function pintarArvore(item, t) {
    const dados = item.dados;
    desenharArvore(ctx, item.x, item.y, {
      stage: dados.stage.stage,
      leaf: dados.leaf,
      vigor: dados.vigor,
      t,
      semente: dados.habit.id,
    });
    // A marca no tronco: um pixel de cor quente na casca, do lado de fora
    // do tronco para não sumir nele.
    if (dados.mark) {
      bloco(ctx, item.x + 3, item.y - 9, 2, 2, "#f0c987");
    }
  }

  function pintarEnfeite(item, t, noite) {
    const dados = item.dados;
    if (dados.kind === "morada") {
      desenharCasa(ctx, item.x, item.y, { cor: dados.color, escala: dados.scale, t, noite });
    } else {
      desenharArvore(ctx, item.x, item.y, {
        stage: 4,
        leaf: dados.color,
        vigor: 1,
        t,
        semente: dados.id,
      });
    }
  }

  function pintarBicho(bicho, t) {
    const dados = bicho.dados;
    desenharCriatura(ctx, bicho.x, bicho.y, {
      cor: dados.color,
      t,
      dormindo: dados.dormindo,
      olhando: bicho.olhando,
    });

    // Quem tem algo para entregar chama atenção — o mesmo sinal do Lar
    // antigo, agora dentro do mundo.
    if (dados.presente) {
      const pulo = Math.round(Math.sin(t * 3) * 1);
      const bx = bicho.x + 6;
      const by = bicho.y - 22 + pulo;
      bloco(ctx, bx - 5, by - 1, 10, 9, "#2b2119");
      bloco(ctx, bx - 4, by, 8, 7, "#fff6dd");
      bloco(ctx, bx - 2, by + 7, 3, 3, "#2b2119");
      bloco(ctx, bx - 1, by + 7, 2, 2, "#fff6dd");
      bloco(ctx, bx - 1, by + 1, 2, 4, "#c4453f");
      bloco(ctx, bx - 1, by + 6, 2, 1, "#c4453f");
    }
  }

  function laco(agora) {
    frame = requestAnimationFrame(laco);
    if (!canvas.isConnected) {
      destruir();
      return;
    }
    if (agora - ultimo < 1000 / FPS) return;
    const dt = Math.min(0.25, (agora - ultimo) / 1000);
    ultimo = agora;
    const t = (agora - inicio) / 1000;
    passearBichos(dt, t);
    desenhar(t);
  }

  /* ---------------------------------------------------------------- */
  /* Toque                                                             */
  /* ---------------------------------------------------------------- */

  function aoTocar(evento) {
    if (!onPick) return;
    const caixa = canvas.getBoundingClientRect();
    const x = ((evento.clientX - caixa.left) / caixa.width) * LARGURA;
    const y = ((evento.clientY - caixa.top) / caixa.height) * altura;

    // Os bichos andam, então o alvo deles é lido na hora do toque, não da
    // montagem. Eles vêm primeiro: com um bicho em cima da árvore dele,
    // quem a pessoa está mirando é o bicho.
    const moveis = bichos.map((bicho) => ({
      x: bicho.x,
      y: bicho.y - 6,
      raio: 12,
      tipo: "criatura",
      dados: bicho.dados,
    }));

    let melhor = null;
    let menor = Infinity;
    for (const alvo of [...moveis, ...alvos]) {
      const dist = Math.hypot(alvo.x - x, alvo.y - y);
      if (dist < alvo.raio && dist < menor) {
        menor = dist;
        melhor = alvo;
      }
    }
    if (melhor) onPick(melhor.tipo, melhor.dados);
  }

  canvas.addEventListener("click", aoTocar);

  const observador = new ResizeObserver(() => {
    const novaEscala = (container.clientWidth || LARGURA) / LARGURA;
    if (Math.abs(novaEscala - escala) > 0.01) montar();
  });
  observador.observe(container);

  function destruir() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    observador.disconnect();
    canvas.removeEventListener("click", aoTocar);
  }

  montar();
  frame = requestAnimationFrame(laco);

  return { destruir };
}

export { elipse, COR };
