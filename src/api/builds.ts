import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BuildPart {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface SavedBuild {
  id: string;
  name: string;
  layout: string;
  parts: BuildPart[];
  totalPrice: number;
  createdAt: string;
}

interface SavedBuildRow {
  id: string;
  name: string;
  layout: string;
  parts: BuildPart[];
  total_price: number;
  created_at: string;
}

export const useSavedBuilds = (userId: string | undefined) =>
  useQuery({
    queryKey: ["saved_builds", userId],
    enabled: !!userId,
    queryFn: async (): Promise<SavedBuild[]> => {
      const { data, error } = await supabase
        .from("saved_builds")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as SavedBuildRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        layout: r.layout,
        parts: r.parts ?? [],
        totalPrice: Number(r.total_price),
        createdAt: r.created_at,
      }));
    },
  });

interface NewBuild {
  userId: string;
  name: string;
  layout: string;
  parts: BuildPart[];
  totalPrice: number;
}

export const useSaveBuild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (b: NewBuild) => {
      const { error } = await supabase.from("saved_builds").insert({
        user_id: b.userId,
        name: b.name,
        layout: b.layout,
        parts: b.parts,
        total_price: Math.round(b.totalPrice * 100) / 100,
      });
      if (error) throw error;
    },
    onSuccess: (_d, b) => queryClient.invalidateQueries({ queryKey: ["saved_builds", b.userId] }),
  });
};

export const useDeleteBuild = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_builds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved_builds", userId] }),
  });
};
