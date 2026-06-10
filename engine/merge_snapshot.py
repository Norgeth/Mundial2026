"""Merge raw research files from data/raw/ into data/snapshot.json and validate.

Inputs (produced by the data-gathering agents):
  tournament_structure.json, fifa_ranking.json,
  form_A_F.json, form_G_L.json, h2h_A_F.json, h2h_G_L.json
"""

import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"


def load(name):
    with open(RAW_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def main():
    structure = load("tournament_structure.json")
    ranking = load("fifa_ranking.json")
    form = {**load("form_A_F.json")["teams"], **load("form_G_L.json")["teams"]}
    h2h = load("h2h_A_F.json")["pairs"] + load("h2h_G_L.json")["pairs"]

    errors, warnings = [], []
    teams = {}
    for letter, members in structure["groups"].items():
        if len(members) != 4:
            errors.append(f"Group {letter} has {len(members)} teams")
        for entry in members:
            code = entry["code"]
            rank = ranking["teams"].get(code)
            if rank is None:
                errors.append(f"{code}: missing FIFA ranking entry")
                continue
            matches = form.get(code, [])
            if len(matches) < 5:
                warnings.append(f"{code}: only {len(matches)} recent matches")
            teams[code] = {
                "name_en": entry["name_en"],
                "name_pl": entry["name_pl"],
                "group": letter,
                "fifa_rank": rank["rank"],
                "fifa_points": rank["points"],
                "recent_matches": matches[:5],
            }

    if len(teams) != 48:
        errors.append(f"Expected 48 teams, got {len(teams)}")

    pair_keys = set()
    for pair in h2h:
        a, b = pair["team_a"], pair["team_b"]
        if a not in teams or b not in teams:
            errors.append(f"H2H pair {a}-{b}: unknown team code")
            continue
        if teams[a]["group"] != teams[b]["group"]:
            errors.append(f"H2H pair {a}-{b}: not group rivals")
        pair_keys.add(frozenset((a, b)))
    if len(pair_keys) != 72:
        warnings.append(f"H2H covers {len(pair_keys)}/72 group pairs")

    snapshot = {
        "meta": {
            "snapshot_date": structure["meta"]["snapshot_date"],
            "ranking_edition": ranking.get("ranking_edition"),
            "sources": {
                "structure": structure["meta"].get("sources", []),
                "ranking": ranking.get("source_urls", []),
            },
            "data_quality": (
                ranking.get("data_quality", [])
                + load("form_A_F.json").get("data_quality", [])
                + load("form_G_L.json").get("data_quality", [])
                + load("h2h_A_F.json").get("data_quality", [])
                + load("h2h_G_L.json").get("data_quality", [])
            ),
        },
        "groups": {k: [m["code"] for m in v] for k, v in structure["groups"].items()},
        "teams": teams,
        "h2h": h2h,
        "round_of_32": structure["round_of_32"],
        "bracket_flow": structure["bracket_flow"],
    }

    for w in warnings:
        print(f"WARNING: {w}")
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    out = DATA_DIR / "snapshot.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)
    print(f"OK: wrote {out} ({len(teams)} teams, {len(pair_keys)} H2H pairs, "
          f"{len(warnings)} warnings)")


if __name__ == "__main__":
    main()
