import os
import time
import csv
from typing import Dict, List, Tuple

from src.puzzle import AsteroidFieldPuzzle
from src.search_algorithms import depth_first_search, breadth_first_search, best_first_search
from src.heuristics import manhattan_distance_heuristic, asteroid_blocking_heuristic
from src.utils import load_puzzle_from_file


def ensure_dirs():
    os.makedirs("output/solutions", exist_ok=True)
    os.makedirs("output/analysis", exist_ok=True)


def run_all_algorithms(grid: List[List[int]]):
    algos = [
        ("DFS", depth_first_search),
        ("BFS", breadth_first_search),
        ("BestFirst_Manhattan", lambda s: best_first_search(s, manhattan_distance_heuristic)),
        ("BestFirst_Enhanced", lambda s: best_first_search(s, asteroid_blocking_heuristic)),
    ]
    results = []

    for name, fn in algos:
        state = AsteroidFieldPuzzle(grid)
        start = time.perf_counter()
        solution, nodes = fn(state)
        elapsed = (time.perf_counter() - start) * 1000.0  # ms
        results.append({
            "algorithm": name,
            "moves": len(solution) if solution else None,
            "nodes": nodes,
            "time_ms": round(elapsed, 3),
            "solution_path": " -> ".join(solution) if solution else None,
        })
    return results


def write_solutions(results: List[Dict], puzzle_label: str):
    mapping = {
        "DFS": "output/solutions/dfs_results.txt",
        "BFS": "output/solutions/bfs_results.txt",
        "BestFirst_Manhattan": "output/solutions/best_first_results.txt",
        "BestFirst_Enhanced": "output/solutions/best_first_results.txt",
    }
    for r in results:
        path = mapping[r["algorithm"]]
        with open(path, "a") as f:
            f.write(f"[{puzzle_label}]\n")
            f.write(f"Algorithm: {r['algorithm']}\n")
            f.write(f"Moves: {r['moves']}\n")
            f.write(f"Nodes: {r['nodes']}\n")
            f.write(f"Time (ms): {r['time_ms']}\n")
            f.write(f"Solution: {r['solution_path']}\n\n")


def write_statistics(all_stats: List[Dict]):
    csv_path = "output/analysis/statistics.csv"
    header = ["puzzle", "algorithm", "moves", "nodes", "time_ms"]
    with open(csv_path, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=header)
        writer.writeheader()
        for row in all_stats:
            writer.writerow({k: row.get(k) for k in header})


def write_report(all_stats: List[Dict]):
    report_path = "output/analysis/comparison_report.txt"
    lines = ["Algorithm Comparison Report\n", "===========================\n\n"]

    # Aggregate fastest per puzzle
    by_puzzle: Dict[str, List[Dict]] = {}
    for r in all_stats:
        by_puzzle.setdefault(r["puzzle"], []).append(r)

    for puzzle, rows in by_puzzle.items():
        lines.append(f"Puzzle: {puzzle}\n")
        # sort by time then nodes
        best = sorted(rows, key=lambda x: (x["time_ms"], x["nodes"]))[0]
        for r in rows:
            lines.append(f"- {r['algorithm']}: moves={r['moves']} nodes={r['nodes']} time_ms={r['time_ms']}")
        lines.append(f"Best (time first): {best['algorithm']}\n\n")

    with open(report_path, "w") as f:
        f.write("\n".join(lines))


def main():
    ensure_dirs()

    inputs = [
        ("puzzle1", "input/puzzle1.txt"),
        ("puzzle2", "input/puzzle2.txt"),
        ("puzzle3", "input/puzzle3.txt"),
    ]

    # Clear previous solution files
    for p in [
        "output/solutions/dfs_results.txt",
        "output/solutions/bfs_results.txt",
        "output/solutions/best_first_results.txt",
    ]:
        open(p, "w").close()

    all_stats: List[Dict] = []

    for label, path in inputs:
        grid = load_puzzle_from_file(path)
        results = run_all_algorithms(grid)
        write_solutions(results, label)
        for r in results:
            all_stats.append({
                "puzzle": label,
                **r,
            })

    write_statistics(all_stats)
    write_report(all_stats)
    print("Benchmark complete. See output/solutions and output/analysis.")


if __name__ == "__main__":
    main()


