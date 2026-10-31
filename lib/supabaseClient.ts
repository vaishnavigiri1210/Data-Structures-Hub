import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isLiveConfigured =
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseAnonKey.length > 20;

export const supabase = isLiveConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface LearnerUser {
  email: string;
  name: string;
}

export function getStoredUser(): LearnerUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("dsa_hub_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: LearnerUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("dsa_hub_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("dsa_hub_user");
  }
}