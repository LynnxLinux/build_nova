import { motion } from "framer-motion";
import { Keyboard, Heart, Zap, Globe } from "lucide-react";

const values = [
  { icon: Keyboard, title: "Construção", desc: "Cada teclado é uma expressão única de seu criador." },
  { icon: Heart, title: "Paixão", desc: "Construído por entusiastas, para entusiastas." },
  { icon: Zap, title: "Inovação", desc: "Expandindo os limites da tecnologia de teclados." },
  { icon: Globe, title: "Comunidade", desc: "Uma rede global de amantes de teclados." },
];

const AboutPage = () => (
  <div className="container mx-auto px-4 py-12">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
        Ajudando você a construir seu<br />
        <span className="text-gradient-primary">Teclado dos Sonhos</span>
      </h1>
      <p className="text-lg text-foreground leading-relaxed">
        A Qwerty foi fundada com uma missão simples: tornar o complexo processo de criação de teclados personalizados acessível, visual e satisfatório para todos desde iniciantes até entusiastas experientes.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
      {values.map((v, i) => (
        <motion.div
          key={v.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="bg-card rounded-lg shadow-card p-6"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
            <v.icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold mb-2">{v.title}</h3>
          <p className="text-sm text-foreground">{v.desc}</p>
        </motion.div>
      ))}
    </div>

    <div className="glass rounded-lg p-12 text-center max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold tracking-tight mb-4">Nossa História</h2>
      <p className="text-foreground leading-relaxed">
        O que começou como um projeto paralelo de um grupo de entusiastas de teclados cresceu e se tornou uma plataforma usada por milhares de criadores ao redor do mundo. Acreditamos que o teclado perfeito não é algo que você compra é algo que você cria. Cada switch, cada keycap, cada detalhe importa. É por isso que construímos a Qwerty: para dar a você as ferramentas para torná-lo seu.
      </p>
    </div>
  </div>
);

export default AboutPage;