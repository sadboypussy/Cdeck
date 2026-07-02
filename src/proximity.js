/** Proximité — rails, ribbon, grille focus 3×3. */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function neighborIndexForGrid(i) {
  if (i === 4) return null;
  return i < 4 ? i : i - 1;
}

function splitSides(nodes) {
  const left = [];
  const right = [];
  nodes.forEach((node, i) => {
    (i % 2 === 0 ? left : right).push(node);
  });
  return { left, right };
}

function renderRailColumn(el, nodes, side, onSelect) {
  el.innerHTML = "";
  if (!nodes.length) {
    el.classList.remove("has-chips");
    return;
  }
  el.classList.add("has-chips");
  nodes.slice(0, 3).forEach((node) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `proximity-rail-chip proximity-rail-${side}`;
    const reason = node.reasons?.[0] ?? "";
    chip.innerHTML = `
      <span class="proximity-rail-chip-title">${escapeHtml(node.title)}</span>
      ${reason ? `<span class="proximity-rail-chip-reason">${escapeHtml(reason)}</span>` : ""}`;
    chip.addEventListener("click", () => onSelect?.(node.id));
    el.appendChild(chip);
  });
}

function renderRibbon(el, nodes, onSelect) {
  el.innerHTML = "";
  if (!nodes.length) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  nodes.slice(0, 8).forEach((node) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "proximity-ribbon-chip";
    const reason = node.reasons?.[0] ?? "";
    chip.innerHTML = `${escapeHtml(node.title)}${reason ? `<em>${escapeHtml(reason)}</em>` : ""}`;
    chip.addEventListener("click", () => onSelect?.(node.id));
    el.appendChild(chip);
  });
}

function renderFadeColumn(el, nodes, side, onSelect) {
  el.innerHTML = "";
  el.classList.toggle("has-chips", nodes.length > 0);
  if (!nodes.length) return;

  nodes.slice(0, 5).forEach((node, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `proximity-fade-chip proximity-fade-chip-${side}`;
    const fade = 0.38 + (1 - i / Math.max(nodes.length, 1)) * 0.35;
    chip.style.opacity = String(fade);
    chip.title = node.reasons?.[0] ?? node.title;
    chip.innerHTML = `<span>${escapeHtml(node.title)}</span>`;
    chip.addEventListener("click", () => onSelect?.(node.id));
    el.appendChild(chip);
  });
}

export function createProximityUI({
  railLeft,
  railRight,
  ribbon,
  gridContainer,
  fadeLeft,
  fadeRight,
  onSelect,
  onCenterClick,
}) {
  const grid = document.createElement("div");
  grid.className = "proximity-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Notes proches");

  const cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "proximity-cell";
    cell.dataset.grid = String(i);
    if (i === 4) cell.classList.add("is-center");
    grid.appendChild(cell);
    cells.push(cell);
  }
  gridContainer.appendChild(grid);

  let centerId = null;
  let slotIds = Array(8).fill(null);
  let focusIndex = 4;
  let lastView = null;

  function setFocus(i) {
    if (i < 0 || i > 8 || cells[i].disabled) return;
    focusIndex = i;
    cells.forEach((c, idx) => c.classList.toggle("is-focused", idx === focusIndex));
  }

  function moveFocus(dr, dc) {
    const r = Math.floor(focusIndex / 3) + dr;
    const c = (focusIndex % 3) + dc;
    if (r < 0 || r > 2 || c < 0 || c > 2) return;
    setFocus(r * 3 + c);
  }

  function activateCell(i) {
    if (i === 4) {
      onCenterClick?.(centerId);
      return;
    }
    const idx = neighborIndexForGrid(i);
    const id = idx !== null ? slotIds[idx] : null;
    if (id) onSelect?.(id);
  }

  function renderGrid(view) {
    centerId = view.center_id;
    const gridNodes = (view.nodes ?? []).slice(0, 8);
    let peripheral = (view.peripheral ?? []).slice(0, 8);

    if (!peripheral.length && gridNodes.length) {
      peripheral = gridNodes.map((node) => ({ ...node, _echo: true }));
    }

    slotIds = Array.from({ length: 8 }, (_, i) => gridNodes[i]?.id ?? null);

    const { left, right } = splitSides(peripheral);
    renderFadeColumn(fadeLeft, left, "left", onSelect);
    renderFadeColumn(fadeRight, right, "right", onSelect);

    cells.forEach((cell, i) => {
      cell.classList.remove("is-empty", "is-focused");
      if (i === 4) {
        cell.classList.add("is-center");
        cell.disabled = false;
        cell.innerHTML = `
          <span class="proximity-label">Note active</span>
          <span class="proximity-title">${escapeHtml(view.center_title)}</span>
          <span class="proximity-id">${escapeHtml(view.center_id)}</span>`;
        return;
      }

      cell.classList.remove("is-center");
      const nIdx = neighborIndexForGrid(i);
      const node = gridNodes[nIdx];
      if (node) {
        cell.classList.remove("is-empty");
        cell.disabled = false;
        const reason = node.reasons?.[0] ?? "";
        cell.innerHTML = `
          <span class="proximity-title">${escapeHtml(node.title)}</span>
          ${reason ? `<span class="proximity-reason">${escapeHtml(reason)}</span>` : ""}`;
      } else {
        cell.classList.add("is-empty");
        cell.disabled = true;
        cell.innerHTML = "";
      }
    });

    setFocus(4);
  }

  function render(view) {
    lastView = view;
    const gridNodes = (view.nodes ?? []).slice(0, 8);
    let peripheral = (view.peripheral ?? []).slice(0, 8);
    if (!peripheral.length && gridNodes.length > 4) {
      peripheral = gridNodes.slice(4).map((n) => ({ ...n }));
    }

    const { left, right } = splitSides(gridNodes);
    renderRailColumn(railLeft, left, "left", onSelect);
    renderRailColumn(railRight, right, "right", onSelect);

    const ribbonNodes = [
      ...gridNodes.slice(6),
      ...peripheral.filter((p) => !gridNodes.some((g) => g.id === p.id)),
    ];
    renderRibbon(ribbon, ribbonNodes, onSelect);
    renderGrid(view);
  }

  cells.forEach((cell, i) => {
    cell.addEventListener("click", () => activateCell(i));
    cell.addEventListener("mouseenter", () => {
      if (!cell.disabled) setFocus(i);
    });
  });

  function handleKey(e) {
    const moves = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = moves[e.key];
    if (delta) {
      e.preventDefault();
      moveFocus(delta[0], delta[1]);
      return true;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      activateCell(focusIndex);
      return true;
    }
    return false;
  }

  return { render, handleKey, getLastView: () => lastView };
}
