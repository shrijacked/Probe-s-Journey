import csv
from statistics import mean
from collections import defaultdict


def load_stats(path: str):
    rows = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            # Cast types
            r["moves"] = int(r["moves"]) if r["moves"] not in (None, "", "None") else None
            r["nodes"] = int(r["nodes"]) if r["nodes"] not in (None, "", "None") else None
            r["time_ms"] = float(r["time_ms"]) if r["time_ms"] not in (None, "", "None") else None
            rows.append(r)
    return rows


def summarize(rows):
    by_algo = defaultdict(list)
    for r in rows:
        by_algo[r["algorithm" ]].append(r)

    summary = {}
    for algo, lst in by_algo.items():
        times = [r["time_ms"] for r in lst if r["time_ms"] is not None]
        nodes = [r["nodes"] for r in lst if r["nodes"] is not None]
        moves = [r["moves"] for r in lst if r["moves"] is not None]
        summary[algo] = {
            "count": len(lst),
            "avg_time_ms": round(mean(times), 3) if times else None,
            "min_time_ms": round(min(times), 3) if times else None,
            "max_time_ms": round(max(times), 3) if times else None,
            "avg_nodes": round(mean(nodes), 2) if nodes else None,
            "min_nodes": min(nodes) if nodes else None,
            "max_nodes": max(nodes) if nodes else None,
            "avg_moves": round(mean(moves), 2) if moves else None,
        }
    return summary


def append_table_to_md(summary, md_path: str):
    lines = []
    lines.append("\n## Summary Statistics\n")
    lines.append("\n| Algorithm | Runs | Avg Time (ms) | Min | Max | Avg Nodes | Min | Max | Avg Moves |\n")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|\n")
    for algo, s in sorted(summary.items()):
        lines.append(
            f"| {algo} | {s['count']} | {s['avg_time_ms']} | {s['min_time_ms']} | {s['max_time_ms']} | {s['avg_nodes']} | {s['min_nodes']} | {s['max_nodes']} | {s['avg_moves']} |"
        )
    with open(md_path, "a") as f:
        f.write("\n".join(lines) + "\n")


def main():
    stats_csv = "output/analysis/statistics.csv"
    md_path = "docs/performance_analysis.md"
    rows = load_stats(stats_csv)
    summary = summarize(rows)
    append_table_to_md(summary, md_path)
    print("Summary appended to docs/performance_analysis.md")


if __name__ == "__main__":
    main()


