"use client";

import { useState } from "react";
import ExecutionLog from "@/components/ExecutionLog";
import { soundEngine } from "@/lib/sound";

export default function StackVisualizerPage() {
  const [items, setItems] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [logs, setLogs] = useState<string[]>([]);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  const handlePush = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) {
      soundEngine.playError();
      addLog("Error: Enter a valid number to push.");
      return;
    }
    if (items.length >= capacity) {
      soundEngine.playError();
      addLog(`Stack Overflow: Capacity of ${capacity} reached.`);
      return;
    }
    soundEngine.playInsert();
    setItems((prev) => [...prev, val]);
    addLog(`Pushed ${val} onto TOP (Index: ${items.length}).`);
    setInputValue("");
    setPeekIndex(null);
  };

  const handlePop = () => {
    if (items.length === 0) {
      soundEngine.playError();
      addLog("Stack Underflow: Stack is empty.");
      return;
    }
    soundEngine.playDelete();
    const popped = items[items.length - 1];
    setItems((prev) => prev.slice(0, prev.length - 1));
    addLog(`Popped ${popped} from TOP.`);
    setPeekIndex(null);
  };

  const handlePeek = () => {
    if (items.length === 0) {
      soundEngine.playError();
      addLog("Stack is empty: No top item.");
      return;
    }
    soundEngine.playStep();
    setPeekIndex(items.length - 1);
    addLog(`Peeked TOP item: ${items[items.length - 1]}`);
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
        <span className="font-semibold text-slate-700">LIFO Container</span>
        <span className="font-mono text-[11px] text-slate-500">Last-In, First-Out Memory Order</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Capacity:</span>
              <input
                type="number"
                min={2}
                max={12}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(items.length, parseInt(e.target.value) || 2))}
                className="w-12 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-700"
              />
              <span className="text-[11px] text-slate-400 font-mono">({items.length}/{capacity})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              placeholder="Enter value..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePush()}
              className="px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs w-28 text-center focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setInputValue(String(Math.floor(Math.random() * 90) + 10))}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-xs font-mono"
            >
              🎲
            </button>
            <button onClick={handlePush} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs shadow-xs">
              Push [Enter]
            </button>
            <button onClick={handlePop} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs">
              Pop
            </button>
            <button onClick={handlePeek} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-xs">
              Peek
            </button>
            <button onClick={() => { setItems([]); addLog("Stack cleared."); }} className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-400 text-xs rounded border border-slate-200">
              Clear
            </button>
          </div>
        </div>

        <ExecutionLog logs={logs} onClear={() => setLogs([])} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 min-h-[380px] flex items-center justify-center relative shadow-xs overflow-hidden">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="relative w-72 h-[310px] border-b-2 border-l-2 border-r-2 border-slate-400 rounded-b-xl flex flex-col-reverse items-center p-2.5 gap-2 bg-slate-50/70 shadow-inner overflow-hidden">
              {items.map((val, idx) => (
                <div
                  key={idx}
                  className={`anim-drop w-full py-2 px-3.5 bg-white text-slate-800 font-bold rounded-lg shadow-xs border border-slate-200 flex items-center justify-between text-xs transition-all ${peekIndex === idx ? "anim-highlight border-amber-400" : ""
                    }`}
                >
                  <span className="font-mono text-[10px] text-slate-400">[Idx: {idx}]</span>
                  <span className="text-sm font-bold text-blue-700">{val}</span>
                  {idx === items.length - 1 && (
                    <span className="text-[9px] uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                      TOP
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="mt-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400">Stack Bucket Base</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Stack Complexity</h3>
            <div className="border-t border-slate-100 pt-2 space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1 px-2 rounded bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Push</span>
                <span className="font-mono font-bold text-blue-700">O(1)</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Pop</span>
                <span className="font-mono font-bold text-blue-700">O(1)</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Peek</span>
                <span className="font-mono font-bold text-amber-700">O(1)</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
            <strong>Analogy:</strong> A cafeteria plate dispenser—the last plate put on top is the first one taken.
          </div>
        </div>
      </div>
    </div>
  );
}