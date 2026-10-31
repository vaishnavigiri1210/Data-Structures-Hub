"use client";

import { useState } from "react";
import ExecutionLog from "@/components/ExecutionLog";
import { soundEngine } from "@/lib/sound";

export default function QueueVisualizerPage() {
  const [variant, setVariant] = useState<"linear" | "circular" | "deque">("linear");
  const [capacity, setCapacity] = useState<number>(6);
  const [tempCapacity, setTempCapacity] = useState<string>("6");

  // Queue state
  const [linearItems, setLinearItems] = useState<number[]>([]);
  const [circBuffer, setCircBuffer] = useState<(number | null)[]>(new Array(6).fill(null));
  const [circFront, setCircFront] = useState(-1);
  const [circRear, setCircRear] = useState(-1);
  const [circCount, setCircCount] = useState(0);

  const [inputValue, setInputValue] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  const handleApplyCapacity = () => {
    const newCap = parseInt(tempCapacity, 10);
    if (isNaN(newCap) || newCap < 2 || newCap > 12) {
      soundEngine.playError();
      addLog("Capacity must be between 2 and 12.");
      return;
    }

    const currentCount = variant === "circular" ? circCount : linearItems.length;
    if (newCap < currentCount) {
      soundEngine.playError();
      addLog(`Cannot shrink capacity to ${newCap} while ${currentCount} items exist. Dequeue items first.`);
      return;
    }

    setCapacity(newCap);
    if (variant === "circular") {
      setCircBuffer(new Array(newCap).fill(null));
      setCircFront(-1);
      setCircRear(-1);
      setCircCount(0);
    }
    soundEngine.playStep();
    addLog(`Queue capacity successfully set to ${newCap}.`);
  };

  const handleEnqueue = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) {
      soundEngine.playError();
      addLog("Error: Enter a valid number to enqueue.");
      return;
    }

    if (variant === "circular") {
      if (circCount >= capacity) {
        soundEngine.playError();
        addLog(`Circular Queue Full! Limit of ${capacity} reached.`);
        return;
      }
      soundEngine.playInsert();
      const newRear = circFront === -1 ? 0 : (circRear + 1) % capacity;
      const newFront = circFront === -1 ? 0 : circFront;
      const nextBuf = [...circBuffer];
      nextBuf[newRear] = val;
      setCircBuffer(nextBuf);
      setCircFront(newFront);
      setCircRear(newRear);
      setCircCount(circCount + 1);
      addLog(`Enqueued ${val} at slot [${newRear}] via (rear + 1) % ${capacity}.`);
    } else {
      if (linearItems.length >= capacity) {
        soundEngine.playError();
        addLog(`Queue Overflow! Limit of ${capacity} reached.`);
        return;
      }
      soundEngine.playInsert();
      setLinearItems((prev) => [...prev, val]);
      addLog(`Enqueued ${val} at REAR (Index ${linearItems.length}).`);
    }
    setInputValue("");
  };

  const handleDequeue = () => {
    if (variant === "circular") {
      if (circCount === 0) {
        soundEngine.playError();
        addLog("Circular Queue is empty!");
        return;
      }
      soundEngine.playDelete();
      const removed = circBuffer[circFront];
      const nextBuf = [...circBuffer];
      nextBuf[circFront] = null;
      setCircBuffer(nextBuf);
      if (circCount - 1 === 0) {
        setCircFront(-1);
        setCircRear(-1);
      } else {
        setCircFront((circFront + 1) % capacity);
      }
      setCircCount(circCount - 1);
      addLog(`Dequeued ${removed}. FRONT moved to slot [${(circFront + 1) % capacity}].`);
    } else {
      if (linearItems.length === 0) {
        soundEngine.playError();
        addLog("Queue Underflow! Queue is empty.");
        return;
      }
      soundEngine.playDelete();
      const removed = linearItems[0];
      setLinearItems((prev) => prev.slice(1));
      addLog(`Dequeued ${removed} from FRONT.`);
    }
  };

  const handleDequeInsertFront = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return soundEngine.playError();
    if (linearItems.length >= capacity) {
      soundEngine.playError();
      addLog(`Deque Overflow: Limit of ${capacity} reached.`);
      return;
    }
    soundEngine.playInsert();
    setLinearItems((prev) => [val, ...prev]);
    addLog(`Inserted ${val} at FRONT of Deque.`);
    setInputValue("");
  };

  const handleDequeDeleteRear = () => {
    if (linearItems.length === 0) {
      soundEngine.playError();
      addLog("Deque Underflow: Empty.");
      return;
    }
    soundEngine.playDelete();
    const removed = linearItems[linearItems.length - 1];
    setLinearItems((prev) => prev.slice(0, prev.length - 1));
    addLog(`Deleted ${removed} from REAR of Deque.`);
  };

  const currentCount = variant === "circular" ? circCount : linearItems.length;

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-4">
      {/* Variant Selector */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Variant:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(["linear", "circular", "deque"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setVariant(t);
                  setLinearItems([]);
                  setCircBuffer(new Array(capacity).fill(null));
                  setCircFront(-1);
                  setCircRear(-1);
                  setCircCount(0);
                }}
                className={`px-2.5 py-1 rounded text-xs capitalize ${
                  variant === t
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "linear" ? "Linear FIFO" : t === "circular" ? "Circular (Modulo)" : "Deque (Two-way)"}
              </button>
            ))}
          </div>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          {variant === "linear"
            ? "Enqueues at REAR, Dequeues at FRONT"
            : variant === "circular"
            ? "Wraps indices using: (rear + 1) % size"
            : "Double-Ended Queue (Push/Pop at both ends)"}
        </span>
      </div>

      {/* Queue Controls & Execution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-3">
          {/* Capacity Input Config */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Queue Size:</span>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-0.5">
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={tempCapacity}
                  onChange={(e) => setTempCapacity(e.target.value)}
                  className="w-10 bg-transparent text-center font-bold text-slate-700 outline-none text-xs"
                />
                <button
                  onClick={handleApplyCapacity}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-[10px] transition-all"
                >
                  Set Size
                </button>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                ({currentCount}/{capacity})
              </span>
            </div>
          </div>

          {/* Operations Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              placeholder="Value..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnqueue()}
              className="px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs w-24 text-center focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setInputValue(String(Math.floor(Math.random() * 90) + 10))}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-xs font-mono"
              title="Random Value"
            >
              🎲
            </button>

            {variant === "deque" ? (
              <>
                <button
                  onClick={handleDequeInsertFront}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium rounded text-xs"
                >
                  + Front
                </button>
                <button
                  onClick={handleEnqueue}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs shadow-xs"
                >
                  + Rear [Enter]
                </button>
                <button
                  onClick={handleDequeue}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs"
                >
                  - Front
                </button>
                <button
                  onClick={handleDequeDeleteRear}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs"
                >
                  - Rear
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEnqueue}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs shadow-xs"
                >
                  Enqueue [Enter]
                </button>
                <button
                  onClick={handleDequeue}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs"
                >
                  Dequeue
                </button>
              </>
            )}

            <button
              onClick={() => {
                setLinearItems([]);
                setCircBuffer(new Array(capacity).fill(null));
                setCircFront(-1);
                setCircRear(-1);
                setCircCount(0);
                addLog("Queue cleared.");
              }}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-400 text-xs rounded border border-slate-200"
            >
              Clear
            </button>
          </div>
        </div>

        <ExecutionLog logs={logs} onClear={() => setLogs([])} />
      </div>

      {/* Visual Workspace Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[380px] flex items-center justify-center relative shadow-xs overflow-hidden">
        {variant === "circular" ? (
          <div className="flex flex-col items-center">
            <div className="grid grid-flow-col auto-cols-max gap-2 px-6 py-6 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto max-w-full">
              {circBuffer.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-24 rounded-xl border flex flex-col items-center justify-between p-2 shadow-xs transition-all ${
                    val !== null ? "bg-white border-slate-300" : "bg-slate-100/70 border-dashed border-slate-200"
                  }`}
                >
                  <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>[{idx}]</span>
                    {idx === circFront && idx === circRear ? (
                      <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded font-bold">
                        F & R
                      </span>
                    ) : idx === circFront ? (
                      <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 rounded font-bold">
                        FRONT
                      </span>
                    ) : idx === circRear ? (
                      <span className="text-[8px] bg-blue-50 text-blue-800 border border-blue-200 px-1 rounded font-bold">
                        REAR
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300">Empty</span>
                    )}
                  </div>
                  <div className={`text-sm font-bold ${val !== null ? "text-slate-800" : "text-slate-300"}`}>
                    {val ?? "—"}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">slot</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs font-mono text-slate-500 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded font-bold">FRONT</span>
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-bold">REAR</span>
              <span>Formula: (rear + 1) % {capacity}</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2.5 w-full max-w-2xl px-6 py-8 border-y border-dashed border-slate-300 bg-slate-50/50 rounded-xl overflow-x-auto min-h-[140px]">
              {linearItems.length === 0 ? (
                <div className="w-full text-center text-slate-400 font-mono text-xs">Queue is Empty</div>
              ) : (
                linearItems.map((val, idx) => (
                  <div
                    key={idx}
                    className="anim-slide flex-shrink-0 w-16 h-16 bg-white text-slate-800 font-bold rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center text-xs relative"
                  >
                    <span className="text-sm font-bold text-slate-800">{val}</span>
                    <span className="text-[9px] font-mono text-slate-400">#{idx}</span>
                    {idx === 0 && (
                      <span className="absolute -top-2.5 text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 rounded font-bold">
                        FRONT
                      </span>
                    )}
                    {idx === linearItems.length - 1 && (
                      <span className="absolute -bottom-2.5 text-[8px] bg-blue-50 border border-blue-200 text-blue-700 px-1 rounded font-bold">
                        REAR
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between w-full max-w-2xl px-4 mt-2.5 text-xs font-semibold uppercase tracking-wider">
              <span className="text-rose-600">◀ Front (Dequeue)</span>
              <span className="text-emerald-700">Rear (Enqueue) ▶</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}