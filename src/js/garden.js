// Quem está no jardim, e como está.
//
// Os guardiões não cuidam mais das árvores — cuidar do jardim virou coisa
// sua, com regador e adubo (garden/grove.js). Eles continuam morando lá
// porque um jardim sem ninguém dentro é cenário, não lugar. O que este
// arquivo responde é só "quem aparece hoje, e de que humor".

import { getHabits } from "./habits.js";
import { isDoneToday } from "./missions.js";
import { getCompanionState } from "./companion.js";
import { getMood } from "./mood.js";
import { getPendingDiscovery } from "./discoveries.js";

export function getSceneCreatures() {
  return getHabits()
    .map((habit) => {
      const companion = getCompanionState(habit);
      if (!companion.animal) return null;
      return {
        habit,
        animal: companion.animal,
        mood: getMood(habit.id),
        done: isDoneToday(habit.id),
        pendingDiscovery: getPendingDiscovery(habit, companion.animal),
      };
    })
    .filter(Boolean);
}
