// Camada de persistência. Hoje fala com localStorage; a assinatura de
// loadState/saveState é o contrato que uma futura persistência remota
// (ex. Supabase) precisa cumprir para substituir este arquivo sem
// alterar state.js nem a UI.

const STORAGE_KEY = "pocket-habits:state:v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("[storage] falha ao carregar estado", err);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[storage] falha ao salvar estado", err);
  }
}
