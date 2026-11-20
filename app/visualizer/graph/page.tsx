"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

interface GraphNode {
  id: string;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphStep {
  activeNode: string | null;
  visitedOrder: string[];
  frontier: string[];
  discoveredEdges: string[];
  activeEdge: string | null;
  conceptTitle: string;
  explanation: string;
  logText: string;
  sound?: "step" | "done";
}

// Clean layered tree-like graph so BFS (Level-by-Level) vs DFS (Deep Branch) is crystal clear
const NODES: GraphNode[] = [
  { id: "A", x: 260, y: 48, level: 0 },
  { id: "B", x: 140, y: 138, level: 1 },
  { id: "C", x: 380, y: 138, level: 1 },
  { id: "D", x: 75, y: 235, level: 2 },
  { id: "E", x: 205, y: 235, level: 2 },
  { id: "F", x: 325, y: 235, level: 2 },
  { id: "G", x: 445, y: 235, level: 2 },
];

const EDGES: GraphEdge[] = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "D" },
  { from: "B", to: "E" },
  { from: "C", to: "F" },
  { from: "C", to: "G" },
  { from: "E", to: "F" },
];

const ADJ_LIST: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F", "G"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
  G: ["C"],
};

function generateGraphSteps(startNode: string, algo: "BFS" | "DFS"): GraphStep[] {
  const steps: GraphStep[] = [];
  const visited = new Set<string>();
  const order: string[] = [];
  const container: string[] = [startNode];
  const discoveredEdges: string[] = [];

  if (algo === "BFS") visited.add(startNode);

  steps.push({
    activeNode: null,
    visitedOrder: [],
    frontier: [...container],
    discoveredEdges: [],
    activeEdge: null,
    conceptTitle:
      algo === "BFS"
        ? "BFS (Breadth-First Search) — Explores Layer by Layer"
        : "DFS (Depth-First Search) — Explores Deep Down One Path First",
    explanation:
      algo === "BFS"
        ? `BFS puts start node '${startNode}' into a FIFO Queue. It visits all Level 1 neighbors before moving to Level 2.`
        : `DFS pushes start node '${startNode}' onto a LIFO Stack. It follows one branch all the way down before backtracking.`,
    logText: `Workspace ready. Start = ${startNode} (${algo}).`,
  });

  while (container.length > 0) {
    const current = algo === "BFS" ? container.shift()! : container.pop()!;

    if (algo === "DFS") {
      if (visited.has(current)) continue;
      visited.add(current);
    }

    order.push(current);

    steps.push({
      activeNode: current,
      visitedOrder: [...order],
      frontier: [...container],
      discoveredEdges: [...discoveredEdges],
      activeEdge: null,
      conceptTitle: `Step #${order.length}: Visit Node '${current}'`,
      explanation: `${
        algo === "BFS"
          ? `Removed '${current}' from the FRONT of the Queue.`
          : `Popped '${current}' from the TOP of the Stack.`
      } Marked '${current}' as Visited (#${order.length}). Checking neighbors: [ ${ADJ_LIST[
        current
      ].join(", ")} ].`,
      logText: `Visited #${order.length}: ${current}`,
      sound: "step",
    });

    const neighbors = ADJ_LIST[current] || [];
    const ordered = algo === "DFS" ? [...neighbors].reverse() : neighbors;

    for (const neighbor of ordered) {
      if (!visited.has(neighbor)) {
        if (algo === "BFS") visited.add(neighbor);
        container.push(neighbor);
        const edgeKey = `${current}-${neighbor}`;
        discoveredEdges.push(edgeKey, `${neighbor}-${current}`);

        steps.push({
          activeNode: current,
          visitedOrder: [...order],
          frontier: [...container],
          discoveredEdges: [...discoveredEdges],
          activeEdge: edgeKey,
          conceptTitle: `Follow Edge ${current} → ${neighbor}`,
          explanation: `Neighbor '${neighbor}' is unvisited! Added '${neighbor}' to the ${
            algo === "BFS" ? "BACK of the Queue" : "TOP of the Stack"
          } to visit later.`,
          logText: `Edge ${current} → ${neighbor} (queued ${neighbor})`,
          sound: "step",
        });
      }
    }
  }

  steps.push({
    activeNode: null,
    visitedOrder: [...order],
    frontier: [],
    discoveredEdges: [...discoveredEdges],
    activeEdge: null,
    conceptTitle: `${algo} Complete! Visited All ${order.length} Nodes`,
    explanation: `Final Traversal Sequence: ${order
      .map((n, i) => `#${i + 1} ${n}`)
      .join("  →  ")}`,
    logText: `${algo} Complete: ${order.join(" → ")}`,
    sound: "done",
  });

  return steps;
}

export default function GraphVisualizerPage() {
  const [algo, setAlgo] = useState<"BFS" | "DFS">("BFS");
  const [startNode, setStartNode] = useState("A");
  const [steps, setSteps] = useState<GraphStep[]>(() =>
    generateGraphSteps("A", "BFS")
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(2200);
  const [logs, setLogs] = useState<string[]>([
    "Workspace ready. Click Start Traversal or Next Step.",
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStep = steps[stepIndex] || steps[0];

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev.slice(0, 24)]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  };

  const playStepAudioAndLog = (step: GraphStep) => {
    addLog(step.logText);
    if (step.sound === "step") soundEngine.playStep();
    else if (step.sound === "done") soundEngine.playSuccess();
  };

  const handleUpdateConfig = (newStart: string, newAlgo: "BFS" | "DFS") => {
    stopTimer();
    setStartNode(newStart);
    setAlgo(newAlgo);
    const newSteps = generateGraphSteps(newStart, newAlgo);
    setSteps(newSteps);
    setStepIndex(0);
    addLog(`Set ${newAlgo} with start vertex ${newStart}.`);
  };

  const handleNext = () => {
    stopTimer();
    if (stepIndex < steps.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      playStepAudioAndLog(steps[next]);
    }
  };

  const handlePrev = () => {
    stopTimer();
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopTimer();
      return;
    }
    let idx = stepIndex >= steps.length - 1 ? 0 : stepIndex;
    setStepIndex(idx);
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= steps.length) {
        stopTimer();
        return;
      }
      setStepIndex(idx);
      playStepAudioAndLog(steps[idx]);
      if (idx === steps.length - 1) stopTimer();
    }, delayMs);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* 1. Top Variant Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Algorithm:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(["BFS", "DFS"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleUpdateConfig(startNode, mode)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  algo === mode
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode === "BFS" ? "BFS (Queue — Level Order)" : "DFS (Stack — Deep First)"}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">
          G = (V, E) | Time: O(V + E)
        </span>
      </div>

      {/* 2. Middle Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-600">Speed:</span>
              {[
                { label: "Very Slow (2.8s)", ms: 2800 },
                { label: "Slow (2.2s)", ms: 2200 },
                { label: "Normal (1.2s)", ms: 1200 },
              ].map((s) => (
                <button
                  key={s.ms}
                  onClick={() => {
                    stopTimer();
                    setDelayMs(s.ms);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    delayMs === s.ms
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Step {stepIndex}/{steps.length - 1}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Start Vertex:</span>
            <select
              value={startNode}
              onChange={(e) => handleUpdateConfig(e.target.value, algo)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50"
            >
              {NODES.map((n) => (
                <option key={n.id} value={n.id}>
                  Node {n.id}
                </option>
              ))}
            </select>

            <button
              onClick={handleTogglePlay}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-2xs ${
                isPlaying ? "bg-amber-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? "⏸ Pause" : `▶ Start ${algo}`}
            </button>

            <button
              onClick={() => {
                stopTimer();
                setStepIndex(0);
                addLog("Reset graph to Step 0.");
              }}
              className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg"
            >
              ◀ Prev Step
            </button>
            <button
              onClick={handleNext}
              disabled={stepIndex >= steps.length - 1}
              className="px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 rounded-lg"
            >
              Next Step ▶
            </button>
          </div>
        </div>

        {/* Right Live Execution Log Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span className="text-xs font-bold text-slate-800">
                Live Execution Log
              </span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <div className="font-mono text-xs text-slate-600 h-28 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-400">&gt; Log cleared.</div>
            ) : (
              logs.map((entry, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-400 mr-1.5">&gt;</span>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Full-Width Visualization Canvas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        {/* Concept & Plain-English Step Banner */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-base mt-0.5">💡</span>
          <div>
            <div className="text-xs font-bold text-blue-800">
              {currentStep.conceptTitle}
            </div>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              {currentStep.explanation}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Interactive Graph SVG with Layer Guides & Step Number Badges */}
          <div className="lg:col-span-7 flex justify-center bg-slate-50/60 border border-slate-100 rounded-xl p-3">
            <svg width="520" height="285" viewBox="0 0 520 285" className="max-w-full">
              {/* Subtle Horizontal Layer Guides for Beginner Clarity */}
              {[
                { y: 48, label: "Layer 0" },
                { y: 138, label: "Layer 1" },
                { y: 235, label: "Layer 2" },
              ].map((layer) => (
                <g key={layer.label}>
                  <line
                    x1="15"
                    y1={layer.y}
                    x2="505"
                    y2={layer.y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x="18"
                    y={layer.y - 6}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {layer.label}
                  </text>
                </g>
              ))}

              {/* Edges */}
              {EDGES.map((edge, i) => {
                const u = NODES.find((n) => n.id === edge.from)!;
                const v = NODES.find((n) => n.id === edge.to)!;
                const isDiscovered = currentStep.discoveredEdges.includes(
                  `${edge.from}-${edge.to}`
                );
                const isCurrentEdge =
                  currentStep.activeEdge === `${edge.from}-${edge.to}` ||
                  currentStep.activeEdge === `${edge.to}-${edge.from}`;

                return (
                  <line
                    key={i}
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={
                      isCurrentEdge
                        ? "#f59e0b"
                        : isDiscovered
                        ? "#10b981"
                        : "#cbd5e1"
                    }
                    strokeWidth={isCurrentEdge ? "4" : isDiscovered ? "3" : "2"}
                  />
                );
              })}

              {/* Vertices + Visit Step Number Badges (#1, #2, ...) */}
              {NODES.map((node) => {
                const isActive = currentStep.activeNode === node.id;
                const visitIdx = currentStep.visitedOrder.indexOf(node.id);
                const isVisited = visitIdx !== -1;
                const isFrontier = currentStep.frontier.includes(node.id);

                let fill = "#2563eb";
                if (isActive) fill = "#f59e0b";
                else if (isVisited) fill = "#10b981";
                else if (isFrontier) fill = "#8b5cf6";

                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      handleUpdateConfig(node.id, algo);
                      soundEngine.playStep();
                    }}
                    className="cursor-pointer"
                  >
                    {/* Visit Order Pill above Visited Node */}
                    {isVisited && (
                      <g>
                        <rect
                          x={node.x - 14}
                          y={node.y - 38}
                          width="28"
                          height="15"
                          rx="4"
                          fill="#065f46"
                        />
                        <text
                          x={node.x}
                          y={node.y - 27}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          #{visitIdx + 1}
                        </text>
                      </g>
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      fill={fill}
                      stroke={startNode === node.id ? "#0f172a" : "#ffffff"}
                      strokeWidth="2.5"
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Side: Live Queue/Stack + Visited Order + Adjacency List */}
          <div className="lg:col-span-5 space-y-3">
            {/* Frontier Memory */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {algo === "BFS"
                  ? "Queue Memory (FIFO — Next Out is Leftmost)"
                  : "Stack Memory (LIFO — Next Out is Rightmost)"}
              </div>
              <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                {currentStep.frontier.length === 0 ? (
                  <span className="font-mono text-xs text-slate-400">
                    [ Empty ]
                  </span>
                ) : (
                  currentStep.frontier.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded font-mono font-bold text-xs"
                    >
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Visited Sequence */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Visited Order
              </div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                {currentStep.visitedOrder.length === 0 ? (
                  <span className="font-mono text-xs text-slate-400">
                    [ None yet ]
                  </span>
                ) : (
                  currentStep.visitedOrder.map((v, idx) => (
                    <span key={v} className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-xs">
                        #{idx + 1} {v}
                      </span>
                      {idx < currentStep.visitedOrder.length - 1 && (
                        <span className="text-slate-400 font-mono text-xs">→</span>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Adjacency List Reference */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Adjacency List (Neighbors)
              </div>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-slate-600">
                {Object.entries(ADJ_LIST).map(([vertex, neighbors]) => (
                  <div
                    key={vertex}
                    className={`px-2 py-0.5 rounded ${
                      currentStep.activeNode === vertex
                        ? "bg-amber-100 text-amber-900 font-bold"
                        : ""
                    }`}
                  >
                    {vertex} → [{neighbors.join(", ")}]
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Color Key */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Unvisited
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Waiting in {algo === "BFS" ? "Queue" : "Stack"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Current Vertex
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Visited (#Order)
          </span>
        </div>
      </div>
    </div>
  );
}