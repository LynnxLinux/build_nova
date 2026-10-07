import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { communityImages } from "@/data/communityImages";
import type { CommunityBuild } from "@/data/community";

interface CommunityRow {
  id: string;
  author_name: string;
  title: string;
  description: string;
  layout: string;
  switches: string;
  keycaps: string;
  image_key: string;
  likes: number;
}

export const useCommunityBuilds = () =>
  useQuery({
    queryKey: ["community_builds"],
    queryFn: async (): Promise<CommunityBuild[]> => {
      const { data, error } = await supabase
        .from("community_builds")
        .select("*")
        .eq("is_public", true)
        .order("id");
      if (error) throw error;
      return ((data ?? []) as CommunityRow[]).map((r) => ({
        id: r.id,
        user: r.author_name,
        title: r.title,
        description: r.description,
        likes: r.likes,
        layout: r.layout,
        switches: r.switches,
        keycaps: r.keycaps,
        image: communityImages[r.image_key] ?? "",
      }));
    },
  });

/** IDs das builds que o usuário logado já curtiu */
export const useMyLikes = (userId: string | undefined) =>
  useQuery({
    queryKey: ["community_likes", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("community_likes")
        .select("build_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((r: { build_id: string }) => r.build_id));
    },
  });

export const useToggleLike = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ buildId, liked }: { buildId: string; liked: boolean }) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const query = supabase.from("community_likes");
      const { error } = liked
        ? await query.delete().eq("build_id", buildId).eq("user_id", userId)
        : await query.insert({ build_id: buildId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      // o trigger do banco atualiza o contador; aqui só recarregamos
      queryClient.invalidateQueries({ queryKey: ["community_builds"] });
      queryClient.invalidateQueries({ queryKey: ["community_likes", userId] });
    },
  });
};
