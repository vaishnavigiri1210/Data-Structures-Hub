"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, setStoredUser } from "@/lib/supabaseClient";
import { soundEngine } from "@/lib/sound";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setStoredUser({
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
        });
      } else {
        // Safe local session mode when external API is offline
        setStoredUser({
          email,
          name: email.split("@")[0],
        });
      }

      soundEngine.playSuccess();
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      soundEngine.playError();
      const msg = err instanceof Error ? err.message : "Failed to sign in.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8 min-h-[calc(100vh-140px)]">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center mx-auto mb-2 text-base">
            DS
          </div>
          <h3 className="text-base font-bold text-slate-900">Welcome Back</h3>
          <p className="text-xs text-slate-500">Sign in to your learner profile</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-xs shadow-sm transition-all mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          <span>Don&apos;t have an account?</span>
          <Link href="/auth/signup" className="text-blue-600 font-semibold hover:underline ml-1">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}