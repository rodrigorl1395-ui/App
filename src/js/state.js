// Fonte única de verdade em memória, com pub/sub simples.
// Regras de negócio (habits.js, missions.js, etc.) leem via getState()
// e escrevem via setState(); a UI apenas re-renderiza ao ser notificada.

function getInitialState() {
  return {
    user: null,
    habits: [],
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
