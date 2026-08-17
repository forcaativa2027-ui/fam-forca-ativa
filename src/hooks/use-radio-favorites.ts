"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { RadioProgram } from "@/types/domain";

export interface RadioFavorite {
  id: string;
  program_id: string;
  user_id: string;
  created_at: string;
}

export interface RadioFavoriteInsert {
  program_id: string;
}

export function useRadioFavorites(userId: string | null) {
  return useQuery({
    queryKey: ["radio-favorites", userId],
    queryFn: async () => {
      if (!userId) return [] as RadioFavorite[];
      
      const { data, error } = await supabase
        .from("radio_user_favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RadioFavorite[];
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  return useMutation({
    mutationFn: async (programId: string) => {
      const { data, error } = await supabase
        .from("radio_user_favorites")
        .upsert(
          {
            user_id: userId!,
            program_id: programId,
          },
          {
            onConflict: "program_id_user_id",
            ignoreDuplicates: true,
          }
        );
      
      if (error) throw error;
      return data;
    },
  });
}
