import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCommunityBuilds, useMyLikes, useToggleLike } from "@/api/community";
import CommunityBuildCard from "@/components/community/CommunityBuildCard";

const CommunityPage = () => {
  const { user } = useAuth();
  const { data: builds = [], isLoading, isError } = useCommunityBuilds();
  const { data: myLikes } = useMyLikes(user?.id);
  const toggleLike = useToggleLike(user?.id);

  const handleLike = (id: string) => {
    if (!user) {
      toast.error("Entre na sua conta para curtir.");
      return;
    }
    toggleLike.mutate(
      { buildId: id, liked: myLikes?.has(id) ?? false },
      { onError: () => toast.error("Não foi possível registrar a curtida.") },
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Galeria da Comunidade</h1>
        <p className="text-foreground mb-10">
          Veja teclados criados pela comunidade, monte um igual no Montador ou compre a build inteira.
        </p>
      </motion.div>

      {isLoading && <p className="text-foreground text-center py-20">Carregando builds...</p>}
      {isError && (
        <p className="text-foreground text-center py-20">Não foi possível carregar a galeria. Tente novamente em instantes.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builds.map((build, i) => (
          <CommunityBuildCard
            key={build.id}
            build={build}
            index={i}
            liked={myLikes?.has(build.id) ?? false}
            onLike={handleLike}
          />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
