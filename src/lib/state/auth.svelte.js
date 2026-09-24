// Inlogstatus (magic link via Supabase Auth). Zonder backend blijft alles
// uitgeschakeld en is `enabled` false — dan toont de app geen accountknop.
//
// `isAdmin` is alleen voor de UI (tab "Plantendata" tonen). Of je echt mag
// schrijven, beslist de database zelf via RLS (is_admin()).

import { supabase } from "../supabase.js";

const INVITE_KEY = "tuintaak:pendingInvite";

function createAuth() {
  let session = $state(null);
  let isAdmin = $state(false);
  let ready = $state(!supabase);
  const listeners = new Set();

  async function checkAdmin(user) {
    if (!user) {
      isAdmin = false;
      return;
    }
    const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    isAdmin = !error && !!data;
  }

  function setSession(next) {
    const prevUserId = session?.user?.id ?? null;
    const first = !ready;
    session = next;
    ready = true;
    const user = next?.user ?? null;
    if (!first && (user?.id ?? null) === prevUserId) return; // alleen token vernieuwd
    checkAdmin(user);
    for (const fn of listeners) fn(user);
  }

  if (supabase) {
    // Supabase raadt af om in deze callback zelf weer Supabase aan te roepen
    // (kan vastlopen op de auth-lock) — daarom via setTimeout.
    supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => setSession(next), 0);
    });
  }

  return {
    get enabled() {
      return !!supabase;
    },
    get ready() {
      return ready;
    },
    get user() {
      return session?.user ?? null;
    },
    get isAdmin() {
      return isAdmin;
    },

    /** Aanroepen bij elke wissel van gebruiker (ook de eerste keer, met null bij niet ingelogd). */
    onUserChange(fn) {
      listeners.add(fn);
      if (ready) fn(session?.user ?? null);
      return () => listeners.delete(fn);
    },

    /**
     * Stuurt een magic link. Een openstaande uitnodiging gaat mee in de
     * terugkeer-URL, zodat die ook werkt als je de mail op een ander apparaat opent.
     */
    async signInWithEmail(email) {
      const redirect = new URL(window.location.pathname, window.location.origin);
      const invite = this.pendingInvite;
      if (invite) redirect.searchParams.set("invite", invite);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect.toString() },
      });
      if (error) throw error;
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    /** Uitnodigingstoken uit de URL (?invite=…), bewaard tot hij gebruikt is. */
    get pendingInvite() {
      try {
        return sessionStorage.getItem(INVITE_KEY);
      } catch {
        return null;
      }
    },
    clearPendingInvite() {
      try {
        sessionStorage.removeItem(INVITE_KEY);
      } catch {
        // niets
      }
    },
  };
}

/** Haalt ?invite=… uit de adresbalk en bewaart hem; aanroepen vóór het mounten. */
export function captureInviteFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("invite");
  if (!token) return;
  try {
    sessionStorage.setItem(INVITE_KEY, token);
  } catch {
    // Zonder sessionStorage werkt de uitnodiging alleen als je al ingelogd bent.
  }
  url.searchParams.delete("invite");
  window.history.replaceState(null, "", url.toString());
}

export const auth = createAuth();
