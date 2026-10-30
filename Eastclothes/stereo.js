(() => {
  "use strict";

  const allItems = window.EASTAI_CATALOG || [];
  const items = allItems.filter((item) => Number(item.styleCode) >= 1 && Number(item.styleCode) <= 6);
  const styles = [...new Map(items.map((item) => [item.styleCode, item.style])).entries()]
    .map(([code, name]) => ({ code, name, items: items.filter((item) => item.styleCode === code) }));
  const filters = document.getElementById("stereoFilters");
  const search = document.getElementById("stereoSearch");
  const result = document.getElementById("stereoResult");
  const empty = document.getElementById("stereoEmpty");
  const groups = document.getElementById("stereoGroups");
  const dialog = document.getElementById("stereoDialog");
  const viewer = document.getElementById("stereoViewerImage");
  const dialogTitle = document.getElementById("stereoDialogTitle");
  const dialogKicker = document.getElementById("stereoDialogKicker");
  const dialogCounter = document.getElementById("stereoDialogCounter");
  const matchingLink = document.getElementById("stereoMatchingLink");
  let activeStyle = "all";
  let visibleItems = items.slice();
  let selectedIndex = 0;
  let lastTrigger = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function renderFilters() {
    const definitions = [{ code: "all", name: "全部风格", count: items.length }]
      .concat(styles.map((style) => ({ code: style.code, name: style.name, count: style.items.length })));
    filters.innerHTML = definitions.map((entry) =>
      '<button class="filter-button" type="button" data-filter="' + escapeHtml(entry.code) + '" aria-pressed="' +
      String(entry.code === activeStyle) + '">' + escapeHtml(entry.name) +
      '<span class="filter-count">' + String(entry.count).padStart(2, "0") + "</span></button>"
    ).join("");
  }

  function cardMarkup(item) {
    const full = "assets/stereo-mockups/" + item.id + "-full.webp";
    const thumb = "assets/stereo-mockups/" + item.id + "-thumb.webp";
    const alt = item.style + " · " + item.name + "卫衣正反面效果";
    return '<article class="design-card stereo-mockup-card" data-id="' + escapeHtml(item.id) + '">' +
      '<button class="card-image-button" type="button" data-open="' + escapeHtml(item.id) + '" data-full="' + full +
      '" aria-label="放大查看第 ' + escapeHtml(item.number) + ' 套 ' + escapeHtml(item.style) + ' · ' + escapeHtml(item.name) + ' 卫衣正反面效果">' +
      '<img src="' + thumb + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async"></button>' +
      '<div class="card-main"><div class="card-title-line"><span class="card-number">' + escapeHtml(item.number) +
      '</span><h3 class="card-title">' + escapeHtml(item.name) + '</h3></div><p class="card-style">' +
      escapeHtml(item.style) + ' · 正反面组合</p></div></article>';
  }

  function renderGallery() {
    const query = search.value.trim().toLocaleLowerCase();
    visibleItems = items.filter((item) => {
      const styleMatch = activeStyle === "all" || item.styleCode === activeStyle;
      const queryMatch = !query || (item.name + " " + item.style + " " + item.number).toLocaleLowerCase().includes(query);
      return styleMatch && queryMatch;
    });
    const visibleIds = new Set(visibleItems.map((item) => item.id));
    result.textContent = "显示 " + String(visibleItems.length).padStart(2, "0") + " / " +
      String(items.length).padStart(2, "0") + " 套卫衣效果";
    empty.hidden = visibleItems.length !== 0;
    groups.hidden = visibleItems.length === 0;
    groups.innerHTML = styles.map((style, styleIndex) => {
      const matches = style.items.filter((item) => visibleIds.has(item.id));
      if (!matches.length) return "";
      return '<section class="style-group" aria-labelledby="stereo-style-' + escapeHtml(style.code) + '">' +
        '<div class="style-group-heading"><div class="style-title-wrap"><span class="style-index">' +
        escapeHtml(style.code) + " / 06</span><h2 id=\"stereo-style-" + escapeHtml(style.code) + "\">" +
        escapeHtml(style.name) + '</h2></div><span class="style-total">' + String(matches.length).padStart(2, "0") +
        ' 套卫衣效果</span></div><div class="cards-grid">' + matches.map(cardMarkup).join("") +
        "</div></section>";
    }).join("");
    filters.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeStyle));
    });
  }

  function showSelected() {
    const item = visibleItems[selectedIndex];
    if (!item) return;
    viewer.src = "assets/stereo-mockups/" + item.id + "-full.webp";
    viewer.alt = item.style + " · " + item.name + "卫衣正反面效果";
    dialogKicker.textContent = item.number + " / " + String(items.length).padStart(2, "0") + " · " + item.style;
    dialogTitle.textContent = item.name;
    dialogCounter.textContent = String(selectedIndex + 1).padStart(2, "0") + " / " +
      String(visibleItems.length).padStart(2, "0");
    matchingLink.href = "index.html?design=" + encodeURIComponent(item.id) + "#gallery";
  }

  function openItem(id, trigger) {
    const index = visibleItems.findIndex((item) => item.id === id);
    if (index < 0) return;
    selectedIndex = index;
    lastTrigger = trigger;
    showSelected();
    dialog.showModal();
  }

  function move(direction) {
    if (visibleItems.length < 2) return;
    selectedIndex = (selectedIndex + direction + visibleItems.length) % visibleItems.length;
    showSelected();
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeStyle = button.dataset.filter;
    renderGallery();
  });
  search.addEventListener("input", renderGallery);
  groups.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open]");
    if (trigger) openItem(trigger.dataset.open, trigger);
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

  renderFilters();
  renderGallery();
})();
