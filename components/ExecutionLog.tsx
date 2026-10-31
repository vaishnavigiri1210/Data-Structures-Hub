"use client";

interface ExecutionLogProps {
  logs: string[];
  onClear: () => void;
}

export default function ExecutionLog({ logs, onClear }: ExecutionLogProps) {
  return (
    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs">
        <span className="font-medium text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Live
          Execution Log
        </span>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 text-[11px]"
        >
          Clear
        </button>
      </div>
      <div className="font-mono text-[11px] text-slate-600 space-y-1 h-[78px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-slate-400">
            &gt; Workspace ready. Hit Enter after typing a value.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={
                log.includes("Error") ||
                log.includes("Overflow") ||
                log.includes("Underflow")
                  ? "text-rose-600"
                  : "text-slate-800"
              }
            >
              {`> ${log}`}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
