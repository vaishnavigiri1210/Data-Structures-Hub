"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

interface GraphNode {
  id: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphStep {
  activeNode: string | null;
  visitedOrder: string[];
  frontier: string[];
  activeEdges: string[];
  conceptTitle: string;
  explanation: string;
  logText: string;
  sound?: "step" | "done";
}

const NODES: GraphNode[] = [
  { id: "A", x: 250, y: 40 },
  { id: "B", x: 130, y: 120 },
  { id: "C", x: 370, y: 120 },
  { id: "D", x: 65, y: 225 },
  { id: "E", x: 195, y: 225 },
  { id: "F", x: 305, y: 225 },
  { id: "G", x: 435, y: 225 },
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
  const edgesUsed: string[] = [];

  if (algo === "BFS") visited.add(startNode);

  steps.push({
    activeNode: null,
    visitedOrder: [],
    frontier: [...container],
    activeEdges: [],
    conceptTitle:
      algo === "BFS"
        ? "Breadth-First Search (BFS) — Level by Level"
        : "Depth-First Search (DFS) — Branch by Branch",
    explanation:
      algo === "BFS"
        ? `BFS uses a FIFO Queue. Starting at '${startNode}', it visits all immediate neighbors before moving deeper.`
        : `DFS uses a LIFO Stack. Starting at '${startNode}', it dives as deep as possible along one branch before backtracking.`,
    logText: `Workspace ready. Start vertex = ${startNode} (${algo}).`,
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
      activeEdges: [...edgesUsed],
      conceptTitle:
        algo === "BFS"
          ? `Dequeue '${current}' from Front of Queue`
          : `Pop '${current}' from Top of Stack`,
      explanation: `Mark vertex '${current}' as Visited. Next, inspect its adjacent neighbors: [ ${ADJ_LIST[
        current
      ].join(", ")} ].`,
      logText: `Visited vertex ${current}`,
      sound: "step",
    });

    const neighbors = ADJ_LIST[current] || [];
    const ordered = algo === "DFS" ? [...neighbors].reverse() : neighbors;

    for (const neighbor of ordered) {
      if (!visited.has(neighbor)) {
        if (algo === "BFS") visited.add(neighbor);
        container.push(neighbor);
        edgesUsed.push(`${current}-${neighbor}`, `${neighbor}-${current}`);

        steps.push({
          activeNode: current,
          visitedOrder: [...order],
          frontier: [...container],
          activeEdges: [...edgesUsed],
          conceptTitle: `Discovered Unvisited Neighbor '${neighbor}'`,
          explanation: `Edge (${current} — ${neighbor}): '${neighbor}' has not been visited yet, so push it into the ${
            algo === "BFS" ? "Queue" : "Stack"
          }.`,
          logText: `Edge ${current} → ${neighbor} | Added ${neighbor} to ${
            algo === "BFS" ? "Queue" : "Stack"
          }`,
          sound: "step",
        });
      }
    }
  }

  steps.push({
    activeNode: null,
    visitedOrder: [...order],
    frontier: [],
    activeEdges: [...edgesUsed],
    conceptTitle: `${algo} Traversal Complete!`,
    explanation: `Every reachable vertex has been visited. Order: ${order.join(" → ")}.`,
    logText: `${algo} finished: ${order.join(" → ")}`,
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
      {/* 1. Top Variant Bar (Exact Linked List Style) */}
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
                {mode === "BFS" ? "BFS (Queue)" : "DFS (Stack)"}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">
          G = (V, E) | Time: O(V + E)
        </span>
      </div>

      {/* 2. Middle Split Row: Controls Card (Left) + Live Execution Log Card (Right) */}
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
        {/* Plain-English Concept Banner */}
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
          {/* Interactive Graph SVG */}
          <div className="lg:col-span-7 flex justify-center">
            <svg width="500" height="265" viewBox="0 0 500 265" className="max-w-full">
              {EDGES.map((edge, i) => {
                const u = NODES.find((n) => n.id === edge.from)!;
                const v = NODES.find((n) => n.id === edge.to)!;
                const active = currentStep.activeEdges.includes(
                  `${edge.from}-${edge.to}`
                );
                return (
                  <line
                    key={i}
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={active ? "#10b981" : "#cbd5e1"}
                    strokeWidth={active ? "3.5" : "2"}
                  />
                );
              })}
              {NODES.map((node) => {
                const isActive = currentStep.activeNode === node.id;
                const isVisited = currentStep.visitedOrder.includes(node.id);
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
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      fill={fill}
                      stroke={startNode === node.id ? "#0f172a" : "none"}
                      strokeWidth={startNode === node.id ? "2.5" : "0"}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="bold"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Side: Live Queue / Stack & Visited Memory State */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {algo === "BFS"
                  ? "Queue Memory (FIFO — Front Left)"
                  : "Stack Memory (LIFO — Top Right)"}
              </div>
              <div className="flex flex-wrap items-center gap-2 min-h-[34px]">
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

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Visited Sequence
              </div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[34px]">
                {currentStep.visitedOrder.length === 0 ? (
                  <span className="font-mono text-xs text-slate-400">
                    [ None yet ]
                  </span>
                ) : (
                  currentStep.visitedOrder.map((v, idx) => (
                    <span key={v} className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded font-mono font-bold text-xs">
                        {v}
                      </span>
                      {idx < currentStep.visitedOrder.length - 1 && (
                        <span className="text-slate-400 font-mono text-xs">→</span>
                      )}
                    </span>
                  ))
                )}
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
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> In {algo === "BFS" ? "Queue" : "Stack"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Current Vertex
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Visited
          </span>
        </div>
      </div>
    </div>
  );
}