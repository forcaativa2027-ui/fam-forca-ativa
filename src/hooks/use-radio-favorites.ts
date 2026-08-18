"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export function useRadioFavorites(userId: string | null) {
  return useQuery({
    queryKey: ["radio-favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("radio_user_favorites")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite(userId: string) {
  return useMutation({
    mutationFn: async (programId: string) => {
      const { data, error } = await supabase
        .from("radio_user_favorites")
        .upsert(
          {
            user_id: userId,
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
