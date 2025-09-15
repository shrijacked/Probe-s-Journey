from src.puzzle import AsteroidFieldPuzzle
from src.utils import print_grid


def main():
    grid = [
        [0, 0, 0, 4],
        [0, 2, 0, 0],
        [3, 0, 0, 0],
        [0, 0, 0, 0],
    ]
    game = AsteroidFieldPuzzle(grid)

    print("Use commands: UP, DOWN, LEFT, RIGHT, or QUIT")
    while True:
        print_grid(game.grid)
        cmd = input("> ").strip().upper()
        if cmd in {"QUIT", "Q", "EXIT"}:
            break
        next_states = dict(game.move_gen())
        if cmd in next_states:
            game = next_states[cmd]
            if game.is_goal():
                print_grid(game.grid)
                print("Docking successful!")
                break
        else:
            print("Invalid move.")


if __name__ == "__main__":
    main()


