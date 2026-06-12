/* Renders pre-computed simulation results (results.json).
   Optionally overlays real tournament results (live_results.json):
   in "live" view scores are shown only for matches actually played. */

const FLAGS = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿", CAN: "🇨🇦", BIH: "🇧🇦",
  QAT: "🇶🇦", SUI: "🇨🇭", BRA: "🇧🇷", MAR: "🇲🇦", HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸", PAR: "🇵🇾", AUS: "🇦🇺", TUR: "🇹🇷", GER: "🇩🇪", CUW: "🇨🇼",
  CIV: "🇨🇮", ECU: "🇪🇨", NED: "🇳🇱", JPN: "🇯🇵", SWE: "🇸🇪", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿", ESP: "🇪🇸", CPV: "🇨🇻",
  KSA: "🇸🇦", URU: "🇺🇾", FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴", POR: "🇵🇹", COD: "🇨🇩",
  UZB: "🇺🇿", COL: "🇨🇴", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
};

const T = {
  pl: {
    page_title:     "Mundial 2026 — Predykcja",
    hero_h1:        'Mundial <span class="accent">2026</span>',
    hero_kicker:    "Mundial 2026 · USA · Kanada · Meksyk · dane z:",
    hero_sub:       "Wszystkie 104 mecze — od fazy grupowej po finał. Dane z 10 czerwca 2026.",
    champion:       "Przewidywany Mistrz Świata",
    mc_title:       "Szanse na mistrzostwo",
    mc_sub:         "(Monte Carlo, 10 000 turniejów)",
    groups_title:   "Faza grupowa",
    groups_sub:     "(przewidywane wyniki i tabele)",
    groups_sub_live:"(tylko rozegrane mecze)",
    bracket_title:  "Faza pucharowa",
    thirds_summary: "Ranking drużyn z 3. miejsc (8 najlepszych awansuje)",
    th_pos: "#", th_team: "Drużyna", th_group: "Grupa",
    th_played: "M", th_gd: "+/-", th_pts: "Pkt", th_status: "Status",
    advance: "awans", out: "odpada",
    group_prefix:   "Grupa",
    final_label:    "Finał",
    penalties:      "po karnych",
    third_label:    "Mecz o 3. miejsce",
    golden_ball:    "⚽ Złota Piłka — zawodnik turnieju",
    golden_boot:    "👟 Złoty But — król strzelców",
    next_scorers:   "Inni czołowi strzelcy",
    goals: g => g === 1 ? "gol" : g < 5 ? "gole" : "goli",
    view_pred:      "Predykcje",
    view_live:      "Wyniki live",
    live_legend:    "✓ wynik rzeczywisty · pozostałe mecze jeszcze nierozegrane",
    live_updated:   "wyniki zaktualizowano:",
    no_live:        "Brak rozegranych meczów — wyniki pojawią się tu po pierwszych spotkaniach.",
    footer: 'Wynik deterministycznej symulacji — dane zamrożone w przeddzień turnieju. Metodologia i kod: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "1/16 finału", R16: "1/8 finału", QF: "Ćwierćfinały", SF: "Półfinały", F: "Finał" },
    name: (t) => t.name_pl,
  },
  en: {
    page_title:     "World Cup 2026 — Prediction Engine",
    hero_h1:        'World Cup <span class="accent">2026</span>',
    hero_kicker:    "World Cup 2026 · USA · Canada · Mexico · data from:",
    hero_sub:       "Full predicted results for all 104 matches — group stage, round of 32 and knockout. Data frozen June 10 2026.",
    champion:       "Predicted World Champion",
    mc_title:       "Championship probability",
    mc_sub:         "(Monte Carlo, 10 000 tournaments)",
    groups_title:   "Group Stage",
    groups_sub:     "(predicted results & standings)",
    groups_sub_live:"(played matches only)",
    bracket_title:  "Knockout Stage",
    thirds_summary: "Best third-placed teams (top 8 advance)",
    th_pos: "#", th_team: "Team", th_group: "Group",
    th_played: "P", th_gd: "+/-", th_pts: "Pts", th_status: "Status",
    advance: "advance", out: "out",
    group_prefix:   "Group",
    final_label:    "Final",
    penalties:      "on penalties",
    third_label:    "Third-place match",
    golden_ball:    "⚽ Golden Ball — player of the tournament",
    golden_boot:    "👟 Golden Boot — top scorer",
    next_scorers:   "Other top scorers to watch",
    goals: g => g === 1 ? "goal" : "goals",
    view_pred:      "Predictions",
    view_live:      "Live results",
    live_legend:    "✓ real result · remaining matches not yet played",
    live_updated:   "results updated:",
    no_live:        "No matches played yet — results will appear here once the tournament kicks off.",
    footer: 'Deterministic simulation result — data frozen before the tournament. Methodology & code: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "Round of 32", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final" },
    name: (t) => t.name_en,
  },
};

let LANG = "pl";
let VIEW = "pred";          // 'pred' | 'live'
let RESULTS = null;
let LIVE = null;            // payload of live_results.json
let LIVE_INDEX = new Map(); // "HOME|AWAY" -> {score:[h,a]}

async function loadJson(path, fallbackKey) {
  try {
    const resp = await fetch(path);
    if (resp.ok) return await resp.json();
  } catch (e) { /* file:// fallback */ }
  return window[fallbackKey] || null;
}

function indexLive(live) {
  const idx = new Map();
  if (live && Array.isArray(live.matches)) {
    for (const m of live.matches) {
      if (m.status !== "final") continue;
      idx.set(`${m.home}|${m.away}`, { score: m.score });
      idx.set(`${m.away}|${m.home}`, { score: [m.score[1], m.score[0]] });
    }
  }
  return idx;
}

const realResult = (home, away) => LIVE_INDEX.get(`${home}|${away}`) || null;

const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

const teamLabel = (R, code) =>
  `${FLAGS[code] || ""} ${T[LANG].name(R.teams[code])}`;

function renderChampion(R) {
  const final = R.knockout.F[0];
  const champ = R.champion;
  const card = document.getElementById("champion-card");
  card.innerHTML = "";
  card.append(
    el("span", "flag", FLAGS[champ] || ""),
    el("div", "name", T[LANG].name(R.teams[champ])),
    el("div", "final-score",
       `${T[LANG].final_label}: ${teamLabel(R, final.home)} ${final.score[0]}:${final.score[1]} ` +
       `${teamLabel(R, final.away)}${final.penalties ? ` (${T[LANG].penalties})` : ""}`)
  );

  const runnerUp = final.winner === final.home ? final.away : final.home;
  const podium = document.getElementById("podium");
  podium.innerHTML = "";
  podium.append(
    el("div", "step", `<span class="medal">🥈</span>${teamLabel(R, runnerUp)}`),
    el("div", "step", `<span class="medal">🥉</span>${teamLabel(R, R.third_place_winner)}`)
  );
}

function renderAwards(R) {
  const wrap = document.getElementById("awards");
  wrap.innerHTML = "";
  if (!R.awards) return;
  const ball = R.awards.golden_ball;
  const boot = R.awards.golden_boot;
  if (ball) {
    const card = el("div", "award-card");
    card.append(
      el("div", "award-title", T[LANG].golden_ball),
      el("div", "award-player", ball.player),
      el("div", "award-team", teamLabel(R, ball.team))
    );
    wrap.append(card);
  }
  if (boot) {
    const card = el("div", "award-card");
    card.append(
      el("div", "award-title", T[LANG].golden_boot),
      el("div", "award-player", boot.player),
      el("div", "award-team",
         `${teamLabel(R, boot.team)} · ${boot.goals} ${T[LANG].goals(boot.goals)}`)
    );
    wrap.append(card);
  }
  const others = (R.awards.top_scorers || []).slice(1, 4)
    .map(s => `${s.player} (${s.team}) ${s.expected_goals.toFixed(1)}`)
    .join(" · ");
  if (others) {
    wrap.append(el("div", "award-others",
      `${T[LANG].next_scorers}: ${others}`));
  }
}

function renderMonteCarlo(R) {
  const wrap = document.getElementById("mc-bars");
  wrap.innerHTML = "";
  const rows = Object.entries(R.monte_carlo)
    .map(([code, v]) => [code, v.champion])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const max = rows[0][1] || 1;
  for (const [code, pct] of rows) {
    const row = el("div", "mc-row");
    row.append(el("span", "team", teamLabel(R, code)));
    const track = el("div", "bar-track");
    const bar = el("div", "bar");
    bar.style.width = `${(100 * pct / max).toFixed(1)}%`;
    track.append(bar);
    row.append(track, el("span", "pct", `${pct.toFixed(1)}%`));
    wrap.append(row);
  }
}

/* Recompute a group table from played (real) matches only. */
function liveTable(codes, matches) {
  const stats = {};
  for (const c of codes) stats[c] = { P: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  for (const m of matches) {
    const real = realResult(m.home, m.away);
    if (!real) continue;
    const [gh, ga] = real.score;
    for (const [code, gf, gc] of [[m.home, gh, ga], [m.away, ga, gh]]) {
      const s = stats[code];
      s.P += 1; s.GF += gf; s.GA += gc;
      s.Pts += gf > gc ? 3 : gf === gc ? 1 : 0;
    }
  }
  for (const c of codes) stats[c].GD = stats[c].GF - stats[c].GA;
  const order = [...codes].sort((a, b) =>
    stats[b].Pts - stats[a].Pts || stats[b].GD - stats[a].GD || stats[b].GF - stats[a].GF);
  return order.map((code, i) => ({ pos: i + 1, code, ...stats[code] }));
}

function renderGroups(R) {
  const grid = document.getElementById("groups-grid");
  grid.innerHTML = "";
  const live = VIEW === "live";
  const qualifiedThirds = new Set(
    R.third_place.ranking.filter(t => t.qualified).map(t => t.code));

  for (const [letter, group] of Object.entries(R.group_stage)) {
    const card = el("div", "group-card");
    card.append(el("h3", null, `${T[LANG].group_prefix} ${letter}`));

    const codes = group.table.map(r => r.code);
    const rowsData = live ? liveTable(codes, group.matches) : group.table;

    const table = el("table", "group-table");
    table.innerHTML =
      `<thead><tr><th>${T[LANG].th_pos}</th><th>${T[LANG].th_team}</th>` +
      `<th class="num">${T[LANG].th_played}</th>` +
      `<th class="num">${T[LANG].th_gd}</th>` +
      `<th class="num">${T[LANG].th_pts}</th></tr></thead>`;
    const tbody = el("tbody");
    for (const row of rowsData) {
      const tr = el("tr");
      if (!live) {
        if (row.pos <= 2) tr.className = "qualified";
        else if (row.pos === 3)
          tr.className = "third" + (qualifiedThirds.has(row.code) ? "" : " out");
      }
      tr.innerHTML =
        `<td>${row.pos}</td><td>${teamLabel(R, row.code)}</td>` +
        `<td class="num">${row.P}</td>` +
        `<td class="num">${row.GD > 0 ? "+" : ""}${row.GD}</td>` +
        `<td class="num pts">${row.Pts}</td>`;
      tbody.append(tr);
    }
    table.append(tbody);
    card.append(table);

    const matches = el("div", "group-matches");
    for (const m of group.matches) {
      const real = realResult(m.home, m.away);
      const gm = el("div", "gm");
      let scoreHtml;
      if (live) {
        scoreHtml = real
          ? `<span class="real">✓ ${real.score[0]} : ${real.score[1]}</span>`
          : `<span class="tbd">– : –</span>`;
      } else {
        scoreHtml = `${m.score[0]} : ${m.score[1]}`;
      }
      gm.append(
        el("span", "h", teamLabel(R, m.home)),
        el("span", "s", scoreHtml),
        el("span", "a", teamLabel(R, m.away))
      );
      matches.append(gm);
    }
    card.append(matches);
    grid.append(card);
  }

  const thirdsWrap = document.getElementById("thirds-table");
  thirdsWrap.innerHTML = "";
  const thirdsBox = document.querySelector(".thirds-box");
  thirdsBox.style.display = live ? "none" : "";
  if (!live) {
    const t = el("table");
    t.innerHTML =
      `<thead><tr><th>${T[LANG].th_pos}</th><th>${T[LANG].th_team}</th>` +
      `<th>${T[LANG].th_group}</th><th>${T[LANG].th_pts}</th>` +
      `<th>${T[LANG].th_gd}</th><th>${T[LANG].th_status}</th></tr></thead>`;
    const tb = el("tbody");
    R.third_place.ranking.forEach((row, i) => {
      const tr = el("tr");
      tr.innerHTML =
        `<td>${i + 1}</td><td>${teamLabel(R, row.code)}</td><td>${row.group}</td>` +
        `<td>${row.Pts}</td><td>${row.GD > 0 ? "+" : ""}${row.GD}</td>` +
        `<td class="${row.qualified ? "ok" : "out"}">` +
        `${row.qualified ? T[LANG].advance : T[LANG].out}</td>`;
      tb.append(tr);
    });
    t.append(tb);
    thirdsWrap.append(t);
  }
}

function koMatchCard(R, m, extraClass) {
  const live = VIEW === "live";
  const real = live ? realResult(m.home, m.away) : null;
  const card = el("div", "ko-match" + (extraClass ? ` ${extraClass}` : ""));

  let score = m.score, winner = m.winner, played = true;
  if (live) {
    if (real) {
      score = real.score;
      winner = real.score[0] === real.score[1]
        ? null   // drawn after pens — winner unknown from scoreboard alone
        : (real.score[0] > real.score[1] ? m.home : m.away);
    } else {
      played = false;
    }
  }

  for (const side of ["home", "away"]) {
    const code = m[side];
    const row = el("div", "ko-row" + (played && winner === code ? " winner" : ""));
    const g = played ? String(score[side === "home" ? 0 : 1]) : "–";
    row.append(
      el("span", "t", teamLabel(R, code)),
      el("span", "g" + (live && real ? " real" : ""), g)
    );
    card.append(row);
  }
  if (!live && m.penalties) {
    card.append(el("div", "ko-pens",
      `${T[LANG].penalties}: ${T[LANG].name(R.teams[m.winner])}`));
  }
  if (live && real) card.classList.add("played");
  return card;
}

function renderBracket(R) {
  const bracket = document.getElementById("bracket");
  bracket.innerHTML = "";
  for (const round of ["R32", "R16", "QF", "SF", "F"]) {
    const col = el("div", "round");
    col.append(el("div", "round-title", T[LANG].rounds[round]));
    const list = el("div", "round-matches");
    for (const m of R.knockout[round]) {
      list.append(koMatchCard(R, m, round === "F" ? "final-match" : null));
    }
    col.append(list);
    bracket.append(col);
  }

  const tp = document.getElementById("third-place-match");
  tp.innerHTML = "";
  tp.append(el("div", "round-title", T[LANG].third_label));
  tp.append(koMatchCard(R, R.knockout.third_place[0]));
}

function renderLiveBanner() {
  let banner = document.getElementById("live-banner");
  if (!banner) {
    banner = el("div", "live-banner");
    banner.id = "live-banner";
    const main = document.querySelector("main");
    main.prepend(banner);
  }
  if (VIEW !== "live") { banner.style.display = "none"; return; }
  banner.style.display = "";
  const played = LIVE && LIVE.matches ? LIVE.matches.length : 0;
  const updated = LIVE && LIVE.meta && LIVE.meta.updated_at
    ? ` · ${T[LANG].live_updated} ${LIVE.meta.updated_at.slice(0, 16).replace("T", " ")}` : "";
  banner.innerHTML = played > 0
    ? `${T[LANG].live_legend}${updated}`
    : `${T[LANG].no_live}${updated}`;
}

function applyStaticLabels(R) {
  document.title = T[LANG].page_title;
  document.getElementById("page-title").textContent = T[LANG].page_title;
  document.getElementById("hero-h1").innerHTML = T[LANG].hero_h1;
  document.getElementById("hero-kicker").innerHTML =
    `${T[LANG].hero_kicker} <span id="snapshot-date">${R.meta.snapshot_date}</span>`;
  document.getElementById("hero-sub").textContent = T[LANG].hero_sub;
  document.getElementById("title-champion").textContent = T[LANG].champion;
  document.getElementById("title-mc").innerHTML =
    `${T[LANG].mc_title} <span class="muted" id="mc-sub">${T[LANG].mc_sub}</span>`;
  document.getElementById("title-groups").innerHTML =
    `${T[LANG].groups_title} <span class="muted">` +
    `${VIEW === "live" ? T[LANG].groups_sub_live : T[LANG].groups_sub}</span>`;
  document.getElementById("title-bracket").textContent = T[LANG].bracket_title;
  document.getElementById("thirds-summary").textContent = T[LANG].thirds_summary;
  document.getElementById("footer-text").innerHTML = T[LANG].footer;
  document.getElementById("btn-view-pred").textContent = T[LANG].view_pred;
  document.getElementById("btn-view-live").textContent = T[LANG].view_live;
  document.documentElement.lang = LANG;
}

function renderAll(R) {
  applyStaticLabels(R);
  renderChampion(R);
  renderAwards(R);
  renderMonteCarlo(R);
  renderGroups(R);
  renderBracket(R);
  renderLiveBanner();
}

window.setLang = function (lang) {
  LANG = lang;
  document.getElementById("btn-pl").classList.toggle("active", lang === "pl");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  if (RESULTS) renderAll(RESULTS);
};

window.setView = function (view) {
  VIEW = view;
  document.getElementById("btn-view-pred").classList.toggle("active", view === "pred");
  document.getElementById("btn-view-live").classList.toggle("active", view === "live");
  if (RESULTS) renderAll(RESULTS);
};

(async () => {
  try {
    const [results, live] = await Promise.all([
      loadJson("results.json", "MUNDIAL_RESULTS"),
      loadJson("live_results.json", "MUNDIAL_LIVE"),
    ]);
    if (!results) throw new Error("Nie udało się wczytać results.json / Could not load results.json");
    RESULTS = results;
    LIVE = live;
    LIVE_INDEX = indexLive(live);
    renderAll(RESULTS);
  } catch (err) {
    document.querySelector("main").prepend(el("p", null, `⚠️ ${err.message}`));
  }
})();
