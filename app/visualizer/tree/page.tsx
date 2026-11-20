"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

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
  conceptTitle: string;
  explanation: string;
  logText: string;
  sound?: "step" | "done" | "error";
}

type TraversalMode = "inorder" | "preorder" | "postorder";

const SAMPLE_BST: TreeNode = {
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
  return { val: node.val, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function insertBST(node: TreeNode | null, val: number): TreeNode {
  if (!node) return { val, left: null, right: null };
  if (val < node.val) return { ...node, left: insertBST(node.left, val) };
  if (val > node.val) return { ...node, right: insertBST(node.right, val) };
  return node;
}

export default function TreeVisualizerPage() {
  const [root, setRoot] = useState<TreeNode | null>(SAMPLE_BST);
  const [mode, setMode] = useState<TraversalMode>("inorder");
  const [valInput, setValInput] = useState("");
  const [steps, setSteps] = useState<TreeStep[]>([
    {
      root: SAMPLE_BST,
      activeNode: null,
      visitedNodes: [],
      pathNodes: [],
      conceptTitle: "Binary Search Tree (BST) Property",
      explanation:
        "Every Left child is strictly SMALLER than its parent; every Right child is strictly LARGER. Insert a number, Search, or run a Traversal.",
      logText: "Workspace ready. Sample 7-node BST loaded (Root = 50).",
    },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(2200);
  const [logs, setLogs] = useState<string[]>([
    "Workspace ready. Sample 7-node BST loaded (Root = 50).",
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

  const playStepAudioAndLog = (step: TreeStep) => {
    addLog(step.logText);
    if (step.sound === "step") soundEngine.playStep();
    else if (step.sound === "done") soundEngine.playSuccess();
    else if (step.sound === "error") soundEngine.playError();
  };

  const runSteps = (newSteps: TreeStep[]) => {
    stopTimer();
    setSteps(newSteps);
    setStepIndex(0);
    playStepAudioAndLog(newSteps[0]);
    if (newSteps.length <= 1) return;

    let idx = 0;
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= newSteps.length) {
        stopTimer();
        return;
      }
      setStepIndex(idx);
      playStepAudioAndLog(newSteps[idx]);
      if (idx === newSteps.length - 1) stopTimer();
    }, delayMs);
  };

  const handleRandomVal = () => {
    const num = Math.floor(Math.random() * 89) + 10;
    setValInput(String(num));
    soundEngine.playStep();
  };

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(valInput, 10);
    if (isNaN(num) || num < 1 || num > 99) {
      soundEngine.playError();
      addLog("Error: Enter a valid integer between 1 and 99.");
      return;
    }

    const generated: TreeStep[] = [];
    const path: number[] = [];
    let curr = root;

    if (!curr) {
      const fresh = { val: num, left: null, right: null };
      setRoot(fresh);
      setValInput("");
      runSteps([
        {
          root: fresh,
          activeNode: num,
          visitedNodes: [num],
          pathNodes: [],
          conceptTitle: "Creating Root Node",
          explanation: `The tree was empty, so ${num} becomes the top Root node.`,
          logText: `Inserted ${num} as Root node.`,
          sound: "done",
        },
      ]);
      return;
    }

    while (curr) {
      path.push(curr.val);
      if (num === curr.val) {
        setValInput("");
        runSteps([
          {
            root: cloneTree(root),
            activeNode: curr.val,
            visitedNodes: [],
            pathNodes: [...path],
            conceptTitle: "Duplicate Check",
            explanation: `${num} already exists in the tree. Standard BSTs store unique keys only.`,
            logText: `Skipped duplicate key ${num}.`,
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
          conceptTitle: `Comparing at Node ${curr.val} → Go LEFT`,
          explanation: `Is ${num} < ${curr.val}? YES! Because ${num} is smaller, we follow the Left (L) pointer.`,
          logText: `${num} < ${curr.val} → Moving to Left child`,
          sound: "step",
        });
        curr = curr.left;
      } else {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          conceptTitle: `Comparing at Node ${curr.val} → Go RIGHT`,
          explanation: `Is ${num} > ${curr.val}? YES! Because ${num} is larger, we follow the Right (R) pointer.`,
          logText: `${num} > ${curr.val} → Moving to Right child`,
          sound: "step",
        });
        curr = curr.right;
      }
    }

    const updated = insertBST(root, num);
    setRoot(updated);
    setValInput("");

    generated.push({
      root: updated,
      activeNode: num,
      visitedNodes: [num],
      pathNodes: [...path],
      conceptTitle: `Inserted Leaf Node ${num}`,
      explanation: `Found a null pointer! Attached ${num} here so the BST ordering rule stays valid.`,
      logText: `Inserted ${num} into BST.`,
      sound: "done",
    });

    runSteps(generated);
  };

  const handleSearch = () => {
    const target = parseInt(valInput, 10);
    if (isNaN(target)) {
      soundEngine.playError();
      addLog("Error: Enter a number in Val to search.");
      return;
    }

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
          conceptTitle: `Target ${target} Found!`,
          explanation: `Matched ${target} in ${path.length} step(s)! Binary search eliminates half the tree at every level.`,
          logText: `Found ${target} after ${path.length} comparison(s).`,
          sound: "done",
        });
        runSteps(generated);
        return;
      } else if (target < curr.val) {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          conceptTitle: `Searching ${target} at Node ${curr.val}`,
          explanation: `${target} < ${curr.val} → Discard the entire Right subtree and search Left.`,
          logText: `${target} < ${curr.val} → Search Left`,
          sound: "step",
        });
        curr = curr.left;
      } else {
        generated.push({
          root: cloneTree(root),
          activeNode: curr.val,
          visitedNodes: [],
          pathNodes: [...path],
          conceptTitle: `Searching ${target} at Node ${curr.val}`,
          explanation: `${target} > ${curr.val} → Discard the entire Left subtree and search Right.`,
          logText: `${target} > ${curr.val} → Search Right`,
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
      conceptTitle: `Target ${target} Not Found`,
      explanation: `Reached nullptr without finding ${target}.`,
      logText: `Value ${target} not found in BST.`,
      sound: "error",
    });
    runSteps(generated);
  };

  const handleRunTraversal = (selectedMode: TraversalMode) => {
    setMode(selectedMode);
    if (!root) {
      soundEngine.playError();
      addLog("Tree is empty. Insert nodes first.");
      return;
    }

    const conceptMap: Record<TraversalMode, string> = {
      inorder: "Inorder Traversal (Left → Root → Right)",
      preorder: "Preorder Traversal (Root → Left → Right)",
      postorder: "Postorder Traversal (Left → Right → Root)",
    };

    const introMap: Record<TraversalMode, string> = {
      inorder:
        "Inorder visits Left child first, then Root, then Right child. In a BST, this ALWAYS produces sorted ascending numbers!",
      preorder:
        "Preorder visits the Root first before exploring Left and Right subtrees. Useful for copying or serializing a tree.",
      postorder:
        "Postorder visits Left and Right children first and processes the Root last. Used when deleting a tree from bottom up.",
    };

    const generated: TreeStep[] = [
      {
        root: cloneTree(root),
        activeNode: null,
        visitedNodes: [],
        pathNodes: [],
        conceptTitle: conceptMap[selectedMode],
        explanation: introMap[selectedMode],
        logText: `Started ${selectedMode.toUpperCase()} traversal`,
      },
    ];

    const visited: number[] = [];

    const walk = (node: TreeNode | null) => {
      if (!node) return;
      if (selectedMode === "preorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          conceptTitle: `Preorder: Visit Root (${node.val}) First`,
          explanation: `Record ${node.val} immediately, then recursively traverse its Left and Right subtrees.`,
          logText: `Visited ${node.val}`,
          sound: "step",
        });
      }

      walk(node.left);

      if (selectedMode === "inorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          conceptTitle: `Inorder: Left Subtree Done → Visit (${node.val})`,
          explanation: `Finished all smaller nodes to the left of ${node.val}. Record ${node.val}, then visit larger nodes on the right.`,
          logText: `Visited ${node.val}`,
          sound: "step",
        });
      }

      walk(node.right);

      if (selectedMode === "postorder") {
        visited.push(node.val);
        generated.push({
          root: cloneTree(root),
          activeNode: node.val,
          visitedNodes: [...visited],
          pathNodes: [],
          conceptTitle: `Postorder: Both Children Done → Visit (${node.val})`,
          explanation: `Both Left and Right subtrees of ${node.val} are finished. Now record parent ${node.val}.`,
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
      conceptTitle: `${selectedMode.toUpperCase()} Traversal Complete`,
      explanation: `Final Output Sequence: [ ${visited.join(" → ")} ]`,
      logText: `${selectedMode.toUpperCase()} Result: [${visited.join(", ")}]`,
      sound: "done",
    });

    runSteps(generated);
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

  const renderTree = (
    node: TreeNode | null,
    x: number,
    y: number,
    spread: number
  ) => {
    if (!node) return null;
    const isActive = currentStep.activeNode === node.val;
    const isVisited = currentStep.visitedNodes.includes(node.val);
    const isPath = currentStep.pathNodes.includes(node.val);

    let fill = "#2563eb";
    if (isActive) fill = "#f59e0b";
    else if (isVisited) fill = "#10b981";
    else if (isPath) fill = "#8b5cf6";

    return (
      <g key={node.val}>
        {node.left && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x - spread}
              y2={y + 78}
              stroke={isPath ? "#8b5cf6" : "#cbd5e1"}
              strokeWidth={isPath ? "3" : "2"}
            />
            <text
              x={x - spread * 0.55 - 8}
              y={y + 36}
              fill="#64748b"
              fontSize="10"
              fontWeight="bold"
            >
              L
            </text>
            {renderTree(node.left, x - spread, y + 78, spread * 0.54)}
          </>
        )}
        {node.right && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x + spread}
              y2={y + 78}
              stroke={isPath ? "#8b5cf6" : "#cbd5e1"}
              strokeWidth={isPath ? "3" : "2"}
            />
            <text
              x={x + spread * 0.55 + 2}
              y={y + 36}
              fill="#64748b"
              fontSize="10"
              fontWeight="bold"
            >
              R
            </text>
            {renderTree(node.right, x + spread, y + 78, spread * 0.54)}
          </>
        )}
        <circle
          cx={x}
          cy={y}
          r="22"
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
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* 1. Top Variant Bar (Exact Linked List Style) */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-slate-500">Traversal:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(
              [
                { id: "inorder", label: "Inorder (L-Root-R)" },
                { id: "preorder", label: "Preorder (Root-L-R)" },
                { id: "postorder", label: "Postorder (L-R-Root)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleRunTraversal(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === tab.id
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Left &lt; Root &lt; Right | O(log n)
        </span>
      </div>

      {/* 2. Middle Split Row: Controls Card (Left) + Live Execution Log Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Controls Card */}
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

          {/* Row 1: Node Value Actions (Matches Linked List Controls) */}
          <form onSubmit={handleInsert} className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              value={valInput}
              onChange={(e) => setValInput(e.target.value)}
              placeholder="Val"
              className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleRandomVal}
              className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
              title="Random Value"
            >
              🎲
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              + Insert [Enter]
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                stopTimer();
                setRoot(SAMPLE_BST);
                setStepIndex(0);
                setSteps([
                  {
                    root: SAMPLE_BST,
                    activeNode: null,
                    visitedNodes: [],
                    pathNodes: [],
                    conceptTitle: "Sample Tree Restored",
                    explanation: "Loaded balanced 7-node BST (Root = 50).",
                    logText: "Restored sample 7-node BST.",
                  },
                ]);
                addLog("Restored sample 7-node BST.");
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium rounded-lg"
            >
              Sample
            </button>
            <button
              type="button"
              onClick={() => {
                stopTimer();
                setRoot(null);
                setSteps([
                  {
                    root: null,
                    activeNode: null,
                    visitedNodes: [],
                    pathNodes: [],
                    conceptTitle: "Empty Tree",
                    explanation: "ROOT -> nullptr (Empty Tree). Insert a value above.",
                    logText: "Cleared tree.",
                  },
                ]);
                setStepIndex(0);
                soundEngine.playDelete();
                addLog("Cleared tree.");
              }}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg"
            >
              Clear
            </button>
          </form>

          {/* Row 2: Manual Step-by-Step Walkthrough Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg"
            >
              ◀ Prev Step
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3.5 py-1 text-xs font-semibold text-white rounded-lg ${
                isPlaying ? "bg-amber-500" : "bg-slate-800 hover:bg-slate-900"
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Auto Play"}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={stepIndex >= steps.length - 1}
              className="px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 rounded-lg"
            >
              Next Step ▶
            </button>
          </div>
        </div>

        {/* Right Live Execution Log Card (Exact Linked List Style) */}
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

        {/* SVG Tree Diagram */}
        <div className="min-h-[290px] flex items-center justify-center overflow-x-auto">
          {currentStep.root ? (
            <svg width="700" height="290" viewBox="0 0 700 290">
              {renderTree(currentStep.root, 350, 35, 155)}
            </svg>
          ) : (
            <div className="font-mono text-sm text-slate-400">
              ROOT -&gt; nullptr (Empty Tree)
            </div>
          )}
        </div>

        {/* Traversal Output Strip */}
        {currentStep.visitedNodes.length > 0 && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-800">
              Traversal Output:
            </span>
            {currentStep.visitedNodes.map((val, idx) => (
              <span key={`${val}-${idx}`} className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-xs">
                  {val}
                </span>
                {idx < currentStep.visitedNodes.length - 1 && (
                  <span className="text-slate-400 font-mono text-xs">→</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Color Key */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Unvisited
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Comparison Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Current Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Visited / Done
          </span>
        </div>
      </div>
    </div>
  );
}