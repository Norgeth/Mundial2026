/* Renders pre-computed simulation results (results.json). */

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
    hero_kicker:    "Symulacja algorytmiczna · snapshot danych:",
    hero_sub:       "Predykcja całego turnieju: model Poissona z korektą Dixona-Colesa, Power Index (ranking FIFA + forma + bilans bramkowy + gotowość drużyny) oraz 10 000 symulacji Monte Carlo.",
    champion:       "Przewidywany Mistrz Świata",
    mc_title:       "Szanse na mistrzostwo",
    mc_sub:         "(Monte Carlo, 10 000 turniejów)",
    groups_title:   "Faza grupowa",
    groups_sub:     "(przewidywane wyniki i tabele)",
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
    next_scorers:   "Kolejni przewidywani strzelcy",
    goals: g => g === 1 ? "gol" : g < 5 ? "gole" : "goli",
    footer: 'Wynik deterministycznej symulacji — dane zamrożone w przeddzień turnieju. Metodologia i kod: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "1/16 finału", R16: "1/8 finału", QF: "Ćwierćfinały", SF: "Półfinały", F: "Finał" },
    name: (t) => t.name_pl,
  },
  en: {
    page_title:     "World Cup 2026 — Prediction Engine",
    hero_h1:        'World Cup <span class="accent">2026</span>',
    hero_kicker:    "Algorithmic simulation · data snapshot:",
    hero_sub:       "Full tournament prediction: Poisson model with Dixon-Coles correction, Power Index (FIFA ranking + form + goal difference + squad readiness) and 10 000 Monte Carlo simulations.",
    champion:       "Predicted World Champion",
    mc_title:       "Championship probability",
    mc_sub:         "(Monte Carlo, 10 000 tournaments)",
    groups_title:   "Group Stage",
    groups_sub:     "(predicted results & standings)",
    bracket_title:  "Knockout Stage",
    thirds_summary: "Best third-place teams (top 8 advance)",
    th_pos: "#", th_team: "Team", th_group: "Group",
    th_played: "P", th_gd: "+/-", th_pts: "Pts", th_status: "Status",
    advance: "advance", out: "out",
    group_prefix:   "Group",
    final_label:    "Final",
    penalties:      "on penalties",
    third_label:    "Third-place match",
    golden_ball:    "⚽ Golden Ball — player of the tournament",
    golden_boot:    "👟 Golden Boot — top scorer",
    next_scorers:   "Other predicted top scorers",
    goals: g => g === 1 ? "goal" : "goals",
    footer: 'Deterministic simulation result — data frozen before the tournament. Methodology & code: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "Round of 32", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final" },
    name: (t) => t.name_en,
  },
};

let LANG = "pl";
let RESULTS = null;

async function loadResults() {
  try {
    const resp = await fetch("results.json");
    if (resp.ok) return await resp.json();
  } catch (e) { /* file:// fallback */ }
  if (window.MUNDIAL_RESULTS) return window.MUNDIAL_RESULTS;
  throw new Error("Nie udało się wczytać results.json / Could not load results.json");
}

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

function renderGroups(R) {
  const grid = document.getElementById("groups-grid");
  grid.innerHTML = "";
  const qualifiedThirds = new Set(
    R.third_place.ranking.filter(t => t.qualified).map(t => t.code));

  for (const [letter, group] of Object.entries(R.group_stage)) {
    const card = el("div", "group-card");
    card.append(el("h3", null, `${T[LANG].group_prefix} ${letter}`));

    const table = el("table", "group-table");
    table.innerHTML =
      `<thead><tr><th>${T[LANG].th_pos}</th><th>${T[LANG].th_team}</th>` +
      `<th class="num">${T[LANG].th_played}</th>` +
      `<th class="num">${T[LANG].th_gd}</th>` +
      `<th class="num">${T[LANG].th_pts}</th></tr></thead>`;
    const tbody = el("tbody");
    for (const row of group.table) {
      const tr = el("tr");
      if (row.pos <= 2) tr.className = "qualified";
      else if (row.pos === 3)
        tr.className = "third" + (qualifiedThirds.has(row.code) ? "" : " out");
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
      const gm = el("div", "gm");
      gm.append(
        el("span", "h", teamLabel(R, m.home)),
        el("span", "s", `${m.score[0]} : ${m.score[1]}`),
        el("span", "a", teamLabel(R, m.away))
      );
      matches.append(gm);
    }
    card.append(matches);
    grid.append(card);
  }

  const thirdsWrap = document.getElementById("thirds-table");
  thirdsWrap.innerHTML = "";
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

function koMatchCard(R, m, extraClass) {
  const card = el("div", "ko-match" + (extraClass ? ` ${extraClass}` : ""));
  for (const side of ["home", "away"]) {
    const code = m[side];
    const row = el("div", "ko-row" + (m.winner === code ? " winner" : ""));
    row.append(
      el("span", "t", teamLabel(R, code)),
      el("span", "g", String(m.score[side === "home" ? 0 : 1]))
    );
    card.append(row);
  }
  if (m.penalties) {
    card.append(el("div", "ko-pens",
      `${T[LANG].penalties}: ${T[LANG].name(R.teams[m.winner])}`));
  }
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
    `${T[LANG].groups_title} <span class="muted">${T[LANG].groups_sub}</span>`;
  document.getElementById("title-bracket").textContent = T[LANG].bracket_title;
  document.getElementById("thirds-summary").textContent = T[LANG].thirds_summary;
  document.getElementById("footer-text").innerHTML = T[LANG].footer;
  document.documentElement.lang = LANG;
}

function renderAll(R) {
  applyStaticLabels(R);
  renderChampion(R);
  renderAwards(R);
  renderMonteCarlo(R);
  renderGroups(R);
  renderBracket(R);
}

window.setLang = function (lang) {
  LANG = lang;
  document.getElementById("btn-pl").classList.toggle("active", lang === "pl");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  if (RESULTS) renderAll(RESULTS);
};

loadResults().then(R => {
  RESULTS = R;
  renderAll(R);
}).catch(err => {
  document.querySelector("main").prepend(
    el("p", null, `⚠️ ${err.message}`));
});
