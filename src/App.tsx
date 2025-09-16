import React, { useEffect, useMemo, useRef, useState } from "react";

type Cell = 0 | 1 | 2 | 3 | 4;
type Grid = Cell[][];
type Pos = { r: number; c: number };

const EMPTY = 0 as Cell;
const WALL = 1 as Cell;
const AST = 2 as Cell;
const PROBE = 3 as Cell;
const DOCK = 4 as Cell;

// UI sizing
const CELL_SIZE = 44;
const CELL_GAP = 2;

const DEFAULT_N = 8;
const DEFAULT_M = 12;
const STEP_MS = 350;

function cloneGrid(g: Grid): Grid {
  return g.map((r) => r.slice()) as Grid;
}

function serializeGrid(g: Grid): string {
  return g.map((r) => r.join(",")).join("|");
}

function findCell(g: Grid, val: Cell): Pos | null {
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++) if (g[r][c] === val) return { r, c };
  return null;
}

// Directions: up, down, left, right
const DIRS = [
  { dr: -1, dc: 0, name: "Up" },
  { dr: 1, dc: 0, name: "Down" },
  { dr: 0, dc: -1, name: "Left" },
  { dr: 0, dc: 1, name: "Right" },
] as const;

function inBounds(g: Grid, r: number, c: number) {
  return r >= 0 && r < g.length && c >= 0 && c < g[0].length;
}

/**
 * MoveGen: given a grid, produce all valid next grids (pushes).
 * Rules as per your assignment:
 * - Probe moves 1 cell in chosen cardinal dir.
 * - If an asteroid(s) are in front, the entire contiguous line is pushed 1 cell forward,
 *   only if final cell after that line is empty (0). Asteroids may NOT occupy dock (4).
 * - Walls (1) block movement / invalid.
 * - Probe can enter dock (4) — that is the goal.
 */
function moveGen(g: Grid): Grid[] {
  const res: Grid[] = [];
  const probe = findCell(g, PROBE);
  if (!probe) return res;
  const { r: pr, c: pc } = probe;

  for (const dir of DIRS) {
    const nr = pr + dir.dr;
    const nc = pc + dir.dc;
    // next cell must be inside grid
    if (!inBounds(g, nr, nc)) continue;

    const nextCell = g[nr][nc];
    // If next cell is wall -> invalid
    if (nextCell === WALL) continue;
    // If next cell empty -> simple move
    if (nextCell === EMPTY || nextCell === DOCK) {
      const ng = cloneGrid(g);
      // leaving previous probe cell empty
      ng[pr][pc] = EMPTY;
      // probe can step onto dock or empty
      ng[nr][nc] = PROBE;
      res.push(ng);
      continue;
    }
    // If next cell is asteroid -> collect contiguous asteroid chain
    if (nextCell === AST) {
      const chain: Pos[] = [];
      let cr = nr,
        cc = nc;
      while (inBounds(g, cr, cc) && g[cr][cc] === AST) {
        chain.push({ r: cr, c: cc });
        cr += dir.dr;
        cc += dir.dc;
      }
      // cr,cc is now the cell after last asteroid
      if (!inBounds(g, cr, cc)) continue;
      // That final cell must be EMPTY (0). If it's WALL, AST, or DOCK -> cannot push
      if (g[cr][cc] !== EMPTY) continue;
      // Valid push: shift asteroid chain one forward, move probe into first asteroid cell
      const ng = cloneGrid(g);
      // vacate probe
      ng[pr][pc] = EMPTY;
      // move asteroids from end to front to avoid overwrite
      for (let i = chain.length - 1; i >= 0; i--) {
        const p = chain[i];
        ng[p.r + dir.dr][p.c + dir.dc] = AST;
        ng[p.r][p.c] = EMPTY;
      }
      // move probe into first asteroid's slot
      ng[nr][nc] = PROBE;
      res.push(ng);
      continue;
    }
  }

  return res;
}

function isGoal(g: Grid) {
  const p = findCell(g, PROBE);
  const d = findCell(g, DOCK);
  if (!p || !d) return false;
  return p.r === d.r && p.c === d.c;
}

// Goal check that is robust even if the dock tile is overwritten by the probe.
function isAtDock(g: Grid, dockPos: Pos | null) {
  if (!dockPos) return false;
  const p = findCell(g, PROBE);
  return !!p && p.r === dockPos.r && p.c === dockPos.c;
}

function manhattan(a: Pos, b: Pos) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

/**
 * DFS, BFS, Best-First search over state space (grid states).
 * Return object: { path: Grid[] | null, nodesExpanded, timeMs }
 */

// Depth-First Search (iterative, with stack)
function dfsSolve(start: Grid, maxNodes = 120000) {
  const startTime = performance.now();
  const dockPos = findCell(start, DOCK);
  const probeStart = findCell(start, PROBE);
  if (!dockPos || !probeStart) return { path: null as null, nodesExpanded: 0, timeMs: performance.now() - startTime, visitedProbe: [] as Pos[] };
  const stack: { grid: Grid; parent: string | null }[] = [
    { grid: start, parent: null },
  ];
  const parent = new Map<string, string | null>();
  const seen = new Set<string>();
  const startKey = serializeGrid(start);
  parent.set(startKey, null);
  let nodes = 0;
  const visitedProbe: Pos[] = [];

  while (stack.length) {
    const { grid } = stack.pop()!;
    const key = serializeGrid(grid);
    if (seen.has(key)) continue;
    seen.add(key);
    nodes++;
    const pp = findCell(grid, PROBE);
    if (pp) visitedProbe.push(pp);
    if (isGoal(grid) || isAtDock(grid, dockPos)) {
      // reconstruct path
      const path: Grid[] = [];
      let cur = key;
      while (cur) {
        path.unshift(deserializeGrid(cur, start.length, start[0].length));
        const p = parent.get(cur);
        if (!p) break;
        cur = p;
      }
      const timeMs = performance.now() - startTime;
      return { path, nodesExpanded: nodes, timeMs, visitedProbe };
    }
    if (nodes > maxNodes) break;
    const nexts = moveGen(grid);
    // push children onto stack (LIFO). We'll push without marking seen — standard DFS.
    for (const ng of nexts) {
      const nk = serializeGrid(ng);
      if (!parent.has(nk)) parent.set(nk, key);
      stack.push({ grid: ng, parent: key });
    }
  }
  return { path: null as null, nodesExpanded: nodes, timeMs: performance.now() - startTime, visitedProbe };
}

// Breadth-First Search (queue) -> returns shortest push sequence
function bfsSolve(start: Grid, maxNodes = 150000) {
  const startTime = performance.now();
  const dockPos = findCell(start, DOCK);
  const probeStart = findCell(start, PROBE);
  if (!dockPos || !probeStart) return { path: null as null, nodesExpanded: 0, timeMs: performance.now() - startTime, visitedProbe: [] as Pos[] };
  const q: Grid[] = [start];
  const parent = new Map<string, string | null>();
  const startKey = serializeGrid(start);
  parent.set(startKey, null);
  let nodes = 0;
  const seen = new Set<string>([startKey]);
  const visitedProbe: Pos[] = [];

  while (q.length) {
    const g = q.shift()!;
    const key = serializeGrid(g);
    nodes++;
    const pp = findCell(g, PROBE);
    if (pp) visitedProbe.push(pp);
    if (isGoal(g) || isAtDock(g, dockPos)) {
      // reconstruct path
      const path: Grid[] = [];
      let cur: string | null = key;
      while (cur !== null) {
        path.unshift(deserializeGrid(cur, start.length, start[0].length));
        cur = parent.get(cur) ?? null;
      }
      const timeMs = performance.now() - startTime;
      return { path, nodesExpanded: nodes, timeMs, visitedProbe };
    }
    if (nodes > maxNodes) break;
    const nexts = moveGen(g);
    for (const ng of nexts) {
      const nk = serializeGrid(ng);
      if (!seen.has(nk)) {
        seen.add(nk);
        parent.set(nk, key);
        q.push(ng);
      }
    }
  }
  return { path: null as null, nodesExpanded: nodes, timeMs: performance.now() - startTime, visitedProbe };
}

// Best-First Search (greedy) using Manhattan of probe->dock as priority
// Best-First Search (greedy) using Manhattan of probe->dock as priority
function bestFirstSolve(start: Grid, maxNodes = 200000) {
  const startTime = performance.now();
  const dockPos = findCell(start, DOCK);
  if (!dockPos) {
    // no dock in the start grid -> cannot search
    return { path: null as null, nodesExpanded: 0, timeMs: performance.now() - startTime, visitedProbe: [] as Pos[] };
  }

  // priority queue implemented as a sorted array (fine for small grids)
  const pq: { grid: Grid; score: number }[] = [];
  const startKey = serializeGrid(start);
  const parent = new Map<string, string | null>();
  parent.set(startKey, null);
  const seen = new Set<string>();
  const visitedProbe: Pos[] = [];

  const pushPQ = (grid: Grid) => {
    const p = findCell(grid, PROBE);
    if (!p) return; // ignore impossible states without a probe
    const score = manhattan(p, dockPos);
    pq.push({ grid, score });
    pq.sort((a, b) => a.score - b.score);
  };

  pushPQ(start);
  let nodes = 0;

  while (pq.length) {
    const { grid } = pq.shift()!;
    const key = serializeGrid(grid);
    if (seen.has(key)) continue;
    seen.add(key);

    nodes++;
    const pp = findCell(grid, PROBE);
    if (pp) visitedProbe.push(pp);

    // goal check uses dockPos so it's robust even if DOCK was overwritten
    if (isGoal(grid) || isAtDock(grid, dockPos)) {
      // reconstruct path (safe)
      const path: Grid[] = [];
      let cur: string | null = key;
      while (cur !== null) {
        path.unshift(deserializeGrid(cur, start.length, start[0].length));
        cur = parent.get(cur) ?? null;
      }
      const timeMs = performance.now() - startTime;
      return { path, nodesExpanded: nodes, timeMs, visitedProbe };
    }

    if (nodes > maxNodes) break;

    const nexts = moveGen(grid);
    for (const ng of nexts) {
      const nk = serializeGrid(ng);
      if (!parent.has(nk)) parent.set(nk, key);
      pushPQ(ng);
    }
  }

  return { path: null as null, nodesExpanded: nodes, timeMs: performance.now() - startTime, visitedProbe };
}

// Utility to reconstruct Grid from serialization; needs dims
function deserializeGrid(s: string, n: number, m: number): Grid {
  const rows = s.split("|");
  const g: Grid = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].split(",").map(Number) as Cell[];
    g.push(row);
  }
  // if dims mismatch, pad/trim (defensive)
  while (g.length < n) g.push(new Array(m).fill(0) as Cell[]);
  return g;
}

// ----------------- React UI -----------------
export default function App() {
  // raw inputs so user can type freely; apply on New Grid
  const [nInput, setNInput] = useState<string>(String(DEFAULT_N));
  const [mInput, setMInput] = useState<string>(String(DEFAULT_M));
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  // active grid in editor
  const [grid, setGrid] = useState<Grid>(() => {
    const g = Array.from({ length: DEFAULT_N }, () =>
      Array.from({ length: DEFAULT_M }, () => EMPTY)
    ) as Grid;
    // border walls
    for (let r = 0; r < DEFAULT_N; r++) {
      g[r][0] = WALL;
      g[r][DEFAULT_M - 1] = WALL;
    }
    for (let c = 0; c < DEFAULT_M; c++) {
      g[0][c] = WALL;
      g[DEFAULT_N - 1][c] = WALL;
    }
    // sample probe & dock
    g[1][1] = PROBE;
    g[DEFAULT_N - 2][DEFAULT_M - 2] = DOCK;
    g[2][3] = AST;
    g[3][3] = AST;
    return g;
  });

  const [tool, setTool] = useState<"probe" | "dock" | "asteroid" | "wall" | "erase">(
    "asteroid"
  );
  const painting = useRef(false);

  // animation / solver state (simplified UI)
  const [solution, setSolution] = useState<Grid[] | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const playingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "found" | "not_found">("idle");
  const [visitedKeys, setVisitedKeys] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  // animation overlay positions (for smooth probe movement)
  const [animPos, setAnimPos] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<string[]>([]); // serialized r,c keys visited
  // moving asteroid overlays per step
  const [movingRocks, setMovingRocks] = useState<
    { id: number; fromX: number; fromY: number; toX: number; toY: number }[]
  >([]);
  const [rocksAnimate, setRocksAnimate] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function ensureAudio() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtxRef.current;
  }
  function playBeep(freq = 660, durationMs = 80, gain = 0.02) {
    const actx = ensureAudio();
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    g.gain.value = gain;
    osc.connect(g).connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + durationMs / 1000);
  }
  function playSuccessChime() {
    playBeep(523, 90, 0.03);
    setTimeout(() => playBeep(784, 120, 0.03), 100);
  }

  // removed upload tile feature

  // drive step-by-step animation automatically when a solution is present
  useEffect(() => {
    if (!solution) return;
    playingRef.current = true;
    timerRef.current = window.setInterval(() => {
      setPlayIndex((p) => {
        if (!solution) return p;
        // compute rock animations from solution[p] to solution[p+1]
        if (p + 1 < solution.length) {
          const cur = solution[p];
          const nxt = solution[p + 1];
          const rocks = [] as { id: number; fromX: number; fromY: number; toX: number; toY: number }[];
          let idCounter = 0;
          for (let r = 0; r < cur.length; r++) {
            for (let c = 0; c < cur[0].length; c++) {
              if (cur[r][c] === AST && nxt[r][c] !== AST) {
                const candidates = [
                  { rr: r - 1, cc: c },
                  { rr: r + 1, cc: c },
                  { rr: r, cc: c - 1 },
                  { rr: r, cc: c + 1 },
                ];
                for (const cand of candidates) {
                  if (
                    cand.rr >= 0 && cand.rr < nxt.length &&
                    cand.cc >= 0 && cand.cc < nxt[0].length &&
                    nxt[cand.rr][cand.cc] === AST && cur[cand.rr][cand.cc] !== AST
                  ) {
                    const fromX = c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                    const fromY = r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                    const toX = cand.cc * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                    const toY = cand.rr * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                    rocks.push({ id: idCounter++, fromX, fromY, toX, toY });
                    break;
                  }
                }
              }
            }
          }
          if (rocks.length) {
            setMovingRocks(rocks.map((r) => ({ ...r })));
            setRocksAnimate(true);
            setTimeout(() => {
              setMovingRocks((prev) => prev.map((r) => ({ ...r, fromX: r.toX, fromY: r.toY })));
            }, 10);
            setTimeout(() => {
              setRocksAnimate(false);
              setMovingRocks([]);
            }, STEP_MS + 30);
          }
        }
        if (p + 1 >= solution.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          playingRef.current = false;
          return p;
        }
        return p + 1;
      });
    }, STEP_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      playingRef.current = false;
    };
  }, [solution]);

  // update visible grid when stepping through solution
  const visibleGrid = useMemo(() => {
    if (solution) {
      return solution[playIndex];
    }
    return grid;
  }, [solution, playIndex, grid]);

  // keys of cells that lie along the final path (all probe positions), for highlighting
  const pathKeys = useMemo(() => {
    if (!solution || solution.length === 0) return new Set<string>();
    const keys = new Set<string>();
    for (const g of solution) {
      const p = findCell(g, PROBE);
      if (p) keys.add(`${p.r},${p.c}`);
    }
    return keys;
  }, [solution]);

  // compute probe position for overlay and trail highlighting
  useEffect(() => {
    const g = visibleGrid;
    const p = findCell(g, PROBE);
    if (!p) {
      setAnimPos(null);
      return;
    }
    // Compute CSS pixels for center of cell
    const x = p.c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    const y = p.r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    setAnimPos({ x, y });
    if (solution) playBeep(560, 60, 0.015);
    setMoves((m) => (solution ? m + 1 : m));

    // Trail: accumulate unique r,c keys as we advance playIndex
    const key = `${p.r},${p.c}`;
    setTrail((t) => (t.includes(key) ? t : [...t, key]));
  }, [visibleGrid]);

  // reset trail when a new solution starts or is cleared
  useEffect(() => {
    if (!solution) {
      setTrail([]);
      return;
    }
    if (playIndex === 0) setTrail([]);
  }, [solution, playIndex]);

  // handlers for painting board
  function handleCellDown(r: number, c: number) {
    painting.current = true;
    updateCellByTool(r, c);
  }
  function handleCellEnter(r: number, c: number) {
    if (!painting.current) return;
    updateCellByTool(r, c);
  }
  function handleMouseUp() {
    painting.current = false;
  }
  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  function updateCellByTool(r: number, c: number) {
    setGrid((g) => {
      // Disallow any edits to outer border cells
      const isBorder = r === 0 || c === 0 || r === g.length - 1 || c === g[0].length - 1;
      if (isBorder) return g;
      const ng = cloneGrid(g);
      switch (tool) {
        case "probe": {
          // ensure only one probe
          const prev = findCell(ng, PROBE);
          if (prev) ng[prev.r][prev.c] = EMPTY;
          ng[r][c] = PROBE;
          break;
        }
        case "dock": {
          const prev = findCell(ng, DOCK);
          if (prev) ng[prev.r][prev.c] = EMPTY;
          ng[r][c] = DOCK;
          break;
        }
        case "asteroid":
          if (ng[r][c] === EMPTY) ng[r][c] = AST;
          break;
        case "wall":
          ng[r][c] = WALL;
          break;
        case "erase":
          ng[r][c] = EMPTY;
          break;
      }
      return ng;
    });
  }

  // create new empty grid with border walls
  function makeGridFromInputs() {
    let nParsed = parseInt(nInput, 10);
    let mParsed = parseInt(mInput, 10);
    const minSize = 5;
    if (!Number.isFinite(nParsed)) nParsed = DEFAULT_N;
    if (!Number.isFinite(mParsed)) mParsed = DEFAULT_M;
    let adjusted = false;
    if (nParsed < minSize) {
      nParsed = minSize;
      adjusted = true;
    }
    if (mParsed < minSize) {
      mParsed = minSize;
      adjusted = true;
    }
    if (adjusted) setUiMessage(`Minimum grid size is ${minSize}×${minSize}. Adjusted automatically.`);
    else setUiMessage(null);

    const g = Array.from({ length: nParsed }, () =>
      Array.from({ length: mParsed }, () => EMPTY)
    ) as Grid;
    for (let r = 0; r < nParsed; r++) {
      g[r][0] = WALL;
      g[r][mParsed - 1] = WALL;
    }
    for (let c = 0; c < mParsed; c++) {
      g[0][c] = WALL;
      g[nParsed - 1][c] = WALL;
    }
    setGrid(g);
    setSolution(null);
    setPlayIndex(0);
    // stats removed
    // normalize inputs to applied values
    setNInput(String(nParsed));
    setMInput(String(mParsed));
    setStatus("idle");
    setVisitedKeys([]);
    setMoves(0);
  }

  // quick randomizer for asteroids inside the interior
  function randomizeAsteroids() {
    setGrid((prev) => {
      const nRows = prev.length;
      const nCols = prev[0].length;
      const g = cloneGrid(prev);
      for (let r = 1; r < nRows - 1; r++) {
        for (let c = 1; c < nCols - 1; c++) {
          if (g[r][c] === PROBE || g[r][c] === DOCK) continue;
          // 18% chance asteroid
          g[r][c] = Math.random() < 0.18 ? AST : EMPTY;
        }
      }
      return g;
    });
    setStatus("idle");
    setVisitedKeys([]);
    setMoves(0);
  }

  // solver wrappers
  function runDFS() {
    setStatus("running");
    setVisitedKeys([]);
    setMoves(0);
    setSolution(null);
    setTimeout(() => {
      const result = dfsSolve(grid);
      setVisitedKeys(result.visitedProbe.map((p) => `${p.r},${p.c}`));
      if (result.path) {
        setSolution(result.path);
        setPlayIndex(0);
        setStatus("found");
        playSuccessChime();
      } else {
        setSolution(null);
        setStatus("not_found");
      }
    }, 10);
  }

  // other solvers kept but unused in UI
  function runBFS() {
    setStatus("running");
    setVisitedKeys([]);
    setMoves(0);
    setSolution(null);
    setTimeout(() => {
      const result = bfsSolve(grid);
      setVisitedKeys(result.visitedProbe.map((p) => `${p.r},${p.c}`));
      if (result.path) {
        setSolution(result.path);
        setPlayIndex(0);
        setStatus("found");
        playSuccessChime();
      } else {
        setSolution(null);
        setStatus("not_found");
      }
    }, 10);
  }

  function runBest() {
    setStatus("running");
    setVisitedKeys([]);
    setMoves(0);
    setSolution(null);
    setTimeout(() => {
      const result = bestFirstSolve(grid);
      setVisitedKeys(result.visitedProbe.map((p) => `${p.r},${p.c}`));
      if (result.path) {
        setSolution(result.path);
        setPlayIndex(0);
        setStatus("found");
        playSuccessChime();
      } else {
        setSolution(null);
        setStatus("not_found");
      }
    }, 10);
  }

  // removed upload/export helpers for simplified UI

  return (
    <div className="min-h-screen relative text-white p-6">
      <div className="starfield" />
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 tracking-wide">
            <span className="text-4xl animate-pulse">🛸</span>
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(34,211,238,0.35)]">Asteroid Field</span>
          </h1>
          <div className="text-xs sm:text-sm flex items-center gap-2">
            <span className="opacity-80 bg-slate-700/60 px-3 py-1 rounded-full shadow-inner border border-slate-600/60">Moves {moves}</span>
          </div>
        </header>

        <main className="grid grid-cols-3 gap-6">
          {/* Left: controls */}
          <section className="col-span-1 bg-slate-700/40 rounded p-4 space-y-4 shadow-lg">
            <div>
              <label className="block text-sm">Grid rows (N)</label>
              <input
                type="text"
                inputMode="numeric"
                value={nInput}
                onChange={(e) => setNInput(e.target.value)}
                placeholder="e.g. 8"
                className="w-full p-2 rounded bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm">Grid cols (M)</label>
              <input
                type="text"
                inputMode="numeric"
                value={mInput}
                onChange={(e) => setMInput(e.target.value)}
                placeholder="e.g. 12"
                className="w-full p-2 rounded bg-slate-800"
              />
            </div>
            <button
              onClick={makeGridFromInputs}
              className="w-full bg-emerald-500 text-black py-2 rounded mt-2 font-semibold"
            >
              New Grid
            </button>
            {uiMessage && (
              <div className="text-xs text-amber-300 mt-1">{uiMessage}</div>
            )}

            <div className="pt-3 border-t border-slate-600/60">
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "probe", label: "Probe", color: "bg-blue-400", emoji: "🚀" },
                  { id: "dock", label: "Dock", color: "bg-green-400", emoji: "🟩" },
                  { id: "asteroid", label: "Asteroid", color: "bg-yellow-400", emoji: "🪨" },
                  { id: "wall", label: "Wall", color: "bg-slate-600", emoji: "⬛" },
                  { id: "erase", label: "Erase", color: "bg-slate-200 text-black", emoji: "✖" },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setTool(b.id as any)}
                    className={`px-3 py-2 rounded flex items-center gap-2 transition-transform active:scale-95 ${
                      tool === (b.id as any)
                        ? "ring-2 ring-offset-2 ring-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                        : "hover:ring-2 hover:ring-offset-2 hover:ring-slate-400/50"
                    }`}
                  >
                    <span className="text-lg">{b.emoji}</span>
                    <span className="text-sm">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-600/60 space-y-2">
              <div className="flex gap-2">
                <button onClick={runDFS} className="flex-1 rounded py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:brightness-110 shadow-md shadow-fuchsia-700/30">Run DFS</button>
                <button onClick={runBFS} className="flex-1 rounded py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 shadow-md shadow-cyan-700/30">Run BFS</button>
              </div>
              <div className="flex gap-2">
                <button onClick={runBest} className="flex-1 rounded py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 shadow-md shadow-amber-700/30">Run Best-First</button>
                <button onClick={makeGridFromInputs} className="px-3 rounded py-2 bg-slate-600 hover:bg-slate-500">Reset</button>
                <button onClick={randomizeAsteroids} className="px-3 rounded py-2 bg-slate-600 hover:bg-slate-500">Randomize</button>
              </div>
              <div className="text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${status === "running" ? "bg-cyan-400/20 text-cyan-200 border-cyan-500/40" : status === "found" ? "bg-emerald-400/20 text-emerald-200 border-emerald-500/40" : status === "not_found" ? "bg-rose-400/20 text-rose-200 border-rose-500/40" : "bg-slate-500/20 text-slate-200 border-slate-500/40"}`}>
                  {status === "idle" ? "idle" : status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* removed play/speed/export controls for simplified flow */}
          </section>

          {/* Center: board */}
          <section className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900/60 to-slate-800/20 rounded p-4 shadow-[0_0_0_1px_rgba(51,65,85,0.6)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">Tool: <span className="font-semibold">{tool}</span></div>
                <div className="text-xs opacity-60">Click/drag on board to paint tiles</div>
              </div>

              <div className="text-right text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${status === "running" ? "bg-cyan-400/20 text-cyan-200 border-cyan-500/40" : status === "found" ? "bg-emerald-400/20 text-emerald-200 border-emerald-500/40" : status === "not_found" ? "bg-rose-400/20 text-rose-200 border-rose-500/40" : "bg-slate-500/20 text-slate-200 border-slate-500/40"}`}>
                  {status === "idle" ? "Ready" : status === "running" ? "In progress" : status === "found" ? "Path found" : "Path not found"}
                </span>
              </div>
            </div>

            {/* Grid + overlays */}
            <div
              className={`mx-auto bg-slate-900/70 p-4 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-1 ring-slate-700/70 ${status === "found" ? "flash-win" : ""}`}
              onMouseLeave={() => (painting.current = false)}
            >
              <div
                className="relative"
                style={{
                  width: grid[0].length * (CELL_SIZE + CELL_GAP) - CELL_GAP,
                  height: grid.length * (CELL_SIZE + CELL_GAP) - CELL_GAP,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gap: CELL_GAP,
                    gridTemplateColumns: `repeat(${grid[0].length}, ${CELL_SIZE}px)`,
                    position: "absolute",
                    inset: 0,
                }}
              >
                {visibleGrid.map((row, r) =>
                  row.map((cell, c) => {
                    const key = `${r}-${c}-${cell}`;
                    const isBorder = r === 0 || c === 0 || r === grid.length - 1 || c === grid[0].length - 1;
                    const style: React.CSSProperties = {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      userSelect: "none",
                        cursor: isBorder ? "not-allowed" : "pointer",
                      };
                      const bgImage = {} as React.CSSProperties;
                    let content: React.ReactNode = null;
                    let classes = "rounded border border-slate-700";
                    if (cell === EMPTY) {
                      classes += " bg-slate-900";
                    } else if (cell === WALL) {
                      content = "⬛";
                      classes += " bg-slate-700 text-white";
                    } else if (cell === AST) {
                      content = "🪨";
                      classes += " bg-yellow-400/90 text-black";
                    } else if (cell === PROBE) {
                      content = "🚀";
                      classes += " bg-blue-400/90 text-black";
                    } else if (cell === DOCK) {
                      content = (
                        <span className="relative inline-block">
                          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40" />
                          <span>🟩</span>
                        </span>
                      );
                      classes += " bg-green-400/90 text-black";
                    }
                    if (isBorder) classes += " opacity-80";
                    // highlight visited nodes during search
                    const visited = visitedKeys.includes(`${r},${c}`);
                    if (visited) classes += " ring-2 ring-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.25)]";
                    // highlight final path after found
                    if (status === "found" && pathKeys.has(`${r},${c}`)) classes += " ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)]";
                    return (
                      <div
                        key={key}
                        style={{ ...style, ...bgImage }}
                        className={classes}
                        onMouseDown={() => handleCellDown(r, c)}
                        onMouseEnter={() => handleCellEnter(r, c)}
                        onMouseUp={() => handleMouseUp()}
                        title={`r:${r} c:${c} val:${cell}`}
                      >
                        <div className="select-none text-lg">{content}</div>
                      </div>
                    );
                  })
                  )}
                </div>

                {solution && trail.length > 0 && (
                  <svg
                    width={grid[0].length * (CELL_SIZE + CELL_GAP) - CELL_GAP}
                    height={grid.length * (CELL_SIZE + CELL_GAP) - CELL_GAP}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {(() => {
                      const pts: { x: number; y: number }[] = [];
                      for (let i = 0; i <= playIndex; i++) {
                        const g = solution![i];
                        const p = findCell(g, PROBE);
                        if (!p) continue;
                        const x = p.c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                        const y = p.r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                        pts.push({ x, y });
                      }
                      const pathD = pts
                        .map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt.x},${pt.y}`)
                        .join(" ");
                      return (
                        <>
                          <path d={pathD} stroke="#38bdf8" strokeOpacity={0.6} strokeWidth={4} fill="none" />
                          <path d={pathD} stroke="#06b6d4" strokeOpacity={0.9} strokeWidth={2} fill="none" />
                        </>
                      );
                    })()}
                  </svg>
                )}

                {animPos && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{
                      left: animPos.x,
                      top: animPos.y,
                      transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
                      pointerEvents: "none",
                      fontSize: 22,
                    }}
                    aria-hidden
                  >
                    🚀
                  </div>
                )}

                {/* moving asteroid overlays */}
                {rocksAnimate && movingRocks.map((r) => (
                  <div
                    key={r.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{
                      left: r.fromX,
                      top: r.fromY,
                      transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
                      pointerEvents: "none",
                      fontSize: 20,
                    }}
                    aria-hidden
                  >
                    🪨
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 text-xs opacity-80">
              Tip: don't let asteroids block the dock; probe cannot push asteroids into the dock.
            </div>
          </section>

          {/* Right column removed for simpler game-like UI */}
        </main>
      </div>
    </div>
  );
}
