(function(){
  "use strict";
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sleep=function(ms){return new Promise(function(res){setTimeout(res,reduce?0:ms)})};
  var fmt=function(n){return n.toLocaleString("zh-CN")};

  /* ---------- 导航 ---------- */
  var nav=$("#nav"),burger=$("#burger"),navMobile=$("#navMobile");
  var onScroll=function(){nav&&nav.classList.toggle("stuck",window.scrollY>8)};
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  if(burger&&navMobile){
    burger.addEventListener("click",function(){
      var open=navMobile.classList.toggle("open");
      burger.setAttribute("aria-expanded",open?"true":"false");
    });
    $$("a",navMobile).forEach(function(a){a.addEventListener("click",function(){navMobile.classList.remove("open");burger.setAttribute("aria-expanded","false")})});
  }

  /* ---------- 滚动渐入（9.2-3） ---------- */
  var revealEls=$$(".reveal");
  var revealLeft=revealEls.slice();
  function revealCheck(){
    var vh=window.innerHeight||document.documentElement.clientHeight;
    revealLeft=revealLeft.filter(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<vh*0.94&&r.bottom>0){el.classList.add("in");return false}
      return true;
    });
  }
  if("IntersectionObserver" in window&&!reduce){
    var ro=new IntersectionObserver(function(list){
      list.forEach(function(it){if(it.isIntersecting){it.target.classList.add("in");ro.unobserve(it.target)}});
    },{threshold:.14,rootMargin:"0px 0px -40px 0px"});
    revealEls.forEach(function(el){ro.observe(el)});
    /* 兜底：程序化滚动 / 锚点跳转 / 观察器未触发时仍保证可见 */
    var rTick=null;
    var onRScroll=function(){
      if(rTick)return;
      rTick=setTimeout(function(){rTick=null;revealCheck()},120);
    };
    window.addEventListener("scroll",onRScroll,{passive:true});
    window.addEventListener("resize",onRScroll);
    window.addEventListener("load",revealCheck);
    setTimeout(revealCheck,900);
  }else{revealEls.forEach(function(el){el.classList.add("in")})}

  /* ---------- 数字滚动（9.2-5） ---------- */
  function countUp(el){
    if(el.getAttribute("data-done"))return;
    el.setAttribute("data-done","1");
    var target=parseFloat(el.getAttribute("data-count"))||0;
    var suffix=el.getAttribute("data-suffix")||"";
    if(reduce){el.textContent=target+suffix;return}
    var dur=1100,t0=Date.now();
    var iv=setInterval(function(){
      var p=Math.min(1,(Date.now()-t0)/dur),e=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*e)+suffix;
      if(p>=1)clearInterval(iv);
    },16);
  }
  var counters=$$("[data-count]");
  var countLeft=counters.slice();
  function countCheck(){
    var vh=window.innerHeight||document.documentElement.clientHeight;
    countLeft=countLeft.filter(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<vh*0.92&&r.bottom>0){countUp(el);return false}
      return true;
    });
  }
  if("IntersectionObserver" in window){
    var co=new IntersectionObserver(function(list){
      list.forEach(function(it){if(it.isIntersecting){countUp(it.target);co.unobserve(it.target)}});
    },{threshold:.5});
    counters.forEach(function(el){co.observe(el)});
    window.addEventListener("scroll",function(){setTimeout(countCheck,140)},{passive:true});
    window.addEventListener("load",countCheck);
    setTimeout(countCheck,900);
  }else{counters.forEach(countUp)}

  /* ---------- Hero：Agent 工作台执行演示（9.2-1） ---------- */
  var heroSteps=$$("#heroSteps .step"),heroLog=$("#heroLog"),heroOk=$("#heroOk"),fState=$("#fState");
  var heroLogs=[
    "assess: 场景评估完成 · 已锁定设备巡检 SOP",
    "create: 创建巡检助手 Agent · 配置角色与任务边界",
    "tool: 设备系统连接器 → 返回设备运行数据",
    "deliver: 生成巡检报告与告警通知 · 按实际用量计量",
    "operate: 交付物已归档 · 关键动作可审计 + 可追溯"
  ];
  var heroFoot=[
    {t:"示例",tk:"按实际记录",c:"按实际计量",s:"规划中"},
    {t:"示例",tk:"按实际记录",c:"按实际计量",s:"执行中"},
    {t:"示例",tk:"按实际记录",c:"按实际计量",s:"执行中"},
    {t:"示例",tk:"按实际记录",c:"按实际计量",s:"生成产物"},
    {t:"示例",tk:"按实际记录",c:"按实际计量",s:"演示完成"}
  ];
  var heroTimers=[],heroStopped=false;
  function clearTimers(){heroTimers.forEach(clearTimeout);heroTimers=[]}
  function hsleep(ms){
    return new Promise(function(res){
      if(reduce||ms===0){return res()}
      heroTimers.push(setTimeout(res,ms));
    });
  }
  function typeLine(text,cls){
    return new Promise(function(res){
      var p=document.createElement("p");
      if(cls)p.className=cls;
      heroLog.querySelectorAll(".cursor").forEach(function(cursor){cursor.remove()});
      heroLog.appendChild(p);
      while(heroLog.children.length>3)heroLog.removeChild(heroLog.firstChild);
      if(reduce){p.textContent=text;return res()}
      var i=0;
      (function next(){
        p.textContent=text.slice(0,++i);
        if(i<text.length){heroTimers.push(setTimeout(next,11))}else{p.innerHTML=text+' <span class="cursor"></span>';heroTimers.push(setTimeout(res,260))}
      })();
    });
  }
  function setFoot(idx){
    var d=heroFoot[idx];
    if($("#fTime"))$("#fTime").textContent=d.t;
    if($("#fToken"))$("#fToken").textContent=d.tk;
    if($("#fCost"))$("#fCost").textContent=d.c;
    if(fState)fState.textContent=d.s;
  }
  async function heroRun(){
    if(!heroSteps.length||!heroLog)return;
    heroStopped=false;
    while(!heroStopped){
      heroLog.innerHTML="";
      heroOk&&heroOk.classList.remove("show");
      heroSteps.forEach(function(s){s.classList.remove("on","done")});
      setFoot(0);
      await hsleep(700);
      for(var i=0;i<heroSteps.length;i++){
        if(heroStopped)return;
        heroSteps[i].classList.add("on");
        setFoot(i);
        await typeLine(heroLogs[i],i===0?"":"dim");
        heroSteps[i].classList.remove("on");
        heroSteps[i].classList.add("done");
        await hsleep(260);
      }
      if(heroStopped)return;
      heroOk&&heroOk.classList.add("show");
      await hsleep(4200);
    }
  }
  if("IntersectionObserver" in window){
    var heroRunning=false;
    var ho=new IntersectionObserver(function(list){
      list.forEach(function(it){
        if(it.isIntersecting&&!heroRunning){heroRunning=true;heroStopped=false;heroRun()}
        else if(!it.isIntersecting){heroStopped=true;heroRunning=false;clearTimers()}
      });
    },{threshold:.25});
    var consoleEl=$(".console");if(consoleEl)ho.observe(consoleEl);
  }else{heroRun()}

  /* ---------- 3.5 场景超市筛选（9.2-4） ---------- */
  var tabs=$$("#marketTabs .mtab"),scenes=$$("#marketGrid .scene"),mEmpty=$("#marketEmpty"),mcats=$$(".mcat");
  var marketGrid=$("#marketGrid"),marketPanelKicker=$("#marketPanelKicker"),marketPanelTitle=$("#marketPanelTitle"),marketPanelDesc=$("#marketPanelDesc"),marketPanelNumber=$("#marketPanelNumber"),marketSwitchTimer;
  var marketCategoryLabels={all:"",doc:"文档类",ana:"分析类",flow:"流程类",talk:"沟通类",auto:"自动化类"};
  var marketCurated={
    "竞品调研周报":"all doc ana",
    "投标材料生成":"doc",
    "会议纪要":"doc",
    "工作报告":"doc",
    "合同审核报告":"all doc flow",
    "政策摘要":"doc",
    "销售数据分析":"all ana",
    "客户画像分析":"all ana talk",
    "市场洞察报告":"ana",
    "运维健康分析":"ana",
    "财务报表分析":"ana",
    "设备巡检":"all flow auto",
    "合同审批":"flow",
    "工单处理":"flow",
    "招聘评估":"all flow",
    "合规审查":"flow",
    "客户跟进":"talk",
    "简历筛选":"talk",
    "客服回复":"talk",
    "邮件助手":"talk",
    "通知推送":"talk",
    "定时巡检":"auto",
    "数据同步":"auto",
    "看板推送":"auto",
    "支付同步":"auto",
    "备份提醒":"auto"
  };
  scenes.forEach(function(s){
    var title=s.querySelector(".scene-top h4");
    var name=title?title.textContent.trim():"";
    s.dataset.curated=marketCurated[name]||"";
    s.dataset.baseLabel=(s.querySelector(".scene-cat")||{}).textContent||"";
  });
  var marketMeta={
    all:{label:"ALL SCENES",number:"01",title:"从一个明确场景开始，一站式交付你的 Agent",desc:"先选行业场景模板，再完成 Agent 创建、配置、接入与上线。"},
    doc:{label:"02 · DOCUMENTS",number:"02",title:"文档类 Agent",desc:"从资料整理到报告交付，一站式完成文档类工作。"},
    ana:{label:"03 · ANALYSIS",number:"03",title:"分析类 Agent",desc:"接入数据、生成洞察并交付可衡量的分析结果。"},
    flow:{label:"04 · WORKFLOW",number:"04",title:"流程类 Agent",desc:"连接审批、工单、巡检，支持从搭建到上线运行。"},
    talk:{label:"05 · COMMUNICATION",number:"05",title:"沟通类 Agent",desc:"让客户跟进、客服和招聘等沟通流程持续执行。"},
    auto:{label:"06 · AUTOMATION",number:"06",title:"自动化类 Agent",desc:"定时触发、跨系统同步，并持续查看运行结果。"}
  };
  function filterMarket(cat){
    var meta=marketMeta[cat]||marketMeta.all;
    if(marketGrid){
      clearTimeout(marketSwitchTimer);
      marketGrid.classList.add("is-changing");
    }
    tabs.forEach(function(t){
      var on=t.getAttribute("data-cat")===cat;
      t.classList.toggle("active",on);
      t.setAttribute("aria-selected",on?"true":"false");
    });
    var shown=0;
    scenes.forEach(function(s){
      var hit=(" "+(s.dataset.curated||"")+" ").indexOf(" "+cat+" ")>=0;
      s.dataset.viewCat=cat==="all"?(s.getAttribute("data-cat")||""):cat;
      s.classList.toggle("hide",!hit);
      if(hit){
        var catNode=s.querySelector(".scene-cat");
        if(catNode)catNode.textContent=cat==="all"?(s.dataset.baseLabel||catNode.textContent):(marketCategoryLabels[cat]||catNode.textContent);
        s.style.setProperty("--market-index",shown);
        shown++;
      }
    });
    if(mEmpty)mEmpty.hidden=shown>0;
    if(marketPanelKicker)marketPanelKicker.textContent=meta.label+" · "+shown;
    if(marketPanelTitle)marketPanelTitle.textContent=meta.title;
    if(marketPanelDesc)marketPanelDesc.textContent=meta.desc;
    if(marketPanelNumber)marketPanelNumber.textContent=meta.number;
    if(marketGrid)marketSwitchTimer=setTimeout(function(){marketGrid.classList.remove("is-changing")},120);
  }
  tabs.forEach(function(t){t.addEventListener("click",function(){filterMarket(t.getAttribute("data-cat"))})});
  mcats.forEach(function(m){m.addEventListener("click",function(){
    var c=m.getAttribute("data-cat");filterMarket(c);
    var g=$("#marketGrid");if(g)g.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  })});
  filterMarket("all");

  /* ---------- 9.3-1 场景模拟器 ---------- */
  var simInput=$("#simInput"),simRun=$("#simRun"),simTrack=$("#simTrack"),simState=$("#simState"),simTitle=$("#simTitle");
  var presets=$$("#simPresets .sim-preset");
  var presetNames={"巡检":"定时设备巡检","竞品":"竞品调研周报","合同":"合同审核","简历":"招聘筛选","销售":"销售数据分析"};
  function has(s,keys){return keys.some(function(k){return s.indexOf(k)>=0})}
  function buildPlan(text){
    var s=text||"",steps=[],name="自定义 Agent 任务";
    Object.keys(presetNames).forEach(function(k){if(s.indexOf(k)>=0)name=presetNames[k]});
    var timed=has(s,["定时","每天","每周","每月","每日","计划","巡检"]);
    steps.push({t:"评估场景，拆解为可执行步骤",d:"planner · 目标约束 + SOP · 目标→计划"});
    if(timed)steps.push({t:"注册定时 / 事件触发，到点自动执行",d:"trigger · 定时任务 / 事件驱动"});
    if(has(s,["设备","系统","数据库","生产","运维","指标","支付","账"]))steps.push({t:"连接业务系统采集数据",d:"tool · 业务系统连接器"});
    if(has(s,["竞品","市场","外部","网页","行业动态","抓取"]))steps.push({t:"抓取外部信息并去重清洗",d:"tool · 检索 + 数据清洗"});
    if(has(s,["简历","文档","合同","文件","资料","材料","试卷","公文","政策","会议"]))steps.push({t:"读取并解析文档，抽取关键字段",d:"knowledge · 企业文档解析 + 字段抽取"});
    steps.push({t:"知识增强检索（关键词 + 语义向量，结果融合 + 模型重排）",d:"knowledge · 企业知识库 / SOP / 规则 / 证据"});
    if(has(s,["分析","统计","画像","趋势","预测","对比","洞察","异常","阈值","风险","评分","匹配","批改"]))steps.push({t:"按规则与模型完成分析判断",d:"reasoning · 按能力配置的模型路由"});
    var out=has(s,["报告","周报","日报","纪要","清单","摘要","评估","文案","看板","表","工单","草稿","画像"])?"生成结构化产物（报告 / 清单 / 表格）":"生成任务产物并模板化排版";
    steps.push({t:out,d:"model · 按任务能力配置的模型 · 模板渲染"});
    if(has(s,["外发","发送","客户","推送","邮件","飞书","企微","钉钉","群","通知"]))steps.push({t:"高风险外发 → 触发审批，通过后推送渠道",d:"approval + channel · 飞书 / 企微 / 钉钉"});
    steps.push({t:"产物归档，记录 token / 耗时 / 费用 / 运行事件",d:"audit · 可追踪·可对账·可审计"});
    return {name:name,steps:steps.slice(0,7)};
  }
  var simBusy=false;
  async function runSim(){
    if(!simTrack||simBusy)return;
    simBusy=true;
    var plan=buildPlan((simInput&&simInput.value||"").trim());
    if(simTitle)simTitle.textContent=plan.name+" · 交付计划";
    simTrack.innerHTML="";
    var nodes=plan.steps.map(function(st,i){
      var d=document.createElement("div");
      d.className="sim-node";
      d.innerHTML='<span class="n">'+(i+1)+'</span><span><b></b><span></span></span>';
      d.querySelector("b").textContent=st.t;
      d.querySelectorAll("span span")[0].textContent=st.d;
      simTrack.appendChild(d);
      return d;
    });
    function state(txt,cls){if(simState){simState.textContent=txt;simState.className="sim-state"+(cls?" "+cls:"")}}
    state("规划中","run");
    await sleep(500);
    state("执行中","run");
    for(var i=0;i<nodes.length;i++){
      nodes[i].classList.add("on");
      await sleep(reduce?0:620);
      nodes[i].classList.remove("on");
      nodes[i].classList.add("done");
    }
    state("已交付","ok");
    simBusy=false;
  }
  if(simRun)simRun.addEventListener("click",runSim);
  presets.forEach(function(p){p.addEventListener("click",function(){
    if(simInput)simInput.value=p.getAttribute("data-t")||"";
    runSim();
  })});

  /* ---------- 9.3-3 成本计算器 ---------- */
  var cA=$("#cAgents"),cT=$("#cTasks"),cM=$("#cTier");
  var tiers=[{n:"低成本",u:.35},{n:"平衡主力",u:.86},{n:"高质量",u:2.4}];
  var SEAT=49;
  function calc(){
    if(!cA||!cT||!cM)return;
    var a=+cA.value,t=+cT.value,m=tiers[+cM.value]||tiers[1];
    var run=t*m.u,seat=a*SEAT,total=run+seat,save=Math.round(total*.18);
    if($("#oAgents"))$("#oAgents").textContent=a+" 个";
    if($("#oTasks"))$("#oTasks").textContent=fmt(t)+" 次";
    if($("#oTier"))$("#oTier").textContent=m.n;
    if($("#cTotal"))$("#cTotal").textContent="¥"+fmt(Math.round(total));
    if($("#cRun"))$("#cRun").textContent="¥"+fmt(Math.round(run));
    if($("#cSeat"))$("#cSeat").textContent="¥"+fmt(seat);
    if($("#cAgentN"))$("#cAgentN").textContent=a;
    if($("#cUnit"))$("#cUnit").textContent="¥"+m.u.toFixed(2);
    if($("#cSave"))$("#cSave").textContent="约 ¥"+fmt(save);
    var plan,why;
    if(a<=3&&t<=500){plan="推荐：基础方案";why="适合先用一个明确场景跑通交付闭环，实际能力与用量按套餐配置。"}
    else if(a<=20&&t<=5000){plan="推荐：专业版";why="适合团队正式使用，提供更完整的模型、审批、用量与运营能力。"}
    else{plan="推荐：企业版";why="适合规模化部署，支持按企业需求配置审批、集成、模型与成本管理。"}
    if($("#cPlan"))$("#cPlan").textContent=plan;
    if($("#cPlanWhy"))$("#cPlanWhy").textContent=why;
  }
  [cA,cT,cM].forEach(function(el){if(el)el.addEventListener("input",calc)});
  calc();

  /* ---------- 9.3-2 行业诊断器 ---------- */
  var quiz=$("#quiz"),result=$("#quizResult"),diagSide=$("#diagSide"),bar=$$("#quizBar i");
  var qs=$$(".q",quiz||document);
  var answers={cat:null,load:null,channel:null,risk:null,speed:null};
  var cur=0;
  var sceneMap={
    doc:{n:"文档类",s:["竞品调研周报","会议纪要","合同审核报告"]},
    ana:{n:"分析类",s:["销售数据分析","客户画像分析","运维健康分析"]},
    flow:{n:"流程类",s:["设备巡检","工单处理","合规审查"]},
    talk:{n:"沟通类",s:["简历筛选","客户跟进","客服回复"]},
    auto:{n:"自动化类",s:["定时巡检","数据同步","看板推送"]}
  };
  var loadTxt={
    heavy:"这类工作已由固定岗位专人承担，适合先做“接管型”Agent：把稳定 SOP 固化下来，人只做审核与例外处理。",
    spread:"工作分散在多人手上，建议先统一产物模板与口径，再由 Agent 集中执行，避免重复口径不一。",
    outsource:"外包环节成本与质量不稳定，可把可标准化的部分收回平台内执行，并保留完整审计证据。",
    none:"长期无人负责的工作最适合交给定时触发的 Agent，先把产物跑出来，再逐步迭代规则。"
  };
  var riskTxt={
    high:"任务涉及对外发送，建议开启高风险审批：Agent 生成、人工确认后再外发，全程留痕可追溯。",
    mid:"偶发外发场景建议设置阈值审批，超出范围自动转人工确认。",
    low:"纯内部任务可先不开审批，用运行审计与任务日志兜底，后续按需收紧。"
  };
  var planTxt={
    pilot:"建议起步：基础方案，先用一个明确场景跑通交付闭环。",
    rollout:"建议起步：专业版，按部门场景逐步推广 Agent。",
    scale:"建议起步：企业版，按企业规模配置部署、审批与成本管理。"
  };
  function goto(i){
    cur=Math.max(0,Math.min(qs.length-1,i));
    qs.forEach(function(q,k){q.classList.toggle("on",k===cur)});
    bar.forEach(function(b,k){b.classList.toggle("on",k<=cur)});
    syncNav();
  }
  function syncNav(){
    qs.forEach(function(q,k){
      var nx=$("[data-nav=next]",q);
      if(!nx)return;
      var last=k===qs.length-1;
      nx.textContent=last?"查看诊断结果":"下一题";
      nx.disabled=!hasAnswer(k);
    });
  }
  var keys=["cat","load","channel","risk","speed"];
  function hasAnswer(k){return !!answers[keys[k]]}
  function ensureNav(){
    qs.forEach(function(q,k){
      q.setAttribute("data-key",keys[k]);
      if(!$(".q-nav",q)){
        var d=document.createElement("div");
        d.className="q-nav";
        d.innerHTML='<button class="btn btn-line" type="button" data-nav="prev">上一题</button><button class="btn btn-primary" type="button" data-nav="next" disabled>下一题</button>';
        q.appendChild(d);
      }
      var pv=$("[data-nav=prev]",q),nx=$("[data-nav=next]",q);
      if(pv)pv.style.visibility=k===0?"hidden":"visible";
    });
    syncNav();
  }
  if(quiz){
    ensureNav();
    quiz.addEventListener("click",function(e){
      var opt=e.target.closest?e.target.closest(".q-opt"):null;
      if(opt){
        var q=opt.closest(".q");
        $$(".q-opt",q).forEach(function(o){o.classList.remove("sel")});
        opt.classList.add("sel");
        var key=q.getAttribute("data-key");
        answers[key]=opt.getAttribute("data-"+key)||opt.textContent.trim();
        syncNav();
        var idx=qs.indexOf(q);
        if(idx<qs.length-1)setTimeout(function(){goto(idx+1)},280);
        return;
      }
      var nb=e.target.closest?e.target.closest("[data-nav]"):null;
      if(nb){
        if(nb.getAttribute("data-nav")==="prev"){goto(cur-1)}
        else if(cur<qs.length-1){goto(cur+1)}
        else{showResult()}
      }
    });
  }
  function showResult(){
    var cat=sceneMap[answers.cat]||sceneMap.doc;
    if($("#rTitle"))$("#rTitle").textContent="建议从“"+cat.n+"”场景开始";
    var ul=$("#rScenes");
    if(ul){ul.innerHTML="";cat.s.forEach(function(s){var li=document.createElement("li");li.textContent=s;ul.appendChild(li)})}
    if($("#rDetail"))$("#rDetail").textContent=
      (loadTxt[answers.load]||"")+" "+
      "交付与提醒建议直接推送到 "+(answers.channel||"飞书")+"，让 Agent 出现在团队已有的工作流里。"+
      (riskTxt[answers.risk]||"");
    if($("#rPlan"))$("#rPlan").textContent=planTxt[answers.speed]||planTxt.pilot;
    if(quiz)quiz.style.display="none";
    if(diagSide)diagSide.style.display="none";
    if(result){result.classList.add("on");result.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"})}
  }
  /* ---------- 平台能力切换 ---------- */
  var capabilityData={
    orchestrate:{
      index:"CORE 01 / ENGINE",label:"ENGINE",code:"ORCHESTRATE",number:"01",caption:"场景评估 · 受控规划 · 交付闭环",
      title:"从场景评估到 Agent 上线的一体化编排",
      description:"覆盖场景评估、角色定义、SOP 编排、任务分派与人工审批，把明确需求转成可运行、可交付的 Agent 工作流。",
      tags:["场景评估","SOP 编排","Agent 委派","审批交付"],link:"查看搭建流程"
    },
    ground:{
      index:"CORE 02 / KNOWLEDGE",label:"KNOWLEDGE",code:"GROUND",number:"02",caption:"文档解析 · 混合检索 · 证据核验",
      title:"把企业知识配置成可交付的 Agent 能力",
      description:"通过文档解析、混合检索、模型重排与证据核验，让 Agent 在明确规则和专业语境下稳定执行，并复用可追踪的知识资产。",
      tags:["文档解析","关键词 + 向量","证据核验","模型接入"],link:"查看知识如何参与执行"
    },
    scale:{
      index:"CORE 03 / GOVERNANCE",label:"GOVERNANCE",code:"SCALE",number:"03",caption:"版本发布 · 权限审计 · 用量成本",
      title:"让 Agent 上线即用，并持续可运营",
      description:"贯通工具化发布、渠道接入与版本管理，结合 Run 账本、运行审计、用量计量、成本核算与效果评估，让 Agent 从一次交付走向长期稳定运行。",
      tags:["版本发布","运行审计","用量计量","效果评估"],link:"查看运营能力"
    }
  };
  var capabilityFocusIndex=$("#capabilityFocusIndex"),capabilityFocusLabel=$("#capabilityFocusLabel"),capabilityFocusCode=$("#capabilityFocusCode"),capabilityFocusNumber=$("#capabilityFocusNumber"),capabilityFocusCaption=$("#capabilityFocusCaption"),capabilityFocusTitle=$("#capabilityFocusTitle"),capabilityFocusDescription=$("#capabilityFocusDescription"),capabilityFocusTags=$("#capabilityFocusTags"),capabilityFocusVisual=$(".capability-focus-visual"),capabilityFocusLink=$("#capabilityFocusLink"),capabilityNext=$("#capabilityNext");
  var capabilityKeys=["orchestrate","ground","scale"],capabilityCurrent="orchestrate";
  function renderCapability(key){
    var item=capabilityData[key]||capabilityData.orchestrate;
    capabilityCurrent=key;
    if(capabilityFocusIndex)capabilityFocusIndex.textContent=item.index;
    if(capabilityFocusLabel)capabilityFocusLabel.textContent=item.label;
    if(capabilityFocusCode)capabilityFocusCode.textContent=item.code;
    if(capabilityFocusNumber)capabilityFocusNumber.textContent=item.number;
    if(capabilityFocusCaption)capabilityFocusCaption.textContent=item.caption;
    if(capabilityFocusTitle)capabilityFocusTitle.textContent=item.title;
    if(capabilityFocusDescription)capabilityFocusDescription.textContent=item.description;
    if(capabilityFocusLink)capabilityFocusLink.firstChild.nodeValue=item.link+" ";
    if(capabilityFocusTags){
      capabilityFocusTags.innerHTML="";
      item.tags.forEach(function(tag){var span=document.createElement("span");span.textContent=tag;capabilityFocusTags.appendChild(span)});
    }
    if(capabilityFocusVisual)capabilityFocusVisual.className="capability-focus-visual"+(key==="ground"?" is-ground":key==="scale"?" is-scale":"");
  }
  function moveCapability(step){
    var index=capabilityKeys.indexOf(capabilityCurrent);
    renderCapability(capabilityKeys[(index+step+capabilityKeys.length)%capabilityKeys.length]);
  }
  if(capabilityNext)capabilityNext.addEventListener("click",function(){moveCapability(1)});
  renderCapability("orchestrate");

  var again=$("#rAgain");
  if(again)again.addEventListener("click",function(){
    answers={cat:null,load:null,channel:null,risk:null,speed:null};
    $$(".q-opt",quiz).forEach(function(o){o.classList.remove("sel")});
    if(result)result.classList.remove("on");
    if(quiz)quiz.style.display="";
    if(diagSide)diagSide.style.display="";
    goto(0);
  });

  /* ---------- CTA 弹层：免费试用 / 联系销售 ---------- */
  var modalMap={trial:$("#trialModal"),sales:$("#salesModal")};
  var activeModal=null,lastModalTrigger=null;
  var trialForm=$("#trialForm"),trialSubmit=$("#trialSubmit"),trialStatus=$("#trialStatus");
  var trialFields=trialForm?$$("input[required],select[required],textarea[required]",trialForm):[];
  var customSelects=[];
  function closeCustomSelect(control){
    if(!control)return;
    control.classList.remove("is-open");
    var trigger=$(".modal-select-trigger",control),menu=$(".modal-select-menu",control);
    if(trigger)trigger.setAttribute("aria-expanded","false");
    if(menu)menu.hidden=true;
  }
  function setCustomSelectValue(control,value,focusTrigger){
    var select=$("select",control),trigger=$(".modal-select-trigger",control),label=$(".modal-select-trigger span",control);
    if(!select||!trigger||!label)return;
    select.value=value;
    var option=select.options[select.selectedIndex]||select.options[0];
    label.textContent=option?option.textContent:"";
    trigger.classList.toggle("has-value",!!value);
    $$(".modal-select-option",control).forEach(function(item){
      var selected=item.getAttribute("data-value")===value;
      item.classList.toggle("is-active",selected);
      item.setAttribute("aria-selected",selected?"true":"false");
    });
    if(focusTrigger)trigger.focus();
  }
  function openCustomSelect(control){
    customSelects.forEach(function(other){if(other!==control)closeCustomSelect(other)});
    var trigger=$(".modal-select-trigger",control),menu=$(".modal-select-menu",control);
    if(!trigger||!menu)return;
    control.classList.add("is-open");
    trigger.setAttribute("aria-expanded","true");
    menu.hidden=false;
  }
  $$('[data-select]').forEach(function(control){
    var select=$("select",control),trigger=$(".modal-select-trigger",control),menu=$(".modal-select-menu",control);
    if(!select||!trigger||!menu)return;
    Array.prototype.forEach.call(select.options,function(option){
      var item=document.createElement("div");
      item.className="modal-select-option"+(option.value?"":" is-placeholder");
      item.setAttribute("role","option");
      item.setAttribute("tabindex","-1");
      item.setAttribute("data-value",option.value);
      item.textContent=option.textContent;
      item.addEventListener("click",function(){
        setCustomSelectValue(control,option.value,false);
        closeCustomSelect(control);
        trigger.focus();
        select.dispatchEvent(new Event("change",{bubbles:true}));
      });
      menu.appendChild(item);
    });
    trigger.addEventListener("click",function(){
      if(control.classList.contains("is-open"))closeCustomSelect(control);else openCustomSelect(control);
    });
    trigger.addEventListener("keydown",function(event){
      if(event.key==="ArrowDown"||event.key==="Enter"||event.key===" "){event.preventDefault();openCustomSelect(control);}
      if(event.key==="Escape")closeCustomSelect(control);
    });
    select.addEventListener("change",function(){setCustomSelectValue(control,select.value,false)});
    customSelects.push(control);
    setCustomSelectValue(control,select.value,false);
  });
  document.addEventListener("click",function(event){
    customSelects.forEach(function(control){if(!control.contains(event.target))closeCustomSelect(control)});
  });
  function modalFocusables(modal){
    return $$("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])",modal).filter(function(el){
      return el.offsetWidth||el.offsetHeight||el.getClientRects().length;
    });
  }
  function resetTrialForm(){
    if(!trialForm)return;
    trialForm.reset();
    trialForm.removeAttribute("data-submitted");
    trialFields.forEach(function(field){
      field.removeAttribute("aria-invalid");
      var error=field.closest(".modal-field")&&$(".modal-field-error",field.closest(".modal-field"));
      if(error)error.textContent="";
    });
    customSelects.forEach(function(control){
      var select=$("select",control);
      setCustomSelectValue(control,select?select.value:"",false);
      closeCustomSelect(control);
    });
    if(trialStatus){trialStatus.textContent="";trialStatus.className="modal-form-status"}
    if(trialSubmit){trialSubmit.disabled=false;trialSubmit.classList.remove("is-loading");trialSubmit.textContent="提交申请"}
  }
  function fieldError(field){
    var wrap=field.closest(".modal-field");
    return wrap?$(".modal-field-error",wrap):null;
  }
  function validateTrialField(field){
    var value=(field.value||"").trim(),message="";
    if(field.required&&!value)message="请填写"+(field.id==="trialName"?"联系人姓名":field.id==="trialCompany"?"企业名称":"联系电话");
    if(!message&&field.id==="trialPhone"&&!/^1[3-9]\\d{9}$/.test(value))message="请输入有效的 11 位手机号码";
    var error=fieldError(field);
    if(message){
      field.setAttribute("aria-invalid","true");
      if(error)error.textContent=message;
      return false;
    }
    field.removeAttribute("aria-invalid");
    if(error)error.textContent="";
    return true;
  }
  function openLeadModal(name,trigger){
    var modal=modalMap[name];
    if(!modal)return;
    if(activeModal)closeLeadModal(activeModal);
    if(name==="trial")resetTrialForm();
    activeModal=modal;
    lastModalTrigger=trigger||document.activeElement;
    modal.hidden=false;
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
    requestAnimationFrame(function(){
      modal.classList.add("is-open");
      var target=name==="trial"?$("#trialName",modal):$(".lead-modal-close",modal);
      if(target)target.focus();
    });
  }
  function closeLeadModal(modal){
    modal=modal||activeModal;
    if(!modal)return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
    var restore=lastModalTrigger;
    activeModal=null;
    lastModalTrigger=null;
    setTimeout(function(){modal.hidden=true},reduce?0:210);
    if(restore&&document.contains(restore)&&restore.focus)restore.focus();
  }
  $$("[data-open-modal]").forEach(function(trigger){
    trigger.addEventListener("click",function(event){
      event.preventDefault();
      openLeadModal(trigger.getAttribute("data-open-modal"),trigger);
    });
  });
  /* Column pages can request the existing trial modal without landing on the CTA section. */
  var initialModalName="";
  try{
    var initialParams=window.URLSearchParams?new URLSearchParams(window.location.search):null;
    initialModalName=initialParams?initialParams.get("modal")||"":"";
  }catch(error){initialModalName=""}
  if(initialModalName==="trial"){
    if(window.history&&window.history.replaceState){
      try{window.history.replaceState(null,document.title,window.location.pathname)}catch(error){}
    }
    openLeadModal("trial",$$("[data-open-modal='trial']"));
  }
  $$("[data-modal-close]").forEach(function(closeButton){
    closeButton.addEventListener("click",function(){closeLeadModal(closeButton.closest(".lead-modal"))});
  });
  document.addEventListener("keydown",function(event){
    if(!activeModal)return;
    if(event.key==="Escape"){event.preventDefault();closeLeadModal();return}
    if(event.key!=="Tab")return;
    var focusables=modalFocusables(activeModal);
    if(!focusables.length){event.preventDefault();activeModal.querySelector(".lead-modal-panel").focus();return}
    var first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
  trialFields.forEach(function(field){
    field.addEventListener("blur",function(){validateTrialField(field)});
    field.addEventListener("input",function(){
      if(field.getAttribute("aria-invalid")==="true")validateTrialField(field);
    });
  });
  if(trialForm)trialForm.addEventListener("submit",function(event){
    event.preventDefault();
    var valid=true,firstInvalid=null;
    trialFields.forEach(function(field){
      if(!validateTrialField(field)){valid=false;if(!firstInvalid)firstInvalid=field}
    });
    if(!valid){
      if(trialStatus){trialStatus.className="modal-form-status";trialStatus.textContent="请先完善必填信息"}
      if(firstInvalid)firstInvalid.focus();
      return;
    }
    if(trialSubmit){
      trialSubmit.disabled=true;
      trialSubmit.classList.add("is-loading");
      trialSubmit.textContent="正在校验…";
    }
    setTimeout(function(){
      if(trialSubmit){trialSubmit.disabled=false;trialSubmit.classList.remove("is-loading");trialSubmit.textContent="提交申请"}
      if(trialStatus){
        trialStatus.className="modal-form-status is-success";
        trialStatus.textContent="信息已完成校验。当前页面未连接后端提交接口，内容不会实际发送。";
      }
      trialForm.setAttribute("data-submitted","true");
    },reduce?0:520);
  });
})();
