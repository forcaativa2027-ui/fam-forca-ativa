"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";

export interface RadioFavorite {
  id: string;
  program_id: string;
  user_id: string;
  created_at: string;
}

export interface RadioFavoriteInsert {
  program_id: string;
  user_id: string;
}

export function useRadioFavorites(userId: string | null) {
  return useQuery({
    queryKey: ["radio-favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
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

export function useToggleFavorite(userId: string) {
  return useMutation({
    mutationFn: async (programId: string) => {
      // A operação é feita diretamente no localStorage para evitar erros de módulo
      const favorites = JSON.parse(localStorage.getItem("radio_favorites") || "[]");
      if (favorites.some((f) => f === programId)) {
        // Remove
        const newFavorites = favorites.filter((id) => id !== programId);
        localStorage.setItem("radio_favorites", JSON.stringify(newFavorites));
      } else {
        // Adiciona
        favorites.push(programId);
        localStorage.setItem("radio_favorites", JSON.stringify(favorites));
      }
      return favorites;
    },
  });
