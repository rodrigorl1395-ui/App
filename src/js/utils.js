export function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDateLong(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(date);
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
