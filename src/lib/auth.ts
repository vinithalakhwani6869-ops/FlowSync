import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "./supabase";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let disposed = false;

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (disposed) return;
        if (!error) setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!disposed) setLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (disposed) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
  };
}
