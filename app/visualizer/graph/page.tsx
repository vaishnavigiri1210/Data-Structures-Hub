"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

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
  explanation: string;
  logText: string;
  sound?: "step" | "done";
}

const NODES: GraphNode[] = [
  { id: "A", x: 320, y: 42 },
  { id: "B", x: 170, y: 118 },
  { id: "C", x: 470, y: 118 },
  { id: "D", x: 90, y: 222 },
  { id: "E", x: 250, y: 222 },
  { id: "F", x: 390, y: 222 },
  { id: "G", x: 550, y: 222 },
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

const ADJACENCY_LIST: Record<string, string[]> = {
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
  const edgesTraversed: string[] = [];

  if (algo === "BFS") {
    visited.add(startNode);
  }

  steps.push({
    activeNode: null,
    visitedOrder: [],
    frontier: [...container],
    activeEdges: [],
    explanation: `Ready for ${algo}: Added starting vertex '${startNode}' to the ${
      algo === "BFS" ? "Queue (FIFO)" : "Stack (LIFO)"
    }. Click Auto Play or Next Step.`,
    logText: `Initialized ${algo} starting at vertex ${startNode}`,
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
      activeEdges: [...edgesTraversed],
      explanation: `${
        algo === "BFS"
          ? `Dequeued '${current}' from front of Queue`
          : `Popped '${current}' from top of Stack`
      } and marked it Visited. Now checking its unvisited neighbors: [${ADJACENCY_LIST[
        current
      ].join(", ")}].`,
      logText: `Visited vertex ${current}`,
      sound: "step",
    });

    const neighbors = ADJACENCY_LIST[current] || [];
    const orderedNeighbors =
      algo === "DFS" ? [...neighbors].reverse() : neighbors;

    for (const neighbor of orderedNeighbors) {
      if (!visited.has(neighbor)) {
        if (algo === "BFS") {
          visited.add(neighbor);
        }
        container.push(neighbor);
        edgesTraversed.push(`${current}-${neighbor}`, `${neighbor}-${current}`);

        steps.push({
          activeNode: current,
          visitedOrder: [...order],
          frontier: [...container],
          activeEdges: [...edgesTraversed],
          explanation: `Neighbor '${neighbor}' of '${current}' is unvisited → Added '${neighbor}' to the ${
            algo === "BFS" ? "back of the Queue" : "top of the Stack"
          }.`,
          logText: `Discovered edge ${current} → ${neighbor} (pushed ${neighbor})`,
          sound: "step",
        });
      }
    }
  }

  steps.push({
    activeNode: null,
    visitedOrder: [...order],
    frontier: [],
    activeEdges: [...edgesTraversed],
    explanation: `${algo} Traversal Complete! All reachable vertices visited in order: ${order.join(
      " → "
    )}.`,
    logText: `${algo} Complete: ${order.join(" → ")}`,
    sound: "done",
  });

  return steps;
}

export default function GraphVisualizerPage() {
  const [startNode, setStartNode] = useState<string>("A");
  const [algo, setAlgo] = useState<"BFS" | "DFS">("BFS");
  const [steps, setSteps] = useState<GraphStep[]>(() =>
    generateGraphSteps("A", "BFS")
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(1200);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      message: "Initialized Graph Visualizer with 7 vertices & 7 edges",
      type: "info",
    },
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStep = steps[stepIndex] || steps[0];

  const appendLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        message,
        type,
      },
      ...prev.slice(0, 29),
    ]);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  };

  const triggerStepFeedback = (step: GraphStep) => {
    if (step.sound === "step") {
      soundEngine.playPush();
      appendLog(step.logText, "info");
    } else if (step.sound === "done") {
      soundEngine.playSuccess();
      appendLog(step.logText, "success");
    } else {
      appendLog(step.logText, "info");
    }
  };

  const handleConfigChange = (newStart: string, newAlgo: "BFS" | "DFS") => {
    stopAutoPlay();
    setStartNode(newStart);
    setAlgo(newAlgo);
    const newSteps = generateGraphSteps(newStart, newAlgo);
    setSteps(newSteps);
    setStepIndex(0);
    appendLog(`Configured ${newAlgo} from start node ${newStart}`, "info");
  };

  const handleNextStep = () => {
    stopAutoPlay();
    if (stepIndex < steps.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      triggerStepFeedback(steps[next]);
    }
  };

  const handlePrevStep = () => {
    stopAutoPlay();
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAutoPlay();
      return;
    }

    let idx = stepIndex >= steps.length - 1 ? 0 : stepIndex;
    setStepIndex(idx);
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= steps.length) {
        stopAutoPlay();
        return;
      }
      setStepIndex(idx);
      triggerStepFeedback(steps[idx]);
      if (idx === steps.length - 1) {
        stopAutoPlay();
      }
    }, delayMs);
  };

  const handleReset = () => {
    stopAutoPlay();
    setStepIndex(0);
    appendLog("Reset graph to Step 0", "info");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Non-Linear Data Structure
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Graph Traversal (BFS & DFS)
          </h2>
          <p className="text-xs text-slate-500">
            See how a Queue powers Breadth-First Search and a Stack powers Depth-First Search
          </p>
        </div>

        {/* Algorithm Toggle Pills */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(["BFS", "DFS"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleConfigChange(startNode, mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                algo === mode
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode === "BFS" ? "BFS (Uses Queue)" : "DFS (Uses Stack)"}
            </button>
          ))}
        </div>
      </div>

      {/* Start Vertex & Beginner Playback Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-700">Start Vertex</div>
            <div className="text-[11px] text-slate-400">
              Click a node or choose here
            </div>
          </div>
          <select
            value={startNode}
            onChange={(e) => handleConfigChange(e.target.value, algo)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50"
          >
            {NODES.map((n) => (
              <option key={n.id} value={n.id}>
                Node {n.id}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg"
            >
              ◀ Prev
            </button>
            <button
              onClick={handlePlayPause}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Auto Play"}
            </button>
            <button
              onClick={handleNextStep}
              disabled={stepIndex >= steps.length - 1}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 rounded-lg"
            >
              Next Step ▶
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
            >
              ↺ Reset
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Speed:</span>
            {[
              { label: "Slow (1.8s)", ms: 1800 },
              { label: "Normal (1.2s)", ms: 1200 },
              { label: "Fast (0.5s)", ms: 500 },
            ].map((preset) => (
              <button
                key={preset.ms}
                onClick={() => {
                  stopAutoPlay();
                  setDelayMs(preset.ms);
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                  delayMs === preset.ms
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plain-English Live Explanation Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-lg">💡</span>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Step {stepIndex} of {steps.length - 1} — What is happening now:
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-0.5">
            {currentStep.explanation}
          </p>
        </div>
      </div>

      {/* Main Graph Canvas + Live Frontier State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center shadow-xs">
          <svg width="640" height="275" viewBox="0 0 640 275" className="max-w-full">
            {EDGES.map((edge, idx) => {
              const fromNode = NODES.find((n) => n.id === edge.from)!;
              const toNode = NODES.find((n) => n.id === edge.to)!;
              const isTraversed = currentStep.activeEdges.includes(
                `${edge.from}-${edge.to}`
              );

              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isTraversed ? "#10b981" : "#cbd5e1"}
                  strokeWidth={isTraversed ? "3.5" : "2"}
                  className="transition-all duration-300"
                />
              );
            })}

            {NODES.map((node) => {
              const isCurrent = currentStep.activeNode === node.id;
              const isVisited = currentStep.visitedOrder.includes(node.id);
              const isInFrontier = currentStep.frontier.includes(node.id);

              let fill = "#2563eb";
              if (isCurrent) fill = "#f59e0b";
              else if (isVisited) fill = "#10b981";
              else if (isInFrontier) fill = "#8b5cf6";

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    handleConfigChange(node.id, algo);
                    soundEngine.playPush();
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="23"
                    fill={fill}
                    stroke={startNode === node.id ? "#0f172a" : "none"}
                    strokeWidth={startNode === node.id ? "2.5" : "0"}
                    className="transition-colors duration-300"
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

          <div className="flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-slate-100 w-full text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Unvisited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Waiting in {algo === "BFS" ? "Queue" : "Stack"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Current Vertex
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Visited
            </span>
          </div>
        </div>

        {/* Live Data Structure Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {algo === "BFS"
                ? "Active BFS Queue (Front → Back)"
                : "Active DFS Stack (Bottom → Top)"}
            </h3>
            <div className="min-h-[48px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-2">
              {currentStep.frontier.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Empty</span>
              ) : (
                currentStep.frontier.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold text-xs"
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Visited Sequence
            </h3>
            <div className="min-h-[48px] p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center gap-1.5">
              {currentStep.visitedOrder.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Not started</span>
              ) : (
                currentStep.visitedOrder.map((node, i) => (
                  <span key={node} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                      {node}
                    </span>
                    {i < currentStep.visitedOrder.length - 1 && (
                      <span className="text-slate-400 font-bold text-xs">→</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">
              {algo === "BFS" ? "How BFS Works:" : "How DFS Works:"}
            </div>
            <p className="text-[11px] leading-relaxed">
              {algo === "BFS"
                ? "Explores all immediate neighbors level-by-level using a First-In-First-Out (FIFO) Queue."
                : "Explores as deep as possible down one branch before backtracking using a Last-In-First-Out (LIFO) Stack."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Complexity Card + Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Graph Complexity</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every vertex (<strong>V</strong>) and edge (<strong>E</strong>) is
            visited once during traversal.
          </p>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Time Complexity</span>
              <span className="font-bold text-blue-600">O(V + E)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Space Complexity</span>
              <span className="font-bold text-emerald-600">O(V)</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Execution Trace Log</h3>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-500"
            >
              Clear Log
            </button>
          </div>
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 font-mono text-xs h-44 overflow-y-auto space-y-1.5">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 border-b border-slate-800/60 pb-1"
              >
                <span className="text-slate-500 text-[10px] shrink-0">
                  [{entry.time}]
                </span>
                <span
                  className={
                    entry.type === "success"
                      ? "text-emerald-400"
                      : entry.type === "error"
                      ? "text-rose-400"
                      : "text-blue-300"
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}