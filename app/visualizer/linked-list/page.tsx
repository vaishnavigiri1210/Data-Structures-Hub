"use client";

import { useState } from "react";
import ExecutionLog from "@/components/ExecutionLog";
import { soundEngine } from "@/lib/sound";

interface LLNode {
  id: string;
  val: number;
}

export default function LinkedListVisualizerPage() {
  const [variant, setVariant] = useState<"singly" | "doubly" | "circular">("singly");
  const [nodes, setNodes] = useState<LLNode[]>([]);
  const [valInput, setValInput] = useState("");
  const [idxInput, setIdxInput] = useState("");
  const [capacity, setCapacity] = useState(7);
  const [logs, setLogs] = useState<string[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  const insertHead = () => {
    const val = parseInt(valInput, 10);
    if (isNaN(val)) return soundEngine.playError();
    if (nodes.length >= capacity) {
      soundEngine.playError();
      addLog(`Capacity limit of ${capacity} reached.`);
      return;
    }
    soundEngine.playInsert();
    setNodes((prev) => [{ id: Math.random().toString(), val }, ...prev]);
    addLog(`Inserted [${val}] at HEAD (Index 0).`);
    setValInput("");
  };

  const insertTail = () => {
    const val = parseInt(valInput, 10);
    if (isNaN(val)) return soundEngine.playError();
    if (nodes.length >= capacity) {
      soundEngine.playError();
      addLog(`Capacity limit of ${capacity} reached.`);
      return;
    }
    soundEngine.playInsert();
    setNodes((prev) => [...prev, { id: Math.random().toString(), val }]);
    addLog(`Inserted [${val}] at TAIL (Index ${nodes.length}).`);
    setValInput("");
  };

  const insertAtIndex = () => {
    const val = parseInt(valInput, 10);
    const idx = parseInt(idxInput, 10);
    if (isNaN(val)) return soundEngine.playError();
    if (isNaN(idx) || idx < 0 || idx > nodes.length) {
      soundEngine.playError();
      addLog(`Invalid index: must be between 0 and ${nodes.length}.`);
      return;
    }
    if (nodes.length >= capacity) {
      soundEngine.playError();
      addLog(`Capacity limit of ${capacity} reached.`);
      return;
    }

    if (idx === 0) return insertHead();
    if (idx === nodes.length) return insertTail();

    soundEngine.playInsert();
    setNodes((prev) => [
      ...prev.slice(0, idx),
      { id: Math.random().toString(), val },
      ...prev.slice(idx),
    ]);
    addLog(`Inserted [${val}] at Index ${idx}.`);
    setValInput("");
    setIdxInput("");
  };

  const deleteHead = () => {
    if (nodes.length === 0) return soundEngine.playError();
    soundEngine.playDelete();
    const removed = nodes[0].val;
    setNodes((prev) => prev.slice(1));
    addLog(`Deleted HEAD node [${removed}].`);
  };

  const deleteAtIndex = () => {
    const idx = parseInt(idxInput, 10);
    if (nodes.length === 0) return soundEngine.playError();
    if (isNaN(idx) || idx < 0 || idx >= nodes.length) {
      soundEngine.playError();
      addLog(`Invalid index: must be between 0 and ${nodes.length - 1}.`);
      return;
    }

    if (idx === 0) return deleteHead();

    soundEngine.playDelete();
    const removed = nodes[idx].val;
    setNodes((prev) => [...prev.slice(0, idx), ...prev.slice(idx + 1)]);
    addLog(`Deleted node [${removed}] from Index ${idx}.`);
    setIdxInput("");
  };

  const searchNode = async () => {
    const target = parseInt(valInput, 10);
    if (isNaN(target) || nodes.length === 0) return soundEngine.playError();

    for (let i = 0; i < nodes.length; i++) {
      soundEngine.playStep();
      setHighlightId(nodes[i].id);
      await new Promise((r) => setTimeout(r, 400));
      if (nodes[i].val === target) {
        soundEngine.playSuccess();
        addLog(`Match found! Node [${target}] at index ${i}.`);
        setTimeout(() => setHighlightId(null), 1500);
        return;
      }
    }
    setHighlightId(null);
    soundEngine.playError();
    addLog(`Value '${target}' not found in the list.`);
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-4">
      {/* Variant Selector */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Variant:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(["singly", "doubly", "circular"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setVariant(t);
                  setNodes([]);
                  setHighlightId(null);
                }}
                className={`px-2.5 py-1 rounded text-xs capitalize ${variant === t
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          {variant === "singly"
            ? "[Data | Next] ➔ Next"
            : variant === "doubly"
              ? "Prev ⇄ [Node] ⇄ Next"
              : "Tail.next loops to Head"}
        </span>
      </div>

      {/* Controls & Execution Log Deck */}
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
                onChange={(e) => setCapacity(Math.max(nodes.length, parseInt(e.target.value) || 2))}
                className="w-12 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none text-xs"
              />
              <span className="text-[11px] text-slate-400 font-mono">
                ({nodes.length}/{capacity})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              placeholder="Val"
              value={valInput}
              onChange={(e) => setValInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && insertTail()}
              className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs w-16 text-center focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setValInput(String(Math.floor(Math.random() * 90) + 10))}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-xs font-mono"
              title="Random Value"
            >
              🎲
            </button>
            <input
              type="number"
              placeholder="Idx"
              min="0"
              value={idxInput}
              onChange={(e) => setIdxInput(e.target.value)}
              className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs w-12 text-center focus:border-blue-500 outline-none"
            />

            <button
              onClick={insertHead}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded text-xs"
            >
              + Head
            </button>
            <button
              onClick={insertTail}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs shadow-xs"
            >
              + Tail [Enter]
            </button>
            <button
              onClick={insertAtIndex}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium rounded text-xs"
            >
              + Idx
            </button>
            <button
              onClick={deleteHead}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs"
            >
              - Head
            </button>
            <button
              onClick={deleteAtIndex}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs"
            >
              - Idx
            </button>
            <button
              onClick={searchNode}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium rounded text-xs"
            >
              Search
            </button>
            <button
              onClick={() => {
                setNodes([]);
                setHighlightId(null);
                addLog("List cleared.");
              }}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-400 text-xs rounded border border-slate-200"
            >
              Clear
            </button>
          </div>
        </div>

        <ExecutionLog logs={logs} onClear={() => setLogs([])} />
      </div>

      {/* Visual Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[380px] flex items-center justify-center relative shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max px-4 py-2">
          {nodes.length === 0 ? (
            <div className="text-slate-400 font-mono text-xs">HEAD ➔ nullptr (Empty List)</div>
          ) : (
            nodes.map((node, idx) => (
              <div key={node.id} className="flex items-center gap-1 relative">
                {idx === 0 && (
                  <span className="absolute -top-3 left-1 text-[8px] bg-blue-100 text-blue-700 border border-blue-200 px-1 rounded font-bold">
                    HEAD
                  </span>
                )}
                <div
                  className={`flex border rounded-lg overflow-hidden shadow-xs bg-white transition-all ${highlightId === node.id
                      ? "ring-2 ring-amber-400 border-amber-400 scale-105"
                      : "border-slate-200"
                    }`}
                >
                  {variant === "doubly" && (
                    <div className="bg-slate-50 px-1.5 py-2 text-[9px] font-mono text-slate-400 border-r border-slate-200">
                      prev
                    </div>
                  )}
                  <div className="bg-slate-50 text-slate-800 px-3 py-2 font-bold text-xs min-w-[42px] text-center border-r border-slate-200">
                    {node.val}
                  </div>
                  <div className="bg-white px-2 py-2 text-[9px] font-mono text-slate-400 flex items-center justify-center">
                    next
                  </div>
                </div>
                <div className="text-slate-400 px-1 font-bold text-xs">
                  {variant === "doubly" ? "⇄" : "➔"}
                </div>
              </div>
            ))
          )}
          {nodes.length > 0 && (
            <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-400 font-mono text-[10px] font-bold">
              {variant === "circular" ? "↺ (to HEAD)" : "nullptr"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}