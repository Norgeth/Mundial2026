# Mundial Predictor Engine — World Cup 2026

Automated data-analysis and tournament-simulation system. It froze a snapshot
of real-world football data on the eve of the 2026 FIFA World Cup
(2026-06-10), runs a deterministic prediction algorithm over the whole
tournament (group stage → Round of 32 → Final) and renders the pre-computed
results on a static HTML page (Polish UI).

**Predicted champion and full bracket: open `docs/index.html`** (or enable
GitHub Pages → deploy from the `docs/` folder).

## Architecture

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

## The model

1. **Power Index (0–100)** per team:
   `0.50 × normalized FIFA points + 0.30 × recency-weighted form (last 5) +
   0.20 × sigmoid of avg goal difference`. Head-to-head history adds a
   capped ±4 adjustment in group matches.
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

## Data snapshot (frozen 2026-06-10)

| Dataset | Source | Method |
|---|---|---|
| Groups & bracket template | FIFA.com, Wikipedia, Sky Sports (cross-checked) | web research |
| FIFA ranking (1 Apr 2026) | ESPN top-50, HITC full list | ranks verified for all 48; points exact for top 3, otherwise interpolated along a typical FIFA points curve (see `engine/build_ranking_raw.py`) |
| Last 5 matches per team | [martj42/international_results](https://github.com/martj42/international_results) (complete through 2026-06-09) | `engine/build_raw_from_dataset.py` |
| Head-to-head (72 group pairs) | same dataset + spot checks vs ESPN/federation sites | last ≤3 meetings per pair |

## Reproducing

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
