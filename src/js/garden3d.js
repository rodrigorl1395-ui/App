/*
  O Jardim em 3D.

  As versões anteriores eram desenho chapado: dava para entender, mas não
  para acreditar. Aqui o jardim é um lugar de verdade — chão, canteiros de
  madeira, árvores com volume, sombra projetada e uma câmera que você gira
  com o dedo. Nada disso é enfeite solto: a árvore de cada hábito cresce em
  estágios, murcha e pende quando fica sem água, e a placa na frente diz de
  quem é o canteiro.

  Three.js mora em vendor/ em vez de vir de CDN porque o app precisa abrir
  offline. Se o WebGL não existir no aparelho, createGarden3D devolve null e
  quem chamou continua com a cena 2D — nenhum jardim é melhor que um jardim
  quebrado.
*/

import * as THREE from "./vendor/three/three.module.js";

const COR_GRAMA = 0x578a49;
const COR_TERRA = 0x4f3d2d;
const COR_MADEIRA = 0x9c7449;
const COR_MADEIRA_ESCURA = 0x6d4c2f;
const COR_TRONCO = 0x5b4a3a;

// Um número estável por texto: a mesma árvore precisa nascer igual a cada
// render, senão o jardim se reembaralha toda vez que a tela volta.
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// A cor da folha desbota junto com a sede, em vez de só ficar transparente.
function folhaComSede(hex, vigor) {
  const cor = new THREE.Color(hex);
  const seco = new THREE.Color(0x8a7a52);
  return cor.lerp(seco, (1 - vigor) * 0.65);
}

function criarPlaca(texto) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#8a6440";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

  ctx.fillStyle = "#f7efe3";
  ctx.font = "600 34px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Nome longo encolhe até caber: cortar no meio de uma palavra esconde
  // justamente o que a placa existe para dizer.
  let tamanho = 34;
  while (ctx.measureText(texto).width > canvas.width - 24 && tamanho > 16) {
    tamanho -= 2;
    ctx.font = `600 ${tamanho}px system-ui, -apple-system, Segoe UI, sans-serif`;
  }
  ctx.fillText(texto, canvas.width / 2, canvas.height / 2 - 2);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

/*
  Uma árvore. O estágio manda no porte (tronco e quantas bolhas de copa), o
  vigor manda no estado (copa menor, cor desbotada e tronco pendido). As duas
  coisas são independentes: uma árvore adulta com sede continua grande.
*/
function criarArvore(item, rng, descartaveis) {
  const grupo = new THREE.Group();
  const estagio = item.stage.stage;
  const vigor = item.vigor;

  const guardar = (recurso) => {
    descartaveis.push(recurso);
    return recurso;
  };

  if (estagio === 0) {
    // Semente: dois pares de folhas rompendo a terra. Precisa ser visível,
    // senão o canteiro recém-criado parece abandonado.
    const folha = guardar(
      new THREE.MeshStandardMaterial({
        color: folhaComSede(item.leaf, vigor),
        flatShading: true,
        roughness: 0.85,
      })
    );
    const geo = guardar(new THREE.SphereGeometry(0.1, 8, 6));
    for (const lado of [-1, 1]) {
      const broto = new THREE.Mesh(geo, folha);
      broto.scale.set(2.2, 0.5, 1.2);
      broto.position.set(lado * 0.1, 0.09, 0);
      broto.rotation.z = lado * 0.5;
      broto.castShadow = true;
      grupo.add(broto);
    }
    return grupo;
  }

  // Tronco alto e copa contida: com copa larga demais a árvore lê como
  // brócolis. A proporção aqui é a de uma árvore de quintal, não de mata.
  const altura = [0, 0.7, 1.15, 1.7, 2.2, 2.45, 2.6][estagio] ?? 0.7;
  const raioCopa = ([0, 0.34, 0.54, 0.74, 0.92, 0.99, 1.05][estagio] ?? 0.34) * (0.62 + vigor * 0.38);

  const tronco = new THREE.Mesh(
    guardar(new THREE.CylinderGeometry(altura * 0.05, altura * 0.09, altura, 7)),
    guardar(new THREE.MeshStandardMaterial({ color: COR_TRONCO, flatShading: true, roughness: 0.9 }))
  );
  tronco.position.y = altura / 2;
  tronco.castShadow = true;
  grupo.add(tronco);

  const copa = new THREE.Group();
  copa.position.y = altura + raioCopa * 0.1;

  const materialFolha = guardar(
    new THREE.MeshStandardMaterial({
      color: folhaComSede(item.leaf, vigor),
      flatShading: true,
      roughness: 0.82,
    })
  );

  // Cinco a sete bolhas irregulares: uma esfera só lê como pirulito.
  const bolhas = 4 + Math.min(3, estagio);
  for (let i = 0; i < bolhas; i += 1) {
    const escala = i === 0 ? 1 : 0.52 + rng() * 0.3;
    const bolha = new THREE.Mesh(
      guardar(new THREE.IcosahedronGeometry(raioCopa * escala, 0)),
      materialFolha
    );
    if (i > 0) {
      const angulo = (i / (bolhas - 1)) * Math.PI * 2 + rng();
      const distancia = raioCopa * (0.5 + rng() * 0.35);
      bolha.position.set(
        Math.cos(angulo) * distancia,
        (rng() - 0.45) * raioCopa * 0.7,
        Math.sin(angulo) * distancia
      );
    }
    bolha.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    bolha.castShadow = true;
    copa.add(bolha);
  }

  // Flores e frutos aparecem no fim da jornada da árvore, e também desbotam
  // com a sede: uma árvore murcha coberta de frutos contaria uma mentira.
  if (estagio >= 5) {
    const fruto = estagio >= 6;
    const material = guardar(
      new THREE.MeshStandardMaterial({
        color: fruto ? 0xe0705f : 0xf7d9e6,
        flatShading: true,
        roughness: 0.6,
        transparent: true,
        opacity: 0.4 + vigor * 0.6,
      })
    );
    const geo = guardar(new THREE.IcosahedronGeometry(raioCopa * (fruto ? 0.14 : 0.1), 0));
    for (let i = 0; i < (fruto ? 9 : 7); i += 1) {
      const enfeite = new THREE.Mesh(geo, material);
      const angulo = rng() * Math.PI * 2;
      const raio = raioCopa * (0.8 + rng() * 0.35);
      enfeite.position.set(
        Math.cos(angulo) * raio,
        (rng() - 0.5) * raioCopa * 1.1,
        Math.sin(angulo) * raio
      );
      copa.add(enfeite);
    }
  }

  grupo.add(copa);
  grupo.userData.copa = copa;

  // A sede inclina a árvore inteira, como no desenho 2D que ela substitui.
  const pendida = (1 - vigor) * 0.22;
  grupo.rotation.z = pendida * (rng() > 0.5 ? 1 : -1);
  grupo.rotation.x = pendida * 0.4;

  return grupo;
}

/*
  Um canteiro: moldura de quatro tábuas, terra dentro, a árvore no meio e a
  placa com o nome do hábito na frente.
*/
function criarCanteiro(item, descartaveis, lado = 1) {
  const grupo = new THREE.Group();
  const rng = semente(item.habit.id);
  const guardar = (recurso) => {
    descartaveis.push(recurso);
    return recurso;
  };

  const largura = 2.4;
  const fundura = 2;
  const alturaTabua = 0.26;
  const espessura = 0.16;

  const madeira = guardar(
    new THREE.MeshStandardMaterial({ color: COR_MADEIRA, flatShading: true, roughness: 0.85 })
  );
  const terra = guardar(
    new THREE.MeshStandardMaterial({ color: COR_TERRA, flatShading: true, roughness: 1 })
  );

  const tabuas = [
    [largura, espessura, 0, fundura / 2 - espessura / 2],
    [largura, espessura, 0, -fundura / 2 + espessura / 2],
    [espessura, fundura, -largura / 2 + espessura / 2, 0],
    [espessura, fundura, largura / 2 - espessura / 2, 0],
  ];

  for (const [sx, sz, x, z] of tabuas) {
    const tabua = new THREE.Mesh(guardar(new THREE.BoxGeometry(sx, alturaTabua, sz)), madeira);
    tabua.position.set(x, alturaTabua / 2, z);
    tabua.castShadow = true;
    tabua.receiveShadow = true;
    grupo.add(tabua);
  }

  const solo = new THREE.Mesh(
    guardar(new THREE.BoxGeometry(largura - espessura * 2, alturaTabua * 0.8, fundura - espessura * 2)),
    terra
  );
  solo.position.y = alturaTabua * 0.4;
  solo.receiveShadow = true;
  grupo.add(solo);

  const arvore = criarArvore(
    { stage: item.stage, vigor: item.vigor, leaf: item.leaf },
    rng,
    descartaveis
  );
  arvore.position.y = alturaTabua * 0.8;
  grupo.add(arvore);
  grupo.userData.copa = arvore.userData.copa || null;

  // Placa fincada na frente do canteiro, virada para a câmera.
  const placa = new THREE.Group();
  const estaca = new THREE.Mesh(
    guardar(new THREE.CylinderGeometry(0.035, 0.035, 0.56, 6)),
    guardar(new THREE.MeshStandardMaterial({ color: COR_MADEIRA_ESCURA, roughness: 0.9 }))
  );
  estaca.position.y = 0.28;
  estaca.castShadow = true;
  placa.add(estaca);

  const tabuleta = new THREE.Mesh(
    guardar(new THREE.BoxGeometry(1.15, 0.33, 0.05)),
    guardar(
      new THREE.MeshStandardMaterial({
        map: guardar(criarPlaca(item.habit.name)),
        roughness: 0.75,
      })
    )
  );
  tabuleta.position.y = 0.62;
  tabuleta.castShadow = true;
  placa.add(tabuleta);

  // A placa fica na quina de fora do canteiro: na de dentro, o canteiro da
  // frente tapa justamente o nome que ela existe para mostrar.
  placa.position.set(lado * largura * 0.3, 0, fundura / 2 + 0.3);
  placa.rotation.y = lado * -0.34;
  grupo.add(placa);

  // Tudo que representa este hábito responde ao toque, não só o tronco.
  grupo.traverse((node) => {
    node.userData.habitId = item.habit.id;
  });

  return grupo;
}

/*
  O que foi comprado com sementes: moradas e árvores de enfeite. Ficam em
  volta dos canteiros, nunca dentro deles — é o que mantém visível a regra
  de que enfeite não é hábito e não conta para nada.
*/
function criarEnfeite(item, descartaveis) {
  const rng = semente(item.id);
  const guardar = (recurso) => {
    descartaveis.push(recurso);
    return recurso;
  };

  if (item.kind !== "morada") {
    const arvore = criarArvore(
      { stage: { stage: 4 }, vigor: 1, leaf: item.color },
      rng,
      descartaveis
    );
    arvore.scale.setScalar(0.85);
    return arvore;
  }

  const casa = new THREE.Group();
  const escala = item.scale || 1;
  const largura = 0.8 * escala;
  const altura = 0.62 * escala;

  const parede = new THREE.Mesh(
    guardar(new THREE.BoxGeometry(largura, altura, largura * 0.85)),
    guardar(new THREE.MeshStandardMaterial({ color: item.color, flatShading: true, roughness: 0.9 }))
  );
  parede.position.y = altura / 2;
  parede.castShadow = true;
  parede.receiveShadow = true;
  casa.add(parede);

  const telhado = new THREE.Mesh(
    guardar(new THREE.ConeGeometry(largura * 0.95, altura * 0.75, 4)),
    guardar(new THREE.MeshStandardMaterial({ color: COR_MADEIRA_ESCURA, flatShading: true, roughness: 0.85 }))
  );
  telhado.position.y = altura + altura * 0.35;
  telhado.rotation.y = Math.PI / 4;
  telhado.castShadow = true;
  casa.add(telhado);

  const porta = new THREE.Mesh(
    guardar(new THREE.BoxGeometry(largura * 0.28, altura * 0.5, 0.03)),
    guardar(new THREE.MeshStandardMaterial({ color: 0x2b211a, roughness: 1 }))
  );
  porta.position.set(0, altura * 0.25, largura * 0.43);
  casa.add(porta);

  return casa;
}

// Enfeites contornam o terreno dos canteiros, em círculo, sem cair em cima
// de nenhum deles.
function posicaoDoEnfeite(index, total, raioBase) {
  const angulo = (index / Math.max(total, 1)) * Math.PI * 2 + 0.6;
  const raio = raioBase + (index % 2) * 0.7;
  return {
    x: Math.sin(angulo) * raio,
    z: Math.cos(angulo) * raio + 0.3,
    rot: -angulo + Math.PI,
  };
}

// Canteiros em fileiras de dois, afastando-se da câmera. Uma leve rotação
// por canteiro tira o alinhamento de tabuleiro sem bagunçar a leitura.
function posicaoDoCanteiro(index) {
  const coluna = index % 2;
  const fileira = Math.floor(index / 2);
  // Cada fileira entra desencontrada da anterior: alinhadas, as de trás
  // ficam escondidas atrás das da frente e o jardim vira uma parede só.
  const desencontro = fileira % 2 === 0 ? 0 : 0.95;
  return {
    x: (coluna === 0 ? -1.5 : 1.5) + desencontro,
    z: 1.6 - fileira * 2.9,
    rot: (coluna === 0 ? 1 : -1) * 0.05 + fileira * 0.02,
    lado: coluna === 0 ? -1 : 1,
  };
}


export function createGarden3D(container, { trees, decor = [], onPick }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  } catch (err) {
    console.warn("[jardim3d] WebGL indisponível", err);
    return null;
  }
  if (!renderer.getContext()) return null;

  const descartaveis = [];
  const scene = new THREE.Scene();
  // Horizonte escuro e esverdeado: o jardim é iluminado, mas continua dentro
  // de um app noturno — céu claro aqui daria um buraco branco na tela.
  const COR_HORIZONTE = 0x16241f;
  scene.background = new THREE.Color(COR_HORIZONTE);
  scene.fog = new THREE.Fog(COR_HORIZONTE, 10, 22);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = "garden-3d-canvas";
  container.appendChild(renderer.domElement);

  // Luz: um sol mais quente de lado e um céu frio por cima. É o contraste
  // entre os dois que dá relevo às bolhas da copa sem precisar de textura.
  const sol = new THREE.DirectionalLight(0xffe9c4, 2.45);
  sol.position.set(4.5, 8, 3.5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 24;
  sol.shadow.camera.left = -8;
  sol.shadow.camera.right = 8;
  sol.shadow.camera.top = 8;
  sol.shadow.camera.bottom = -8;
  sol.shadow.bias = -0.0015;
  scene.add(sol);
  scene.add(new THREE.HemisphereLight(0xa9cfee, 0x44603a, 1.45));

  const grama = new THREE.Mesh(
    new THREE.CircleGeometry(24, 56),
    new THREE.MeshStandardMaterial({ color: COR_GRAMA, roughness: 1 })
  );
  descartaveis.push(grama.geometry, grama.material);
  grama.rotation.x = -Math.PI / 2;
  grama.receiveShadow = true;
  scene.add(grama);

  /*
    Manchas de grama mais clara e mais escura, espalhadas sempre nos mesmos
    lugares. Sem elas o chão é um disco de cor chapada, e o jardim inteiro
    perde o chão de vista.
  */
  const rngChao = semente("chao-do-jardim");
  const manchaGeo = new THREE.CircleGeometry(1, 12);
  descartaveis.push(manchaGeo);
  for (const [tom, quantas] of [
    [0x5d9050, 8],
    [0x4f8043, 6],
  ]) {
    const material = new THREE.MeshStandardMaterial({ color: tom, roughness: 1 });
    descartaveis.push(material);
    for (let i = 0; i < quantas; i += 1) {
      const mancha = new THREE.Mesh(manchaGeo, material);
      const angulo = rngChao() * Math.PI * 2;
      const raio = 2.5 + rngChao() * 13;
      mancha.position.set(Math.sin(angulo) * raio, 0.008 + i * 0.001, Math.cos(angulo) * raio);
      mancha.rotation.x = -Math.PI / 2;
      mancha.scale.set(0.8 + rngChao() * 1.3, 0.8 + rngChao() * 1.1, 1);
      mancha.receiveShadow = true;
      scene.add(mancha);
    }
  }

  /*
    O enquadramento sai das posições de verdade, não de um raio chutado: com
    um canteiro só a câmera chega perto, com seis ela se afasta, e enfeites
    plantados longe puxam a moldura junto.
  */
  const centro = new THREE.Vector3();
  let raioJardim = 2.6;

  const canteiros = [];
  trees.forEach((item, index) => {
    const posicao = posicaoDoCanteiro(index);
    const canteiro = criarCanteiro(item, descartaveis, posicao.lado);
    canteiro.position.set(posicao.x, 0, posicao.z);
    canteiro.rotation.y = posicao.rot;
    scene.add(canteiro);
    canteiros.push(canteiro);
    centro.add(canteiro.position);
  });
  if (canteiros.length) centro.divideScalar(canteiros.length);

  // O terreno que os canteiros ocupam: metade da maior diagonal de canteiro
  // (1,56) somada à distância do mais afastado.
  let raioCanteiros = 1.6;
  canteiros.forEach((canteiro) => {
    const distancia = Math.hypot(canteiro.position.x - centro.x, canteiro.position.z - centro.z);
    raioCanteiros = Math.max(raioCanteiros, distancia + 1.6);
  });
  raioJardim = Math.max(raioJardim, raioCanteiros);

  // Enfeites ficam do lado de fora dos canteiros, nunca em cima deles.
  const raioEnfeites = raioCanteiros + 1.3;

  decor.forEach((item, index) => {
    const enfeite = criarEnfeite(item, descartaveis);
    const posicao = posicaoDoEnfeite(index, decor.length, raioEnfeites);
    enfeite.position.set(posicao.x, 0, posicao.z);
    enfeite.rotation.y = posicao.rot;
    scene.add(enfeite);
    const distancia = Math.hypot(posicao.x - centro.x, posicao.z - centro.z);
    raioJardim = Math.max(raioJardim, distancia + 0.5);
  });

  /*
    Câmera: gira de leve em torno do jardim ao arrastar, dentro de limites.
    Órbita livre deixaria a pessoa olhando o jardim por baixo — aqui ela só
    anda de um lado para o outro e sobe um pouco, como quem dá a volta no
    canteiro sem sair do quintal.
  */
  const alvo = new THREE.Vector3(centro.x, 1.35, centro.z);
  const orbita = { azimute: 0, polar: 1.06, distancia: 9.4 };
  const desejo = { ...orbita };

  function posicionarCamera() {
    const { azimute, polar, distancia } = orbita;
    camera.position.set(
      alvo.x + distancia * Math.sin(polar) * Math.sin(azimute),
      alvo.y + distancia * Math.cos(polar),
      alvo.z + distancia * Math.sin(polar) * Math.cos(azimute)
    );
    camera.lookAt(alvo);
  }
  posicionarCamera();

  let arrastando = false;
  let ultimoX = 0;
  let ultimoY = 0;
  let percorrido = 0;

  function onPointerDown(event) {
    arrastando = true;
    percorrido = 0;
    ultimoX = event.clientX;
    ultimoY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!arrastando) return;
    const dx = event.clientX - ultimoX;
    const dy = event.clientY - ultimoY;
    ultimoX = event.clientX;
    ultimoY = event.clientY;
    percorrido += Math.abs(dx) + Math.abs(dy);

    desejo.azimute = THREE.MathUtils.clamp(desejo.azimute - dx * 0.006, -0.62, 0.62);
    desejo.polar = THREE.MathUtils.clamp(desejo.polar + dy * 0.004, 0.72, 1.28);
  }

  function onPointerUp(event) {
    if (!arrastando) return;
    arrastando = false;
    renderer.domElement.releasePointerCapture(event.pointerId);
    // Arrastar é olhar; tocar é escolher. Sem esse limiar, girar a câmera
    // abriria o perfil de um hábito sem querer.
    if (percorrido < 8) tocar(event);
  }

  const raycaster = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();

  function tocar(event) {
    if (!onPick) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ponteiro.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ponteiro.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ponteiro, camera);
    const alvos = raycaster.intersectObjects(canteiros, true);
    const habitId = alvos.find((hit) => hit.object.userData.habitId)?.object.userData.habitId;
    if (habitId) onPick(habitId);
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);

  /*
    Enquadramento: a distância da câmera sai do tamanho do jardim e do campo
    de visão horizontal, que numa tela em pé é bem mais estreito que o
    vertical. Com distância fixa, o mesmo jardim que cabe no tablet deixa a
    câmera dentro do canteiro no celular.
  */
  function enquadrar() {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distancia = (raioJardim / Math.tan(hFov / 2)) * 0.86;
    orbita.distancia = THREE.MathUtils.clamp(distancia, 7, 26);
    desejo.distancia = orbita.distancia;
    // A névoa acompanha a distância: fixa, ela apagava o jardim inteiro
    // assim que a câmera precisava se afastar para caber mais canteiros.
    scene.fog.near = orbita.distancia * 0.95;
    scene.fog.far = orbita.distancia * 2.4;
  }

  function redimensionar() {
    const largura = container.clientWidth;
    const altura = container.clientHeight;
    if (!largura || !altura) return;
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    enquadrar();
    posicionarCamera();
  }

  const observador = new ResizeObserver(redimensionar);
  observador.observe(container);
  redimensionar();

  let frame = null;
  const inicio = performance.now();

  function animar() {
    frame = requestAnimationFrame(animar);
    const t = (performance.now() - inicio) / 1000;

    // A câmera persegue o desejo em vez de saltar: o arrasto fica com peso.
    orbita.azimute += (desejo.azimute - orbita.azimute) * 0.12;
    orbita.polar += (desejo.polar - orbita.polar) * 0.12;
    posicionarCamera();

    // Vento: a copa balança, o tronco não. É o que tira a cena do congelado.
    canteiros.forEach((canteiro, i) => {
      const copa = canteiro.userData.copa;
      if (!copa) return;
      copa.rotation.z = Math.sin(t * 0.7 + i * 1.3) * 0.035;
      copa.rotation.x = Math.cos(t * 0.5 + i) * 0.025;
    });

    renderer.render(scene, camera);
  }
  animar();

  return {
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      observador.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      descartaveis.forEach((recurso) => recurso.dispose && recurso.dispose());
      renderer.dispose();
      // Sem soltar o contexto, cada visita ao Jardim gasta um dos poucos que
      // o navegador dá, e depois de algumas o canvas simplesmente apaga.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
