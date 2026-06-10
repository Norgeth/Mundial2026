# Mundial Predictor Engine — Mundial 2026

![Python](https://img.shields.io/badge/python-3.x_stdlib_only-3776AB?logo=python&logoColor=white)
![Deterministic](https://img.shields.io/badge/symulacja-deterministyczna-34d399)
![Monte Carlo](https://img.shields.io/badge/monte_carlo-10\,000_turniejów-60a5fa)
![Snapshot](https://img.shields.io/badge/snapshot_danych-2026--06--10-fbbf24)

Symulacja Mundialu 2026 oparta na rzeczywistych danych z czerwca 2026.
Algorytm przewiduje wszystkie 104 mecze — od grup do finału — i wyświetla
wyniki na dwujęzycznej stronie (PL/EN).

## Wynik

| | Drużyna | Uwaga |
|---|---|---|
| 🥇 | **Argentyna** | pokonuje Belgię 1:0 w finale |
| 🥈 | Belgia | |
| 🥉 | Niemcy | pokonują Maroko 2:1 w meczu o 3. miejsce |

Szanse na mistrzostwo (Monte Carlo, 10 000 symulowanych turniejów):
**ARG 34,9%** · BEL 12,9% · GER 8,2% · FRA 6,4% · POR 5,6% · ESP 5,0%

Nagrody indywidualne: **Złoty But** — Florian Wirtz (Niemcy, 6 goli) ·
**Złota Piłka** — Lionel Messi (Argentyna)

Pełne tabele grup, wszystkie 104 wyniki i drabinka pucharowa:
**otwórz `docs/index.html`** lub odwiedź [stronę](#strona).

## Strona

Wyniki dostępne na [norgeth.github.io/Mundial2026](https://norgeth.github.io/Mundial2026/) — ciemny motyw, przełącznik PL/EN. Działa też offline po otwarciu `docs/index.html` z dysku.

## Architektura

```
data/raw/                  # pliki z danymi (ranking FIFA, forma, H2H, strzelcy, readiness)
data/snapshot.json         # zmerge'owana, zwalidowana baza danych — źródło prawdy
engine/predictor.py        # model meczowy: Power Index, Poisson + Dixon-Coles
engine/bracket.py          # tabele, ranking 3. miejsc, przydział do R32
engine/run_simulation.py   # punkt wejścia → docs/results.json + results.js
engine/awards.py           # Złoty But / Złota Piłka
engine/merge_snapshot.py   # scala data/raw/* w snapshot, waliduje
docs/                      # statyczny frontend (gotowy na GitHub Pages)
```

Dane płyną jednostronnie: `snapshot.json → run_simulation.py → results.json → index.html`.
Frontend nie zawiera logiki — tylko renderuje wyliczone wyniki.

## Model

1. **Power Index (0–100)** na drużynę — dwa zestawy wag, osobne dla każdej fazy:

   **Faza grupowa** (równe wagi):
   - `0,25 × znormalizowane punkty FIFA`
   - `0,25 × ważona forma` (ostatnie 5 meczów, nowsze ważone wyżej)
   - `0,25 × sigmoid bilansu bramkowego`
   - `0,25 × gotowość przed turniejem` (ocena 1–10 z artykułów dla wszystkich 48 drużyn)

   **Faza pucharowa** (ranga FIFA decyduje):
   - `0,50 × znormalizowane punkty FIFA`
   - `~16,7% × forma`, `~16,7% × bilans bramkowy`, `~16,7% × gotowość`

   Historia H2H (≤3 bezpośrednie spotkania) dodaje korektę ±4 w fazie grupowej.

2. **Oczekiwane bramki**: wyliczane na bazie różnicy Power Index, modyfikowanej
   wskaźnikami ataku i obrony z ostatnich 5 meczów. Wyniki stabilizowane
   w kierunku historycznej średniej MŚ (żeby np. 5-mecz bez straconej bramki
   nie oznaczał "nieprzebitej obrony").

3. **Siatka wyników**: model statystyczny rozkładu goli (0–8 na drużynę),
   z korektą dla bardziej realistycznej wyceny wyników 0:0 i 1:1.

4. **Wynik deterministyczny** — algorytm wybiera najpierw najbardziej
   prawdopodobny wynik meczu (wygrana/remis/porażka), potem najczęstszy
   scoreline w tej kategorii. Zawsze ten sam wynik przy tym samym snapsocie.

5. **Monte Carlo**: 10 000 losowych symulacji całego turnieju daje
   procentowe szanse na mistrzostwo i awans — jako uzupełnienie
   wyniku deterministycznego, nie jego zamiennik.

## Snapshot danych (zamrożony 2026-06-10)

| Zbiór | Źródło | Weryfikacja |
|---|---|---|
| Grupy i drabinka | FIFA.com, Wikipedia, Sky Sports | sprawdzono w 3 źródłach, numery meczów 73–104 |
| Ranking FIFA (1.04.2026) | oficjalne datasety + ESPN | dokładne punkty dla 48 drużyn |
| Ostatnie 5 meczów | [martj42/international\_results](https://github.com/martj42/international_results) | wszystkie 48 drużyn zweryfikowane; 3 poprawki |
| H2H (72 pary) | j.w. | 33 pary z historią potwierdzone; 39 nigdy nie grało |
| Gotowość drużyn | artykuły prasowe (czerwiec 2026) | wszystkie 48 drużyn zbadane indywidualnie |
| Strzelcy reprezentacji | kwalifikacje + AFCON/Copa América | top-3 dla wszystkich 48 drużyn |

## Reprodukcja

```bash
# opcjonalnie: przebuduj dane surowe
curl -sL -o /tmp/results.csv https://raw.githubusercontent.com/martj42/international_results/master/results.csv
python3 engine/build_raw_from_dataset.py
python3 engine/build_ranking_raw.py

# scala i waliduje snapshot
python3 engine/merge_snapshot.py

# uruchamia symulację (~4 s łącznie z Monte Carlo)
cd engine && python3 run_simulation.py
```

Czyste Python 3 stdlib — zero zależności.

---

## English summary

Tournament-simulation engine for the 2026 FIFA World Cup, built on a frozen
data snapshot (2026-06-10). Deterministic algorithm across all 104 matches;
Monte Carlo layer for probabilities.

**Predicted champion: Argentina** (1:0 vs Belgium in the final, 36.9% Monte Carlo).

**Individual awards:** Golden Boot — Florian Wirtz (Germany, 6 goals) ·
Golden Ball — Lionel Messi (Argentina)

**Model:** Dual Power Index — group stage: 25% FIFA rank / 25% form / 25%
goal diff / 25% readiness; knockout: 50% FIFA rank / ~17% each remaining.
Readiness scores (1–10) from article searches for all 48 teams. Poisson +
Dixon-Coles score grid, deterministic two-stage argmax, 10 000 Monte Carlo runs.

**Frontend:** dependency-free static page with PL/EN language toggle,
served from `/docs` — GitHub Pages-ready.

**Data:** FIFA ranking (1 Apr 2026), last-5-match form, H2H for all 72 group
pairs, squad readiness scores from news articles, top-3 NT scorers per team.
All 48 teams, pure Python 3 stdlib.
