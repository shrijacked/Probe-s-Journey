from typing import List, Optional, Tuple


class AsteroidFieldPuzzle:
    """Core puzzle logic and state representation for the Asteroid Field game.

    Grid cell encoding:
    - 0: empty
    - 1: wall
    - 2: asteroid (pushable in lines)
    - 3: probe (player)
    - 4: docking bay (goal)
    """

    def __init__(self, grid: List[List[int]]):
        # Deep copy to avoid external mutation side effects
        self.grid: List[List[int]] = [row[:] for row in grid]
        self.n: int = len(self.grid)
        self.m: int = len(self.grid[0]) if self.n > 0 else 0
        self.probe_pos: Optional[Tuple[int, int]] = self.find_position(3)
        self.dock_pos: Optional[Tuple[int, int]] = self.find_position(4)

    def find_position(self, target: int) -> Optional[Tuple[int, int]]:
        """Find position of target object in grid."""
        for i in range(self.n):
            for j in range(self.m):
                if self.grid[i][j] == target:
                    return (i, j)
        return None

    def get_state_key(self) -> Tuple[Tuple[int, ...], ...]:
        """Convert grid state to a hashable key for visited tracking."""
        return tuple(tuple(row) for row in self.grid)

    def is_goal(self) -> bool:
        """Check if probe is at docking bay."""
        return self.probe_pos == self.dock_pos

    def is_valid_position(self, row: int, col: int) -> bool:
        """Check if position is within grid boundaries."""
        return 0 <= row < self.n and 0 <= col < self.m

    def move_gen(self):
        """Generate all valid moves from current state.

        Returns a list of (move_name, new_state) pairs.
        """
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # U, D, L, R
        direction_names = ["UP", "DOWN", "LEFT", "RIGHT"]
        valid_moves = []

        probe_row, probe_col = self.probe_pos

        for i, (dr, dc) in enumerate(directions):
            next_row = probe_row + dr
            next_col = probe_col + dc

            # Check if next position is within bounds
            if not self.is_valid_position(next_row, next_col):
                continue

            next_cell = self.grid[next_row][next_col]

            # Case 1: Next cell is wall (1) - invalid move
            if next_cell == 1:
                continue

            # Case 2: Next cell is empty (0) - valid move
            elif next_cell == 0:
                new_state = self.make_move(direction_names[i])
                if new_state:
                    valid_moves.append((direction_names[i], new_state))

            # Case 3: Next cell is docking bay (4) - valid move (winning move)
            elif next_cell == 4:
                new_state = self.make_move(direction_names[i])
                if new_state:
                    valid_moves.append((direction_names[i], new_state))

            # Case 4: Next cell is asteroid (2) - check if we can push
            elif next_cell == 2:
                if self.can_push_asteroids(next_row, next_col, dr, dc):
                    new_state = self.make_move(direction_names[i])
                    if new_state:
                        valid_moves.append((direction_names[i], new_state))

        return valid_moves

    def can_push_asteroids(self, start_row: int, start_col: int, dr: int, dc: int) -> bool:
        """Check if we can push the contiguous line of asteroids in given direction."""
        row, col = start_row, start_col

        # Find the end of the asteroid line
        while self.is_valid_position(row, col) and self.grid[row][col] == 2:
            row += dr
            col += dc

        # Check if the space after the last asteroid is valid
        if not self.is_valid_position(row, col):
            return False

        # The space must be empty (0) - cannot push onto walls, other asteroids, or the docking bay
        return self.grid[row][col] == 0

    def make_move(self, direction: str):
        """Create new state after making a move in the given direction."""
        new_puzzle = AsteroidFieldPuzzle(self.grid)
        probe_row, probe_col = new_puzzle.probe_pos

        direction_map = {
            "UP": (-1, 0),
            "DOWN": (1, 0),
            "LEFT": (0, -1),
            "RIGHT": (0, 1),
        }

        dr, dc = direction_map[direction]
        next_row = probe_row + dr
        next_col = probe_col + dc

        if not new_puzzle.is_valid_position(next_row, next_col):
            return None

        next_cell = new_puzzle.grid[next_row][next_col]

        # Move probe: clear old position
        new_puzzle.grid[probe_row][probe_col] = 0

        if next_cell == 2:  # Pushing asteroids
            # Move all asteroids in the line
            row, col = next_row, next_col
            asteroids_to_move = []

            # Collect all asteroids in line
            while new_puzzle.is_valid_position(row, col) and new_puzzle.grid[row][col] == 2:
                asteroids_to_move.append((row, col))
                row += dr
                col += dc

            # Move asteroids (from last to first to avoid overwrites)
            for ast_row, ast_col in reversed(asteroids_to_move):
                new_puzzle.grid[ast_row][ast_col] = 0
                new_puzzle.grid[ast_row + dr][ast_col + dc] = 2

        # Place probe in new position
        new_puzzle.grid[next_row][next_col] = 3

        new_puzzle.probe_pos = (next_row, next_col)
        return new_puzzle


