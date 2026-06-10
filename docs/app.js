/* Renders pre-computed simulation results (results.json) — no logic here. */

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

const ROUND_LABELS = {
  R32: "1/16 finału", R16: "1/8 finału", QF: "Ćwierćfinały",
  SF: "Półfinały", F: "Finał",
};

async function loadResults() {
  try {
    const resp = await fetch("results.json");
    if (resp.ok) return await resp.json();
  } catch (e) { /* file:// fallback below */ }
  if (window.MUNDIAL_RESULTS) return window.MUNDIAL_RESULTS;
  throw new Error("Nie udało się wczytać results.json");
}

const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

const teamLabel = (R, code) =>
  `${FLAGS[code] || ""} ${R.teams[code].name_pl}`;

function renderChampion(R) {
  const final = R.knockout.F[0];
  const champ = R.champion;
  const card = document.getElementById("champion-card");
  card.append(
    el("span", "flag", FLAGS[champ] || ""),
    el("div", "name", R.teams[champ].name_pl),
    el("div", "final-score",
       `Finał: ${teamLabel(R, final.home)} ${final.score[0]}:${final.score[1]} ` +
       `${teamLabel(R, final.away)}${final.penalties ? " (po karnych)" : ""}`)
  );

  const runnerUp = final.winner === final.home ? final.away : final.home;
  const podium = document.getElementById("podium");
  podium.append(
    el("div", "step", `<span class="medal">🥈</span>${teamLabel(R, runnerUp)}`),
    el("div", "step", `<span class="medal">🥉</span>${teamLabel(R, R.third_place_winner)}`)
  );
}

function renderMonteCarlo(R) {
  const wrap = document.getElementById("mc-bars");
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
  const qualifiedThirds = new Set(
    R.third_place.ranking.filter(t => t.qualified).map(t => t.code));

  for (const [letter, group] of Object.entries(R.group_stage)) {
    const card = el("div", "group-card");
    card.append(el("h3", null, `Grupa ${letter}`));

    const table = el("table", "group-table");
    table.innerHTML =
      `<thead><tr><th>#</th><th>Drużyna</th><th class="num">M</th>` +
      `<th class="num">+/-</th><th class="num">Pkt</th></tr></thead>`;
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
  const t = el("table");
  t.innerHTML =
    `<thead><tr><th>#</th><th>Drużyna</th><th>Grupa</th>` +
    `<th>Pkt</th><th>+/-</th><th>Status</th></tr></thead>`;
  const tb = el("tbody");
  R.third_place.ranking.forEach((row, i) => {
    const tr = el("tr");
    tr.innerHTML =
      `<td>${i + 1}</td><td>${teamLabel(R, row.code)}</td><td>${row.group}</td>` +
      `<td>${row.Pts}</td><td>${row.GD > 0 ? "+" : ""}${row.GD}</td>` +
      `<td class="${row.qualified ? "ok" : "out"}">` +
      `${row.qualified ? "awans" : "odpada"}</td>`;
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
      `po karnych: ${R.teams[m.winner].name_pl}`));
  }
  return card;
}

function renderBracket(R) {
  const bracket = document.getElementById("bracket");
  for (const round of ["R32", "R16", "QF", "SF", "F"]) {
    const col = el("div", "round");
    col.append(el("div", "round-title", ROUND_LABELS[round]));
    const list = el("div", "round-matches");
    for (const m of R.knockout[round]) {
      list.append(koMatchCard(R, m, round === "F" ? "final-match" : null));
    }
    col.append(list);
    bracket.append(col);
  }

  const tp = document.getElementById("third-place-match");
  tp.append(el("div", "round-title", "Mecz o 3. miejsce"));
  tp.append(koMatchCard(R, R.knockout.third_place[0]));
}

loadResults().then(R => {
  document.getElementById("snapshot-date").textContent = R.meta.snapshot_date;
  renderChampion(R);
  renderMonteCarlo(R);
  renderGroups(R);
  renderBracket(R);
}).catch(err => {
  document.querySelector("main").prepend(
    el("p", null, `⚠️ ${err.message}`));
});
