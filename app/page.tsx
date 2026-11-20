"use client";

import Link from "next/link";

const CARDS = [
  {
    title: "Stack",
    badge: "LIFO",
    icon: "🥞",
    desc: "Push, Pop, and Peek operations with top pointer tracking and overflow detection.",
    href: "/visualizer/stack",
    linkColor: "text-blue-600",
  },
  {
    title: "Queue Suite",
    badge: "3 Types",
    icon: "🚶",
    desc: "Linear FIFO Queue, Circular Ring Buffer with modulo calculation, and Double-Ended Deque.",
    href: "/visualizer/queue",
    linkColor: "text-emerald-600",
  },
  {
    title: "Linked Lists",
    badge: "3 Types",
    icon: "🔗",
    desc: "Singly, Doubly, and Circular Linked Lists with insert at index, delete, and step search.",
    href: "/visualizer/linked-list",
    linkColor: "text-cyan-600",
  },
  {
    title: "Binary Search Tree",
    badge: "BST",
    icon: "🌳",
    desc: "Insert nodes, search values, and animate Inorder, Preorder, and Postorder traversals.",
    href: "/visualizer/tree",
    linkColor: "text-emerald-600",
  },
  {
    title: "Graph Traversal",
    badge: "BFS & DFS",
    icon: "🕸️",
    desc: "Breadth-First (Queue) and Depth-First (Stack) vertex exploration with live frontier state.",
    href: "/visualizer/graph",
    linkColor: "text-purple-600",
  },
  {
    title: "Sorting Suite",
    badge: "4 Algorithms",
    icon: "📊",
    desc: "Bubble, Selection, Insertion, and Quick Sort with step-by-step comparisons and swaps.",
    href: "/visualizer/sorting",
    linkColor: "text-blue-600",
  },
];

export default function HomePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Centered Hero Title */}
      <div className="text-center max-w-xl mx-auto pt-4 pb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Data Structure <span className="text-blue-600">Visualizer</span>
        </h1>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          Interactive step-by-step visualizations for operations in Stacks, Queues,
          Linked Lists, Trees, Graphs, and Sorting with custom manual inputs.
        </p>

        {/* 3-Column Metrics Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 max-w-md mx-auto mt-8">
          <div className="px-4">
            <div className="text-2xl font-extrabold text-slate-900">12+</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Variants
            </div>
          </div>
          <div className="px-4">
            <div className="text-2xl font-extrabold text-blue-600">6</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Modules
            </div>
          </div>
          <div className="px-4">
            <div className="text-2xl font-extrabold text-slate-900">Live</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Execution
            </div>
          </div>
        </div>
      </div>

      {/* Clean White Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                  {card.icon}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {card.badge}
                </span>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>

            <div className={`text-xs font-bold ${card.linkColor} group-hover:translate-x-0.5 transition-transform`}>
              Open Visualizer →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}