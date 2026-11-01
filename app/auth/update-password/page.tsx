"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { soundEngine } from "@/lib/sound";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      soundEngine.playError();
      return setErrorMsg("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      soundEngine.playError();
      return setErrorMsg("Passwords do not match.");
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error("Supabase client is not connected.");

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      soundEngine.playSuccess();
      setSuccessMsg("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err: unknown) {
      soundEngine.playError();
      const msg = err instanceof Error ? err.message : "Failed to update password.";
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
            🔒
          </div>
          <h3 className="text-base font-bold text-slate-900">Set New Password</h3>
          <p className="text-xs text-slate-500">Choose a new password for your account</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 mb-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-xs shadow-sm transition-all mt-2"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}