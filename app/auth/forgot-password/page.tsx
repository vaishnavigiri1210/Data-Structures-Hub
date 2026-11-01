"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { soundEngine } from "@/lib/sound";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase client is not connected.");
      }

      const redirectUrl = `${window.location.origin}/auth/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      soundEngine.playSuccess();
      setStatusMsg("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      soundEngine.playError();
      const msg = err instanceof Error ? err.message : "Failed to send reset link.";
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
            🔑
          </div>
          <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
          <p className="text-xs text-slate-500">Enter your email to receive a password reset link</p>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}
        {statusMsg && (
          <div className="p-2.5 mb-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleResetRequest} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-xs shadow-sm transition-all mt-2"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}