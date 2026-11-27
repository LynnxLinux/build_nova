
import { Link } from "react-router-dom";
import { Keyboard } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-surface/50 mt-auto">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground-strong">Qwerty</span>
          </div>
          <p className="text-sm text-foreground max-w-xs">
            Crie o teclado mecânico dos seus sonhos com uma experiência de personalização fácil e divertida.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground-strong mb-4">
            Atalhos
          </h4>
          <div className="flex flex-col gap-2">
            {[
              { to: "/", l: "Inicio" },
              { to: "/builder", l: "Monte o seu" },
              { to: "/products", l: "Produtos" },
              { to: "/community", l: "Comunidade" },
              { to: "/about", l: "Sobre nós" }
            ].map((lnk) => (
              <Link
                key={lnk.to}
                to={lnk.to}
                className="text-sm text-foreground hover:text-foreground-strong transition-colors"
              >
                {lnk.l}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground-strong mb-4">
            Suporte
          </h4>
          <div className="flex flex-col gap-2 text-sm text-foreground">
            <span>contato@qwerty.build</span>
            <span>FAQ</span>
            <span>Envios e devoluções</span>
          </div>
        </div>

      </div>

      <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Qwerty. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
