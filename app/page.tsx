"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/supabaseClient";

const MODULES = [
  {
    title: "Stack (LIFO)",
    tag: "Linear",
    desc: "Push, Pop, and Peek elements with capacity limits.",
    href: "/visualizer/stack",
    icon: "🥞",
    complexity: "O(1)",
  },
  {
    title: "Queue (3 Types)",
    tag: "Linear",
    desc: "Linear, Circular, and Double-Ended (Deque) operations.",
    href: "/visualizer/queue",
    icon: "🚶",
    complexity: "O(1)",
  },
  {
    title: "Linked List (3 Types)",
    tag: "Linear",
    desc: "Singly, Doubly, and Circular pointer manipulation.",
    href: "/visualizer/linked-list",
    icon: "🔗",
    complexity: "O(1) / O(n)",
  },
  {
    title: "Binary Search Tree",
    tag: "Non-Linear",
    desc: "Insert, Search, and Inorder / Preorder / Postorder walks.",
    href: "/visualizer/tree",
    icon: "🌳",
    complexity: "O(log n)",
  },
  {
    title: "Graph (BFS / DFS)",
    tag: "Non-Linear",
    desc: "Step-by-step Breadth-First and Depth-First traversal.",
    href: "/visualizer/graph",
    icon: "🕸️",
    complexity: "O(V + E)",
  },
  {
    title: "Sorting Algorithms",
    tag: "Algorithms",
    desc: "Bubble, Selection, Insertion, and Quick Sort step-by-step.",
    href: "/visualizer/sorting",
    icon: "📊",
    complexity: "O(n log n)",
  },
];

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setUserName(user.name || user.email.split("@")[0]);
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {userName ? `Welcome, ${userName}` : "Data Structure HUB"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a data structure or algorithm below to start visualizing step by step.
          </p>
        </div>

        {!userName && (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Clean 3x2 Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-5 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {item.tag}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                {item.title}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                {item.complexity}
              </span>
              <span className="font-semibold text-blue-600">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}