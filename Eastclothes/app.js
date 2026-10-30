(function () {
  "use strict";

  const items = window.EASTAI_CATALOG || [];
  const styles = [...new Set(items.map((item) => item.style))];
  const filters = document.getElementById("filters");
  const groups = document.getElementById("styleGroups");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  const search = document.getElementById("searchInput");
  const dialog = document.getElementById("detailDialog");
  const overviewGrid = document.querySelector(".overview-grid");
  const overviewDialog = document.getElementById("overviewDialog");
  const overviewViewerImage = document.getElementById("overviewViewerImage");
  const overviewDialogTitle = document.getElementById("overviewDialogTitle");
  const overviewDialogCounter = document.getElementById("overviewDialogCounter");
  const overviewButtons = [...overviewGrid.querySelectorAll("[data-overview-src]")];
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogKicker = document.getElementById("dialogKicker");
  const dialogCounter = document.getElementById("dialogCounter");
  const mockupImage = document.getElementById("mockupImage");
  const stageLabel = document.getElementById("stageLabel");
  const positionGrid = document.getElementById("positionGrid");
  const tabButtons = [...document.querySelectorAll("#viewTabs [data-view]")];
  let activeStyle = "全部";
  let visibleItems = items.slice();
  let selectedIndex = 0;
  let lastTrigger = null;
  let activeView = "combo";
  let overviewIndex = 0;
  let lastOverviewTrigger = null;
  const feedbackStorageKey = "eastai-gallery-feedback-v1";

  function readFeedback() {
    try {
      const stored = JSON.parse(localStorage.getItem(feedbackStorageKey) || "null");
      if (stored && typeof stored === "object") {
        return {
          likes: stored.likes && typeof stored.likes === "object" ? stored.likes : {},
          voteId: items.some((item) => item.id === stored.voteId) ? stored.voteId : null
        };
      }
    } catch (error) {
      // Keep the controls usable for browsers where local storage is unavailable.
    }
    return { likes: {}, voteId: null };
  }

  let feedback = readFeedback();

  function saveFeedback() {
    try {
      localStorage.setItem(feedbackStorageKey, JSON.stringify(feedback));
    } catch (error) {
      // The current page session still retains the in-memory selection.
    }
  }

  function feedbackMarkup(item) {
    const liked = Boolean(feedback.likes[item.id]);
    const voted = feedback.voteId === item.id;
    const likeCount = liked ? 1 : 0;
    const voteCount = voted ? 1 : 0;
    const title = escapeHtml(item.name);
    const id = escapeHtml(item.id);
    return '<div class="card-feedback" role="group" aria-label="本机互动计数">' +
      '<button class="feedback-button like-button' + (liked ? ' is-active' : '') + '" type="button" data-feedback="like" data-id="' + id +
      '" aria-pressed="' + String(liked) + '" aria-label="' + (liked ? '取消点赞' : '点赞') + '：' + title + '，当前 ' + likeCount + ' 赞">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>' +
      '<span>点赞</span><b class="feedback-count">' + likeCount + '</b></button>' +
      '<button class="feedback-button vote-button' + (voted ? ' is-active' : '') + '" type="button" data-feedback="vote" data-id="' + id +
      '" aria-pressed="' + String(voted) + '" aria-label="' + (voted ? '取消投票' : '投票') + '：' + title + '，当前 ' + voteCount + ' 票">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75h9.2L19 7.6v12.65H6z"/><path d="M15 3.9v4h4M9 13h7M9 16.5h7"/></svg>' +
      '<span>' + (voted ? '已投票' : '投票') + '</span><b class="feedback-count">' + voteCount + '</b></button>' +
      '</div>';
  }

  function handleFeedback(button) {
    const { feedback: kind, id } = button.dataset;
    if (!items.some((item) => item.id === id)) return;
    if (kind === "like") {
      if (feedback.likes[id]) delete feedback.likes[id];
      else feedback.likes[id] = true;
    } else if (kind === "vote") {
      feedback.voteId = feedback.voteId === id ? null : id;
    } else {
      return;
    }
    saveFeedback();
    renderGallery();
    const refreshed = groups.querySelector('[data-feedback="' + kind + '"][data-id="' + id + '"]');
    if (refreshed) refreshed.focus();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function renderFilters() {
    const definitions = [{ name: "全部", total: items.length }]
      .concat(styles.map((style) => ({ name: style, total: items.filter((item) => item.style === style).length })));
    filters.innerHTML = definitions.map((entry) =>
      '<button class="filter-button" type="button" data-filter="' + escapeHtml(entry.name) +
      '" aria-pressed="' + (entry.name === activeStyle) + '">' + escapeHtml(entry.name) +
      '<span class="filter-count">' + String(entry.total).padStart(2, "0") + "</span></button>"
    ).join("");
  }

  function cardMarkup(item) {
    const id = escapeHtml(item.id);
    const title = escapeHtml(item.name);
    const style = escapeHtml(item.style);
    const number = escapeHtml(item.number);
    return '<article class="design-card">' +
      '<button class="card-image-button" type="button" data-open="' + id + '" aria-label="查看第 ' + number + " 套 " + title + ' 的正反面效果">' +
      '<img src="' + escapeHtml(item.combo) + '" alt="' + title + ' 卫衣正反面组合效果" loading="lazy" decoding="async"></button>' +
      '<div class="card-main"><div class="card-title-line"><span class="card-number">' + number +
      '</span><h4 class="card-title">' + title + '</h4></div><p class="card-style">' + style + '</p></div>' +
      '<div class="placement-miniatures" aria-label="三个位置的图案">' +
      miniature(item.back, "背部主图", title + " 背部主图") +
      miniature(item.left, "左胸 30th", title + " 左胸 30th 图标") +
      miniature(item.right, "右胸 Eastnet", title + " 右胸 Eastnet 图标") +
      '</div>' + feedbackMarkup(item) + '<button class="card-open" type="button" data-open="' + id + '">查看整套效果<span aria-hidden="true">↗</span></button></article>';
  }

  function miniature(src, label, alt) {
    return '<div class="miniature"><img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) +
      '" loading="lazy" decoding="async"><span>' + escapeHtml(label) + "</span></div>";
  }

  function renderGallery() {
    const query = search.value.trim().toLocaleLowerCase();
    visibleItems = items.filter((item) => {
      const styleMatch = activeStyle === "全部" || item.style === activeStyle;
      const queryMatch = !query || (item.name + " " + item.style + " " + item.number).toLocaleLowerCase().includes(query);
      return styleMatch && queryMatch;
    });
    count.textContent = "显示 " + String(visibleItems.length).padStart(2, "0") + " / " + String(items.length).padStart(2, "0") + " 款";
    empty.hidden = visibleItems.length !== 0;
    groups.hidden = visibleItems.length === 0;

    const visibleStyles = styles.filter((style) => visibleItems.some((item) => item.style === style));
    groups.innerHTML = visibleStyles.map((style, styleIndex) => {
      const matches = visibleItems.filter((item) => item.style === style);
      const first = matches[0];
      return '<section class="style-group" aria-labelledby="style-' + escapeHtml(first.styleCode) + '">' +
        '<div class="style-group-heading"><div class="style-title-wrap"><span class="style-index">' +
        escapeHtml(first.styleCode) + " / " + String(styles.length).padStart(2, "0") + "</span><h3 id=\"style-" + escapeHtml(first.styleCode) + '">' +
        escapeHtml(style) + '</h3></div><span class="style-total">' + String(matches.length).padStart(2, "0") + " 款</span></div>" +
        '<div class="cards-grid">' + matches.map(cardMarkup).join("") + "</div></section>";
    }).join("");
  }

  function setView(view) {
    activeView = view;
    const item = visibleItems[selectedIndex] || items[0];
    const source = item[view];
    const names = { combo: "正面 / 背面", backMockup: "背面效果", frontMockup: "正面效果" };
    mockupImage.src = source;
    mockupImage.alt = item.name + " 卫衣" + names[view];
    stageLabel.textContent = names[view];
    tabButtons.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.view === view)));
  }

  function renderDetail() {
    const item = visibleItems[selectedIndex];
    if (!item) return;
    dialogKicker.textContent = item.number + " / " + String(items.length).padStart(2, "0") + "  ·  " + item.style;
    dialogTitle.textContent = item.name;
    dialogCounter.textContent = String(selectedIndex + 1).padStart(2, "0") + " / " + String(visibleItems.length).padStart(2, "0");
    positionGrid.innerHTML =
      positionCard(item.back, "背部主图", "平面印花") +
      positionCard(item.left, "左胸 30th", "胸前图标") +
      positionCard(item.right, "右胸 Eastnet", "胸前图标");
    document.getElementById("previousItem").disabled = visibleItems.length < 2;
    document.getElementById("nextItem").disabled = visibleItems.length < 2;
    setView(activeView);
  }

  function positionCard(src, label, tag) {
    return '<article class="position-card"><img src="' + escapeHtml(src) + '" alt="' + escapeHtml(label) +
      '" loading="lazy" decoding="async"><div class="position-card-label">' + escapeHtml(label) +
      '<span>' + escapeHtml(tag) + "</span></div></article>";
  }

  function renderOverview() {
    const button = overviewButtons[overviewIndex];
    if (!button) return;
    const thumbnail = button.querySelector("img");
    overviewViewerImage.src = button.dataset.overviewSrc;
    overviewViewerImage.alt = thumbnail ? thumbnail.alt : button.dataset.overviewTitle;
    overviewDialogTitle.textContent = button.dataset.overviewTitle;
    overviewDialogCounter.textContent = String(overviewIndex + 1).padStart(2, "0") + " / " +
      String(overviewButtons.length).padStart(2, "0");
  }

  function openOverview(button) {
    const index = overviewButtons.indexOf(button);
    if (index < 0) return;
    overviewIndex = index;
    lastOverviewTrigger = button;
    renderOverview();
    if (!overviewDialog.open) overviewDialog.showModal();
  }

  function moveOverview(direction) {
    if (!overviewButtons.length) return;
    overviewIndex = (overviewIndex + direction + overviewButtons.length) % overviewButtons.length;
    renderOverview();
  }

  function openItem(id, trigger) {
    const index = visibleItems.findIndex((item) => item.id === id);
    if (index < 0) return;
    selectedIndex = index;
    lastTrigger = trigger;
    activeView = "combo";
    renderDetail();
    if (!dialog.open) dialog.showModal();
  }

  function moveItem(direction) {
    if (!visibleItems.length) return;
    selectedIndex = (selectedIndex + direction + visibleItems.length) % visibleItems.length;
    renderDetail();
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeStyle = button.dataset.filter;
    renderFilters();
    renderGallery();
  });

  search.addEventListener("input", renderGallery);

  overviewGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-overview-src]");
    if (button) openOverview(button);
  });

  groups.addEventListener("click", (event) => {
    const feedbackButton = event.target.closest("[data-feedback]");
    if (feedbackButton) {
      handleFeedback(feedbackButton);
      return;
    }
    const button = event.target.closest("[data-open]");
    if (button) openItem(button.dataset.open, button);
  });

  tabButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
  document.getElementById("previousItem").addEventListener("click", () => moveItem(-1));
  document.getElementById("nextItem").addEventListener("click", () => moveItem(1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });
  document.getElementById("closeOverviewDialog").addEventListener("click", () => overviewDialog.close());
  document.getElementById("previousOverview").addEventListener("click", () => moveOverview(-1));
  document.getElementById("nextOverview").addEventListener("click", () => moveOverview(1));
  overviewDialog.addEventListener("click", (event) => {
    if (event.target === overviewDialog) overviewDialog.close();
  });
  overviewDialog.addEventListener("close", () => {
    if (lastOverviewTrigger && document.contains(lastOverviewTrigger)) lastOverviewTrigger.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !dialog.open && !overviewDialog.open && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
    if (overviewDialog.open && event.key === "ArrowRight") {
      event.preventDefault();
      moveOverview(1);
    }
    if (overviewDialog.open && event.key === "ArrowLeft") {
      event.preventDefault();
      moveOverview(-1);
    }
    if (dialog.open && event.key === "ArrowRight") moveItem(1);
    if (dialog.open && event.key === "ArrowLeft") moveItem(-1);
  });

  renderFilters();
  renderGallery();
  const linkedDesign = new URLSearchParams(window.location.search).get("design");
  if (linkedDesign && items.some((item) => item.id === linkedDesign)) {
    const linkedTrigger = [...groups.querySelectorAll("[data-open]")]
      .find((button) => button.dataset.open === linkedDesign);
    openItem(linkedDesign, linkedTrigger || null);
  }
})();
