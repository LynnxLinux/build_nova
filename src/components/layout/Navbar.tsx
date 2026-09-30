import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Keyboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/builder", label: "Monte o seu" },
  { to: "/products", label: "Produtos" },
  { to: "/community", label: "Comunidade" },
  { to: "/about", label: "Sobre nós" },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Keyboard className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground-strong">Qwerty</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                location.pathname === link.to
                  ? "text-foreground-strong"
                  : "text-foreground hover:text-foreground-strong"
              }`}
            >
              {location.pathname === link.to && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-accent rounded-md"
                  transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hidden md:block text-sm font-medium text-foreground hover:text-foreground-strong transition-colors">
                Dashboard
              </Link>
              <button onClick={logout} className="hidden md:block text-sm font-medium text-foreground hover:text-foreground-strong transition-colors">
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden md:block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Login / Cadastre-se
            </Link>
          )}

          <Link to="/cart" className="relative p-2 rounded-md hover:bg-accent transition-colors">
            <ShoppingCart className="h-5 w-5 text-foreground-strong" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center tabular-nums">
                {totalItems}
              </span>
            )}
          </Link>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5 text-foreground-strong" /> : <Menu className="h-5 w-5 text-foreground-strong" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-foreground-strong transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors">Dashboard</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="px-4 py-2 rounded-md text-sm font-medium text-left text-foreground hover:bg-accent transition-colors">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium text-primary">Login / Cadastre-se</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
