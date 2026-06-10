# Mundial Predictor Engine — World Cup 2026

![Python](https://img.shields.io/badge/python-3.x_stdlib_only-3776AB?logo=python&logoColor=white)
![Deterministic](https://img.shields.io/badge/simulation-deterministic-34d399)
![Monte Carlo](https://img.shields.io/badge/monte_carlo-10\,000_runs-60a5fa)
![Snapshot](https://img.shields.io/badge/data_snapshot-2026--06--10-fbbf24)

Tournament-simulation system built on a frozen snapshot of real football data
(2026-06-10). Runs a deterministic prediction algorithm across all 104 matches
— group stage through the final — and renders the results on a bilingual
(PL/EN) static page.

## The verdict

| | Team | Note |
|---|---|---|
| 🥇 | **Argentina** | beats Belgium 1:0 in the final |
| 🥈 | Belgium | |
| 🥉 | Germany | beats Morocco 2:1 in the third-place match |

Championship probabilities (Monte Carlo, 10 000 simulated tournaments):
**ARG 36.9%** · BEL 12.9% · GER 8.5% · FRA 6.2% · JPN 5.5% · POR 5.1%

Individual awards: **Golden Boot** — Florian Wirtz (GER, 6 goals) ·
**Golden Ball** — Lionel Messi (ARG)

Full group tables, all 104 scorelines and the complete knockout bracket:
**open `docs/index.html`** or see [the website](#the-website).

## The website

Dependency-free static page (dark theme, bilingual PL/EN toggle). Publishes
via GitHub Pages in ~2 minutes:

**Settings → Pages → Source: _Deploy from a branch_ → branch `main`, folder
`/docs` → Save.**

The page then appears at `https://norgeth.github.io/Mundial2026/`.

Works offline too — open `docs/index.html` directly (`results.js` fallback
covers `file://` browsing).

## Architecture

```
data/raw/                  # raw data files (FIFA ranking, form, H2H, players, news scores)
data/snapshot.json         # merged & validated database — the source of truth
engine/predictor.py        # match model: Power Index, Poisson + Dixon-Coles
engine/bracket.py          # tables, third-place ranking/allocation, bracket flow
engine/run_simulation.py   # entry point → docs/results.json + results.js
engine/awards.py           # Golden Boot / Golden Ball calculation
engine/merge_snapshot.py   # merges data/raw/* into the snapshot, validates
docs/                      # static frontend (GitHub Pages-ready)
```

Data flows one way: `snapshot.json → run_simulation.py → results.json → index.html`.
The frontend contains no logic — it only renders pre-computed results.

## The model

1. **Power Index (0–100)** per team — four components:
   - `0.50 × normalized FIFA points`
   - `0.25 × recency-weighted form score` (last 5 matches)
   - `0.15 × sigmoid of avg goal difference`
   - `0.10 × pre-tournament readiness` (squad fitness, morale, key injuries —
     scored 1–10 from news articles published in the week before the tournament)

   Head-to-head history (last ≤3 direct meetings) adds a capped ±4 adjustment
   in group matches, kept small because 39 of the 72 group pairings have never
   met before.

2. **Expected goals**: the power difference sets each side's baseline
   (`1.35 × 10^(Δ/180)`), multiplied by attack/defence factors from the last
   5 matches. Averages are Bayesian-shrunk toward the World Cup mean (prior
   worth 3 matches). λ clamped to [0.3, 3.0].

3. **Score grid**: independent Poisson over 0–8 goals with a Dixon-Coles
   correction (ρ = 0.10) trimming over-represented 0:0/1:1 cells.

4. **Deterministic result** — two-stage argmax: most probable outcome first,
   then most probable scoreline within it. Same output on every run.

5. **Monte Carlo layer**: 10 000 full-tournament simulations
   (`random.Random(2026)`) produce championship/advancement probabilities.
   They never alter the canonical timeline.

A side-effect of the most-likely-outcome rule: no draws appear in group-stage
scorelines, because a draw is rarely the single most probable result.

## Data snapshot (frozen 2026-06-10)

| Dataset | Source | Verification |
|---|---|---|
| Groups & bracket | FIFA.com, Wikipedia, Sky Sports | cross-checked, official match numbering 73–104 |
| FIFA ranking (1 Apr 2026) | official ranking datasets + ESPN | exact published points; confirmed 1 Apr edition is the latest in force on 2026-06-10 |
| Last 5 matches | [martj42/international_results](https://github.com/martj42/international_results) | all 48 teams verified; 3 corrections found & applied |
| Head-to-head (72 pairs) | same dataset | all 33 pairs with history verified; 39 never-met pairs confirmed |
| Squad readiness scores | pre-tournament news (June 2026) | 11 top teams researched, rest by FIFA rank tier |
| Top scorers per squad | qualifying campaigns + AFCON/Copa América | top-3 per team for all 48 nations |

## Reproducing

```bash
# optional: rebuild raw data
curl -sL -o /tmp/results.csv https://raw.githubusercontent.com/martj42/international_results/master/results.csv
python3 engine/build_raw_from_dataset.py
python3 engine/build_ranking_raw.py

# merge + validate
python3 engine/merge_snapshot.py

# run simulation (~4 s including Monte Carlo)
cd engine && python3 run_simulation.py
```

Pure Python 3 stdlib — no dependencies.

---

## Skrót po polsku

Silnik predykcji Mundialu 2026: dane rzeczywiste zamrożone przed turniejem
(ranking FIFA z 1.04.2026, forma z ostatnich 5 meczów, historia H2H i oceny
gotowości drużyn z artykułów prasowych), deterministyczny algorytm (Power
Index → Poisson + Dixon-Coles → dwustopniowy argmax) symuluje wszystkie 104
mecze od fazy grupowej po finał. Monte Carlo (10 000 turniejów) daje szanse
procentowe.

**Przewidywany mistrz: Argentyna** (1:0 z Belgią w finale, 36,9% wg Monte
Carlo). Strona `docs/index.html` oferuje przełącznik językowy PL/EN.
