"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface TreeStep {
  root: TreeNode | null;
  activeNode: number | null;
  visitedNodes: number[];
  pathNodes: number[];
  explanation: string;
  logText: string;
  sound?: "step" | "done" | "error";
}

type TraversalType = "inorder" | "preorder" | "postorder";

const INITIAL_TREE: TreeNode = {
  val: 50,
  left: {
    val: 30,
    left: { val: 20, left: null, right: null },
    right: { val: 40, left: null, right: null },
  },
  right: {
    val: 70,
    left: { val: 60, left: null, right: null },
    right: { val: 80, left: null, right: null },
  },
};

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    val: node.val,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function insertIntoTree(node: TreeNode | null, val: number): TreeNode {
  if (!node) return { val, left: null, right: null };
  if (val < node.val) {
    return { ...node, left: insertIntoTree(node.left, val) };
  }
  if (val > node.val) {
    return { ...node, right: insertIntoTree(node.right, val) };
  }
  return node;
}

export default function TreeVisualizerPage() {
  const [root, setRoot] = useState<TreeNode | null>(INITIAL_TREE);
  const [inputVal, setInputVal] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [steps, setSteps] = useState<TreeStep[]>([
    {
      root: INITIAL_TREE,
      activeNode: null,
      visitedNodes: [],
      pathNodes: [],
      explanation:
        "Initialized a balanced Binary Search Tree (Root = 50). Left children are smaller; right children are larger.",
      logText: "Loaded sample BST with 7 nodes",
    },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(1200);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      message: "Initialized BST Visualizer",
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

  const triggerStepFeedback = (step: TreeStep) => {
    if (step.sound === "step") {
      soundEngine.playPush();
      appendLog(step.logText, "info");
    } else if (step.sound === "done") {
      soundEngine.playSuccess();
      appendLog(step.logText, "success");
    } else if (step.sound === "error") {
      soundEngine.playError();
      appendLog(step.logText, "error");
    } else {
      appendLog(step.logText, "info");
    }
  };

  const startAutoPlaySteps = (generatedSteps: TreeStep[]) => {
    stopAutoPlay();
    setSteps(generatedSteps);
    setStepIndex(0);
    triggerStepFeedback(generatedSteps[0]);

    if (generatedSteps.length <= 1) return;

    let idx = 0;
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= generatedSteps.length) {
        stopAutoPlay();
        return;
      }
      setStepIndex(idx);
      triggerStepFeedback(generatedSteps[idx]);
      if (idx === generatedSteps.length - 1) {
        stopAutoPlay();
      }
    }, delayMs);
  };

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(inputVal, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      soundEngine.playError();
      appendLog("Enter a valid number between 1 and 99.", "error");
      return;
    }

    const generated: TreeStep[] = [];
    const path: number[] = [];
    let curr = root;

    if (!curr) {
      const updated = { val: num, left: null, right: null };
      setRoot(updated);
      setInputVal("");
      startAutoPlaySteps([
        {
          root: updated,
          activeNode: num,
          visitedNodes: [num],
          pathNodes: [],
          explanation: `Tree was empty, so ${num} becomes the new Root node!`,
          logText: `Inserted ${num} as Root`,
          sound: "done",
        },
      ]);
      return;
    }

    while (curr) {
      path.push(curr.val);
      if (num === curr.val) {
        setInputVal("");
        startAutoPlaySteps([
          {
            root: cloneTree(root),
            activeNode: curr.val,
            visitedNodes: [],
            pathNodes: [...path],
            explanation: `Duplicate value! ${num} already exists in the BST, so insertion stops.`,
            logText: `Duplicate ${num} ignored`,
            sound: "error",
          },
        ]);
        return;
      } else if (num < curr.val) {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          explanation: `Compare ${num} with node ${curr.val}: Since ${num} < ${curr.val}, move to the LEFT child.`,
          logText: `${num} < ${curr.val} → Go Left`,
          sound: "step",
        });
        curr = curr.left;
      } else {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          explanation: `Compare ${num} with node ${curr.val}: Since ${num} > ${curr.val}, move to the RIGHT child.`,
          logText: `${num} > ${curr.val} → Go Right`,
          sound: "step",
        });
        curr = curr.right;
      }
    }

    const updatedRoot = insertIntoTree(root, num);
    setRoot(updatedRoot);
    setInputVal("");

    generated.push({
      root: updatedRoot,
      activeNode: num,
      visitedNodes: [num],
      pathNodes: [...path],
      explanation: `Reached an empty spot! Inserted ${num} as a new leaf node.`,
      logText: `Inserted node ${num} into BST`,
      sound: "done",
    });

    startAutoPlaySteps(generated);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(searchVal, 10);
    if (isNaN(target)) return;

    const generated: TreeStep[] = [];
    const path: number[] = [];
    let curr = root;

    while (curr) {
      path.push(curr.val);
      if (target === curr.val) {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [curr.val],
          pathNodes: [...path],
          explanation: `Found ${target}! Matched at node ${curr.val} after ${path.length} comparison(s).`,
          logText: `Search found ${target}`,
          sound: "done",
        });
        setSearchVal("");
        startAutoPlaySteps(generated);
        return;
      } else if (target < curr.val) {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          explanation: `Searching for ${target}: ${target} < ${curr.val}, so search the LEFT subtree.`,
          logText: `Search ${target} < ${curr.val} → Left`,
          sound: "step",
        });
        curr = curr.left;
      } else {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          explanation: `Searching for ${target}: ${target} > ${curr.val}, so search the RIGHT subtree.`,
          logText: `Search ${target} > ${curr.val} → Right`,
          sound: "step",
        });
        curr = curr.right;
      }
    }

    generated.push({
      root: cloneTree(root),
      activeNode: null,
      visitedNodes: [],
      pathNodes: [...path],
      explanation: `Reached null pointer. Value ${target} does NOT exist in this BST.`,
      logText: `Search ${target} not found`,
      sound: "error",
    });

    setSearchVal("");
    startAutoPlaySteps(generated);
  };

  const handleTraversal = (type: TraversalType) => {
    if (!root) {
      soundEngine.playError();
      appendLog("Tree is empty. Insert nodes first.", "error");
      return;
    }

    const ruleDesc: Record<TraversalType, string> = {
      inorder: "Left Subtree → Root → Right Subtree (gives sorted ascending order!)",
      preorder: "Root → Left Subtree → Right Subtree (visits parent before children)",
      postorder: "Left Subtree → Right Subtree → Root (visits children before parent)",
    };

    const generated: TreeStep[] = [
      {
        root: cloneTree(root),
        activeNode: null,
        visitedNodes: [],
        pathNodes: [],
        explanation: `Starting ${type.toUpperCase()} Traversal: Rule is ${ruleDesc[type]}`,
        logText: `Started ${type.toUpperCase()} traversal`,
      },
    ];

    const visited: number[] = [];

    const walk = (node: TreeNode | null) => {
      if (!node) return;

      if (type === "preorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          explanation: `Preorder (Root first): Visit node ${node.val}, then explore its Left and Right subtrees.`,
          logText: `Visited ${node.val}`,
          sound: "step",
        });
      }

      walk(node.left);

      if (type === "inorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          explanation: `Inorder (Left done → Root): Visit node ${node.val}, then move to its Right subtree.`,
          logText: `Visited ${node.val}`,
          sound: "step",
        });
      }

      walk(node.right);

      if (type === "postorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          explanation: `Postorder (Left & Right done → Root): Visit parent node ${node.val}.`,
          logText: `Visited ${node.val}`,
          sound: "step",
        });
      }
    };

    walk(root);

    generated.push({
      root: cloneTree(root),
      activeNode: null,
      visitedNodes: [...visited],
      pathNodes: [],
      explanation: `${type.toUpperCase()} Traversal Complete! Final sequence: [${visited.join(" → ")}].`,
      logText: `${type.toUpperCase()} order: ${visited.join(" → ")}`,
      sound: "done",
    });

    startAutoPlaySteps(generated);
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
      if (idx === steps.length - 1) stopAutoPlay();
    }, delayMs);
  };

  const handleResetSample = () => {
    stopAutoPlay();
    setRoot(INITIAL_TREE);
    setSteps([
      {
        root: INITIAL_TREE,
        activeNode: null,
        visitedNodes: [],
        pathNodes: [],
        explanation: "Reset to balanced 7-node sample BST.",
        logText: "Reset BST to sample tree",
      },
    ]);
    setStepIndex(0);
    appendLog("Reset BST to sample tree", "info");
  };

  const handleClearTree = () => {
    stopAutoPlay();
    setRoot(null);
    setSteps([
      {
        root: null,
        activeNode: null,
        visitedNodes: [],
        pathNodes: [],
        explanation: "Tree cleared. Insert any number (1–99) above to create the Root node.",
        logText: "Cleared all tree nodes",
      },
    ]);
    setStepIndex(0);
    soundEngine.playDelete();
    appendLog("Cleared tree", "info");
  };

  const renderTree = (
    node: TreeNode | null,
    x: number,
    y: number,
    spread: number
  ) => {
    if (!node) return null;
    const isCurrent = currentStep.activeNode === node.val;
    const isVisited = currentStep.visitedNodes.includes(node.val);
    const isOnPath = currentStep.pathNodes.includes(node.val);

    let fill = "#2563eb";
    if (isCurrent) fill = "#f59e0b";
    else if (isVisited) fill = "#10b981";
    else if (isOnPath) fill = "#8b5cf6";

    return (
      <g key={node.val}>
        {node.left && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x - spread}
              y2={y + 72}
              stroke={isOnPath ? "#8b5cf6" : "#cbd5e1"}
              strokeWidth={isOnPath ? "3" : "2"}
            />
            {renderTree(node.left, x - spread, y + 72, spread * 0.54)}
          </>
        )}
        {node.right && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x + spread}
              y2={y + 72}
              stroke={isOnPath ? "#8b5cf6" : "#cbd5e1"}
              strokeWidth={isOnPath ? "3" : "2"}
            />
            {renderTree(node.right, x + spread, y + 72, spread * 0.54)}
          </>
        )}
        <circle
          cx={x}
          cy={y}
          r="21"
          fill={fill}
          className="transition-colors duration-300"
        />
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="bold"
        >
          {node.val}
        </text>
      </g>
    );
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
            Binary Search Tree (BST)
          </h2>
          <p className="text-xs text-slate-500">
            Visualize hierarchical insertion, binary search paths, and DFS traversals step by step
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTraversal("inorder")}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
          >
            Inorder (L-Root-R)
          </button>
          <button
            onClick={() => handleTraversal("preorder")}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
          >
            Preorder (Root-L-R)
          </button>
          <button
            onClick={() => handleTraversal("postorder")}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
          >
            Postorder (L-R-Root)
          </button>
        </div>
      </div>

      {/* Node Operations & Beginner Playback Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <form onSubmit={handleInsert} className="flex gap-1.5 flex-1">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Insert (1–99)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0"
              >
                + Insert
              </button>
            </form>

            <form onSubmit={handleSearch} className="flex gap-1.5 flex-1">
              <input
                type="number"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search node"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shrink-0"
              >
                🔍 Find
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <button
              type="button"
              onClick={handleResetSample}
              className="text-blue-600 font-semibold hover:underline"
            >
              ↺ Restore Sample Tree
            </button>
            <button
              type="button"
              onClick={handleClearTree}
              className="text-rose-600 font-semibold hover:underline"
            >
              🗑 Clear Tree
            </button>
          </div>
        </div>

        {/* Step & Speed Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
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

      {/* SVG Canvas + Live Output Sequence */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex justify-center overflow-x-auto">
          <svg width="700" height="300" viewBox="0 0 700 300">
            {currentStep.root ? (
              renderTree(currentStep.root, 350, 38, 155)
            ) : (
              <text
                x="350"
                y="150"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="13"
              >
                Tree is empty. Insert a number above to create the Root node.
              </text>
            )}
          </svg>
        </div>

        {/* Visited Output Strip */}
        {currentStep.visitedNodes.length > 0 && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 mr-1">
              Output Sequence:
            </span>
            {currentStep.visitedNodes.map((val, i) => (
              <span key={`${val}-${i}`} className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-xs">
                  {val}
                </span>
                {i < currentStep.visitedNodes.length - 1 && (
                  <span className="text-slate-400 font-bold text-xs">→</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Unvisited Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Comparison Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Active Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Visited / Inserted
          </span>
        </div>
      </div>

      {/* Bottom Theory & Trace Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">BST Rules & Complexity</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            For every node in a Binary Search Tree, all values in its{" "}
            <strong>left subtree are smaller</strong> and all values in its{" "}
            <strong>right subtree are larger</strong>.
          </p>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Search (Avg)</span>
              <span className="font-bold text-emerald-600">O(log n)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Insert (Avg)</span>
              <span className="font-bold text-blue-600">O(log n)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Worst (Skewed)</span>
              <span className="font-bold text-rose-600">O(n)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Traversal</span>
              <span className="font-bold text-slate-700">O(n)</span>
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