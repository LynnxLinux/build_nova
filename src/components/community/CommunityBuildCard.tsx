import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { usePurchase } from "@/hooks/usePurchase";
import type { CommunityBuildFull } from "@/api/community";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryLabel: Record<string, string> = {
  switch: "Switch",
  keycap: "Keycap",
  pcb: "PCB",
  case: "Case",
};

interface Props {
  build: CommunityBuildFull;
  index?: number;
  liked: boolean;
  onLike: (id: string) => void;
}

/** Card da galeria: Ver build · Montar igual · Comprar build */
const CommunityBuildCard = ({ build, index = 0, liked, onLike }: Props) => {
  const { buyBuild } = usePurchase();
  const detailUrl = `/community/${build.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-lg shadow-card overflow-hidden flex flex-col"
    >
      <Link to={detailUrl} aria-label={`Ver build ${build.title}`}>
        <div className="h-48 bg-accent flex items-center justify-center overflow-hidden">
          <img src={build.image} alt={build.title} loading="lazy" className="h-full w-full object-contain" />
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <Link to={detailUrl}>
              <h3 className="font-semibold hover:text-primary transition-colors">{build.title}</h3>
            </Link>
            <p className="text-xs text-muted-foreground">por {build.user}</p>
          </div>
          <button
            type="button"
            onClick={() => onLike(build.id)}
            aria-label={`Curtir build ${build.title}`}
            className="flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors shrink-0"
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current text-primary" : ""}`} />
            <span className="tabular-nums">{build.likes}</span>
          </button>
        </div>

        <p className="text-sm text-foreground mb-3 line-clamp-2">{build.description}</p>

        <div className="flex gap-2 text-xs text-muted-foreground mb-3">
          <span className="px-2 py-0.5 rounded-full bg-accent border border-border">{build.layout}</span>
          <span className="px-2 py-0.5 rounded-full bg-accent border border-border">{build.parts.length} peças</span>
        </div>

        <ul className="space-y-1 mb-3 text-xs">
          {build.parts.map((p) => (
            <li key={p.id} className="text-foreground-strong truncate">
              <span className="text-muted-foreground">{categoryLabel[p.category] ?? p.category}:</span> {p.name}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Preço estimado</span>
            <span className="text-primary font-bold tabular-nums text-sm">{brl(build.price)}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <Link
              to={detailUrl}
              className="flex-1 text-center px-3 py-2 bg-accent text-foreground-strong text-xs font-semibold rounded-md border border-border hover:bg-accent/80 transition-colors"
            >
              Ver build
            </Link>
            <Link
              to={`/builder?communityBuild=${build.id}`}
              className="flex-1 text-center px-3 py-2 bg-accent text-foreground-strong text-xs font-semibold rounded-md border border-border hover:bg-accent/80 transition-colors"
            >
              Montar igual
            </Link>
          </div>
          <button
            type="button"
            onClick={() => buyBuild(build)}
            disabled={!build.complete}
            aria-label={`Comprar build ${build.title}`}
            className="w-full px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {build.complete ? "Comprar build" : "Indisponível"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityBuildCard;
