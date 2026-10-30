(() => {
  "use strict";

  const cards = [...document.querySelectorAll(".stereo-card")];
  const groups = [...document.querySelectorAll(".stereo-group")];
  const filters = document.getElementById("stereoFilters");
  const search = document.getElementById("stereoSearch");
  const result = document.getElementById("stereoResult");
  const empty = document.getElementById("stereoEmpty");
  const dialog = document.getElementById("stereoDialog");
  const viewer = document.getElementById("stereoViewerImage");
  const dialogTitle = document.getElementById("stereoDialogTitle");
  const dialogKicker = document.getElementById("stereoDialogKicker");
  const dialogCounter = document.getElementById("stereoDialogCounter");
  const matchingLink = document.getElementById("stereoMatchingLink");
  let activeStyle = "all";
  let visibleCards = cards.slice();
  let selectedIndex = 0;
  let lastTrigger = null;

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    visibleCards = cards.filter((card) => {
      const styleMatch = activeStyle === "all" || card.dataset.styleCode === activeStyle;
      const text = [card.dataset.number, card.dataset.style, card.dataset.name].join(" ").toLocaleLowerCase();
      const visible = styleMatch && (!query || text.includes(query));
      card.hidden = !visible;
      return visible;
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector(".stereo-card:not([hidden])");
    });
    filters.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeStyle));
    });
    result.textContent = "显示 " + String(visibleCards.length).padStart(2, "0") + " / " +
      String(cards.length).padStart(2, "0") + " 张立体效果图";
    empty.hidden = visibleCards.length !== 0;
  }

  function showSelected() {
    const card = visibleCards[selectedIndex];
    if (!card) return;
    viewer.src = card.dataset.full;
    viewer.alt = card.dataset.style + " · " + card.dataset.name + "立体效果图";
    dialogKicker.textContent = card.dataset.number + " / " + String(cards.length).padStart(2, "0") + " · " + card.dataset.style;
    dialogTitle.textContent = card.dataset.name;
    dialogCounter.textContent = String(selectedIndex + 1).padStart(2, "0") + " / " +
      String(visibleCards.length).padStart(2, "0");
    matchingLink.href = "index.html?design=" + encodeURIComponent(card.dataset.id) + "#gallery";
  }

  function openCard(card) {
    const index = visibleCards.indexOf(card);
    if (index < 0) return;
    selectedIndex = index;
    lastTrigger = card;
    showSelected();
    dialog.showModal();
  }

  function move(direction) {
    if (visibleCards.length < 2) return;
    selectedIndex = (selectedIndex + direction + visibleCards.length) % visibleCards.length;
    showSelected();
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeStyle = button.dataset.filter;
    applyFilters();
  });
  search.addEventListener("input", applyFilters);
  document.getElementById("stereoGroups").addEventListener("click", (event) => {
    const card = event.target.closest(".stereo-card");
    if (card) openCard(card);
  });
  document.getElementById("stereoClose").addEventListener("click", () => dialog.close());
  document.getElementById("stereoPrevious").addEventListener("click", () => move(-1));
  document.getElementById("stereoNext").addEventListener("click", () => move(1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (dialog.open && event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (dialog.open && event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (!dialog.open && event.key === "/" && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
  });

  applyFilters();
})();
