import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Palette, Users, ShoppingCart } from "lucide-react";
import heroImage from "@/assets/hero-keyboard.jpg";
import { useBestSellers } from "@/api/catalog";
import { useCommunityBuilds } from "@/api/community";
import { usePurchase } from "@/hooks/usePurchase";
import ProductCard from "@/components/products/ProductCard";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const spring = { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.5 };

const reasons = [
  { icon: Palette, title: "Personalização completa", desc: "Escolha cada componente, do layout às keycaps." },
  { icon: Zap, title: "Visualização em tempo real", desc: "Veja seu teclado sendo montado enquanto escolhe." },
  { icon: Shield, title: "Peças de qualidade", desc: "Utilizamos apenas componentes confiáveis e duráveis." },
  { icon: Users, title: "Comunidade ativa", desc: "Compartilhe setups e descubra novas ideias." },
];

const HomePage = () => {
  const { data: builds = [] } = useCommunityBuilds();
  const { data: bestSellers = [] } = useBestSellers(4);
  const { addBuild, buyBuild } = usePurchase();

  const featured = (builds.filter((b) => b.isFeatured).length > 0 ? builds.filter((b) => b.isFeatured) : builds).slice(0, 3);

  return (
  <div>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Teclado mecânico personalizado" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>
      <div className="relative container mx-auto px-4 py-32 md:py-44">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
            Monte o seu teclado<br />
            <span className="text-gradient-primary">ideal</span>
          </h1>
          <p className="text-lg text-foreground max-w-lg mb-8">
            Crie seu teclado mecânico personalizado com nosso construtor interativo. Escolha cada peça, visualize na hora e finalize sua compra com facilidade.
          </p>
          <div className="flex gap-4 flex-wrap">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button transition-colors hover:bg-primary/90"
              >
                Montar meu teclado <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-foreground-strong font-semibold rounded-md border border-border transition-colors hover:bg-accent/80"
              >
                Ver produtos
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>

    {featured.length > 0 && (
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Teclados em destaque</h2>
        <p className="text-foreground mb-10">Modelos montados por nossa comunidade.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((build, i) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-lg shadow-card overflow-hidden flex flex-col"
            >
              <Link to={`/community/${build.id}`} aria-label={`Ver build ${build.title}`}>
                <div className="h-48 bg-accent flex items-center justify-center overflow-hidden">
                  <img src={build.image} alt={build.title} loading="lazy" className="h-full w-full object-contain" />
                </div>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-lg mb-1">{build.title}</h3>
                <div className="flex justify-between text-sm text-foreground mb-4">
                  <span>{build.layout}</span>
                  <span className="text-primary font-semibold tabular-nums">{brl(build.price)}</span>
                </div>
                <div className="mt-auto space-y-2">
                  <button
                    type="button"
                    onClick={() => buyBuild(build)}
                    disabled={!build.complete}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="h-3 w-3" /> Comprar agora
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addBuild(build)}
                      disabled={!build.complete}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-foreground-strong text-xs font-semibold rounded-md border border-border hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-3 w-3" /> Adicionar
                    </button>
                    <Link
                      to={`/community/${build.id}`}
                      className="flex-1 text-center px-3 py-2 bg-accent text-foreground-strong text-xs font-semibold rounded-md border border-border hover:bg-accent/80 transition-colors"
                    >
                      Ver build
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    )}

    {bestSellers.length > 0 && (
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Produtos mais vendidos</h2>
        <p className="text-foreground mb-10">Peças mais populares entre nossos clientes.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    )}

    <section className="container mx-auto px-4 py-24">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-2">Por que escolher o Qwerty?</h2>
      <p className="text-foreground text-center mb-12">Tudo o que você precisa para montar seu teclado ideal.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="text-center p-6"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
              <r.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">{r.title}</h3>
            <p className="text-sm text-foreground">{r.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="container mx-auto px-4 py-24">
      <div className="glass rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Faça parte da comunidade</h2>
        <p className="text-foreground max-w-md mx-auto mb-8">
          Compartilhe seus setups, receba feedback e encontre inspiração.
        </p>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring} className="inline-block">
          <Link to="/community" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
            Ver projetos <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  </div>
  );
};

export default HomePage;