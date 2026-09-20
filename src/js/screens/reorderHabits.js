/*
  Reordenar hábitos à mão — arrastando, não por importância, horário ou
  nome. É a mesma ordem em que a pessoa pretende executá-los na rotina, e
  como nada no app reordena por conta própria (getHabits() é sempre lido na
  ordem em que está guardado), essa escolha vira a ordem de tudo: a missão
  do dia, a lista em Meus hábitos, e onde cada um mora no Lar e no Jardim.

  Lista compacta de propósito — só o essencial pra reconhecer cada hábito.
  Arrastar os cartões grandes (com árvore, frutos, ações) seria pesado e
  fácil de errar; aqui cada linha tem a mesma altura, o que faz o reordenar
  ficar previsível.
*/

import { createEl } from "../ui.js";
import { createGuardianArt } from "../guardianArt.js";
import { getHabits, reorderHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";

const ROW_HEIGHT = 60;

export function showReorderHabits(onClose) {
  const habits = getHabits();
  let order = habits.map((habit) => habit.id);
  const rows = new Map();

  const list = createEl("div", { className: "reorder-list" });

  const overlay = createEl("div", {
    className: "reorder-overlay",
    children: [
      createEl("div", {
        className: "reorder-panel",
        children: [
          createEl("div", {
            className: "reorder-head",
            children: [
              createEl("h2", { className: "card-title", text: "Reordenar hábitos" }),
              createEl("p", {
                className: "card-subtitle",
                text: "Arraste pela ordem em que pretende fazer cada um. Nada aqui muda importância nem meta — só a ordem que você vê.",
              }),
            ],
          }),
          list,
        ],
      }),
    ],
  });

  const doneButton = createEl("button", {
    className: "button button-primary button-block reorder-done",
    text: "Pronto",
    attrs: { type: "button" },
  });
  doneButton.addEventListener("click", close);
  overlay.querySelector(".reorder-panel").appendChild(doneButton);

  function close() {
    overlay.remove();
    if (onClose) onClose();
  }

  order.forEach((id) => {
    const habit = habits.find((item) => item.id === id);
    const row = renderRow(habit);
    rows.set(id, row);
    list.appendChild(row);
  });

  function renderRow(habit) {
    const companion = getCompanionState(habit);

    const row = createEl("div", {
      className: "reorder-row",
      children: [
        createEl("span", { className: "reorder-handle", attrs: { "aria-hidden": "true" }, text: "⠿" }),
        companion.animal
          ? createEl("span", {
              className: "reorder-art",
              children: [createGuardianArt(companion.animal.id)],
            })
          : null,
        createEl("span", { className: "reorder-name", text: habit.name }),
      ],
    });

    let dragging = false;
    let startY = 0;
    let startIndex = 0;
    let currentIndex = 0;
    let origIndex = new Map();

    function onPointerDown(event) {
      dragging = true;
      startY = event.clientY;
      startIndex = order.indexOf(habit.id);
      currentIndex = startIndex;
      origIndex = new Map(order.map((id, i) => [id, i]));
      row.setPointerCapture(event.pointerId);
      row.classList.add("is-dragging");
      row.style.transition = "none";
    }

    function onPointerMove(event) {
      if (!dragging) return;
      const dy = event.clientY - startY;
      row.style.transform = `translateY(${dy}px)`;

      let newIndex = startIndex + Math.round(dy / ROW_HEIGHT);
      newIndex = Math.max(0, Math.min(order.length - 1, newIndex));
      if (newIndex !== currentIndex) {
        order.splice(currentIndex, 1);
        order.splice(newIndex, 0, habit.id);
        currentIndex = newIndex;
      }

      // Todo mundo, menos quem está sendo arrastado, desliza pro lugar que
      // abriu — sem mover o DOM de verdade ainda, só o desenho.
      order.forEach((id, i) => {
        if (id === habit.id) return;
        const el = rows.get(id);
        el.style.transition = "transform 150ms ease";
        el.style.transform = `translateY(${(i - origIndex.get(id)) * ROW_HEIGHT}px)`;
      });
    }

    function onPointerUp(event) {
      if (!dragging) return;
      dragging = false;
      row.releasePointerCapture(event.pointerId);
      row.classList.remove("is-dragging");
      row.style.transition = "";
      row.style.transform = "";

      order.forEach((id) => {
        const el = rows.get(id);
        el.style.transition = "";
        el.style.transform = "";
        list.appendChild(el);
      });

      reorderHabits(order);
    }

    row.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".reorder-handle")) return;
      onPointerDown(event);
    });
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);

    return row;
  }

  document.body.appendChild(overlay);
}
