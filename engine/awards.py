"""Individual awards derived from the deterministic tournament timeline.

Golden Boot (top scorer): each team's simulated tournament goals are
distributed among its key scorers proportionally to their share of recent
national-team goals (with a pseudo-count for the rest of the squad); the
player with the most expected goals wins, ties broken by the team's stage
reached, then by recent NT goals.

Golden Ball (player of the tournament): the designated star player of the
simulated champion — the convention most real tournaments follow.
"""

REST_OF_SQUAD_PSEUDO_GOALS = 2.0

STAGE_RANK = {"groups": 0, "R32": 1, "R16": 2, "QF": 3,
              "SF": 4, "third_place": 4, "F": 5, "CHAMPION": 6}


def compute_awards(players, team_goals, team_stage, champion):
    """players: parsed data/raw/players.json; team_goals/team_stage keyed by code."""
    candidates = []
    for code, pdata in players["teams"].items():
        goals = team_goals.get(code, 0)
        pool = sum(s["nt_goals_recent"] for s in pdata["scorers"])
        pool += REST_OF_SQUAD_PSEUDO_GOALS
        for s in pdata["scorers"]:
            xg = goals * s["nt_goals_recent"] / pool if pool else 0.0
            candidates.append({
                "player": s["name"],
                "team": code,
                "position": s["position"],
                "expected_goals": xg,
                "stage_rank": STAGE_RANK.get(team_stage.get(code, "groups"), 0),
                "nt_goals_recent": s["nt_goals_recent"],
            })
    boot = max(candidates,
               key=lambda c: (c["expected_goals"], c["stage_rank"],
                              c["nt_goals_recent"], c["player"]))

    golden_ball = None
    champ_data = players["teams"].get(champion)
    if champ_data:
        golden_ball = {"player": champ_data["star_player"], "team": champion}

    return {
        "golden_boot": {
            "player": boot["player"],
            "team": boot["team"],
            "goals": max(1, round(boot["expected_goals"])),
            "expected_goals": round(boot["expected_goals"], 2),
        },
        "golden_ball": golden_ball,
        "top_scorers": [
            {"player": c["player"], "team": c["team"],
             "expected_goals": round(c["expected_goals"], 2)}
            for c in sorted(candidates, key=lambda c: -c["expected_goals"])[:8]
        ],
    }
