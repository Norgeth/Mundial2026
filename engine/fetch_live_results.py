"""Fetch real World Cup 2026 results and write docs/live_results.json (+ .js).

Source: ESPN public scoreboard API (no key required):
  https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard

Only completed matches are stored. The frontend overlays these on top of
the predictions: in "live" view, scores are shown only for matches that
have actually been played.

Run manually or via the scheduled GitHub Action (.github/workflows/
live-results.yml). Pure Python 3 stdlib.
"""

import json
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = ("https://site.api.espn.com/apis/site/v2/sports/soccer/"
       "fifa.world/scoreboard?dates={dates}&limit=200")
TOURNAMENT_RANGE = "20260611-20260720"

# ESPN team naming -> our snapshot codes. Keyed on lowercase displayName;
# abbreviation is tried first when it matches one of our codes directly.
NAME_TO_CODE = {
    "mexico": "MEX", "south africa": "RSA", "south korea": "KOR",
    "korea republic": "KOR", "czech republic": "CZE", "czechia": "CZE",
    "canada": "CAN", "bosnia and herzegovina": "BIH", "qatar": "QAT",
    "switzerland": "SUI", "brazil": "BRA", "morocco": "MAR", "haiti": "HAI",
    "scotland": "SCO", "united states": "USA", "usa": "USA",
    "paraguay": "PAR", "australia": "AUS", "turkey": "TUR",
    "turkiye": "TUR", "türkiye": "TUR", "germany": "GER", "curacao": "CUW",
    "curaçao": "CUW", "ivory coast": "CIV", "côte d'ivoire": "CIV",
    "cote d'ivoire": "CIV", "ecuador": "ECU", "netherlands": "NED",
    "japan": "JPN", "sweden": "SWE", "tunisia": "TUN", "belgium": "BEL",
    "egypt": "EGY", "iran": "IRN", "ir iran": "IRN", "new zealand": "NZL",
    "spain": "ESP", "cape verde": "CPV", "cabo verde": "CPV",
    "saudi arabia": "KSA", "uruguay": "URU", "france": "FRA",
    "senegal": "SEN", "iraq": "IRQ", "norway": "NOR", "argentina": "ARG",
    "algeria": "ALG", "austria": "AUT", "jordan": "JOR", "portugal": "POR",
    "dr congo": "COD", "congo dr": "COD", "democratic republic of the congo": "COD",
    "uzbekistan": "UZB", "colombia": "COL", "england": "ENG",
    "croatia": "CRO", "ghana": "GHA", "panama": "PAN",
}
VALID_CODES = set(NAME_TO_CODE.values())


def resolve_code(competitor):
    team = competitor.get("team", {})
    abbr = (team.get("abbreviation") or "").upper()
    if abbr in VALID_CODES:
        return abbr
    for key in ("displayName", "name", "shortDisplayName"):
        name = (team.get(key) or "").strip().lower()
        if name in NAME_TO_CODE:
            return NAME_TO_CODE[name]
    return None


def fetch_scoreboard(dates=TOURNAMENT_RANGE):
    url = API.format(dates=dates)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def parse_events(data):
    """Extract completed matches as our normalized records."""
    matches = []
    for event in data.get("events", []):
        for comp in event.get("competitions", []):
            status = comp.get("status", {}).get("type", {})
            if not status.get("completed"):
                continue
            sides = {"home": None, "away": None}
            scores = {"home": None, "away": None}
            for c in comp.get("competitors", []):
                side = c.get("homeAway")
                if side not in sides:
                    continue
                sides[side] = resolve_code(c)
                try:
                    scores[side] = int(c.get("score"))
                except (TypeError, ValueError):
                    scores[side] = None
            if None in sides.values() or None in scores.values():
                continue
            when = (event.get("date") or "")[:10]
            matches.append({
                "home": sides["home"], "away": sides["away"],
                "score": [scores["home"], scores["away"]],
                "date": when,
                "status": "final",
            })
    matches.sort(key=lambda m: (m["date"], m["home"]))
    return matches


def write_outputs(matches, fetched=True):
    payload = {
        "meta": {
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source": "ESPN scoreboard API" if fetched else "init",
            "matches_final": len(matches),
        },
        "matches": matches,
    }
    docs = ROOT / "docs"
    with open(docs / "live_results.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    # file:// fallback, same pattern as results.js
    with open(docs / "live_results.js", "w", encoding="utf-8") as f:
        f.write("window.MUNDIAL_LIVE = ")
        json.dump(payload, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Wrote {len(matches)} final results -> docs/live_results.json")


def main():
    if "--init" in sys.argv:
        write_outputs([], fetched=False)
        return
    try:
        data = fetch_scoreboard()
    except Exception as exc:  # network failures must not break the site
        print(f"Fetch failed ({exc}); keeping existing live_results.json")
        sys.exit(0)
    write_outputs(parse_events(data))


if __name__ == "__main__":
    main()
