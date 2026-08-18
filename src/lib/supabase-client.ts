"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useRadioFavorites(userId: string | null) {
  // ... código usando o supabase criado acima
}
