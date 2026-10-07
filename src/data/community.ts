// Tipo da galeria. As builds vêm do Supabase (tabela community_builds),
// veja src/api/community.ts. As imagens ficam em src/data/communityImages.ts.

export interface CommunityBuild {
  id: string;
  user: string;
  title: string;
  description: string;
  likes: number;
  layout: string;
  switches: string;
  keycaps: string;
  image: string;
}
