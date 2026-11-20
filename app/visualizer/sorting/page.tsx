"use client";

import { useState, useRef } from "react";
import { soundEngine } from "@/lib/sound";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

type SortAlgo = "bubble" | "selection" | "insertion" | "quick";

interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  explanation: string;
  logText: string;
  sound?: "compare" | "swap" | "done";
}

const ALGO_INFO: Record<
  SortAlgo,
  {
    title: string;
    howItWorks: string;
    best: string;
    average: string;
    worst: string;
    space: string;
  }
> = {
  bubble: {
    title: "Bubble Sort",
    howItWorks:
      "Repeatedly compares adjacent elements and swaps them if they are in the wrong order. Larger values 'bubble up' to the right end after each pass.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  selection: {
    title: "Selection Sort",
    howItWorks:
      "Finds the smallest element from the unsorted portion in each pass and places it at the beginning of the unsorted section.",
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  insertion: {
    title: "Insertion Sort",
    howItWorks:
      "Builds the sorted array one item at a time by taking the next element and shifting larger sorted elements to the right until it fits.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  quick: {
    title: "Quick Sort",
    howItWorks:
      "Picks a 'Pivot' element and partitions the array so elements smaller than the pivot move left and larger elements move right.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
  },
};

function generateSortSteps(initialArr: number[], algo: SortAlgo): SortStep[] {
  const steps: SortStep[] = [];
  const arr = [...initialArr];
  const n = arr.length;
  const sortedIndices = new Set<number>();

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    explanation: `Initial unsorted array: [${arr.join(", ")}]. Ready to begin ${ALGO_INFO[algo].title}.`,
    logText: `Initialized ${ALGO_INFO[algo].title} with ${n} elements`,
  });

  if (algo === "bubble") {
    for (let i = 0; i < n - 1; i++) {
      let swappedInPass = false;
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [],
          sorted: Array.from(sortedIndices),
          explanation: `Pass ${i + 1}: Comparing index [${j}] (${arr[j]}) and index [${j + 1}] (${arr[j + 1]}). Is ${arr[j]} > ${arr[j + 1]}?`,
          logText: `Compare [${j}]=${arr[j]} vs [${j + 1}]=${arr[j + 1]}`,
          sound: "compare",
        });

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swappedInPass = true;
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [j, j + 1],
            sorted: Array.from(sortedIndices),
            explanation: `Yes! ${arr[j + 1]} > ${arr[j]}, so we SWAP them. Larger value ${arr[j + 1]} moves right.`,
            logText: `Swapped ${arr[j + 1]} ↔ ${arr[j]}`,
            sound: "swap",
          });
        }
      }
      sortedIndices.add(n - 1 - i);
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: Array.from(sortedIndices),
        explanation: `Pass ${i + 1} complete! Element ${arr[n - 1 - i]} is now locked in its final sorted position at index [${n - 1 - i}].`,
        logText: `Pass ${i + 1} locked element ${arr[n - 1 - i]}`,
      });
      if (!swappedInPass) {
        for (let k = 0; k < n; k++) sortedIndices.add(k);
        break;
      }
    }
    sortedIndices.add(0);
  } else if (algo === "selection") {
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      steps.push({
        array: [...arr],
        comparing: [i],
        swapping: [],
        sorted: Array.from(sortedIndices),
        explanation: `Pass ${i + 1}: Assume index [${i}] (${arr[i]}) is the smallest value in the unsorted portion.`,
        logText: `Current minimum assumed: ${arr[i]} at [${i}]`,
      });

      for (let j = i + 1; j < n; j++) {
        steps.push({
          array: [...arr],
          comparing: [minIdx, j],
          swapping: [],
          sorted: Array.from(sortedIndices),
          explanation: `Checking if [${j}] (${arr[j]}) is smaller than current minimum [${minIdx}] (${arr[minIdx]}).`,
          logText: `Compare [${j}]=${arr[j]} with min [${minIdx}]=${arr[minIdx]}`,
          sound: "compare",
        });

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          steps.push({
            array: [...arr],
            comparing: [minIdx],
            swapping: [],
            sorted: Array.from(sortedIndices),
            explanation: `Found a new smaller element! ${arr[minIdx]} at index [${minIdx}] becomes the new minimum.`,
            logText: `New minimum found: ${arr[minIdx]} at [${minIdx}]`,
          });
        }
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [i, minIdx],
          sorted: Array.from(sortedIndices),
          explanation: `Swapping smallest found (${arr[i]}) into sorted position index [${i}].`,
          logText: `Swapped min ${arr[i]} into [${i}]`,
          sound: "swap",
        });
      }
      sortedIndices.add(i);
    }
  } else if (algo === "insertion") {
    sortedIndices.add(0);
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [0],
      explanation: `First element [${0}] (${arr[0]}) is trivially sorted by itself.`,
      logText: `Element [${0}]=${arr[0]} marked sorted`,
    });

    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;

      steps.push({
        array: [...arr],
        comparing: [i],
        swapping: [],
        sorted: Array.from(sortedIndices),
        explanation: `Pick key element ${key} at index [${i}] and find where it belongs in the sorted left section.`,
        logText: `Selected key = ${key} at [${i}]`,
        sound: "compare",
      });

      while (j >= 0 && arr[j] > key) {
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: [],
          sorted: Array.from(sortedIndices),
          explanation: `Since ${arr[j]} > key (${key}), shift ${arr[j]} one position to the right.`,
          logText: `Shift ${arr[j]} from [${j}] to [${j + 1}]`,
          sound: "swap",
        });
        arr[j + 1] = arr[j];
        arr[j] = key;
        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sorted: Array.from(sortedIndices),
          explanation: `Shifted ${arr[j + 1]} right; key ${key} is now at index [${j}].`,
          logText: `Placed key ${key} temporarily at [${j}]`,
        });
        j--;
      }
      sortedIndices.add(i);
    }
  } else if (algo === "quick") {
    const quickSort = (low: number, high: number) => {
      if (low < high) {
        const pivot = arr[high];
        let i = low - 1;

        steps.push({
          array: [...arr],
          comparing: [high],
          swapping: [],
          sorted: Array.from(sortedIndices),
          explanation: `Selected last element [${high}] (${pivot}) as the PIVOT for subarray [${low}..${high}].`,
          logText: `Pivot = ${pivot} at [${high}]`,
        });

        for (let j = low; j < high; j++) {
          steps.push({
            array: [...arr],
            comparing: [j, high],
            swapping: [],
            sorted: Array.from(sortedIndices),
            explanation: `Compare [${j}] (${arr[j]}) with Pivot (${pivot}). Values smaller than ${pivot} go to the left.`,
            logText: `Compare [${j}]=${arr[j]} vs Pivot=${pivot}`,
            sound: "compare",
          });

          if (arr[j] < pivot) {
            i++;
            if (i !== j) {
              [arr[i], arr[j]] = [arr[j], arr[i]];
              steps.push({
                array: [...arr],
                comparing: [],
                swapping: [i, j],
                sorted: Array.from(sortedIndices),
                explanation: `${arr[i]} < ${pivot}, so swap [${i}] and [${j}] to move ${arr[i]} to the left partition.`,
                logText: `Moved ${arr[i]} left (swapped [${i}] ↔ [${j}])`,
                sound: "swap",
              });
            }
          }
        }

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        const pi = i + 1;
        sortedIndices.add(pi);

        steps.push({
          array: [...arr],
          comparing: [],
          swapping: [pi, high],
          sorted: Array.from(sortedIndices),
          explanation: `Placed Pivot (${pivot}) into its exact sorted index [${pi}]. Everything left is smaller; everything right is larger.`,
          logText: `Pivot ${pivot} locked at [${pi}]`,
          sound: "swap",
        });

        quickSort(low, pi - 1);
        quickSort(pi + 1, high);
      } else if (low === high) {
        sortedIndices.add(low);
      }
    };

    quickSort(0, n - 1);
  }

  steps.push({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, idx) => idx),
    explanation: `Sorting Complete! Final sorted array: [${arr.join(", ")}].`,
    logText: `Completed ${ALGO_INFO[algo].title}!`,
    sound: "done",
  });

  return steps;
}

export default function SortingVisualizerPage() {
  const [algo, setAlgo] = useState<SortAlgo>("bubble");
  const [baseArray, setBaseArray] = useState<number[]>([38, 19, 54, 12, 45, 27, 63, 15]);
  const [customInput, setCustomInput] = useState("38, 19, 54, 12, 45, 27, 63, 15");
  const [steps, setSteps] = useState<SortStep[]>(() =>
    generateSortSteps([38, 19, 54, 12, 45, 27, 63, 15], "bubble")
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(1200);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      message: "Loaded Bubble Sort visualizer with 8 elements",
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

  const applyStepSoundAndLog = (step: SortStep) => {
    if (step.sound === "swap") {
      soundEngine.playPush();
      appendLog(step.logText, "success");
    } else if (step.sound === "done") {
      soundEngine.playSuccess();
      appendLog(step.logText, "success");
    } else {
      appendLog(step.logText, "info");
    }
  };

  const handleAlgoChange = (newAlgo: SortAlgo) => {
    stopAutoPlay();
    setAlgo(newAlgo);
    const newSteps = generateSortSteps(baseArray, newAlgo);
    setSteps(newSteps);
    setStepIndex(0);
    appendLog(`Switched to ${ALGO_INFO[newAlgo].title}`, "info");
  };

  const handleApplyCustomArray = (e: React.FormEvent) => {
    e.preventDefault();
    stopAutoPlay();
    const parsed = customInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((num) => !isNaN(num) && num >= 1 && num <= 99);

    if (parsed.length < 3 || parsed.length > 12) {
      soundEngine.playError();
      appendLog("Enter between 3 and 12 numbers (values 1–99)", "error");
      return;
    }

    setBaseArray(parsed);
    const newSteps = generateSortSteps(parsed, algo);
    setSteps(newSteps);
    setStepIndex(0);
    soundEngine.playPush();
    appendLog(`Loaded custom array: [${parsed.join(", ")}]`, "success");
  };

  const handleRandomize = () => {
    stopAutoPlay();
    const randomArr = Array.from(
      { length: 8 },
      () => Math.floor(Math.random() * 80) + 10
    );
    setBaseArray(randomArr);
    setCustomInput(randomArr.join(", "));
    const newSteps = generateSortSteps(randomArr, algo);
    setSteps(newSteps);
    setStepIndex(0);
    soundEngine.playPush();
    appendLog(`Generated random array: [${randomArr.join(", ")}]`, "info");
  };

  const handleNextStep = () => {
    stopAutoPlay();
    if (stepIndex < steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      applyStepSoundAndLog(steps[nextIdx]);
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

    let currentIdx = stepIndex;
    if (currentIdx >= steps.length - 1) {
      currentIdx = 0;
      setStepIndex(0);
    }

    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      currentIdx += 1;
      if (currentIdx >= steps.length) {
        stopAutoPlay();
        return;
      }
      setStepIndex(currentIdx);
      applyStepSoundAndLog(steps[currentIdx]);
      if (currentIdx === steps.length - 1) {
        stopAutoPlay();
      }
    }, delayMs);
  };

  const handleReset = () => {
    stopAutoPlay();
    setStepIndex(0);
    appendLog("Reset to Step 0", "info");
  };

  const info = ALGO_INFO[algo];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header & Algorithm Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Algorithm Visualizer
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Sorting Techniques
          </h2>
          <p className="text-xs text-slate-500">
            Learn how elements compare, shift, and lock into sorted order step by step
          </p>
        </div>

        {/* Algorithm Selector Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(["bubble", "selection", "insertion", "quick"] as SortAlgo[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => handleAlgoChange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  algo === key
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {ALGO_INFO[key].title}
              </button>
            )
          )}
        </div>
      </div>

      {/* Controls & Array Input Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Custom Input Card */}
        <form
          onSubmit={handleApplyCustomArray}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Custom Array (3–12 numbers)
            </label>
            <button
              type="button"
              onClick={handleRandomize}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              🎲 Randomize
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. 42, 15, 8, 99, 23"
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Set Array
            </button>
          </div>
        </form>

        {/* Playback & Beginner Speed Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg"
              title="Previous Step"
            >
              ◀ Prev
            </button>

            <button
              onClick={handlePlayPause}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs ${
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
              title="Advance One Step Manually"
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

          {/* Beginner-Friendly Speed Presets */}
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

      {/* Plain-English Live Explanation Banner for New Learners */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
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
      </div>

      {/* Main Visualizer Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="h-64 flex items-end justify-center gap-3 pt-6 pb-2 border-b border-slate-100">
          {currentStep.array.map((val, idx) => {
            const isComparing = currentStep.comparing.includes(idx);
            const isSwapping = currentStep.swapping.includes(idx);
            const isSorted = currentStep.sorted.includes(idx);

            let barStyle = "bg-blue-500 border-blue-600";
            let statusBadge = "";
            if (isSwapping) {
              barStyle = "bg-rose-500 border-rose-600 scale-105";
              statusBadge = "SWAP";
            } else if (isComparing) {
              barStyle = "bg-amber-400 border-amber-500 scale-105";
              statusBadge = "COMPARE";
            } else if (isSorted) {
              barStyle = "bg-emerald-500 border-emerald-600";
              statusBadge = "SORTED";
            }

            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 max-w-[64px]"
              >
                {statusBadge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded mb-1 ${
                      isSwapping
                        ? "bg-rose-100 text-rose-700"
                        : isComparing
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {statusBadge}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-800 mb-1">
                  {val}
                </span>
                <div
                  style={{ height: `${Math.max(val * 1.8, 24)}px` }}
                  className={`w-full rounded-t-xl border-2 transition-all duration-300 shadow-xs ${barStyle}`}
                />
                <span className="mt-2 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  [{idx}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Unsorted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Comparing Two Elements
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Swapping / Shifting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Sorted & Locked
          </span>
        </div>
      </div>

      {/* Bottom Section: Algorithm Theory Card + Built-In Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            How {info.title} Works
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {info.howItWorks}
          </p>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Best Case</span>
              <span className="font-bold text-emerald-600">{info.best}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Average Case</span>
              <span className="font-bold text-blue-600">{info.average}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Worst Case</span>
              <span className="font-bold text-rose-600">{info.worst}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Space Complexity</span>
              <span className="font-bold text-slate-700">{info.space}</span>
            </div>
          </div>
        </div>

        {/* Built-in Execution Log Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Execution Trace Log
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-500"
            >
              Clear Log
            </button>
          </div>
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 font-mono text-xs h-44 overflow-y-auto space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No log entries yet.</div>
            ) : (
              logs.map((entry) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}