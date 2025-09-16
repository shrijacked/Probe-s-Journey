import argparse

from .puzzle import AsteroidFieldPuzzle
from .search_algorithms import depth_first_search, breadth_first_search, best_first_search
from .heuristics import manhattan_distance_heuristic, asteroid_blocking_heuristic
from .utils import print_grid, load_puzzle_from_file


def solve_with_all(grid):
    print("Initial State:")
    print_grid(grid)

    initial_state = AsteroidFieldPuzzle(grid)

    algorithms = [
        ("Depth First Search", depth_first_search),
        ("Breadth First Search", breadth_first_search),
        ("Best First Search (Manhattan)", lambda s: best_first_search(s, manhattan_distance_heuristic)),
        ("Best First Search (Enhanced)", lambda s: best_first_search(s, asteroid_blocking_heuristic)),
    ]

    for name, algo in algorithms:
        print(f"\n--- {name} ---")
        solution, nodes = algo(initial_state)
        if solution:
            print(f"Solution found in {len(solution)} moves!")
            print(f"Nodes explored: {nodes}")
            print(f"Solution path: {' -> '.join(solution)}")
        else:
            print("No solution found")


def main():
    parser = argparse.ArgumentParser(description="Navigate the Asteroid Field - SMAI Assignment 1")
    parser.add_argument("input", help="Path to puzzle input file (txt)")
    args = parser.parse_args()

    grid = load_puzzle_from_file(args.input)
    solve_with_all(grid)


if __name__ == "__main__":
    main()


