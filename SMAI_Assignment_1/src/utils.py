from typing import List


def print_grid(grid: List[List[int]]) -> None:
    """Pretty print the grid to stdout."""
    symbols = {0: '.', 1: '#', 2: 'A', 3: 'P', 4: 'D'}
    for row in grid:
        print(' '.join(symbols.get(cell, str(cell)) for cell in row))
    print()


def load_puzzle_from_file(path: str) -> List[List[int]]:
    """Load puzzle grid from text file.

    Expected format: rows and columns followed by grid rows or coordinates.
    For simplicity here, treat the file as whitespace separated integers of a full grid.
    """
    with open(path, 'r') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    # If the first line looks like two ints, assume dimensions and parse remaining as rows
    tokens = lines[0].split()
    if len(tokens) == 2 and all(tok.isdigit() for tok in tokens):
        r, c = map(int, tokens)
        grid: List[List[int]] = []
        for line in lines[1:1 + r]:
            row = list(map(int, line.split()))
            if len(row) != c:
                raise ValueError("Row length does not match specified columns")
            grid.append(row)
        if len(grid) != r:
            raise ValueError("Number of rows does not match specified rows")
        return grid

    # Otherwise, parse the entire file as a rectangular grid
    grid = [list(map(int, line.split())) for line in lines]
    cols = len(grid[0])
    if any(len(row) != cols for row in grid):
        raise ValueError("Inconsistent row lengths in grid file")
    return grid


