"""Match prediction core for the Mundial Predictor Engine.

Hybrid model (variant C from the architecture review):
- Power Index per team: normalized FIFA points (50%) + recency-weighted
  form from the last 5 matches (30%) + sigmoid of average goal difference (20%).
- Expected goals derived from the power difference, scaled by each side's
  attack/defence averages (square-rooted to dampen the noisy 5-match sample).
- Independent-Poisson score grid with a Dixon-Coles low-score correction.
- Two-stage argmax: first fix the outcome (win/draw/loss) by total
  probability mass, then pick the most probable scoreline within it.
"""

import math
from bisect import bisect_right

WEIGHT_RANK = 0.50
WEIGHT_FORM = 0.30
WEIGHT_GOALS = 0.20
FORM_RECENCY_WEIGHTS = [1.00, 0.85, 0.70, 0.55, 0.40]  # newest match first
GOAL_SIGMOID_K = 0.4
H2H_DELTA_PER_WIN = 1.33
H2H_DELTA_CAP = 4.0
BASE_GOALS = 1.35            # half of the ~2.7 goals/match World Cup average
POWER_EXP_SCALE = 180.0      # power delta of ~40 -> lambdas around 2.2 vs 0.8
SHRINK_PRIOR_WEIGHT = 3      # Bayesian shrink of 5-match GF/GA averages
                             # toward BASE_GOALS (prior worth 3 matches),
                             # so a 5-game clean-sheet streak doesn't imply
                             # a near-impenetrable defence
LAMBDA_MIN = 0.3
LAMBDA_MAX = 3.0
MAX_GOALS = 8
DIXON_COLES_RHO = 0.10       # positive rho trims excess 0:0 and 1:1 cells


def poisson_pmf(k, lam):
    return math.exp(-lam) * lam ** k / math.factorial(k)


class TeamModel:
    """Per-team strength figures derived once from the data snapshot."""

    def __init__(self, code, fifa_points, recent_matches, min_pts, max_pts):
        self.code = code
        self.fifa_points = fifa_points
        self.rank_score = 100.0 * (fifa_points - min_pts) / (max_pts - min_pts)
        self.form_score = self._form_score(recent_matches)
        self.avg_scored, self.avg_conceded = self._goal_averages(recent_matches)
        self.goal_score = self._goal_score()
        n = len(recent_matches)
        self.attack_avg = self._shrink(self.avg_scored, n)
        self.defence_avg = self._shrink(self.avg_conceded, n)
        # Teams with no verifiable recent matches fall back to their rank score
        # for the form component instead of being silently punished.
        form = self.form_score if self.form_score is not None else self.rank_score
        self.power = (WEIGHT_RANK * self.rank_score
                      + WEIGHT_FORM * form
                      + WEIGHT_GOALS * self.goal_score)
        self.form_string = self._form_string(recent_matches)

    @staticmethod
    def _shrink(avg, n):
        if avg is None:
            return BASE_GOALS
        k = SHRINK_PRIOR_WEIGHT
        return (n * avg + k * BASE_GOALS) / (n + k)

    @staticmethod
    def _form_string(matches):
        out = []
        for m in matches[:5]:
            if m["goals_for"] > m["goals_against"]:
                out.append("W")
            elif m["goals_for"] == m["goals_against"]:
                out.append("D")
            else:
                out.append("L")
        return "".join(out)

    @staticmethod
    def _form_score(matches):
        if not matches:
            return None
        total, weight_sum = 0.0, 0.0
        for m, w in zip(matches, FORM_RECENCY_WEIGHTS):
            if m["goals_for"] > m["goals_against"]:
                pts = 3
            elif m["goals_for"] == m["goals_against"]:
                pts = 1
            else:
                pts = 0
            total += pts * w
            weight_sum += w
        return 100.0 * total / (3.0 * weight_sum)

    @staticmethod
    def _goal_averages(matches):
        if not matches:
            return None, None
        n = len(matches)
        scored = sum(m["goals_for"] for m in matches) / n
        conceded = sum(m["goals_against"] for m in matches) / n
        return scored, conceded

    def _goal_score(self):
        if self.avg_scored is None:
            return 50.0
        diff = self.avg_scored - self.avg_conceded
        return 100.0 / (1.0 + math.exp(-GOAL_SIGMOID_K * diff))


def h2h_power_delta(h2h_matches):
    """Power delta in favour of team_a, from up to 3 direct meetings."""
    balance = 0
    for m in h2h_matches[:3]:
        if m["goals_a"] > m["goals_b"]:
            balance += 1
        elif m["goals_a"] < m["goals_b"]:
            balance -= 1
    delta = H2H_DELTA_PER_WIN * balance
    return max(-H2H_DELTA_CAP, min(H2H_DELTA_CAP, delta))


def _strength_factor(shrunk_avg):
    return math.sqrt(shrunk_avg / BASE_GOALS)


def expected_goals(team_a, team_b, h2h_delta=0.0):
    delta = (team_a.power - team_b.power) + h2h_delta
    base_a = BASE_GOALS * 10 ** (delta / POWER_EXP_SCALE)
    base_b = BASE_GOALS * 10 ** (-delta / POWER_EXP_SCALE)
    lam_a = base_a * _strength_factor(team_a.attack_avg) * _strength_factor(team_b.defence_avg)
    lam_b = base_b * _strength_factor(team_b.attack_avg) * _strength_factor(team_a.defence_avg)
    clamp = lambda x: max(LAMBDA_MIN, min(LAMBDA_MAX, x))
    return clamp(lam_a), clamp(lam_b)


def score_matrix(lam_a, lam_b):
    """(MAX_GOALS+1)^2 probability grid with Dixon-Coles correction, renormalized."""
    pa = [poisson_pmf(k, lam_a) for k in range(MAX_GOALS + 1)]
    pb = [poisson_pmf(k, lam_b) for k in range(MAX_GOALS + 1)]
    grid = [[pa[a] * pb[b] for b in range(MAX_GOALS + 1)] for a in range(MAX_GOALS + 1)]
    rho = DIXON_COLES_RHO
    grid[0][0] *= 1.0 - lam_a * lam_b * rho
    grid[0][1] *= 1.0 + lam_a * rho
    grid[1][0] *= 1.0 + lam_b * rho
    grid[1][1] *= 1.0 - rho
    total = sum(sum(row) for row in grid)
    return [[v / total for v in row] for row in grid]


def outcome_masses(grid):
    win_a = draw = win_b = 0.0
    for a in range(MAX_GOALS + 1):
        for b in range(MAX_GOALS + 1):
            if a > b:
                win_a += grid[a][b]
            elif a == b:
                draw += grid[a][b]
            else:
                win_b += grid[a][b]
    return win_a, draw, win_b


def predict_score(grid):
    """Two-stage argmax: most probable outcome, then most probable score in it."""
    win_a, draw, win_b = outcome_masses(grid)
    outcome = max((win_a, "A"), (draw, "D"), (win_b, "B"), key=lambda t: t[0])[1]
    best, best_score = -1.0, (0, 0)
    for a in range(MAX_GOALS + 1):
        for b in range(MAX_GOALS + 1):
            region = "A" if a > b else ("D" if a == b else "B")
            if region == outcome and grid[a][b] > best:
                best, best_score = grid[a][b], (a, b)
    return best_score


def cumulative_cells(grid):
    """Flattened cumulative distribution for Monte Carlo sampling."""
    cells, cum, acc = [], [], 0.0
    for a in range(MAX_GOALS + 1):
        for b in range(MAX_GOALS + 1):
            acc += grid[a][b]
            cells.append((a, b))
            cum.append(acc)
    return cells, cum


def sample_score(cells, cum, rnd):
    r = rnd.random() * cum[-1]
    return cells[bisect_right(cum, r)]
