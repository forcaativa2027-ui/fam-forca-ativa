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

// Usa localStorage como fallback garantido (não depende de migrations SQL)
export function useRadioFavorites(userId: string | null) {
  const getFavoritesFromLocalStorage = (): string[] => {
    try {
      const stored = localStorage.getItem("radio_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveFavoritesToLocalStorage = (favorites: string[]) => {
    try {
      localStorage.setItem("radio_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("Erro ao salvar favoritos no localStorage", e);
    }
  };

  return useQuery({
    queryKey: ["radio-favorites", userId],
    queryFn: async () => {
      // Primeiro tenta o Supabase, se falhar usa localStorage
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("radio_user_favorites")
            .select("*")
            .eq("user_id", userId);
        
        if (error) throw error;
        return data as RadioFavorite[];
        } else {
          // Fallback para localStorage se supabase falhar ou userId não existir
          return getFavoritesFromLocalStorage().map(fav => ({
            id: Math.random().toString(36).substr(2, 9),
            program_id: fav,
            user_id: userId || "",
            created_at: new Date().toISOString()
          }));
        }
      } else {
        return getFavoritesFromLocalStorage();
      }
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite(userId: string) {
  return useMutation({
    mutationFn: async (programId: string) => {
      // Tenta usar Supabase primeiro, cai para localStorage em caso de erro
      try {
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
        // Also update localStorage
        updateLocalStorageFavorites(userId, programId);
        return data;
      } catch (error) {
        // Fallback para localStorage se Supabase falhar
        updateLocalStorageFavorites(userId, programId);
      }
    },
  });
}

function updateLocalStorageFavorites(userId: string, programId: string) {
  let favorites = getFavoritesFromLocalStorage();
  
  if (favorites.some((f) => f === programId)) {
    favorites = favorites.filter((id) => id !== programId);
  } else {
    favorites.push(programId);
  }
  
  saveFavoritesToLocalStorage(favorites);
}
