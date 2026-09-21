// Fonte única de verdade em memória, com pub/sub simples.
// Regras de negócio (habits.js, missions.js, etc.) leem via getState()
// e escrevem via setState(); a UI apenas re-renderiza ao ser notificada.

function getInitialState() {
  return {
    user: null,
    habits: [],
    logs: [],
    plans: [],
    collected: [],
    powerUses: [],
    misses: [],
    garden: [],
    tools: [],
    treeMarks: [],

    /*
      Dados das ferramentas. Cada ferramenta desbloqueada é um app de
      verdade, com os registros da pessoa — treinos feitos, gastos,
      páginas lidas, linhas do diário. Tudo escolha ou registro real:
      nada aqui é derivado de outra coisa.
    */
    workoutPlans: [],
    workoutSessions: [],
    expenses: [],
    wishlist: [],
    journalEntries: [],
    books: [],
    readingSessions: [],

    settings: { theme: "automatico" },
    // null = tour nunca começou. Começa ao criar o primeiro hábito
    // (tour.js), e vira { step, done, skipped } a partir daí.
    tour: null,
    meta: { firstOpenedAt: null, deviceId: null },
  };
}

let state = getInitialState();
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

export function hydrate(persisted) {
  if (persisted) {
    state = { ...state, ...persisted };
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}
