"""Build data/raw/fifa_ranking.json for the April 2026 FIFA ranking edition.

Rank positions for all 48 finalists were verified via web search against the
1 April 2026 FIFA/Coca-Cola Men's World Ranking (ESPN top-50 summary, HITC
full-list article, aggregated ranking mirrors). Exact point totals were only
published for the top of the table in accessible sources; remaining teams'
points are interpolated from their verified rank along a typical FIFA points
curve (the engine normalizes points to 0-100, so only the curve shape
matters). Interpolated entries are flagged in data_quality.
"""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "raw" / "fifa_ranking.json"

# (code, rank) verified for the 2026-04-01 edition.
RANKS = [
    ("FRA", 1), ("ESP", 2), ("ARG", 3), ("ENG", 4), ("POR", 5), ("BRA", 6),
    ("NED", 7), ("MAR", 8), ("BEL", 9), ("GER", 10), ("CRO", 11),
    ("COL", 13), ("SEN", 14), ("MEX", 15), ("USA", 16), ("URU", 17),
    ("JPN", 18), ("SUI", 19), ("IRN", 21), ("TUR", 22), ("ECU", 23),
    ("AUT", 24), ("KOR", 25), ("AUS", 27), ("ALG", 28), ("EGY", 29),
    ("CAN", 30), ("NOR", 31), ("PAN", 33), ("CIV", 34), ("SWE", 38),
    ("PAR", 40), ("CZE", 41), ("SCO", 43), ("TUN", 44), ("COD", 46),
    ("UZB", 50), ("QAT", 55), ("IRQ", 57), ("RSA", 60), ("KSA", 61),
    ("JOR", 63), ("BIH", 65), ("CPV", 69), ("GHA", 74), ("CUW", 82),
    ("HAI", 83), ("NZL", 85),
]

# Exact published points (top of the April 2026 table).
EXACT_POINTS = {"FRA": 1877.32, "ESP": 1876.40, "ARG": 1874.81}

# Piecewise-linear reference curve (rank -> points), shaped after recent
# FIFA ranking editions and anchored to the published April 2026 top.
CURVE = [
    (1, 1877.3), (3, 1874.8), (4, 1832.0), (5, 1800.0), (7, 1762.0),
    (10, 1718.0), (12, 1696.0), (15, 1658.0), (18, 1630.0), (20, 1616.0),
    (25, 1574.0), (30, 1538.0), (35, 1504.0), (40, 1472.0), (45, 1446.0),
    (50, 1420.0), (55, 1394.0), (60, 1368.0), (65, 1342.0), (70, 1316.0),
    (75, 1292.0), (80, 1268.0), (85, 1246.0), (90, 1226.0),
]


def points_for_rank(rank):
    for (r1, p1), (r2, p2) in zip(CURVE, CURVE[1:]):
        if r1 <= rank <= r2:
            return round(p1 + (p2 - p1) * (rank - r1) / (r2 - r1), 2)
    raise ValueError(f"rank {rank} outside curve")


def main():
    teams, interpolated = {}, []
    for code, rank in RANKS:
        if code in EXACT_POINTS:
            pts = EXACT_POINTS[code]
        else:
            pts = points_for_rank(rank)
            interpolated.append(code)
        teams[code] = {"rank": rank, "points": pts}

    payload = {
        "ranking_edition": "FIFA Men's World Ranking, 1 April 2026",
        "source_urls": [
            "https://www.espn.com/soccer/story/_/id/46664763/fifa-mens-top-50-world-rankings",
            "https://www.hitc.com/official-fifa-rankings-in-full-ahead-of-2026-world-cup-including-mexico-canada-and-the-usa/",
            "https://inside.fifa.com/fifa-world-ranking/men",
        ],
        "data_quality": [
            "Rank positions verified for all 48 teams (1 April 2026 edition).",
            "Exact points published only for the top 3 in accessible sources; "
            f"points for {len(interpolated)} teams interpolated from verified "
            "rank along a typical FIFA points curve (see engine/build_ranking_raw.py).",
        ],
        "teams": teams,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Wrote {OUT}: {len(teams)} teams "
          f"({len(EXACT_POINTS)} exact, {len(interpolated)} interpolated)")


if __name__ == "__main__":
    main()
