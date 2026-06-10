"""Run the full World Cup 2026 simulation and write docs/results.json (+ .js).

Deterministic core: every group match and knockout tie resolved by the
two-stage argmax of the Dixon-Coles-corrected Poisson grid — identical
output on every run. A seeded Monte Carlo layer (N tournaments) adds
advancement/championship probabilities as a secondary statistic.
"""

import json
import random
from datetime import date
from pathlib import Path

import awards
import bracket
import predictor

ROOT = Path(__file__).resolve().parent.parent
MC_RUNS = 10_000
MC_SEED = 2026


def load_snapshot():
    with open(ROOT / "data" / "snapshot.json", encoding="utf-8") as f:
        return json.load(f)


def build_models(snapshot, news_scores=None):
    pts = [t["fifa_points"] for t in snapshot["teams"].values()]
    lo, hi = min(pts), max(pts)
    news = news_scores or {}
    return {
        code: predictor.TeamModel(code, t["fifa_points"], t["recent_matches"], lo, hi, news.get(code))
        for code, t in snapshot["teams"].items()
    }


def build_h2h_index(snapshot):
    index = {}
    for pair in snapshot["h2h"]:
        index[(pair["team_a"], pair["team_b"])] = pair["matches"]
    return index


def h2h_delta(index, home, away):
    if (home, away) in index:
        return predictor.h2h_power_delta(index[(home, away)])
    if (away, home) in index:
        return -predictor.h2h_power_delta(index[(away, home)])
    return 0.0


class GridCache:
    """Caches the score grid (and cumulative form) per ordered fixture."""

    def __init__(self, models, h2h_index):
        self.models = models
        self.h2h_index = h2h_index
        self._grids = {}

    def grid(self, home, away, use_h2h):
        key = (home, away, use_h2h)
        if key not in self._grids:
            delta = h2h_delta(self.h2h_index, home, away) if use_h2h else 0.0
            lam_h, lam_a = predictor.expected_goals(
                self.models[home], self.models[away], delta)
            grid = predictor.score_matrix(lam_h, lam_a)
            cells, cum = predictor.cumulative_cells(grid)
            self._grids[key] = (grid, cells, cum, (lam_h, lam_a))
        return self._grids[key]


def knockout_winner(grid, home, away, score, models):
    """Resolve a knockout tie; returns (winner, decided_by_penalties)."""
    gh, ga = score
    if gh != ga:
        return (home if gh > ga else away), False
    win_h, _, win_a = predictor.outcome_masses(grid)
    if win_h != win_a:
        return (home if win_h > win_a else away), True
    if models[home].power != models[away].power:
        return (home if models[home].power > models[away].power else away), True
    return (home if models[home].fifa_points >= models[away].fifa_points else away), True


def simulate_group_stage(snapshot, cache, score_fn):
    """score_fn(home, away, grid_tuple) -> (gh, ga). Returns matches + tables."""
    group_matches, tables = {}, {}
    for letter, codes in snapshot["groups"].items():
        results = []
        for i, j in bracket.GROUP_FIXTURES:
            home, away = codes[i], codes[j]
            grid_tuple = cache.grid(home, away, use_h2h=True)
            gh, ga = score_fn(home, away, grid_tuple)
            results.append((home, away, gh, ga))
        order, stats = bracket.standings(codes, results, cache.models)
        group_matches[letter] = results
        tables[letter] = (order, stats)
    return group_matches, tables


def qualify_thirds(snapshot, tables, models):
    thirds = [(letter, order[2], stats[order[2]])
              for letter, (order, stats) in tables.items()]
    ranked = bracket.rank_thirds(thirds, models)
    qualified_groups = [e[0] for e in ranked[:8]]
    third_slots = sorted(
        (m["match_id"], set(m["away"][1:]))
        for m in snapshot["round_of_32"] if m["away"].startswith("3")
    )
    allocation = bracket.allocate_thirds(third_slots, qualified_groups)
    return ranked, allocation


def resolve_slot(slot, tables, allocation, ko_results, match_id):
    if slot.startswith("W"):
        return ko_results[int(slot[1:])]["winner"]
    if slot.startswith("L"):
        return ko_results[int(slot[1:])]["loser"]
    pos = int(slot[0])
    if pos == 3:
        group = allocation[match_id]
    else:
        group = slot[1]
    return tables[group][0][pos - 1]


def simulate_knockout(snapshot, cache, tables, allocation, score_fn, draw_fn):
    """draw_fn(grid, home, away, score) -> (winner, by_penalties)."""
    ko = {}
    rounds = [("R32", snapshot["round_of_32"]),
              ("R16", snapshot["bracket_flow"]["R16"]),
              ("QF", snapshot["bracket_flow"]["QF"]),
              ("SF", snapshot["bracket_flow"]["SF"]),
              ("third_place", [snapshot["bracket_flow"]["third_place"]]),
              ("F", [snapshot["bracket_flow"]["F"]])]
    by_round = {}
    for round_name, fixtures in rounds:
        round_matches = []
        for m in fixtures:
            mid = m["match_id"]
            home = resolve_slot(m["home"], tables, allocation, ko, mid)
            away = resolve_slot(m["away"], tables, allocation, ko, mid)
            grid_tuple = cache.grid(home, away, use_h2h=False)
            score = score_fn(home, away, grid_tuple)
            winner, pens = draw_fn(grid_tuple[0], home, away, score)
            ko[mid] = {
                "match_id": mid, "home": home, "away": away,
                "score": list(score), "winner": winner,
                "loser": away if winner == home else home,
                "penalties": pens,
            }
            round_matches.append(ko[mid])
        by_round[round_name] = round_matches
    return ko, by_round


def deterministic_run(snapshot, cache, models):
    score_fn = lambda h, a, gt: predictor.predict_score(gt[0])
    draw_fn = lambda grid, h, a, s: knockout_winner(grid, h, a, s, models)
    group_matches, tables = simulate_group_stage(snapshot, cache, score_fn)
    ranked_thirds, allocation = qualify_thirds(snapshot, tables, models)
    ko, by_round = simulate_knockout(snapshot, cache, tables, allocation,
                                     score_fn, draw_fn)
    return group_matches, tables, ranked_thirds, allocation, ko, by_round


def monte_carlo(snapshot, cache, models):
    rnd = random.Random(MC_SEED)
    counters = {c: {"advance": 0, "qf": 0, "sf": 0, "final": 0, "champion": 0}
                for c in snapshot["teams"]}

    def score_fn(home, away, grid_tuple):
        _, cells, cum, _ = grid_tuple
        return predictor.sample_score(cells, cum, rnd)

    def draw_fn(grid, home, away, score):
        gh, ga = score
        if gh != ga:
            return (home if gh > ga else away), False
        win_h, _, win_a = predictor.outcome_masses(grid)
        p = win_h / (win_h + win_a) if (win_h + win_a) > 0 else 0.5
        return (home if rnd.random() < p else away), True

    for _ in range(MC_RUNS):
        _, tables = simulate_group_stage(snapshot, cache, score_fn)
        _, allocation = qualify_thirds(snapshot, tables, models)
        _, by_round = simulate_knockout(snapshot, cache, tables, allocation,
                                        score_fn, draw_fn)
        for m in by_round["R32"]:
            counters[m["home"]]["advance"] += 1
            counters[m["away"]]["advance"] += 1
        for m in by_round["QF"]:
            counters[m["home"]]["qf"] += 1
            counters[m["away"]]["qf"] += 1
        for m in by_round["SF"]:
            counters[m["home"]]["sf"] += 1
            counters[m["away"]]["sf"] += 1
        final = by_round["F"][0]
        counters[final["home"]]["final"] += 1
        counters[final["away"]]["final"] += 1
        counters[final["winner"]]["champion"] += 1

    pct = lambda n: round(100.0 * n / MC_RUNS, 1)
    return {
        code: {k: pct(v) for k, v in c.items()}
        for code, c in counters.items()
    }


def main():
    snapshot = load_snapshot()
    news_path = ROOT / "data" / "raw" / "news_scores.json"
    news_scores = {}
    if news_path.exists():
        with open(news_path, encoding="utf-8") as f:
            news_scores = json.load(f)
        news_scores = {k: v for k, v in news_scores.items() if not k.startswith("_")}
    models = build_models(snapshot, news_scores)
    h2h_index = build_h2h_index(snapshot)
    cache = GridCache(models, h2h_index)

    (group_matches, tables, ranked_thirds,
     allocation, ko, by_round) = deterministic_run(snapshot, cache, models)

    print("Running Monte Carlo layer "
          f"({MC_RUNS} tournaments, seed {MC_SEED})...")
    mc = monte_carlo(snapshot, cache, models)

    team_goals, team_stage = {}, {}
    for letter, matches in group_matches.items():
        for home, away, gh, ga in matches:
            team_goals[home] = team_goals.get(home, 0) + gh
            team_goals[away] = team_goals.get(away, 0) + ga
    for rnd_name, matches in by_round.items():
        for m in matches:
            team_goals[m["home"]] += m["score"][0]
            team_goals[m["away"]] += m["score"][1]
            team_stage[m["home"]] = rnd_name
            team_stage[m["away"]] = rnd_name
    champion = by_round["F"][0]["winner"]
    team_stage[champion] = "CHAMPION"

    awards_result = None
    players_path = ROOT / "data" / "raw" / "players.json"
    if players_path.exists():
        with open(players_path, encoding="utf-8") as f:
            players = json.load(f)
        awards_result = awards.compute_awards(players, team_goals,
                                              team_stage, champion)

    results = {
        "meta": {
            "generated_at": date.today().isoformat(),
            "snapshot_date": snapshot["meta"]["snapshot_date"],
            "ranking_edition": snapshot["meta"].get("ranking_edition"),
            "algorithm": {
                "weights": {"fifa_rank": predictor.WEIGHT_RANK,
                            "form": predictor.WEIGHT_FORM,
                            "goals": predictor.WEIGHT_GOALS,
                            "news": predictor.WEIGHT_NEWS},
                "h2h_cap": predictor.H2H_DELTA_CAP,
                "dixon_coles_rho": predictor.DIXON_COLES_RHO,
                "lambda_bounds": [predictor.LAMBDA_MIN, predictor.LAMBDA_MAX],
                "monte_carlo": {"runs": MC_RUNS, "seed": MC_SEED},
            },
        },
        "teams": {
            code: {
                "name_pl": t["name_pl"],
                "name_en": t["name_en"],
                "group": t["group"],
                "fifa_rank": t["fifa_rank"],
                "fifa_points": t["fifa_points"],
                "power": round(models[code].power, 1),
                "form": models[code].form_string,
            }
            for code, t in snapshot["teams"].items()
        },
        "group_stage": {
            letter: {
                "matches": [
                    {"home": h, "away": a, "score": [gh, ga]}
                    for h, a, gh, ga in group_matches[letter]
                ],
                "table": [
                    {"pos": idx + 1, "code": code, **tables[letter][1][code]}
                    for idx, code in enumerate(tables[letter][0])
                ],
            }
            for letter in sorted(snapshot["groups"])
        },
        "third_place": {
            "ranking": [
                {"group": g, "code": c, "Pts": s["Pts"], "GD": s["GD"],
                 "GF": s["GF"], "qualified": i < 8}
                for i, (g, c, s) in enumerate(ranked_thirds)
            ],
            "allocation": {str(mid): g for mid, g in allocation.items()},
        },
        "knockout": {
            rnd_name: [
                {"match_id": m["match_id"], "home": m["home"], "away": m["away"],
                 "score": m["score"], "winner": m["winner"],
                 "penalties": m["penalties"]}
                for m in matches
            ]
            for rnd_name, matches in by_round.items()
        },
        "champion": by_round["F"][0]["winner"],
        "third_place_winner": by_round["third_place"][0]["winner"],
        "awards": awards_result,
        "monte_carlo": mc,
    }

    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)
    with open(docs / "results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    # JS fallback so docs/index.html also works when opened from file://
    with open(docs / "results.js", "w", encoding="utf-8") as f:
        f.write("window.MUNDIAL_RESULTS = ")
        json.dump(results, f, ensure_ascii=False)
        f.write(";\n")

    champ = results["teams"][results["champion"]]["name_en"]
    final = by_round["F"][0]
    print(f"Champion: {champ} "
          f"({final['home']} {final['score'][0]}:{final['score'][1]} {final['away']}"
          f"{' p.' if final['penalties'] else ''})")
    print(f"Wrote {docs / 'results.json'}")


if __name__ == "__main__":
    main()
