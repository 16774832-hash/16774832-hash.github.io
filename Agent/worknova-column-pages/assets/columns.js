(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");

  if (menuButton && mobileNav) {
    const closeMenu = () => {
      mobileNav.classList.remove("open");
      mobileNav.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "打开菜单");
    };
    menuButton.addEventListener("click", () => {
      const opening = mobileNav.hidden;
      mobileNav.hidden = !opening;
      mobileNav.classList.toggle("open", opening);
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.setAttribute("aria-label", opening ? "关闭菜单" : "打开菜单");
    });
    mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  const industryButtons = [...document.querySelectorAll("[data-industry-filter]")];
  const industryCards = [...document.querySelectorAll("[data-industry-card]")];
  const industryStatus = document.querySelector("[data-industry-status]");
  if (industryButtons.length && industryCards.length) {
    const filterIndustry = (industry) => {
      let visible = 0;
      industryCards.forEach((card) => {
        const show = industry === "all" || card.dataset.industryCard === industry;
        card.hidden = !show;
        if (show) visible += 1;
      });
      industryButtons.forEach((button) => {
        const selected = button.dataset.industryFilter === industry;
        button.setAttribute("aria-pressed", String(selected));
      });
      if (industryStatus) industryStatus.textContent = `当前显示 ${visible} 个行业方案方向`;
    };
    industryButtons.forEach((button) => button.addEventListener("click", () => filterIndustry(button.dataset.industryFilter)));
    filterIndustry("all");
  }

  const sceneButtons = [...document.querySelectorAll("[data-scene-filter]")];
  const sceneCards = [...document.querySelectorAll("[data-scene-card]")];
  const sceneGroups = [...document.querySelectorAll("[data-scene-group]")];
  const sceneSearch = document.querySelector("[data-scene-search]");
  const sceneStatus = document.querySelector("[data-scene-status]");
  const sceneCount = document.querySelector("[data-scene-count]");
  const sceneEmpty = document.querySelector("[data-scene-empty]");
  if (sceneCards.length) {
    let activeCategory = sceneButtons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.sceneFilter || "all";
    const animateVisibleSceneCards = () => {
      if (prefersReducedMotion) return;
      const visibleCards = sceneCards.filter((card) => !card.hidden);
      sceneCards.forEach((card) => card.classList.remove("scene-filter-enter"));
      visibleCards.forEach((card, index) => {
        card.style.setProperty("--scene-enter-delay", `${Math.min(index, 7) * 45}ms`);
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => visibleCards.forEach((card) => card.classList.add("scene-filter-enter")));
      });
    };
    const filterScenes = (shouldAnimate = false) => {
      const query = (sceneSearch?.value || "").trim().toLocaleLowerCase();
      let visible = 0;
      sceneCards.forEach((card) => {
        const categories = (card.dataset.sceneCategories || card.dataset.sceneCategory || "").split(/\s+/);
        const categoryMatch = activeCategory === "all"
          || (activeCategory === "featured" ? card.dataset.sceneFeatured === "true" : categories.includes(activeCategory));
        const textMatch = !query || card.textContent.toLocaleLowerCase().includes(query);
        const show = categoryMatch && textMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });
      sceneGroups.forEach((group) => {
        const groupHasResults = [...group.querySelectorAll("[data-scene-card]")].some((card) => !card.hidden);
        group.hidden = !groupHasResults;
      });
      if (sceneCount) sceneCount.textContent = String(visible);
      else if (sceneStatus) sceneStatus.textContent = `找到 ${visible} 个场景`;
      if (sceneEmpty) sceneEmpty.hidden = visible !== 0;
      if (shouldAnimate) animateVisibleSceneCards();
    };
    sceneButtons.forEach((button) => button.addEventListener("click", () => {
      activeCategory = button.dataset.sceneFilter;
      sceneButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      filterScenes(true);
    }));
    sceneSearch?.addEventListener("input", filterScenes);
    filterScenes();
  }

  const scenarioSimInput = document.querySelector("#scenario-sim-input");
  const scenarioSimRun = document.querySelector("#scenario-sim-run");
  const scenarioSimTrack = document.querySelector("#scenario-sim-track");
  const scenarioSimState = document.querySelector("#scenario-sim-state");
  const scenarioSimTitle = document.querySelector("#scenario-sim-title");
  const scenarioSimPresets = [...document.querySelectorAll("[data-scenario-sim-task]")];
  if (scenarioSimInput && scenarioSimRun && scenarioSimTrack && scenarioSimState) {
    const reduceMotion = prefersReducedMotion;
    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : duration));
    const hasAny = (text, keys) => keys.some((key) => text.includes(key));
    const presetNames = {
      巡检: "定时设备巡检",
      竞品: "竞品调研周报",
      合同: "合同审核",
      简历: "招聘筛选",
      销售: "销售数据分析",
    };
    const buildScenarioPlan = (text) => {
      const source = text || "";
      const steps = [];
      let name = "自定义 Agent 任务";
      Object.keys(presetNames).forEach((key) => {
        if (source.includes(key)) name = presetNames[key];
      });
      const timed = hasAny(source, ["定时", "每天", "每周", "每月", "每日", "计划", "巡检"]);
      steps.push({ title: "评估场景，拆解为可执行步骤", detail: "planner · 目标约束 + SOP · 目标→计划" });
      if (timed) steps.push({ title: "注册定时 / 事件触发，到点自动执行", detail: "trigger · 定时任务 / 事件驱动" });
      if (hasAny(source, ["设备", "系统", "数据库", "生产", "运维", "指标", "支付", "账"])) {
        steps.push({ title: "连接业务系统采集数据", detail: "tool · 业务系统连接器" });
      }
      if (hasAny(source, ["竞品", "市场", "外部", "网页", "行业动态", "抓取"])) {
        steps.push({ title: "抓取外部信息并去重清洗", detail: "tool · 检索 + 数据清洗" });
      }
      if (hasAny(source, ["简历", "文档", "合同", "文件", "资料", "材料", "试卷", "公文", "政策", "会议"])) {
        steps.push({ title: "读取并解析文档，抽取关键字段", detail: "knowledge · 企业文档解析 + 字段抽取" });
      }
      steps.push({ title: "知识增强检索（关键词 + 语义向量，结果融合 + 模型重排）", detail: "knowledge · 企业知识库 / SOP / 规则 / 证据" });
      if (hasAny(source, ["分析", "统计", "画像", "趋势", "预测", "对比", "洞察", "异常", "阈值", "风险", "评分", "匹配", "批改"])) {
        steps.push({ title: "按规则与模型完成分析判断", detail: "reasoning · 按能力配置的模型路由" });
      }
      const output = hasAny(source, ["报告", "周报", "日报", "纪要", "清单", "摘要", "评估", "文案", "看板", "表", "工单", "草稿", "画像"])
        ? "生成结构化产物（报告 / 清单 / 表格）"
        : "生成任务产物并模板化排版";
      steps.push({ title: output, detail: "model · 按任务能力配置的模型 · 模板渲染" });
      if (hasAny(source, ["外发", "发送", "客户", "推送", "邮件", "飞书", "企微", "钉钉", "群", "通知"])) {
        steps.push({ title: "高风险外发 → 触发审批，通过后推送渠道", detail: "approval + channel · 飞书 / 企微 / 钉钉" });
      }
      steps.push({ title: "产物归档，记录 token / 耗时 / 费用 / 运行事件", detail: "audit · 可追踪·可对账·可审计" });
      return { name, steps: steps.slice(0, 7) };
    };
    let scenarioSimBusy = false;
    const setScenarioSimState = (text, stateClass = "") => {
      scenarioSimState.textContent = text;
      scenarioSimState.className = `scenario-sim-state${stateClass ? ` ${stateClass}` : ""}`;
    };
    const setScenarioSimBusy = (busy) => {
      scenarioSimBusy = busy;
      scenarioSimRun.disabled = busy;
      scenarioSimRun.setAttribute("aria-busy", String(busy));
      scenarioSimPresets.forEach((preset) => {
        preset.disabled = busy;
      });
    };
    const runScenarioSimulation = async () => {
      if (scenarioSimBusy) return;
      setScenarioSimBusy(true);
      const plan = buildScenarioPlan(scenarioSimInput.value.trim());
      if (scenarioSimTitle) scenarioSimTitle.textContent = `${plan.name} · 交付计划`;
      scenarioSimTrack.innerHTML = "";
      scenarioSimTrack.setAttribute("aria-busy", "true");
      const nodes = plan.steps.map((step, index) => {
        const node = document.createElement("div");
        node.className = "scenario-sim-node";
        node.innerHTML = '<span class="scenario-sim-node-number"></span><span class="scenario-sim-node-copy"><b></b><span></span></span>';
        node.querySelector(".scenario-sim-node-number").textContent = String(index + 1);
        node.querySelector("b").textContent = step.title;
        node.querySelector(".scenario-sim-node-copy span").textContent = step.detail;
        scenarioSimTrack.appendChild(node);
        return node;
      });
      try {
        setScenarioSimState("规划中", "run");
        await wait(500);
        setScenarioSimState("执行中", "run");
        for (const node of nodes) {
          node.classList.add("on");
          await wait(620);
          node.classList.remove("on");
          node.classList.add("done");
        }
        setScenarioSimState("已交付", "ok");
      } finally {
        scenarioSimTrack.setAttribute("aria-busy", "false");
        setScenarioSimBusy(false);
      }
    };
    scenarioSimRun.addEventListener("click", runScenarioSimulation);
    scenarioSimPresets.forEach((preset) => preset.addEventListener("click", () => {
      scenarioSimPresets.forEach((item) => item.classList.toggle("is-selected", item === preset));
      scenarioSimInput.value = preset.dataset.scenarioSimTask || "";
      runScenarioSimulation();
    }));
  }

  const casesCostAgents = document.querySelector("#cases-cost-agents");
  const casesCostTasks = document.querySelector("#cases-cost-tasks");
  const casesCostTier = document.querySelector("#cases-cost-tier");
  if (casesCostAgents && casesCostTasks && casesCostTier) {
    const tiers = [
      { name: "低成本", unit: 0.35 },
      { name: "平衡主力", unit: 0.86 },
      { name: "高质量", unit: 2.4 },
    ];
    const formatNumber = (value) => new Intl.NumberFormat("zh-CN").format(value);
    const updateRangeProgress = (input) => {
      const min = Number(input.min || 0);
      const max = Number(input.max || 100);
      const value = Number(input.value);
      const progress = ((value - min) / (max - min)) * 100;
      input.style.setProperty("--range-progress", `${progress}%`);
    };
    const updateCasesCost = () => {
      const agents = Number(casesCostAgents.value);
      const tasks = Number(casesCostTasks.value);
      const tier = tiers[Number(casesCostTier.value)] || tiers[1];
      const run = tasks * tier.unit;
      const seat = agents * 49;
      const total = run + seat;
      const save = Math.round(total * 0.18);
      const setText = (selector, value) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
      };
      setText("#cases-cost-agents-output", `${agents} 个`);
      setText("#cases-cost-tasks-output", `${formatNumber(tasks)} 次`);
      setText("#cases-cost-tier-output", tier.name);
      setText("#cases-cost-total", `¥${formatNumber(Math.round(total))}`);
      setText("#cases-cost-run", `¥${formatNumber(Math.round(run))}`);
      setText("#cases-cost-seat", `¥${formatNumber(seat)}`);
      setText("#cases-cost-agent-count", String(agents));
      setText("#cases-cost-unit", `¥${tier.unit.toFixed(2)}`);
      setText("#cases-cost-save", `约 ¥${formatNumber(save)}`);
      const plan = agents <= 3 && tasks <= 500
        ? { name: "推荐：基础方案", why: "适合先用一个明确场景跑通交付闭环，实际能力与用量按套餐配置。" }
        : agents <= 20 && tasks <= 5000
          ? { name: "推荐：专业版", why: "适合团队正式使用，提供更完整的模型、审批、用量与运营能力。" }
          : { name: "推荐：企业版", why: "适合规模化部署，支持按企业需求配置审批、集成、模型与成本管理。" };
      setText("#cases-cost-plan", plan.name);
      setText("#cases-cost-plan-why", plan.why);
      [casesCostAgents, casesCostTasks, casesCostTier].forEach(updateRangeProgress);
    };
    [casesCostAgents, casesCostTasks, casesCostTier].forEach((input) => input.addEventListener("input", updateCasesCost));
    updateCasesCost();
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  revealItems.forEach((item) => {
    const siblings = item.parentElement
      ? [...item.parentElement.children].filter((child) => child.matches("[data-reveal]"))
      : [];
    const siblingIndex = siblings.indexOf(item);
    if (siblingIndex >= 0) {
      item.style.setProperty("--reveal-delay", `${Math.min(siblingIndex, 5) * 65}ms`);
    }
  });
  if ("IntersectionObserver" in window && revealItems.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const pointerSurfaces = document.querySelectorAll(".scene-market-page .hero-panel, .scene-market-page .scenario-simulator-right");
  if (!prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    pointerSurfaces.forEach((surface) => {
      let frame = 0;
      let point = { x: 50, y: 50 };
      const paintSpot = () => {
        frame = 0;
        surface.style.setProperty("--spot-x", `${point.x}%`);
        surface.style.setProperty("--spot-y", `${point.y}%`);
      };
      surface.addEventListener("pointerenter", () => surface.classList.add("has-pointer-spot"), { passive: true });
      surface.addEventListener("pointermove", (event) => {
        const rect = surface.getBoundingClientRect();
        point = {
          x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
          y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
        };
        if (!frame) frame = requestAnimationFrame(paintSpot);
      }, { passive: true });
      surface.addEventListener("pointerleave", () => {
        surface.classList.remove("has-pointer-spot");
        surface.style.removeProperty("--spot-x");
        surface.style.removeProperty("--spot-y");
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }, { passive: true });
    });
  }

  const factoryButtons = [...document.querySelectorAll("[data-factory-step]")];
  const factoryPanels = [...document.querySelectorAll("[data-factory-panel]")];
  const factoryStatus = document.querySelector("[data-factory-status]");
  if (factoryButtons.length && factoryPanels.length) {
    const stepNames = ["选择场景", "定义角色", "配置能力"];
    const activateFactoryStep = (step) => {
      factoryButtons.forEach((button) => {
        const selected = Number(button.dataset.factoryStep) === step;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      factoryPanels.forEach((panel) => {
        panel.hidden = Number(panel.dataset.factoryPanel) !== step;
      });
      if (factoryStatus) factoryStatus.textContent = `当前步骤：${stepNames[step]}`;
    };
    factoryButtons.forEach((button) => button.addEventListener("click", () => {
      activateFactoryStep(Number(button.dataset.factoryStep));
    }));
  }

  const pricingTable = document.querySelector(".pricing-table");
  if (pricingTable) {
    const planCells = pricingTable.querySelectorAll("thead th:nth-child(n + 2), tbody td:nth-child(n + 2)");
    planCells.forEach((cell) => {
      cell.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        pricingTable.dataset.hoverColumn = String(cell.cellIndex + 1);
      });
    });
    pricingTable.addEventListener("pointerleave", () => {
      delete pricingTable.dataset.hoverColumn;
    });
  }

  // A tiny pointer tilt gives the hero panels a sense of depth on desktop.
  // It is disabled for touch and reduced-motion users so it never competes with scrolling.
  const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (motionOK && finePointer) {
    const tiltTargets = document.querySelectorAll(".page-hero .hero-panel, .pricing-hero .pricing-logic, .industry-hero-visual");
    tiltTargets.forEach((panel) => {
      let frame = 0;
      let rotateX = 0;
      let rotateY = 0;
      const renderTilt = () => {
        frame = 0;
        panel.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0,-2px,0)`;
      };
      panel.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const rect = panel.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
        const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
        rotateY = offsetX * 3.2;
        rotateX = offsetY * -3.2;
        if (!frame) frame = window.requestAnimationFrame(renderTilt);
      });
      panel.addEventListener("pointerleave", () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        panel.style.removeProperty("transform");
      });
    });
  }
})();
