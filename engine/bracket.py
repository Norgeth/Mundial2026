"""Group tables, third-place ranking/allocation and knockout bracket flow."""

# Round-robin schedule by draw position within a 4-team group.
GROUP_FIXTURES = [(0, 1), (2, 3), (0, 2), (1, 3), (0, 3), (1, 2)]


def standings(group_codes, results, models):
    """Ordered table for one group.

    results: list of (home, away, goals_home, goals_away).
    Tie-breakers: points, goal difference, goals for, then head-to-head
    points/GD among the exactly tied teams, then Power Index (deterministic
    stand-in for FIFA's drawing of lots).
    """
    stats = {c: {"P": 0, "W": 0, "D": 0, "L": 0, "GF": 0, "GA": 0, "Pts": 0}
             for c in group_codes}
    for home, away, gh, ga in results:
        for code, gf, gc in ((home, gh, ga), (away, ga, gh)):
            s = stats[code]
            s["P"] += 1
            s["GF"] += gf
            s["GA"] += gc
            if gf > gc:
                s["W"] += 1
                s["Pts"] += 3
            elif gf == gc:
                s["D"] += 1
                s["Pts"] += 1
            else:
                s["L"] += 1
    for s in stats.values():
        s["GD"] = s["GF"] - s["GA"]

    primary = lambda c: (-stats[c]["Pts"], -stats[c]["GD"], -stats[c]["GF"])
    order = sorted(group_codes, key=primary)

    final = []
    i = 0
    while i < len(order):
        cluster = [order[i]]
        while i + len(cluster) < len(order) and primary(order[i + len(cluster)]) == primary(order[i]):
            cluster.append(order[i + len(cluster)])
        if len(cluster) > 1:
            cluster = _break_tie(cluster, results, models)
        final.extend(cluster)
        i += len(cluster)
    return final, stats


def _break_tie(cluster, results, models):
    mini = {c: [0, 0] for c in cluster}  # [points, goal diff] in mutual matches
    members = set(cluster)
    for home, away, gh, ga in results:
        if home in members and away in members:
            if gh > ga:
                mini[home][0] += 3
            elif gh == ga:
                mini[home][0] += 1
                mini[away][0] += 1
            else:
                mini[away][0] += 3
            mini[home][1] += gh - ga
            mini[away][1] += ga - gh
    return sorted(cluster,
                  key=lambda c: (-mini[c][0], -mini[c][1], -models[c].power))


def rank_thirds(third_entries, models):
    """third_entries: list of (group_letter, code, stats). Best thirds first."""
    return sorted(third_entries,
                  key=lambda e: (-e[2]["Pts"], -e[2]["GD"], -e[2]["GF"],
                                 -models[e[1]].power))


def allocate_thirds(third_slots, qualified_groups):
    """Assign qualified third-place groups to R32 slots.

    third_slots: list of (match_id, allowed_group_letters) sorted by match_id.
    qualified_groups: group letters of the 8 qualified thirds, best-ranked first.
    Deterministic backtracking: each slot takes the best-ranked still-free
    third allowed in it, backtracking when a dead end appears. Approximation
    of FIFA's Annex C lookup table (which is not publicly reproduced).
    """
    def backtrack(i, remaining):
        if i == len(third_slots):
            return {}
        match_id, allowed = third_slots[i]
        for g in qualified_groups:
            if g in remaining and g in allowed:
                sub = backtrack(i + 1, remaining - {g})
                if sub is not None:
                    sub[match_id] = g
                    return sub
        return None

    result = backtrack(0, set(qualified_groups))
    if result is None:
        raise ValueError("No feasible third-place allocation found")
    return result
