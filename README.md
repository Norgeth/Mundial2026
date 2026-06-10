# Mundial Predictor Engine — Mundial 2026

![Python](https://img.shields.io/badge/python-3.x_stdlib_only-3776AB?logo=python&logoColor=white)
![Deterministic](https://img.shields.io/badge/symulacja-deterministyczna-34d399)
![Monte Carlo](https://img.shields.io/badge/monte_carlo-10\,000_turniejów-60a5fa)
![Snapshot](https://img.shields.io/badge/snapshot_danych-2026--06--10-fbbf24)

Silnik symulacji Mundialu 2026 oparty na zamrożonym snapshocie rzeczywistych
danych piłkarskich (10 czerwca 2026). Deterministyczny algorytm rozgrywa
wszystkie 104 mecze — od fazy grupowej po finał — i renderuje wyniki na
dwujęzycznej stronie statycznej (PL/EN).

## Wynik

| | Drużyna | Uwaga |
|---|---|---|
| 🥇 | **Argentyna** | pokonuje Belgię 1:0 w finale |
| 🥈 | Belgia | |
| 🥉 | Niemcy | pokonują Maroko 2:1 w meczu o 3. miejsce |

Szanse na mistrzostwo (Monte Carlo, 10 000 symulowanych turniejów):
**ARG 36,9%** · BEL 12,9% · GER 8,5% · FRA 6,2% · JPN 5,5% · POR 5,1%

Nagrody indywidualne: **Złoty But** — Florian Wirtz (Niemcy, 6 goli) ·
**Złota Piłka** — Lionel Messi (Argentyna)

Pełne tabele grup, wszystkie 104 wyniki i drabinka pucharowa:
**otwórz `docs/index.html`** lub odwiedź [stronę](#strona).

## Strona

Statyczna strona bez żadnych zależności (ciemny motyw, przełącznik PL/EN).
Publikacja przez GitHub Pages w ~2 minuty:

**Settings → Pages → Source: _Deploy from a branch_ → branch `main`, folder
`/docs` → Save.**

Strona dostępna pod `https://norgeth.github.io/Mundial2026/`.

Działa też offline — otwórz `docs/index.html` z dysku (plik `results.js`
obsługuje tryb `file://`).

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

1. **Power Index (0–100)** na drużynę — cztery składniki:
   - `0,50 × znormalizowane punkty FIFA`
   - `0,25 × ważona forma` (ostatnie 5 meczów, nowsze ważone wyżej)
   - `0,15 × sigmoid bilansu bramkowego`
   - `0,10 × gotowość przed turniejem` (sprawność zawodników, morale, kontuzje
     — ocena 1–10 na podstawie artykułów z tygodnia przed turniejem)

   Historia H2H (≤3 bezpośrednie spotkania) dodaje korekę ±4 w fazie grupowej.

2. **Oczekiwane bramki**: różnica Power Index wyznacza bazę każdej drużyny
   (`1,35 × 10^(Δ/180)`), mnożoną przez wskaźniki ataku/obrony z ostatnich
   5 meczów. Średnie skurczone bayesowsko w kierunku średniej MŚ (prior = 3 mecze).
   λ ograniczone do [0,3; 3,0].

3. **Siatka wyników**: niezależny Poisson dla 0–8 goli z korektą Dixona-Colesa
   (ρ = 0,10) — redukuje nadreprezentację wyników 0:0 i 1:1.

4. **Wynik deterministyczny** — dwustopniowy argmax: najpierw wynik (W/R/P),
   potem najczęstszy scoreline w jego ramach. Identyczny wynik przy każdym
   uruchomieniu.

5. **Monte Carlo**: 10 000 pełnych symulacji (`random.Random(2026)`) daje
   procentowe szanse na mistrzostwo i awans. Nie zmienia kanonicznej osi meczów.

## Snapshot danych (zamrożony 2026-06-10)

| Zbiór | Źródło | Weryfikacja |
|---|---|---|
| Grupy i drabinka | FIFA.com, Wikipedia, Sky Sports | sprawdzono w 3 źródłach, numery meczów 73–104 |
| Ranking FIFA (1.04.2026) | oficjalne datasety + ESPN | dokładne punkty dla 48 drużyn |
| Ostatnie 5 meczów | [martj42/international\_results](https://github.com/martj42/international_results) | wszystkie 48 drużyn zweryfikowane; 3 poprawki |
| H2H (72 pary) | j.w. | 33 pary z historią potwierdzone; 39 nigdy nie grało |
| Gotowość drużyn | artykuły prasowe (czerwiec 2026) | 11 czołowych drużyn zbadanych, reszta domyślnie wg rangi |
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

**Model:** Power Index = 50% FIFA rank + 25% form + 15% goal diff + 10%
pre-tournament readiness. Poisson + Dixon-Coles score grid, deterministic
two-stage argmax, 10 000 Monte Carlo runs.

**Frontend:** dependency-free static page with PL/EN language toggle,
served from `/docs` — GitHub Pages-ready.

**Data:** FIFA ranking (1 Apr 2026), last-5-match form, H2H for all 72 group
pairs, squad readiness scores from news articles, top-3 NT scorers per team.
All 48 teams, pure Python 3 stdlib.
