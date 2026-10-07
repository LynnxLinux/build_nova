import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCommunityBuilds, useMyLikes, useToggleLike } from "@/api/community";

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
        <p className="text-foreground mb-10">Veja teclados personalizados criados pela comunidade.</p>
      </motion.div>

      {isLoading && <p className="text-foreground text-center py-20">Carregando builds...</p>}
      {isError && (
        <p className="text-foreground text-center py-20">Não foi possível carregar a galeria. Tente novamente em instantes.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builds.map((build, i) => (
          <motion.div
            key={build.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-card rounded-lg shadow-card overflow-hidden"
          >
            <div className="h-48 bg-accent flex items-center justify-center text-7xl">
              <img
                src={build.image}
                alt={build.title}
                className="h=40 object-contain"
                />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{build.title}</h3>
                  <p className="text-xs text-muted-foreground">por {build.user}</p>
                </div>
                <button
                  onClick={() => handleLike(build.id)}
                  className="flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Heart className={`h-4 w-4 ${myLikes?.has(build.id) ? "fill-current text-primary" : ""}`} />
                  <span className="tabular-nums">{build.likes}</span>
                </button>
              </div>
              <p className="text-sm text-foreground mb-3">{build.description}</p>
              <div className="flex flex-wrap gap-2">
                {[build.layout, build.switches, build.keycaps].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-accent rounded-md text-foreground-strong">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;