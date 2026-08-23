/* ============================================================
   ASK THE TERMINAL — deterministic data assistant
   Answers questions strictly from the three embedded datasets
   (MACRO_DATA, EV_DATA, OEM_DATA). No network calls.
   ============================================================ */
(function () {
  // Top-level consts in the data files live in the global lexical scope,
  // not on window — reference them by name, never via window.X
  const MACRO = typeof MACRO_DATA !== "undefined" ? MACRO_DATA : null;
  const EV = typeof EV_DATA !== "undefined" ? EV_DATA : null;
  const OEM = typeof OEM_DATA !== "undefined" ? OEM_DATA : null;

  /* ---------------- aliases ---------------- */
  const COUNTRY_ALIASES = {
    "united states":"USA","usa":"USA","u.s.":"USA","us":"USA","america":"USA",
    "china":"CHN","germany":"DEU","japan":"JPN","india":"IND",
    "united kingdom":"GBR","uk":"GBR","britain":"GBR","france":"FRA","italy":"ITA",
    "canada":"CAN","south korea":"KOR","korea":"KOR","brazil":"BRA","australia":"AUS",
    "spain":"ESP","mexico":"MEX","indonesia":"IDN","netherlands":"NLD","holland":"NLD",
    "turkey":"TUR","türkiye":"TUR","turkiye":"TUR","switzerland":"CHE","saudi arabia":"SAU",
    "poland":"POL","sweden":"SWE","singapore":"SGP","south africa":"ZAF","argentina":"ARG",
    "nigeria":"NGA","egypt":"EGY","world":"WLD","global":"WLD","worldwide":"WLD",
    "norway":"NOR","denmark":"DNK","belgium":"BEL","austria":"AUT","portugal":"PRT",
    "vietnam":"VNM","thailand":"THA","new zealand":"NZL","europe":"EUR","european union":"EUR",
  };
  const OEM_ALIASES = {
    "tesla":"TESLA", "byd bev":"BYD_BEV", "byd phev":"BYD_PHEV", "byd":"BYD_BEV",
    "volkswagen group":"VW", "volkswagen":"VW", "vw":"VW",
    "bmw group":"BMW", "bmw":"BMW",
    "mercedes-benz":"MB", "mercedes":"MB", "benz":"MB",
  };

  /* ---------------- indicator index ---------------- */
  // ds: "macro" | "ev" ; ind: dataset key
  const INDICATORS = [
    { ds:"macro", ind:"gdp_growth",    syns:["gdp growth","economic growth","real growth"] },
    { ds:"macro", ind:"inflation",     syns:["inflation","cpi","consumer price","price growth"] },
    { ds:"macro", ind:"unemployment",  syns:["unemployment","jobless"] },
    { ds:"macro", ind:"gdp_per_capita",syns:["gdp per capita","income per capita","per capita income"] },
    { ds:"macro", ind:"gdp_usd",       syns:["total gdp","gdp size","economy size","gdp"] },
    { ds:"macro", ind:"population",    syns:["population","inhabitants","people"] },
    { ds:"ev",    ind:"ev_sales",      syns:["ev sales","electric car sales","electric cars sold","electric vehicle sales","evs sold"] },
    { ds:"ev",    ind:"ev_share",      syns:["ev market share","market share","ev share","ev adoption","share of new cars","electric share","adoption rate"] },
    { ds:"ev",    ind:"ev_stock",      syns:["ev fleet","fleet","ev stock","evs on the road","cars in use","electric fleet"] },
    { ds:"ev",    ind:"ev_growth",     syns:["ev sales growth","ev growth"] },
    { ds:"ev",    ind:"ev_cum",        syns:["cumulative ev","cumulative sales"] },
    { ds:"ev",    ind:"ev_per_1k",     syns:["per 1,000","per 1000","per 1k","sales intensity","ev intensity"] },
  ];
  const OEM_INDICATORS = {
    sales:  { syns:["oem sales","brand sales","manufacturer sales","maker sales"], label:"Annual sales" },
    growth: { syns:["oem growth"], label:"Sales growth" },
    share:  { syns:["oem share","maker share"], label:"Share of world plugin market" },
  };

  /* ---------------- formatting ---------------- */
  function compact(v) {
    if (v == null) return "—";
    const a = Math.abs(v);
    if (a >= 1e12) return (v/1e12).toFixed(2) + "T";
    if (a >= 1e9)  return (v/1e9).toFixed(2) + "B";
    if (a >= 1e6)  return (v/1e6).toFixed(1) + "M";
    if (a >= 1e4)  return (v/1e3).toFixed(0) + "K";
    return Math.round(v).toLocaleString();
  }
  function fmtDs(ds, ind, v) {
    if (v == null) return "—";
    if (ds === "macro") {
      if (["gdp_growth","inflation"].includes(ind)) return (v > 0 ? "+" : "") + v.toFixed(1) + "%";
      if (ind === "unemployment") return v.toFixed(1) + "%";
      if (ind === "gdp_per_capita") return "$" + Math.round(v).toLocaleString();
      if (ind === "gdp_usd") return "$" + compact(v);
      return compact(v);
    }
    if (ds === "ev") {
      if (ind === "ev_share") return v.toFixed(0) + "%";
      if (ind === "ev_growth") return (v > 0 ? "+" : "") + v.toFixed(0) + "%";
      if (ind === "ev_per_1k") return v.toFixed(1);
      return compact(v);
    }
    return compact(v); // oem units
  }
  function dsLabel(ds) {
    return ds === "macro" ? "World Bank Open Data"
         : ds === "ev" ? "IEA GEVO via Our World in Data"
         : "Company-reported figures";
  }
  function indMeta(ds, ind) {
    if (ds === "macro") return MACRO.indicators[ind];
    if (ds === "ev") return EV.indicators[ind];
    return { label: OEM_INDICATORS[ind].label, unit: "units as reported" };
  }

  /* ---------------- data access ---------------- */
  function dsValue(ds, key, ind, year) {
    if (ds === "oem") {
      const s = OEM.sales[key]?.[String(year)];
      if (s == null) return null;
      if (ind === "sales") return s;
      if (ind === "growth") { const p = OEM.sales[key]?.[String(year-1)]; return p ? (s/p-1)*100 : null; }
      if (ind === "share")  { const w = OEM.world_plugin_sales[String(year)]; return w ? s/w*100 : null; }
    }
    const DS = ds === "macro" ? MACRO : EV;
    return DS.series[ind]?.[key]?.[String(year)] ?? null;
  }
  function dsLatest(ds, key, ind) {
    const yrs = ds === "oem" ? [2025,2024,2023,2022,2021] : ds === "macro" ? range(2024,2000) : range(2025,2010);
    for (const y of yrs) { const v = dsValue(ds, key, ind, y); if (v != null) return { year: y, value: v }; }
    return null;
  }
  function range(hi, lo) { const a = []; for (let y = hi; y >= lo; y--) a.push(y); return a; }
  function dsKeys(ds) {
    if (ds === "oem") return Object.keys(OEM.makers);
    return Object.keys(ds === "macro" ? MACRO.countries : EV.countries);
  }
  function dsName(ds, key) {
    if (ds === "oem") return OEM.makers[key].name;
    return (ds === "macro" ? MACRO.countries : EV.countries)[key];
  }

  /* ---------------- entity detection ---------------- */
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function findEntities(q) {
    const found = [];
    const all = [];
    Object.entries(COUNTRY_ALIASES).forEach(([a,k]) => all.push({ a, k, type:"country" }));
    Object.entries(OEM_ALIASES).forEach(([a,k]) => all.push({ a, k, type:"oem" }));
    all.sort((x,y) => y.a.length - x.a.length);
    const used = [];
    for (const e of all) {
      const re = new RegExp("\\b" + esc(e.a) + "\\b", "i");
      const m = q.match(re);
      if (m && !used.some(u => m.index < u.end && m.index + e.a.length > u.start)) {
        used.push({ start: m.index, end: m.index + e.a.length });
        if (!found.some(f => f.k === e.k && f.type === e.type)) found.push(e);
      }
    }
    return found;
  }
  function findIndicator(q) {
    const cands = [];
    INDICATORS.forEach(meta => meta.syns.forEach(s => {
      if (new RegExp("\\b" + esc(s) + "\\b", "i").test(q)) cands.push({ ...meta, len: s.length });
    }));
    cands.sort((a,b) => b.len - a.len);
    return cands[0] || null;
  }
  function findYear(q) { const m = q.match(/\b(20[0-2]\d)\b/); return m ? +m[1] : null; }
  function findTopN(q) { const m = q.match(/\b(?:top|first)\s+(\d{1,2})\b/i); return m ? Math.min(+m[1], 15) : 5; }

  const RANK_HI = /\b(top|highest|best|largest|biggest|most|leading|leads|leader|fastest)\b/i;
  const RANK_LO = /\b(lowest|worst|smallest|least|bottom|slowest)\b/i;
  const TREND = /\b(trend|history|over time|evolution|since|show|chart|develop)\b/i;
  const COMPARE = /\b(vs\.?|versus|compare|against)\b/i;

  /* ---------------- svg helpers ---------------- */
  function sparkline(points, w = 230, h = 44) {
    const vals = points.filter(p => p.v != null);
    if (!vals.length) return "";
    const min = Math.min(...vals.map(p => p.v)), max = Math.max(...vals.map(p => p.v));
    const span = max - min || 1;
    const xs = i => 4 + (points.length === 1 ? w/2 : i * (w - 8) / (points.length - 1));
    const ys = v => h - 6 - ((v - min) / span) * (h - 14);
    const pts = points.map((p, i) => p.v == null ? null : `${xs(i).toFixed(1)},${ys(p.v).toFixed(1)}`).filter(Boolean);
    const last = vals[vals.length - 1];
    const li = points.indexOf(last);
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline points="${pts.join(" ")}" fill="none" stroke="#0b0b0b" stroke-width="1.6"/>
      <circle cx="${xs(li).toFixed(1)}" cy="${ys(last.v).toFixed(1)}" r="2.6" fill="#0e7a34"/>
      <text x="${w-4}" y="10" text-anchor="end" font-size="8" fill="rgba(11,11,11,.45)" font-family="JetBrains Mono">${points[0].y}–${points[points.length-1].y}</text>
    </svg>`;
  }
  function compareBars(items, fmtFn) {
    const max = Math.max(...items.map(i => Math.abs(i.v)), 1e-9);
    const W = 320;
    return `<svg width="${W}" height="${items.length * 26}" viewBox="0 0 ${W} ${items.length * 26}">` +
      items.map((it, i) => {
        const bw = Math.max(3, Math.abs(it.v) / max * 170);
        return `<text x="0" y="${i*26+11}" font-size="9" fill="#0b0b0b" font-family="JetBrains Mono">${it.label.toUpperCase().slice(0,16)}</text>
        <rect x="86" y="${i*26+3}" width="${bw.toFixed(1)}" height="9" fill="${it.color || "#0b0b0b"}"/>
        <text x="${(92+bw).toFixed(1)}" y="${i*26+11}" font-size="9" fill="#0b0b0b" font-family="JetBrains Mono">${fmtFn(it.v)}</text>`;
      }).join("") + `</svg>`;
  }
  const row = (l, v) => `<div class="row"><span>${l}</span><b>${v}</b></div>`;

  /* ---------------- intent handlers ---------------- */
  function answerProfile(ent) {
    const parts = [];
    if (ent.type === "oem") {
      const m = OEM.makers[ent.k];
      const s = OEM.sales[ent.k];
      const y25 = s["2025"], y24 = s["2024"];
      parts.push(`<b>${m.name}</b> — ${m.scope}`);
      parts.push(row("2025 sales", compact(y25)));
      if (y24 && y25) {
        const g = (y25/y24-1)*100;
        parts.push(row("YoY growth", `<span class="${g<0?"neg":"pos"}">${(g>0?"+":"")+g.toFixed(1)}%</span>`));
      }
      const cum = Object.values(s).reduce((a,b) => a+b, 0);
      parts.push(row("Cumulative 2021–25", compact(cum)));
      return { html: parts.join(""), src: dsLabel("oem") };
    }
    const name = MACRO.countries[ent.k] || EV.countries[ent.k];
    parts.push(`<b>${name}</b> — latest snapshot`);
    if (MACRO.countries[ent.k]) {
      const g = dsLatest("macro", ent.k, "gdp_growth"), i = dsLatest("macro", ent.k, "inflation"),
            u = dsLatest("macro", ent.k, "unemployment"), pc = dsLatest("macro", ent.k, "gdp_per_capita");
      if (g) parts.push(row(`Real GDP growth · ${g.year}`, fmtDs("macro","gdp_growth",g.value)));
      if (i) parts.push(row(`Inflation · ${i.year}`, fmtDs("macro","inflation",i.value)));
      if (u) parts.push(row(`Unemployment · ${u.year}`, fmtDs("macro","unemployment",u.value)));
      if (pc) parts.push(row(`GDP per capita · ${pc.year}`, fmtDs("macro","gdp_per_capita",pc.value)));
    }
    if (EV.countries[ent.k]) {
      const sh = dsLatest("ev", ent.k, "ev_share"), sa = dsLatest("ev", ent.k, "ev_sales");
      if (sh) parts.push(row(`EV market share · ${sh.year}`, fmtDs("ev","ev_share",sh.value)));
      if (sa) parts.push(row(`EV sales · ${sa.year}`, fmtDs("ev","ev_sales",sa.value)));
    }
    return { html: parts.join(""), src: "World Bank · IEA GEVO via OWID" };
  }

  function answerValue(ent, meta, year) {
    const ds = meta ? meta.ds : (ent.type === "oem" ? "oem" : "ev");
    const ind = meta ? meta.ind : "sales";
    let y = year, v = y ? dsValue(ds, ent.k, ind, y) : null, usedLatest = false;
    if (v == null) {
      const l = dsLatest(ds, ent.k, ind);
      if (!l) return null;
      y = l.year; v = l.value; usedLatest = year != null && year !== l.year;
    }
    const m = indMeta(ds, ind);
    const note = usedLatest ? ` (no ${year} data — showing latest)` : "";
    return {
      html: `<b>${dsName(ds, ent.k)}</b> — ${m.label} in <b>${y}</b>${note}: <b>${fmtDs(ds === "oem" ? "oem" : ds, ind, v)}</b>` +
            (ds === "oem" ? `<span class="src">${OEM.makers[ent.k].scope}</span>` : ""),
      src: dsLabel(ds),
    };
  }

  function answerRank(meta, year, n, asc) {
    const ds = meta.ds, ind = meta.ind;
    const keys = dsKeys(ds).filter(k => !(ds !== "oem" && ["WLD","EUR"].includes(k)));
    let y = year;
    const getRows = yy => keys.map(k => ({ k, v: dsValue(ds, k, ind, yy) })).filter(r => r.v != null);
    let rows = y ? getRows(y) : [];
    if (!rows.length) {
      const yrs = ds === "oem" ? [2025,2024,2023,2022,2021] : ds === "macro" ? range(2024,2000) : range(2025,2010);
      for (const yy of yrs) { rows = getRows(yy); if (rows.length >= 3) { y = yy; break; } }
    }
    rows.sort((a,b) => asc ? a.v - b.v : b.v - a.v);
    const top = rows.slice(0, n);
    if (!top.length) return null;
    const m = indMeta(ds, ind);
    const list = top.map((r,i) => row(`${String(i+1).padStart(2,"0")} · ${dsName(ds, r.k)}`, fmtDs(ds === "oem" ? "oem" : ds, ind, r.v))).join("");
    return {
      html: `${asc ? "Lowest" : "Highest"} <b>${m.label}</b>, ${y}:<div style="margin-top:6px">${list}</div>`,
      src: dsLabel(ds),
    };
  }

  function answerTrend(ent, meta) {
    const ds = ent.type === "oem" ? "oem" : (meta ? meta.ds : "ev");
    const ind = meta ? meta.ind : "sales";
    const yrs = ds === "oem" ? [2021,2022,2023,2024,2025] : ds === "macro" ? range(2024,2000).reverse() : range(2025,2010).reverse();
    const points = yrs.map(y => ({ y, v: dsValue(ds, ent.k, ind, y) }));
    const valid = points.filter(p => p.v != null);
    if (valid.length < 2) return null;
    const first = valid[0], last = valid[valid.length-1];
    const m = indMeta(ds, ind);
    const f2 = v => fmtDs(ds === "oem" ? "oem" : ds, ind, v);
    return {
      html: `<b>${dsName(ds, ent.k)}</b> — ${m.label}, ${first.y}–${last.y}:` +
            sparkline(points) +
            `<div style="margin-top:4px">${first.y}: <b>${f2(first.v)}</b> &nbsp;→&nbsp; ${last.y}: <b>${f2(last.v)}</b></div>`,
      src: dsLabel(ds),
    };
  }

  function answerCompare(ents, meta, year) {
    const a = ents[0], b = ents[1];
    const ds = a.type === "oem" || b.type === "oem" ? "oem" : (meta ? meta.ds : "ev");
    if ((a.type === "oem") !== (b.type === "oem")) return { html: `One of those is a manufacturer and the other a market — they're not directly comparable in this dataset. Try two brands or two countries.`, src: null };
    const ind = meta ? (meta.ds === ds ? meta.ind : "sales") : "sales";
    const ya = latestOr(ds, a.k, ind, year), yb = latestOr(ds, b.k, ind, year);
    if (!ya || !yb) return null;
    const f2 = v => fmtDs(ds === "oem" ? "oem" : ds, ind, v);
    const m = indMeta(ds, ind);
    const ratio = yb.value ? ya.value / yb.value : null;
    const PAL = ["#0e7a34", "#c2232f"];
    return {
      html: `<b>${m.label}</b> — ${Math.max(ya.year, yb.year)}:` +
            compareBars([
              { label: dsName(ds, a.k), v: ya.value, color: PAL[0] },
              { label: dsName(ds, b.k), v: yb.value, color: PAL[1] },
            ], f2) +
            (ratio ? `<div style="margin-top:4px">${dsName(ds, a.k)} is <b>${ratio >= 1 ? ratio.toFixed(1) + "×" : (1/ratio).toFixed(1) + "× less than"}</b> ${dsName(ds, b.k)}${ratio < 1 ? "" : ""}.</div>` : ""),
      src: dsLabel(ds),
    };
  }
  function latestOr(ds, k, ind, year) {
    if (year) { const v = dsValue(ds, k, ind, year); if (v != null) return { year, value: v }; }
    return dsLatest(ds, k, ind);
  }

  /* ---------------- main router ---------------- */
  function answerQuestion(raw) {
    const q = " " + raw.toLowerCase().trim() + " ";
    const ents = findEntities(q);
    const meta = findIndicator(q);
    const year = findYear(q);

    if (/\b(help|what can you|how do i|examples?)\b/i.test(q)) return { html: HELP_HTML, src: null };
    if (/\b(thanks|thank you|thx)\b/i.test(q)) return { html: "Anytime. Ask me anything about the macro, EV-market, or manufacturer data.", src: null };

    // OEM entity without indicator
    if (ents.length && ents[0].type === "oem") {
      if (ents.length >= 2 || COMPARE.test(q)) {
        if (ents.length < 2) return { html: "Compare against which manufacturer? I track Tesla, BYD (BEV and PHEV), Volkswagen Group, BMW Group, and Mercedes-Benz.", src: null };
        return answerCompare(ents, null, year);
      }
      if (TREND.test(q)) return answerTrend(ents[0], null) || fallback();
      return answerValue(ents[0], null, year) || answerProfile(ents[0]);
    }
    // country entities
    if (ents.length >= 2 || (COMPARE.test(q) && ents.length >= 2)) return answerCompare(ents, meta, year) || fallback();
    if (ents.length === 1) {
      if (TREND.test(q)) return answerTrend(ents[0], meta) || fallback();
      if (meta) return answerValue(ents[0], meta, year) || fallback();
      return answerProfile(ents[0]);
    }
    // no entity: ranking intents
    if (meta && (RANK_HI.test(q) || RANK_LO.test(q))) return answerRank(meta, year, findTopN(q), RANK_LO.test(q)) || fallback();
    if (meta && /\b(world|global|total)\b/i.test(q)) {
      const ds = meta.ds;
      const key = ds === "macro" || ds === "ev" ? "WLD" : null;
      if (key && (ds !== "ev" || EV.countries.WLD)) return answerValue({ k: key, type: "country" }, meta, year) || fallback();
    }
    if (meta) return answerRank(meta, year, findTopN(q), RANK_LO.test(q)) || fallback();
    return fallback();
  }

  const HELP_HTML = `I answer questions from the three datasets on this site — no guesses, only the numbers here. Try:
    <div style="margin-top:6px">
    ${row("Value", "&ldquo;China EV market share in 2024&rdquo;")}
    ${row("Ranking", "&ldquo;Highest inflation in 2024&rdquo;")}
    ${row("Trend", "&ldquo;Show Germany GDP growth trend&rdquo;")}
    ${row("Compare", "&ldquo;Tesla vs BYD&rdquo;")}
    ${row("Profile", "&ldquo;Tell me about Norway&rdquo;")}
    </div>`;
  function fallback() {
    return { html: `I couldn't map that to the data on this site. I can look up values, rankings, trends, and comparisons across <b>27 economies</b> (macro), <b>30 EV markets</b>, and <b>6 manufacturer series</b>. ${HELP_HTML}`, src: null };
  }

  /* ---------------- UI ---------------- */
  const CHIPS = [
    "Which country has the highest EV market share?",
    "Compare Tesla vs BYD",
    "Germany GDP growth in 2024",
    "Show China's EV sales trend",
    "Top 5 countries by inflation 2024",
  ];

  function buildUI() {
    const cssVars = getComputedStyle(document.documentElement);
    const dock = document.createElement("div");
    dock.className = "ask-dock";
    dock.innerHTML = `<button class="ask-tab"><span class="ask-dot"></span>Ask the data</button>`;
    const panel = document.createElement("div");
    panel.className = "ask-panel";
    panel.innerHTML = `
      <div class="ask-head">
        <div><div class="t">Ask the terminal</div><div class="sub">deterministic · answers from on-page data only</div></div>
        <button class="ask-close" aria-label="Close">×</button>
      </div>
      <div class="ask-log"></div>
      <div class="ask-chips"></div>
      <div class="ask-inputrow">
        <input type="text" placeholder="e.g. China EV market share in 2024" aria-label="Ask a question">
        <button class="ask-send">ASK</button>
      </div>`;
    document.body.appendChild(dock);
    document.body.appendChild(panel);

    const log = panel.querySelector(".ask-log");
    const input = panel.querySelector("input");
    const chips = panel.querySelector(".ask-chips");

    function botSay(html, src) {
      const d = document.createElement("div");
      d.className = "ask-msg bot";
      d.innerHTML = html + (src ? `<span class="src">Source · ${src}</span>` : "");
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    function userSay(text) {
      const d = document.createElement("div");
      d.className = "ask-msg user";
      d.textContent = text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    function ask(text) {
      const t = (text ?? input.value).trim();
      if (!t) return;
      userSay(t);
      input.value = "";
      const ans = answerQuestion(t);
      setTimeout(() => botSay(ans.html, ans.src), 180);
    }
    CHIPS.forEach(c => {
      const b = document.createElement("button");
      b.className = "ask-chip";
      b.textContent = c;
      b.onclick = () => ask(c);
      chips.appendChild(b);
    });

    const tab = dock.querySelector(".ask-tab");
    tab.onclick = () => {
      panel.classList.add("open");
      dock.style.display = "none";
      if (!log.children.length) botSay(HELP_HTML, null);
      setTimeout(() => input.focus(), 200);
    };
    panel.querySelector(".ask-close").onclick = () => {
      panel.classList.remove("open");
      dock.style.display = "";
    };
    input.addEventListener("keydown", e => { if (e.key === "Enter") ask(); });
    panel.querySelector(".ask-send").onclick = () => ask();
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        panel.classList.remove("open");
        dock.style.display = "";
      }
    });
  }

  window.__ask = answerQuestion; // exposed for testing
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildUI);
  else buildUI();
})();
