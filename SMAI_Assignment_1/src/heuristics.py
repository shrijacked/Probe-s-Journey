from .puzzle import AsteroidFieldPuzzle


def manhattan_distance_heuristic(state: AsteroidFieldPuzzle) -> int:
    """Calculate Manhattan distance from probe to dock."""
    probe_row, probe_col = state.probe_pos
    dock_row, dock_col = state.dock_pos
    return abs(probe_row - dock_row) + abs(probe_col - dock_col)


def asteroid_blocking_heuristic(state: AsteroidFieldPuzzle) -> int:
    """Enhanced heuristic considering asteroids in the direct path."""
    manhattan_dist = manhattan_distance_heuristic(state)

    probe_row, probe_col = state.probe_pos
    dock_row, dock_col = state.dock_pos

    blocking_penalty = 0

    # Check horizontal path
    if probe_row == dock_row:
        start_col = min(probe_col, dock_col)
        end_col = max(probe_col, dock_col)
        for col in range(start_col + 1, end_col):
            if state.grid[probe_row][col] == 2:
                blocking_penalty += 2

    # Check vertical path
    if probe_col == dock_col:
        start_row = min(probe_row, dock_row)
        end_row = max(probe_row, dock_row)
        for row in range(start_row + 1, end_row):
            if state.grid[row][probe_col] == 2:
                blocking_penalty += 2

    return manhattan_dist + blocking_penalty


