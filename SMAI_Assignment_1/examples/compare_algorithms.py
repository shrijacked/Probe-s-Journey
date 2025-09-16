from src.puzzle import AsteroidFieldPuzzle
from src.search_algorithms import depth_first_search, breadth_first_search, best_first_search
from src.heuristics import manhattan_distance_heuristic, asteroid_blocking_heuristic
from src.utils import load_puzzle_from_file


if __name__ == "__main__":
    grid = load_puzzle_from_file("input/puzzle2.txt")
    puzzle = AsteroidFieldPuzzle(grid)

    algos = [
        ("DFS", lambda s: depth_first_search(s)),
        ("BFS", lambda s: breadth_first_search(s)),
        ("Best-First Manhattan", lambda s: best_first_search(s, manhattan_distance_heuristic)),
        ("Best-First Enhanced", lambda s: best_first_search(s, asteroid_blocking_heuristic)),
    ]

    for name, algo in algos:
        sol, nodes = algo(puzzle)
        print(f"{name}: moves={len(sol) if sol else None}, nodes={nodes}")


