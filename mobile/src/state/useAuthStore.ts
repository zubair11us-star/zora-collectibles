import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import { getSupabase, isCloudConfigured } from "@/services/supabaseClient";

interface AuthState {
  session: Session | null;
  loaded: boolean;
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loaded: false,

  init: async () => {
    if (!isCloudConfigured) {
      set({ loaded: true });
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, loaded: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signUp: async (email, password) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    const needsEmailConfirmation = !data.session;
    if (data.session) set({ session: data.session });
    return { error: null, needsEmailConfirmation };
  },

  signIn: async (email, password) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ session: data.session });
    return { error: null };
  },

  signOut: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
