"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, setStoredUser, supabase } from "@/lib/supabaseClient";
import { soundEngine } from "@/lib/sound";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    setUserEmail(user?.email ?? null);
  }, [pathname]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setStoredUser(null);
    setUserEmail(null);
    soundEngine.playDelete();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { name: "Home", href: "/", icon: "⊞" },
    { name: "Stack (LIFO)", href: "/visualizer/stack", icon: "🥞" },
    { name: "Queue (3 Types)", href: "/visualizer/queue", icon: "🚶" },
    { name: "Linked List (3 Types)", href: "/visualizer/linked-list", icon: "🔗" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 shadow-xs z-30">
      <div>
        <Link href="/" className="p-5 border-b border-slate-100 flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            DS
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Data Structure HUB</h1>
            <p className="text-[11px] text-slate-500">Interactive Visualizer</p>
          </div>
        </Link>

        <nav className="p-3 space-y-1.5 text-xs">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">Navigation</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="font-semibold text-slate-700 max-w-[110px] truncate">
              {userEmail ? userEmail.split("@")[0] : "Guest Learner"}
            </div>
            {userEmail ? (
              <span className="text-[10px] text-emerald-600 font-medium">Signed In</span>
            ) : (
              <Link href="/auth/login" className="text-[10px] text-blue-600 hover:underline">
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>
        {userEmail && (
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-500 font-bold p-1 rounded"
            title="Sign Out"
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  );
}