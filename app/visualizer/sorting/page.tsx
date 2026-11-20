"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

type SortAlgo = "bubble" | "selection" | "insertion" | "quick";

interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  conceptTitle: string;
  explanation: string;
  logText: string;
  sound?: "step" | "done";
}

const ALGO_META: Record<
  SortAlgo,
  { label: string; complexity: string; concept: string }
> = {
  bubble: {
    label: "Bubble Sort",
    complexity: "Adjacent Swaps | Time: O(n²)",
    concept:
      "Compares neighbors [j] and [j+1]. If left > right, swaps them so the biggest unsorted number 'bubbles' to the right end on every pass.",
  },
  selection: {
    label: "Selection Sort",
    complexity: "Select Minimum | Time: O(n²)",
    concept:
      "Scans the unsorted part to find the smallest value, then swaps it directly into the front unsorted slot.",
  },
  insertion: {
    label: "Insertion Sort",
    complexity: "Shift & Insert | Time: O(n²)",
    concept:
      "Takes one element (the Key) at a time and shifts larger sorted elements right until the Key lands in its proper sorted spot.",
  },
  quick: {
    label: "Quick Sort",
    complexity: "Divide & Pivot | Time: O(n log n)",
    concept:
      "Picks the last element as a Pivot and partitions smaller numbers to its left and larger numbers to its right.",
  },
};

function buildSortSteps(initialArr: number[], algo: SortAlgo): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...initialArr];
  const n = arr.length;
  const locked = new Set<number>();

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    conceptTitle: `${ALGO_META[algo].label} — Ready`,
    explanation: ALGO_META[algo].concept,
    logText: `Workspace ready. Array: [${arr.join(", ")}].`,
  });

  if (algo === "bubble") {
    for (let i = 0; i < n - 1; i++) {
      let anySwap = false;
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [],
          sorted: Array.from(locked),
          conceptTitle: `Pass ${i + 1}: Compare Index [${j}] and [${j + 1}]`,
          explanation: `Is ${arr[j]} > ${arr[j + 1]}? ${
            arr[j] > arr[j + 1]
              ? `YES (${arr[j]} is larger), so we will swap them next.`
              : `NO (${arr[j]} ≤ ${arr[j + 1]}), so they stay in order.`
          }`,
          logText: `Compare [${j}]=${arr[j]} vs [${j + 1}]=${arr[j + 1]}`,
          sound: "step",
        });

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          anySwap = true;
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [j, j + 1],
            sorted: Array.from(locked),
            conceptTitle: `Swapped ${arr[j + 1]} and ${arr[j]}`,
            explanation: `Moved larger value ${arr[j + 1]} one step closer to the right end.`,
            logText: `Swapped [${j}] ↔ [${j + 1}] (${arr[j]}, ${arr[j + 1]})`,
            sound: "step",
          });
        }
      }
      locked.add(n - 1 - i);
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: Array.from(locked),
        conceptTitle: `Pass ${i + 1} Complete — Index [${n - 1 - i}] Locked`,
        explanation: `${arr[n - 1 - i]} has bubbled to its final sorted position and won't move again.`,
        logText: `Locked ${arr[n - 1 - i]} at index [${n - 1 - i}]`,
      });
      if (!anySwap) {
        for (let k = 0; k < n; k++) locked.add(k);
        break;
      }
    }
    locked.add(0);
  } else if (algo === "selection") {
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        steps.push({
          array: [...arr],
          comparing: [minIdx, j],
          swapping: [],
          sorted: Array.from(locked),
          conceptTitle: `Pass ${i + 1}: Hunting for Minimum`,
          explanation: `Current minimum is ${arr[minIdx]} at [${minIdx}]. Checking if [${j}] (${arr[j]}) is even smaller.`,
          logText: `Compare min [${minIdx}]=${arr[minIdx]} vs [${j}]=${arr[j]}`,
          sound: "step",
        });
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [i, minIdx],
          sorted: Array.from(locked),
          conceptTitle: `Place Minimum ${arr[i]} at Index [${i}]`,
          explanation: `Swapped smallest unsorted element (${arr[i]}) into sorted slot [${i}].`,
          logText: `Swapped ${arr[i]} into index [${i}]`,
          sound: "step",
        });
      }
      locked.add(i);
    }
  } else if (algo === "insertion") {
    locked.add(0);
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;
      steps.push({
        array: [...arr],
        comparing: [i],
        swapping: [],
        sorted: Array.from(locked),
        conceptTitle: `Pick Key = ${key} at Index [${i}]`,
        explanation: `Compare Key (${key}) against the sorted elements on its left to find where it fits.`,
        logText: `Selected Key = ${key} at [${i}]`,
        sound: "step",
      });
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        arr[j] = key;
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sorted: Array.from(locked),
          conceptTitle: `Shift ${arr[j + 1]} Right`,
          explanation: `Since ${arr[j + 1]} > Key (${key}), shift ${arr[j + 1]} right to index [${j + 1}].`,
          logText: `Shifted ${arr[j + 1]} right; Key ${key} at [${j}]`,
          sound: "step",
        });
        j--;
      }
      locked.add(i);
    }
  } else if (algo === "quick") {
    const quick = (low: number, high: number) => {
      if (low < high) {
        const pivot = arr[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
          steps.push({
            array: [...arr],
            comparing: [j, high],
            swapping: [],
            sorted: Array.from(locked),
            conceptTitle: `Partitioning with Pivot = ${pivot} at [${high}]`,
            explanation: `Compare [${j}] (${arr[j]}) with Pivot (${pivot}). Values smaller than ${pivot} move to the left side.`,
            logText: `Compare [${j}]=${arr[j]} vs Pivot=${pivot}`,
            sound: "step",
          });
          if (arr[j] < pivot) {
            i++;
            if (i !== j) {
              [arr[i], arr[j]] = [arr[j], arr[i]];
              steps.push({
                array: [...arr],
                comparing: [],
                swapping: [i, j],
                sorted: Array.from(locked),
                conceptTitle: `Move ${arr[i]} Left of Pivot`,
                explanation: `${arr[i]} < ${pivot}, so swap [${i}] and [${j}].`,
                logText: `Swapped [${i}] ↔ [${j}]`,
                sound: "step",
              });
            }
          }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        const pi = i + 1;
        locked.add(pi);
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [pi, high],
          sorted: Array.from(locked),
          conceptTitle: `Pivot ${pivot} Locked at Index [${pi}]`,
          explanation: `All elements left of [${pi}] are smaller than ${pivot}; all elements right are larger.`,
          logText: `Pivot ${pivot} placed at [${pi}]`,
          sound: "step",
        });
        quick(low, pi - 1);
        quick(pi + 1, high);
      } else if (low === high) {
        locked.add(low);
      }
    };
    quick(0, n - 1);
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, idx) => idx),
    conceptTitle: "Array Completely Sorted!",
    explanation: `Final Sorted Array: [ ${arr.join(", ")} ]`,
    logText: `${ALGO_META[algo].label} completed.`,
    sound: "done",
  });

  return steps;
}

export default function SortingVisualizerPage() {
  const [algo, setAlgo] = useState<SortAlgo>("bubble");
  const [baseArr, setBaseArr] = useState<number[]>([42, 18, 65, 12, 53, 29, 71]);
  const [inputStr, setInputStr] = useState("42, 18, 65, 12, 53, 29, 71");
  const [steps, setSteps] = useState<SortStep[]>(() =>
    buildSortSteps([42, 18, 65, 12, 53, 29, 71], "bubble")
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(2200);
  const [logs, setLogs] = useState<string[]>([
    "Workspace ready. Click Start Sort or Next Step.",
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

  const playStepAudioAndLog = (step: SortStep) => {
    addLog(step.logText);
    if (step.sound === "step") soundEngine.playStep();
    else if (step.sound === "done") soundEngine.playSuccess();
  };

  const handleSelectAlgo = (newAlgo: SortAlgo) => {
    stopTimer();
    setAlgo(newAlgo);
    const nextSteps = buildSortSteps(baseArr, newAlgo);
    setSteps(nextSteps);
    setStepIndex(0);
    addLog(`Selected ${ALGO_META[newAlgo].label}.`);
  };

  const handleSetArray = (e: React.FormEvent) => {
    e.preventDefault();
    stopTimer();
    const nums = inputStr
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 5 && n <= 99);

    if (nums.length < 3 || nums.length > 10) {
      soundEngine.playError();
      addLog("Error: Enter 3 to 10 integers (between 5 and 99).");
      return;
    }

    setBaseArr(nums);
    setSteps(buildSortSteps(nums, algo));
    setStepIndex(0);
    soundEngine.playInsert();
    addLog(`Set custom array: [${nums.join(", ")}].`);
  };

  const handleRandomize = () => {
    stopTimer();
    const arr = Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 12);
    setBaseArr(arr);
    setInputStr(arr.join(", "));
    setSteps(buildSortSteps(arr, algo));
    setStepIndex(0);
    soundEngine.playStep();
    addLog(`Generated random array: [${arr.join(", ")}].`);
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
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-slate-500">Algorithm:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg flex-wrap">
            {(["bubble", "selection", "insertion", "quick"] as SortAlgo[]).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => handleSelectAlgo(key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    algo === key
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {ALGO_META[key].label}
                </button>
              )
            )}
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {ALGO_META[algo].complexity}
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

          <form onSubmit={handleSetArray} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              placeholder="42, 18, 65, 12"
              className="flex-1 min-w-[150px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={handleRandomize}
              className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
              title="Random Array"
            >
              🎲
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Set Array
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-2xs ${
                isPlaying ? "bg-amber-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Start Sort"}
            </button>
          </form>

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
              onClick={handleNext}
              disabled={stepIndex >= steps.length - 1}
              className="px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 rounded-lg"
            >
              Next Step ▶
            </button>
            <button
              type="button"
              onClick={() => {
                stopTimer();
                setStepIndex(0);
                addLog("Reset to Step 0.");
              }}
              className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg"
            >
              Reset
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
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

        {/* Array Bars & Index Boxes */}
        <div className="h-64 flex items-end justify-center gap-4 pt-6 pb-2">
          {currentStep.array.map((val, idx) => {
            const isComp = currentStep.comparing.includes(idx);
            const isSwap = currentStep.swapping.includes(idx);
            const isDone = currentStep.sorted.includes(idx);

            let barColor = "bg-blue-500 border-blue-600";
            let tag = "";
            if (isSwap) {
              barColor = "bg-rose-500 border-rose-600 scale-105";
              tag = "SWAP";
            } else if (isComp) {
              barColor = "bg-amber-400 border-amber-500 scale-105";
              tag = "COMPARE";
            } else if (isDone) {
              barColor = "bg-emerald-500 border-emerald-600";
              tag = "LOCKED";
            }

            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 max-w-[68px]"
              >
                {tag && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-1.5 ${
                      isSwap
                        ? "bg-rose-100 text-rose-700"
                        : isComp
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {tag}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-800 mb-1">
                  {val}
                </span>
                <div
                  style={{ height: `${Math.max(val * 1.85, 24)}px` }}
                  className={`w-full rounded-t-lg border-2 transition-all duration-300 ${barColor}`}
                />
                <span className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  [{idx}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Color Key */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Unsorted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Comparing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Swapping
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Sorted &amp; Locked
          </span>
        </div>
      </div>
    </div>
  );
}