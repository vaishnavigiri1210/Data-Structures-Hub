"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("Guest Learner");

  useEffect(() => {
    const user = getStoredUser();
    if (user?.email) {
      setUserName(user.email.split("@")[0]);
    }
  }, [pathname]);

  const getTitle = () => {
    if (pathname.includes("stack")) return "Stack Visualizer";
    if (pathname.includes("queue")) return "Queue Suite";
    if (pathname.includes("linked-list")) return "Linked List Visualizer";
    if (pathname.includes("login")) return "Sign In";
    if (pathname.includes("signup")) return "Create Account";
    return "Dashboard";
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">{getTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>{userName}</span>
        </div>
      </div>
    </header>
  );
}
