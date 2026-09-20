/*
  O jardim decorativo. As sementes em si (ganhas, gastas, disponíveis) moram
  em seeds.js — o Jardim e as Ferramentas gastam da mesma bolsa, então o
  cálculo de quanto sobra precisa ser um lugar só.

  O que foi plantado é a única coisa guardada aqui: uma escolha da pessoa,
  como collected e powerUses.
*/

import { getState, setState } from "./state.js";
import { generateId } from "./utils.js";
import { DECOR_ITEMS, getDecorItem } from "../data/decor.js";
import { getSeedsAvailable } from "./seeds.js";

export { getSeedsEarned, getSeedsSpent, getSeedsAvailable } from "./seeds.js";

export function getGarden() {
  return getState().garden;
}

// O catálogo com o que já foi possível pagar, e quantas vezes cada item já
// foi plantado — nada impede repetir uma morada ou uma árvore.
export function getCatalog() {
  const available = getSeedsAvailable();
  const garden = getGarden();
  return DECOR_ITEMS.map((item) => ({
    ...item,
    ownedCount: garden.filter((planted) => planted.itemId === item.id).length,
    affordable: available >= item.cost,
  }));
}

export function plantItem(itemId) {
  const item = getDecorItem(itemId);
  if (!item || getSeedsAvailable() < item.cost) return null;

  const planted = { id: generateId("decor"), itemId, plantedAt: new Date().toISOString() };
  setState({ garden: [...getGarden(), planted] });
  return planted;
}
