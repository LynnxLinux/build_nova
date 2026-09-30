import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Navigate } from "react-router-dom";
import { User, ShoppingBag, Keyboard, Settings } from "lucide-react";

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice } = useCart();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const savedBuilds = [
    { name: "Midnight Purple 65%", date: "10 Mar 2026", price: "$287.49" },
    { name: "Arctic TKL", date: "5 Mar 2026", price: "$312.99" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Painel</h1>
        <p className="text-foreground mb-8">Bem-vindo de volta, {user?.name}.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: ShoppingBag, label: "Itens no Carrinho", value: items.length.toString() },
          { icon: Keyboard, label: "Builds Salvas", value: "2" },
          { icon: User, label: "Total Gasto", value: `$${totalPrice.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-lg shadow-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-foreground">{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Builds */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" /> Builds Salvas
          </h3>
          <div className="space-y-3">
            {savedBuilds.map((build) => (
              <div key={build.name} className="flex items-center justify-between p-3 bg-accent rounded-md">
                <div>
                  <p className="font-medium text-sm">{build.name}</p>
                  <p className="text-xs text-muted-foreground">{build.date}</p>
                </div>
                <span className="text-primary font-semibold text-sm tabular-nums">{build.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Perfil
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground-strong block mb-1">Nome</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground-strong block mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none"
                readOnly
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md text-sm shadow-button"
            >
              Salvar Alterações
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;