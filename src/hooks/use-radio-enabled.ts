import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { getRadioConfig } from "@/services/radio";

export function useRadioEnabled(churchId: string | null) {
  return useQuery({
    queryKey: ["radio-settings", churchId],
    queryFn: () => (churchId ? getRadioConfig(supabase, churchId) : getRadioConfig(supabase, null)),
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}