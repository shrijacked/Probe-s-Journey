from src.puzzle import AsteroidFieldPuzzle
from src.search_algorithms import depth_first_search, breadth_first_search, best_first_search
from src.heuristics import manhattan_distance_heuristic


def test_algorithms_run():
    grid = [
        [0, 0, 0, 4],
        [0, 2, 0, 0],
        [3, 0, 0, 0],
        [0, 0, 0, 0],
    ]
    p = AsteroidFieldPuzzle(grid)

    for fn in [depth_first_search, breadth_first_search]:
        sol, nodes = fn(p)
        assert nodes >= 1

    sol, nodes = best_first_search(p, manhattan_distance_heuristic)
    assert nodes >= 1


