import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Palette, Users } from "lucide-react";
import heroImage from "@/assets/hero-keyboard.jpg";
import midnightPurple from "@/assets/community-builds/midnight-purple.png"
import brancoArtico from "@/assets/community-builds/branco-artico.png"
import neonDreams from "@/assets/community-builds/neon-dreams.png"
import gateronOil from "@/assets/produtos/gateron-oil.png"
import gmkLaser from "@/assets/produtos/gmkLaser.png"
import caboCoiled from "@/assets/produtos/cabo-coiled.png"
import tofu65 from "@/assets/produtos/Tofu65.png"

const spring = { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.5 };

const featuredBuilds = [
  { title: "Midnight Purple", layout: "75%", price: "R$299,99", image: midnightPurple },
  { title: "Branco Ártico", layout: "TKL", price: "R$299,99", image: brancoArtico },
  { title: "Neon Dreams", layout: "Full Size", price: "R$349,99", image: neonDreams },
];

const popularProducts = [
  { name: "Gateron Oil King", price: "R$32,99", category: "Switches", image: gateronOil, imageSize: "h-28" },
  { name: "GMK Laser Keycaps", price: "R$129,99", category: "Keycaps", image: gmkLaser, imageSize: "h-26"},
  { name: "Coiled USB-C Cable", price: "R$49,99", category: "Cabos", image: caboCoiled, imageSize: "h-24" },
  { name: "Tofu65 Case", price: "R$119,99", category: "Cases", image:tofu65, imageSize: "h-24" },
];

const reasons = [
  { icon: Palette, title: "Personalização completa", desc: "Escolha cada componente, do layout às keycaps." },
  { icon: Zap, title: "Visualização em tempo real", desc: "Veja seu teclado sendo montado enquanto escolhe." },
  { icon: Shield, title: "Peças de qualidade", desc: "Utilizamos apenas componentes confiáveis e duráveis." },
  { icon: Users, title: "Comunidade ativa", desc: "Compartilhe setups e descubra novas ideias." },
];

const HomePage = () => (
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

    <section className="container mx-auto px-4 py-24">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Teclados em destaque</h2>
      <p className="text-foreground mb-10">Modelos montados por nossa comunidade.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredBuilds.map((build, i) => (
          <motion.div
            key={build.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-card rounded-lg shadow-card overflow-hidden group cursor-pointer"
          >
            <div className="h-48 bg-accent flex items-center justify-center text-7xl">
              <img
                src={build.image}
                alt={build.title}
                className="h=40 object-contain"
                />
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1">{build.title}</h3>
              <div className="flex justify-between text-sm text-foreground">
                <span>{build.layout}</span>
                <span className="text-primary font-semibold tabular-nums">{build.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="container mx-auto px-4 py-24">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Produtos mais vendidos</h2>
      <p className="text-foreground mb-10">Peças mais populares entre nossos clientes.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {popularProducts.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-card rounded-lg shadow-card p-5 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center h-20 mb-3">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className={`${p.imageSize || "h-16"} object-contain`}
              />
            ) : (
              <div className="text-4xl">{p.image}</div>
           )}
              </div>
            <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-1">{p.category}</p>
            <p className="text-primary font-semibold text-sm tabular-nums">{p.price}</p>
          </motion.div>
        ))}
      </div>
    </section>

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

export default HomePage;