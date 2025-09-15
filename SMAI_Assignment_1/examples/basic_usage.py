from src.puzzle import AsteroidFieldPuzzle
from src.search_algorithms import depth_first_search
from src.utils import load_puzzle_from_file


if __name__ == "__main__":
    grid = load_puzzle_from_file("input/puzzle1.txt")
    puzzle = AsteroidFieldPuzzle(grid)
    solution, nodes = depth_first_search(puzzle)
    print(f"Solution: {solution}")
    print(f"Nodes explored: {nodes}")


