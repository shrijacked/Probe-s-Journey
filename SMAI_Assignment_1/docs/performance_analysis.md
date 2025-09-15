# Performance Analysis

## How to Reproduce

1. Activate the virtual environment:
```
source .venv/bin/activate
```
2. Run the benchmark:
```
python examples/benchmark.py
```
3. Outputs:
- Solutions: `output/solutions/*.txt`
- CSV metrics: `output/analysis/statistics.csv`
- Summary report: `output/analysis/comparison_report.txt`

## Metrics Recorded
- moves: solution length
- nodes: nodes explored
- time_ms: wall-clock time (ms)

## Quick Observations
- BFS guarantees shortest path in moves but may explore more nodes.
- Best-First with Manhattan was fastest on simple puzzles.
- Enhanced heuristic matches Manhattan on these samples; larger maps may differ.

## Next Steps
- Add more diverse puzzles (dead-ends, narrow corridors).
- Track memory (frontier/visited sizes) for completeness.
- Visualize performance (box plots per algorithm across puzzles).


## Summary Statistics


| Algorithm | Runs | Avg Time (ms) | Min | Max | Avg Nodes | Min | Max | Avg Moves |

|---|---:|---:|---:|---:|---:|---:|---:|---:|

| BFS | 3 | 0.287 | 0.182 | 0.358 | 41 | 28 | 53 | 5.67 |
| BestFirst_Enhanced | 3 | 0.054 | 0.042 | 0.061 | 8 | 6 | 9 | 5.67 |
| BestFirst_Manhattan | 3 | 0.056 | 0.045 | 0.063 | 8 | 6 | 9 | 5.67 |
| DFS | 3 | 0.257 | 0.086 | 0.491 | 23.67 | 11 | 37 | 15.67 |

## Summary Statistics


| Algorithm | Runs | Avg Time (ms) | Min | Max | Avg Nodes | Min | Max | Avg Moves |

|---|---:|---:|---:|---:|---:|---:|---:|---:|

| BFS | 3 | 0.361 | 0.224 | 0.452 | 41 | 28 | 53 | 5.67 |
| BestFirst_Enhanced | 3 | 0.068 | 0.052 | 0.076 | 8 | 6 | 9 | 5.67 |
| BestFirst_Manhattan | 3 | 0.078 | 0.073 | 0.086 | 8 | 6 | 9 | 5.67 |
| DFS | 3 | 0.288 | 0.107 | 0.383 | 23.67 | 11 | 37 | 15.67 |
