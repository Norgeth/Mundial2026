/* Renders pre-computed predictions, overlaying real results inline
   for a side-by-side comparison (prediction vs reality). */

const FLAGS = {
  MEX: "\u{1F1F2}\u{1F1FD}", RSA: "\u{1F1FF}\u{1F1E6}", KOR: "\u{1F1F0}\u{1F1F7}", CZE: "\u{1F1E8}\u{1F1FF}",
  CAN: "\u{1F1E8}\u{1F1E6}", BIH: "\u{1F1E7}\u{1F1E6}", QAT: "\u{1F1F6}\u{1F1E6}", SUI: "\u{1F1E8}\u{1F1ED}",
  BRA: "\u{1F1E7}\u{1F1F7}", MAR: "\u{1F1F2}\u{1F1E6}", HAI: "\u{1F1ED}\u{1F1F9}", SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  USA: "\u{1F1FA}\u{1F1F8}", PAR: "\u{1F1F5}\u{1F1FE}", AUS: "\u{1F1E6}\u{1F1FA}", TUR: "\u{1F1F9}\u{1F1F7}",
  GER: "\u{1F1E9}\u{1F1EA}", CUW: "\u{1F1E8}\u{1F1FC}", CIV: "\u{1F1E8}\u{1F1EE}", ECU: "\u{1F1EA}\u{1F1E8}",
  NED: "\u{1F1F3}\u{1F1F1}", JPN: "\u{1F1EF}\u{1F1F5}", SWE: "\u{1F1F8}\u{1F1EA}", TUN: "\u{1F1F9}\u{1F1F3}",
  BEL: "\u{1F1E7}\u{1F1EA}", EGY: "\u{1F1EA}\u{1F1EC}", IRN: "\u{1F1EE}\u{1F1F7}", NZL: "\u{1F1F3}\u{1F1FF}",
  ESP: "\u{1F1EA}\u{1F1F8}", CPV: "\u{1F1E8}\u{1F1FB}", KSA: "\u{1F1F8}\u{1F1E6}", URU: "\u{1F1FA}\u{1F1FE}",
  FRA: "\u{1F1EB}\u{1F1F7}", SEN: "\u{1F1F8}\u{1F1F3}", IRQ: "\u{1F1EE}\u{1F1F6}", NOR: "\u{1F1F3}\u{1F1F4}",
  ARG: "\u{1F1E6}\u{1F1F7}", ALG: "\u{1F1E9}\u{1F1FF}", AUT: "\u{1F1E6}\u{1F1F9}", JOR: "\u{1F1EF}\u{1F1F4}",
  POR: "\u{1F1F5}\u{1F1F9}", COD: "\u{1F1E8}\u{1F1E9}", UZB: "\u{1F1FA}\u{1F1FF}", COL: "\u{1F1E8}\u{1F1F4}",
  ENG: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", CRO: "\u{1F1ED}\u{1F1F7}",
  GHA: "\u{1F1EC}\u{1F1ED}", PAN: "\u{1F1F5}\u{1F1E6}",
};

const T = {
  pl: {
    page_title:     "Mundial 2026 — Predykcja",
    hero_h1:        'Mundial <span class="accent">2026</span>',
    hero_kicker:    "Mundial 2026 · USA · Kanada · Meksyk · dane z:",
    hero_sub:       "Wszystkie 104 mecze — od fazy grupowej po finał. Dane z 10 czerwca 2026.",
    hero_sub_live:  "Predykcje vs. rzeczywistość — śledź trafienia w trakcie turnieju.",
    champion:       "Przewidywany Mistrz Świata",
    mc_title:       "Szanse na mistrzostwo",
    mc_sub:         "(Monte Carlo, 10 000 turniejów)",
    groups_title:   "Faza grupowa",
    groups_sub:     "(przewidywane wyniki i tabele)",
    groups_sub_cmp: "(predykcja vs. rzeczywistość)",
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
    golden_boot:    "\u{1F45F} Złoty But — król strzelców",
    next_scorers:   "Inni czołowi strzelcy",
    goals: g => g === 1 ? "gol" : g < 5 ? "gole" : "goli",
    exact_n:   n => n === 1 ? "dokładny wynik" : n < 5 ? "dokładne wyniki" : "dokładnych wyników",
    outcome_n: n => n === 1 ? "poprawny typ" : n < 5 ? "poprawne typy" : "poprawnych typów",
    miss_n:    n => n === 1 ? "pudło" : n < 5 ? "pudła" : "pudeł",
    pair_full_n: n => n === 1 ? "trafiona para" : n < 5 ? "trafione pary" : "trafionych par",
    pair_half_n: n => n === 1 ? "para z 1 drużyną" : "pary z 1 drużyną",
    played_of:      "z 104 meczów rozegranych",
    pts:            "pkt",
    scoring_rules:  "dokładny wynik 3 pkt · poprawny typ 1 pkt · para pucharowa 3 pkt · 1 drużyna w parze 1 pkt",
    bonus_title:    "Bonusy po turnieju (po 5 pkt) —",
    bonus_champion: "Mistrz",
    bonus_boot:     "Król strzelców",
    bonus_mvp:      "MVP",
    footer: 'Wynik deterministycznej symulacji — dane zamrożone w przedzień turnieju. Metodologia i kod: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "1/16 finału", R16: "1/8 finału", QF: "Ćwierćfinały", SF: "Półfinały", F: "Finał" },
    name: (t) => t.name_pl,
  },
  en: {
    page_title:     "World Cup 2026 — Prediction Engine",
    hero_h1:        'World Cup <span class="accent">2026</span>',
    hero_kicker:    "World Cup 2026 · USA · Canada · Mexico · data from:",
    hero_sub:       "Full predicted results for all 104 matches — group stage, round of 32 and knockout. Data frozen June 10 2026.",
    hero_sub_live:  "Predictions vs. reality — track accuracy as the tournament unfolds.",
    champion:       "Predicted World Champion",
    mc_title:       "Championship probability",
    mc_sub:         "(Monte Carlo, 10 000 tournaments)",
    groups_title:   "Group Stage",
    groups_sub:     "(predicted results & standings)",
    groups_sub_cmp: "(prediction vs. reality)",
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
    golden_boot:    "\u{1F45F} Golden Boot — top scorer",
    next_scorers:   "Other top scorers to watch",
    goals: g => g === 1 ? "goal" : "goals",
    exact_n:   n => n === 1 ? "exact score" : "exact scores",
    outcome_n: n => n === 1 ? "correct outcome" : "correct outcomes",
    miss_n:    n => n === 1 ? "miss" : "misses",
    pair_full_n: n => n === 1 ? "exact pair" : "exact pairs",
    pair_half_n: n => n === 1 ? "pair with 1 team" : "pairs with 1 team",
    played_of:      "of 104 matches played",
    pts:            "pts",
    scoring_rules:  "exact score 3 pts · correct outcome 1 pt · knockout pair 3 pts · 1 team in pair 1 pt",
    bonus_title:    "Post-tournament bonuses (5 pts each) —",
    bonus_champion: "Champion",
    bonus_boot:     "Top scorer",
    bonus_mvp:      "MVP",
    footer: 'Deterministic simulation result — data frozen before the tournament. Methodology & code: <a href="https://github.com/norgeth/mundial2026" target="_blank" rel="noopener">GitHub</a>.',
    rounds: { R32: "Round of 32", R16: "Round of 16", QF: "Quarter-finals", SF: "Semi-finals", F: "Final" },
    name: (t) => t.name_en,
  },
};

let LANG = "pl";
let RESULTS = null;
let LIVE = null;
let LIVE_INDEX = new Map();

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

function getVerdict(pred, real) {
  if (!real) return null;
  const [ph, pa] = pred;
  const [rh, ra] = real.score;
  if (ph === rh && pa === ra) return "exact";
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return "outcome";
  return "miss";
}

/* Official competition scoring:
   exact score 3 pts · correct outcome 1 pt · miss 0 pts
   knockout pair fully right 3 pts · one team right 1 pt
   pre-tournament bonus picks (champion / top scorer / MVP) 5 pts each */
const SCORING = { exact: 3, outcome: 1, pairFull: 3, pairHalf: 1, bonus: 5 };

const verdictPts = v =>
  v === "exact" ? SCORING.exact : v === "outcome" ? SCORING.outcome : 0;

/* Map a real match date to the tournament stage (official 2026 calendar). */
const KO_STAGES = [
  ["R32",         "2026-06-28", "2026-07-03"],
  ["R16",         "2026-07-04", "2026-07-07"],
  ["QF",          "2026-07-08", "2026-07-11"],
  ["SF",          "2026-07-13", "2026-07-16"],
  ["third_place", "2026-07-18", "2026-07-18"],
  ["F",           "2026-07-19", "2026-07-19"],
];

function stageForDate(date) {
  if (!date || date <= "2026-06-27") return "group";
  for (const [stage, from, to] of KO_STAGES)
    if (date >= from && date <= to) return stage;
  return "group";
}

function computeScore(R) {
  const s = { exact: 0, outcome: 0, miss: 0, played: 0,
              matchPts: 0, pairFull: 0, pairHalf: 0, pairPts: 0,
              champion: null, points: 0 };

  const addVerdict = v => {
    if (v === "exact") s.exact++;
    else if (v === "outcome") s.outcome++;
    else s.miss++;
    s.played++;
    s.matchPts += verdictPts(v);
  };

  for (const group of Object.values(R.group_stage)) {
    for (const m of group.matches) {
      const real = realResult(m.home, m.away);
      if (real) addVerdict(getVerdict(m.score, real));
    }
  }

  /* Knockout: real matches bucketed by stage, compared with predicted pairs. */
  const realByStage = {};
  if (LIVE && Array.isArray(LIVE.matches)) {
    for (const rm of LIVE.matches) {
      if (rm.status !== "final") continue;
      const st = stageForDate(rm.date);
      if (st === "group") continue;
      (realByStage[st] = realByStage[st] || []).push(rm);
    }
  }
  for (const [stage, realMatches] of Object.entries(realByStage)) {
    const predicted = R.knockout[stage] || [];
    for (const rm of realMatches) {
      let overlap = 0, exactPair = null;
      for (const pm of predicted) {
        const o = (pm.home === rm.home || pm.away === rm.home ? 1 : 0)
                + (pm.home === rm.away || pm.away === rm.away ? 1 : 0);
        if (o > overlap) { overlap = o; exactPair = o === 2 ? pm : null; }
      }
      if (overlap === 2) { s.pairFull++; s.pairPts += SCORING.pairFull; }
      else if (overlap === 1) { s.pairHalf++; s.pairPts += SCORING.pairHalf; }
      if (exactPair) {
        addVerdict(getVerdict(exactPair.score,
                              realResult(exactPair.home, exactPair.away)));
      }
    }
  }

  s.points = s.matchPts + s.pairPts;

  /* Champion bonus resolves itself once the final has been played. */
  const fin = (realByStage.F || [])[0];
  if (fin && fin.score[0] !== fin.score[1]) {
    const champ = fin.score[0] > fin.score[1] ? fin.home : fin.away;
    s.champion = champ === R.champion ? "hit" : "miss";
    if (s.champion === "hit") s.points += SCORING.bonus;
  }
  return s;
}

function renderScore(R) {
  const banner = document.getElementById("accuracy-banner");
  if (!banner) return;
  const s = computeScore(R);
  if (s.played === 0 && s.pairFull === 0 && s.pairHalf === 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "";
  const t = T[LANG];

  let chips =
    `<span class="acc-chip exact"><span class="acc-n">✓ ${s.exact}</span> ${t.exact_n(s.exact)} <span class="acc-pts">+${s.exact * SCORING.exact}</span></span>` +
    `<span class="acc-chip outcome"><span class="acc-n">~ ${s.outcome}</span> ${t.outcome_n(s.outcome)} <span class="acc-pts">+${s.outcome * SCORING.outcome}</span></span>` +
    `<span class="acc-chip miss"><span class="acc-n">✗ ${s.miss}</span> ${t.miss_n(s.miss)}</span>`;
  if (s.pairFull || s.pairHalf) {
    chips +=
      `<span class="acc-chip pair"><span class="acc-n">${s.pairFull}</span> ${t.pair_full_n(s.pairFull)} <span class="acc-pts">+${s.pairFull * SCORING.pairFull}</span></span>` +
      `<span class="acc-chip pair"><span class="acc-n">${s.pairHalf}</span> ${t.pair_half_n(s.pairHalf)} <span class="acc-pts">+${s.pairHalf * SCORING.pairHalf}</span></span>`;
  }

  const bonus = [
    [t.bonus_champion, teamLabel(R, R.champion),
     s.champion === "hit" ? "hit" : s.champion === "miss" ? "miss" : "open"],
    [t.bonus_boot, `${R.awards.golden_boot.player}`, "open"],
    [t.bonus_mvp, `${R.awards.golden_ball.player}`, "open"],
  ].map(([label, pick, state]) => {
    const mark = state === "hit" ? " ✓ +5" : state === "miss" ? " ✗" : "";
    return `<span class="bonus-pick ${state}">${label}: <b>${pick}</b>${mark}</span>`;
  }).join(" · ");

  banner.innerHTML =
    `<div class="score-total"><span class="score-n">${s.points}</span> ${t.pts}</div>` +
    `<div class="acc-chips">${chips}</div>` +
    `<div class="acc-sub">${s.played} ${t.played_of} · ${t.scoring_rules}</div>` +
    `<div class="acc-bonus">${t.bonus_title} ${bonus}</div>`;
}

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
    el("div", "step", `<span class="medal">\u{1F948}</span>${teamLabel(R, runnerUp)}`),
    el("div", "step", `<span class="medal">\u{1F949}</span>${teamLabel(R, R.third_place_winner)}`)
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
  const hasLive = LIVE_INDEX.size > 0;
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
      const real = realResult(m.home, m.away);
      const verdict = getVerdict(m.score, real);

      const wrapper = el("div", "match-card" + (verdict ? ` mc-${verdict}` : ""));

      const predRow = el("div", "gm");
      predRow.append(
        el("span", "h", teamLabel(R, m.home)),
        el("span", "s", `${m.score[0]} : ${m.score[1]}`),
        el("span", "a", teamLabel(R, m.away))
      );
      wrapper.append(predRow);

      if (verdict) {
        const icon = verdict === "exact" ? "✓" : verdict === "outcome" ? "~" : "✗";
        const pts = verdictPts(verdict);
        const realRow = el("div", `gm gm-result ${verdict}`);
        realRow.append(
          el("span", "h", teamLabel(R, m.home)),
          el("span", "s", `${icon} ${real.score[0]} : ${real.score[1]}` +
             `<span class="ptbadge">+${pts}</span>`),
          el("span", "a", teamLabel(R, m.away))
        );
        wrapper.append(realRow);
      }

      matches.append(wrapper);
    }
    card.append(matches);
    grid.append(card);
  }

  const thirdsWrap = document.getElementById("thirds-table");
  thirdsWrap.innerHTML = "";
  const t3 = el("table");
  t3.innerHTML =
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
  t3.append(tb);
  thirdsWrap.append(t3);
}

function koMatchCard(R, m, extraClass) {
  const real = realResult(m.home, m.away);
  const verdict = getVerdict(m.score, real);
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
  if (verdict) {
    const icon = verdict === "exact" ? "✓" : verdict === "outcome" ? "~" : "✗";
    card.append(el("div", `ko-verdict ${verdict}`,
      `${icon} ${real.score[0]} : ${real.score[1]}` +
      `<span class="ptbadge">+${verdictPts(verdict)}</span>`));
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
  const hasLive = LIVE_INDEX.size > 0;
  const t = T[LANG];
  document.title = t.page_title;
  document.getElementById("page-title").textContent = t.page_title;
  document.getElementById("hero-h1").innerHTML = t.hero_h1;
  document.getElementById("hero-kicker").innerHTML =
    `${t.hero_kicker} <span id="snapshot-date">${R.meta.snapshot_date}</span>`;
  document.getElementById("hero-sub").textContent =
    hasLive ? t.hero_sub_live : t.hero_sub;
  document.getElementById("title-champion").textContent = t.champion;
  document.getElementById("title-mc").innerHTML =
    `${t.mc_title} <span class="muted" id="mc-sub">${t.mc_sub}</span>`;
  document.getElementById("title-groups").innerHTML =
    `${t.groups_title} <span class="muted">${hasLive ? t.groups_sub_cmp : t.groups_sub}</span>`;
  document.getElementById("title-bracket").textContent = t.bracket_title;
  document.getElementById("thirds-summary").textContent = t.thirds_summary;
  document.getElementById("footer-text").innerHTML = t.footer;
  document.documentElement.lang = LANG;
}

function renderAll(R) {
  applyStaticLabels(R);
  renderChampion(R);
  renderAwards(R);
  renderMonteCarlo(R);
  renderScore(R);
  renderGroups(R);
  renderBracket(R);
}

window.setLang = function (lang) {
  LANG = lang;
  document.getElementById("btn-pl").classList.toggle("active", lang === "pl");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
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
