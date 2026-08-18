"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

// Simulação usando localStorage - sem dependência de supabase query parsing issues
export function useRadioFavorites(userId: string | null) {
  const getFavoritesFromLocalStorage = () => {
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
      console.error("Erro ao salvar favoritos", e);
    }
  };

  return useQuery({
    queryKey: ["radio-favorites", userId],
    queryFn: () => getFavoritesFromLocalStorage(),
    enabled: !!userId,
  });
}

export function useToggleFavorite(userId: string) {
  return useMutation({
    mutationFn: async (programId: string) => {
      // Atualiza localStorage
      const favorites = getFavoritesFromLocalStorage();
      if (favorites.some((f) => f === programId)) {
        // Remove
        const newFavorites = favorites.filter(id => id !== programId);
        saveFavoritesToLocalStorage(newFavorites);
      } else {
        // Adiciona
        favorites.push(programId);
        saveFavoritesToLocalStorage(favorites);
      }
      return favorites;
    },
  });
