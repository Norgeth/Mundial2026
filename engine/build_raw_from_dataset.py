"""Build form_*.json and h2h_G_L.json raw files from the martj42 dataset.

Source: https://github.com/martj42/international_results (results.csv),
complete through 2026-06-08 at snapshot time. Expects the CSV at
/tmp/results.csv (see README). Produces the same file format the
data-gathering agents use, so merge_snapshot.py treats both identically.
"""

import csv
import json
from pathlib import Path

DATA_RAW = Path(__file__).resolve().parent.parent / "data" / "raw"
CSV_PATH = Path("/tmp/results.csv")
SNAPSHOT_DATE = "2026-06-10"
SOURCE_URL = "https://github.com/martj42/international_results"

CODE_TO_NAME = {
    "MEX": "Mexico", "RSA": "South Africa", "KOR": "South Korea",
    "CZE": "Czech Republic", "CAN": "Canada", "BIH": "Bosnia and Herzegovina",
    "QAT": "Qatar", "SUI": "Switzerland", "BRA": "Brazil", "MAR": "Morocco",
    "HAI": "Haiti", "SCO": "Scotland", "USA": "United States",
    "PAR": "Paraguay", "AUS": "Australia", "TUR": "Turkey", "GER": "Germany",
    "CUW": "Curaçao", "CIV": "Ivory Coast", "ECU": "Ecuador",
    "NED": "Netherlands", "JPN": "Japan", "SWE": "Sweden", "TUN": "Tunisia",
    "BEL": "Belgium", "EGY": "Egypt", "IRN": "Iran", "NZL": "New Zealand",
    "ESP": "Spain", "CPV": "Cape Verde", "KSA": "Saudi Arabia",
    "URU": "Uruguay", "FRA": "France", "SEN": "Senegal", "IRQ": "Iraq",
    "NOR": "Norway", "ARG": "Argentina", "ALG": "Algeria", "AUT": "Austria",
    "JOR": "Jordan", "POR": "Portugal", "COD": "DR Congo",
    "UZB": "Uzbekistan", "COL": "Colombia", "ENG": "England",
    "CRO": "Croatia", "GHA": "Ghana", "PAN": "Panama",
}
NAME_TO_CODE = {v: k for k, v in CODE_TO_NAME.items()}

GROUPS_A_F = ["MEX", "RSA", "KOR", "CZE", "CAN", "BIH", "QAT", "SUI",
              "BRA", "MAR", "HAI", "SCO", "USA", "PAR", "AUS", "TUR",
              "GER", "CUW", "CIV", "ECU", "NED", "JPN", "SWE", "TUN"]
GROUPS_G_L = ["BEL", "EGY", "IRN", "NZL", "ESP", "CPV", "KSA", "URU",
              "FRA", "SEN", "IRQ", "NOR", "ARG", "ALG", "AUT", "JOR",
              "POR", "COD", "UZB", "COL", "ENG", "CRO", "GHA", "PAN"]
GROUP_MEMBERS_G_L = [
    ["BEL", "EGY", "IRN", "NZL"], ["ESP", "CPV", "KSA", "URU"],
    ["FRA", "SEN", "IRQ", "NOR"], ["ARG", "ALG", "AUT", "JOR"],
    ["POR", "COD", "UZB", "COL"], ["ENG", "CRO", "GHA", "PAN"],
]


def load_matches():
    matches = []
    with open(CSV_PATH, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["home_score"] in ("NA", "") or row["date"] >= SNAPSHOT_DATE:
                continue
            matches.append(row)
    matches.sort(key=lambda r: r["date"])
    return matches


def team_form(matches, code):
    name = CODE_TO_NAME[code]
    out = []
    for row in reversed(matches):
        if row["home_team"] == name:
            opp, gf, ga = row["away_team"], row["home_score"], row["away_score"]
            venue = "N" if row["neutral"] == "TRUE" else "H"
        elif row["away_team"] == name:
            opp, gf, ga = row["home_team"], row["away_score"], row["home_score"]
            venue = "N" if row["neutral"] == "TRUE" else "A"
        else:
            continue
        out.append({
            "date": row["date"], "opponent": opp, "venue": venue,
            "goals_for": int(gf), "goals_against": int(ga),
            "competition": row["tournament"],
        })
        if len(out) == 5:
            break
    return out


def pair_h2h(matches, code_a, code_b):
    name_a, name_b = CODE_TO_NAME[code_a], CODE_TO_NAME[code_b]
    out = []
    for row in reversed(matches):
        if {row["home_team"], row["away_team"]} != {name_a, name_b}:
            continue
        if row["home_team"] == name_a:
            ga, gb = int(row["home_score"]), int(row["away_score"])
        else:
            ga, gb = int(row["away_score"]), int(row["home_score"])
        out.append({"date": row["date"], "goals_a": ga, "goals_b": gb,
                    "competition": row["tournament"]})
        if len(out) == 3:
            break
    return out


def main():
    matches = load_matches()
    print(f"Loaded {len(matches)} completed matches "
          f"(latest: {matches[-1]['date']})")

    for codes, fname in ((GROUPS_A_F, "form_A_F.json"),
                         (GROUPS_G_L, "form_G_L.json")):
        teams = {c: team_form(matches, c) for c in codes}
        short = [f"{c}: only {len(v)} matches" for c, v in teams.items()
                 if len(v) < 5]
        payload = {
            "source_urls": [SOURCE_URL],
            "data_quality": short or ["all teams have 5/5 matches"],
            "teams": teams,
        }
        with open(DATA_RAW / fname, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"Wrote {fname}: {len(teams)} teams, {len(short)} with gaps")

    pairs = []
    for group in GROUP_MEMBERS_G_L:
        for i in range(4):
            for j in range(i + 1, 4):
                a, b = group[i], group[j]
                pairs.append({"team_a": a, "team_b": b,
                              "matches": pair_h2h(matches, a, b)})
    empty = sum(1 for p in pairs if not p["matches"])
    payload = {
        "source_urls": [SOURCE_URL],
        "data_quality": [f"{empty} of 36 pairs have no recorded meeting"],
        "pairs": pairs,
    }
    with open(DATA_RAW / "h2h_G_L.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Wrote h2h_G_L.json: {len(pairs)} pairs, {empty} empty")


if __name__ == "__main__":
    main()
