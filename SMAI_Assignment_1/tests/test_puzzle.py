from src.puzzle import AsteroidFieldPuzzle


def test_goal_detection():
    grid = [
        [0, 0, 0, 4],
        [0, 2, 0, 0],
        [3, 0, 0, 0],
        [0, 0, 0, 0],
    ]
    p = AsteroidFieldPuzzle(grid)
    assert not p.is_goal()


def test_move_generation_bounds():
    grid = [
        [3, 1],
        [1, 4],
    ]
    p = AsteroidFieldPuzzle(grid)
    moves = dict(p.move_gen())
    assert "RIGHT" not in moves  # wall
    assert "UP" not in moves  # out of bounds


