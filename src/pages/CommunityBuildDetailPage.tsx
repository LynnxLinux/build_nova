import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Wrench, Zap } from "lucide-react";
import { useCommunityBuilds, layoutOfBuild } from "@/api/community";
import { usePurchase } from "@/hooks/usePurchase";
import { supportsWebGL } from "@/utils/webgl";

const Keyboard3D = lazy(() => import("@/components/builder/Keyboard3D"));

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryLabel: Record<string, string> = {
  switch: "Switch",
  keycap: "Keycap",
  pcb: "PCB",
  case: "Case",
};

const CommunityBuildDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: builds = [], isLoading } = useCommunityBuilds();
  const { addBuild, buyBuild } = usePurchase();
  const [show3d, setShow3d] = useState(supportsWebGL());

  const build = builds.find((b) => b.id === id);

  if (isLoading) {
    return <p className="container mx-auto px-4 py-20 text-center text-foreground">Carregando build...</p>;
  }

  if (!build) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-foreground mb-4">Build não encontrada.</p>
        <Link to="/community" className="text-primary font-semibold hover:underline">
          Voltar para a galeria
        </Link>
      </div>
    );
  }

  const part = (cat: string) => build.parts.find((p) => p.category === cat) ?? null;
  const caseItem = part("case");

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para a galeria
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Visual */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          {show3d ? (
            <Suspense fallback={<p className="text-center text-foreground py-20">Carregando 3D...</p>}>
              <Keyboard3D
                layout={layoutOfBuild(build)}
                keycap={part("keycap")}
                caseItem={caseItem}
                switchItem={part("switch")}
                pcb={part("pcb")}
                caseColor={caseItem?.colors?.[0]?.hex ?? null}
                heightClass="h-[420px]"
                onFail={() => setShow3d(false)}
              />
            </Suspense>
          ) : (
            <img src={build.image} alt={build.title} className="w-full max-h-[420px] object-contain rounded-xl" />
          )}
          {show3d && (
            <div className="mt-4 flex items-center gap-3">
              <img src={build.image} alt="" className="h-14 w-14 object-contain rounded-md bg-accent" />
              <p className="text-xs text-muted-foreground">
                O 3D mostra as peças da build. A foto ao lado é a imagem original enviada pela comunidade.
              </p>
            </div>
          )}
        </motion.div>

        {/* Informações */}
        <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{build.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              por {build.user} · {build.layout} · {build.likes} curtidas
            </p>
          </div>
          <p className="text-foreground">{build.description}</p>

          <div className="bg-card rounded-lg shadow-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Peças</h2>
            <ul className="space-y-2">
              {build.parts.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="text-muted-foreground">{categoryLabel[p.category] ?? p.category}:</span>{" "}
                    <span className="text-foreground-strong">{p.name}</span>
                  </span>
                  <span className="tabular-nums shrink-0">{brl(p.price)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary tabular-nums">{brl(build.price)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => buyBuild(build)}
              disabled={!build.complete}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-button disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" /> Comprar build
            </button>
            <button
              type="button"
              onClick={() => addBuild(build)}
              disabled={!build.complete}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent text-foreground-strong font-semibold rounded-xl border border-border disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
            </button>
            <Link
              to={`/builder?communityBuild=${build.id}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent text-foreground-strong font-semibold rounded-xl border border-border hover:bg-accent/80 transition-colors"
            >
              <Wrench className="h-4 w-4" /> Montar igual no Montador
            </Link>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default CommunityBuildDetailPage;
