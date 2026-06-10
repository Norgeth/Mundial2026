# 🏆 Mundial Predictor Engine — World Cup 2026

![Python](https://img.shields.io/badge/python-3.x_stdlib_only-3776AB?logo=python&logoColor=white)
![Deterministic](https://img.shields.io/badge/simulation-deterministic-34d399)
![Monte Carlo](https://img.shields.io/badge/monte_carlo-10\,000_runs-60a5fa)
![Snapshot](https://img.shields.io/badge/data_snapshot-2026--06--10-fbbf24)

Automated data-analysis and tournament-simulation system. It froze a snapshot
of real-world football data on the eve of the 2026 FIFA World Cup
(**2026-06-10**), runs a deterministic prediction algorithm over the whole
tournament (group stage → Round of 32 → Final) and renders the pre-computed
results on a static HTML page (Polish UI).

## 🥇 The verdict

| | Team | Note |
|---|---|---|
| 🥇 | **Argentina** | beats Belgium 1:0 in the final |
| 🥈 | Belgium | |
| 🥉 | Germany | beats Morocco 2:1 in the third-place match |

Championship probabilities (Monte Carlo, 10 000 simulated tournaments):
**ARG 35.3%** · BEL 13.8% · GER 9.2% · POR 6.7% · FRA 5.1% · JPN 4.9%

Full predicted group tables, all 104 match scores and the complete knockout
bracket: **open `docs/index.html`** or see [the website](#-the-website).

## 🌐 The website

The frontend is a dependency-free static page (dark theme, Polish UI) that
only renders `docs/results.json` — no logic in the browser.

To publish it with GitHub Pages:
**Settings → Pages → Source: _Deploy from a branch_ → branch
`claude/loving-knuth-h6u3pz`, folder `/docs` → Save.**
The page appears at `https://norgeth.github.io/Mundial2026/` after ~2 minutes.

It also works offline — just open `docs/index.html` from disk (a `results.js`
fallback covers `file://` browsing).

## 🏗️ Architecture

```
data/raw/                  # raw research files (one per data-gathering task)
data/snapshot.json         # merged & validated database — the source of truth
engine/predictor.py        # match model: Power Index, Poisson + Dixon-Coles
engine/bracket.py          # tables, third-place ranking/allocation, bracket flow
engine/run_simulation.py   # entry point -> docs/results.json (+ results.js)
engine/merge_snapshot.py   # merges data/raw/* into the snapshot, validates
engine/build_*.py          # reproducible builders for the raw data files
docs/                      # static frontend (GitHub Pages-ready)
```

Data flows one way: `snapshot.json → run_simulation.py → results.json →
index.html`. The frontend contains no logic — it only renders.

## 🧮 The model

1. **Power Index (0–100)** per team:
   `0.50 × normalized FIFA points + 0.30 × recency-weighted form (last 5) +
   0.20 × sigmoid of avg goal difference`. Head-to-head history (last ≤3
   direct meetings) adds a capped ±4 adjustment in group matches — kept
   small and separate because 28 of the 72 group pairings have never played
   each other.
2. **Expected goals**: the power difference sets each side's baseline
   (`1.35 × 10^(Δ/180)`), multiplied by attack/defence factors from the last
   5 matches. The 5-match averages are Bayesian-shrunk toward the World Cup
   mean (prior worth 3 matches) so e.g. a short clean-sheet streak doesn't
   imply an impenetrable defence. λ clamped to [0.3, 3.0].
3. **Score grid**: independent Poisson over 0..8 goals with a Dixon-Coles
   correction (ρ = 0.10) trimming the over-represented 0:0/1:1 cells.
4. **Deterministic result** — two-stage argmax: pick the most probable
   outcome (win/draw/win) by total probability mass, then the most probable
   scoreline within it. Knockout draws are resolved by the larger win-mass
   ("penalties"). Same output on every run, and tables/bracket are always
   consistent with the displayed scores.
5. **Monte Carlo layer**: 10 000 full-tournament simulations
   (`random.Random(2026)`) produce championship/advancement probabilities as
   a secondary statistic — they never alter the canonical timeline.

A by-product of the most-likely-outcome rule: predicted group scorelines
contain no draws, because a draw is rarely the single most probable result
of a match. This is intentional, not a bug.

Third-place teams are allocated to Round-of-32 slots by deterministic
constraint matching over the official per-slot candidate groups (FIFA's full
Annex C lookup table is not publicly reproduced).

## 📊 Data snapshot (frozen 2026-06-10)

| Dataset | Source | Verification |
|---|---|---|
| Groups & bracket template | FIFA.com, Wikipedia, Sky Sports | cross-checked across 3 sources, official match numbering 73–104 |
| FIFA ranking (1 Apr 2026) | official-ranking datasets + ESPN top-50 | exact published points for all 48 teams; confirmed the 1 Apr edition is the latest official one in force on 2026-06-10 (next release: 11 Jun 2026) |
| Last 5 matches per team | [martj42/international_results](https://github.com/martj42/international_results) | all 48 teams spot-checked against ESPN/federation sources; 3 corrections found & fixed (RSA, CZE, CPV) |
| Head-to-head (72 group pairs) | same dataset | all 33 pairs with history verified; 39 never-met pairs confirmed |

Every raw file carries its own `source_urls` and `data_quality` audit trail.

## 🔁 Reproducing

```bash
# 1. (optional) rebuild raw data from the matches dataset
curl -sL -o /tmp/results.csv https://raw.githubusercontent.com/martj42/international_results/master/results.csv
python3 engine/build_raw_from_dataset.py
python3 engine/build_ranking_raw.py

# 2. merge + validate the snapshot
python3 engine/merge_snapshot.py

# 3. run the simulation (deterministic; ~4 s including Monte Carlo)
cd engine && python3 run_simulation.py
```

Pure Python 3 stdlib — no dependencies.

---

## 🇵🇱 Skrót po polsku

Silnik predykcji Mundialu 2026: dane rzeczywiste zamrożone w przeddzień
turnieju (ranking FIFA z 1.04.2026, forma z ostatnich 5 meczów i historia
H2H dla wszystkich 48 drużyn), deterministyczny algorytm (Power Index →
model Poissona z korektą Dixona-Colesa → dwustopniowy argmax) symuluje
wszystkie 104 mecze od fazy grupowej po finał, a warstwa Monte Carlo
(10 000 turniejów) liczy procentowe szanse na mistrzostwo.

**Przewidywany mistrz: Argentyna** (1:0 z Belgią w finale, 35,3% szans wg
Monte Carlo). Wyniki ogląda się na statycznej stronie `docs/index.html`
(polski interfejs) — instrukcja publikacji przez GitHub Pages powyżej.
