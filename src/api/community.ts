import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { communityImages } from "@/data/communityImages";
import type { CommunityBuild } from "@/data/community";
import type { BuilderProduct, LayoutSize } from "@/data/builderProducts";
import { useBuilderParts } from "@/api/catalog";

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
  is_featured: boolean | null;
  parts: string[] | null;
}

/** Build da comunidade já com as peças do catálogo e o preço somado */
export interface CommunityBuildFull extends CommunityBuild {
  parts: BuilderProduct[];
  price: number;
  /** true quando todas as peças da build existem no catálogo */
  complete: boolean;
}

const useRawCommunityBuilds = () =>
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
        partIds: Array.isArray(r.parts) ? r.parts : [],
        isFeatured: !!r.is_featured,
      }));
    },
  });

/** Galeria com as peças resolvidas (junta community_builds + builder_parts) */
export function useCommunityBuilds() {
  const builds = useRawCommunityBuilds();
  const parts = useBuilderParts();

  const data = useMemo<CommunityBuildFull[] | undefined>(() => {
    if (!builds.data || !parts.data) return undefined;
    const byId = new Map(parts.data.map((p) => [p.id, p]));
    return builds.data.map((b) => {
      const resolved = b.partIds.map((id) => byId.get(id)).filter((p): p is BuilderProduct => !!p);
      return {
        ...b,
        parts: resolved,
        price: resolved.reduce((sum, p) => sum + p.price, 0),
        complete: resolved.length > 0 && resolved.length === b.partIds.length,
      };
    });
  }, [builds.data, parts.data]);

  return {
    data,
    isLoading: builds.isLoading || parts.isLoading,
    isError: builds.isError || parts.isError,
  };
}

/** Layout usado pelo montador, a partir das peças (ou do texto "Full Size") */
export function layoutOfBuild(build: CommunityBuildFull): LayoutSize {
  const fromParts = build.parts.find((p) => p.category === "pcb")?.layout ?? build.parts.find((p) => p.category === "case")?.layout;
  if (fromParts) return fromParts;
  const l = build.layout.trim().toLowerCase();
  if (l.startsWith("full")) return "Full";
  if (l === "tkl") return "TKL";
  if (l === "60%" || l === "65%" || l === "75%") return l as LayoutSize;
  return "65%";
}

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
