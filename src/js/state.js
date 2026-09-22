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

    /*
      O jardim: canteiros plantados, o regador e o que já foi tirado do
      riacho. Só escolha da pessoa — quanta água existe, em que estágio cada
      planta está e se ela tem sede saem daqui na hora, em grove.js.
    */
    grove: null,

    /*
      O que os guardiões fizeram no jardim (uma ação por guardião por dia) e
      os frutos que você deu a eles. Escolha e acontecimento, não derivado:
      o XP que vem da fruta some se isto não ficar registrado.
    */
    guardianActions: [],
    feedings: [],

    // Dados dos apps que os guardiões destravam.
    people: [],
    routines: [],

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
    alarms: [],
    focusSessions: [],
    agendaEvents: [],
    goals: [],
    savingsGoal: null,
    savingsEntries: [],
    calorieLogs: [],

    settings: { theme: "automatico", calorieGoal: 0 },
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
