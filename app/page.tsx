import Link from "next/link";

export default function Dashboard() {
  const modules = [
    {
      title: "Stack",
      tag: "LIFO",
      desc: "Push, Pop, and Peek operations with top pointer tracking and overflow detection.",
      href: "/visualizer/stack",
      icon: "🥞",
      borderHover: "hover:border-blue-400",
      accent: "text-blue-600",
    },
    {
      title: "Queue Suite",
      tag: "3 Types",
      desc: "Linear FIFO Queue, Circular Ring Buffer with modulo calculation, and Double-Ended Deque.",
      href: "/visualizer/queue",
      icon: "🚶",
      borderHover: "hover:border-emerald-400",
      accent: "text-emerald-600",
    },
    {
      title: "Linked Lists",
      tag: "3 Types",
      desc: "Singly, Doubly, and Circular Linked Lists with insert at index, delete, and step search.",
      href: "/visualizer/linked-list",
      icon: "🔗",
      borderHover: "hover:border-cyan-400",
      accent: "text-cyan-600",
    },
  ];

  return (
    <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
      <div className="text-center py-6 space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Data Structure <span className="text-blue-600">Visualizer</span>
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
          Interactive step-by-step visualizations for operations in Stacks,
          Queues, and Linked Lists with custom manual inputs.
        </p>

        <div className="flex items-center justify-center gap-12 pt-4">
          <div className="text-center">
            <span className="text-2xl font-black text-slate-800 block">7+</span>
            <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
              Variants
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <span className="text-2xl font-black text-blue-600 block">3</span>
            <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
              Data Structures
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="text-center">
            <span className="text-2xl font-black text-slate-800 block">
              Live
            </span>
            <span className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
              Execution
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modules.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className={`bg-white border border-slate-200 ${m.borderHover} hover:shadow-md transition-all p-5 rounded-2xl cursor-pointer group flex flex-col justify-between h-48`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                  {m.icon}
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {m.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {m.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {m.desc}
              </p>
            </div>
            <div
              className={`text-xs font-semibold ${m.accent} flex items-center gap-1`}
            >
              Open Visualizer ➔
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
