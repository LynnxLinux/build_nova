import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Link, Navigate } from "react-router-dom";
import { User, ShoppingBag, Keyboard, Settings, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSavedBuilds, useDeleteBuild } from "@/api/builds";
import { useOrders, orderStatusLabel } from "@/api/checkout";
import { useIsAdmin } from "@/api/admin";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { items, totalPrice } = useCart();
  const { data: savedBuilds = [], isLoading: loadingBuilds } = useSavedBuilds(user?.id);
  const deleteBuild = useDeleteBuild(user?.id);
  const { data: orders = [] } = useOrders(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user?.id, user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });
    if (!error && user) {
      await supabase.from("profiles").update({ name: trimmed }).eq("id", user.id);
    }
    setSaving(false);
    if (error) toast.error("Não foi possível salvar as alterações.");
    else toast.success("Perfil atualizado!");
  };

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Painel</h1>
        <p className="text-foreground mb-4">Bem-vindo de volta, {user?.name}.</p>
        {isAdmin ? (
          <Link to="/admin" className="inline-flex mb-8 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button">
            Abrir painel do administrador
          </Link>
        ) : (
          <div className="mb-4" />
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: ShoppingBag, label: "Itens no Carrinho", value: items.length.toString() },
          { icon: Keyboard, label: "Builds Salvas", value: savedBuilds.length.toString() },
          { icon: User, label: "Total no Carrinho", value: brl(totalPrice) },
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
            {loadingBuilds && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!loadingBuilds && savedBuilds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Você ainda não salvou nenhuma build. Monte uma no Montador e clique em "Salvar build".
              </p>
            )}
            {savedBuilds.map((build) => (
              <div key={build.id} className="flex items-center justify-between gap-3 p-3 bg-accent rounded-md">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{build.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(build.createdAt).toLocaleDateString("pt-BR")} · {build.parts.length}{" "}
                    {build.parts.length === 1 ? "peça" : "peças"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-primary font-semibold text-sm tabular-nums">{brl(build.totalPrice)}</span>
                  <button
                    onClick={() =>
                      deleteBuild.mutate(build.id, {
                        onSuccess: () => toast.success("Build removida."),
                        onError: () => toast.error("Não foi possível remover a build."),
                      })
                    }
                    disabled={deleteBuild.isPending}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    aria-label={`Remover ${build.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground-strong block mb-1">Email</label>
              <input
                type="email"
                value={user?.email ?? ""}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none"
                readOnly
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md text-sm shadow-button disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Meus pedidos */}
      <div className="bg-card rounded-lg shadow-card p-6 mt-8">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Meus pedidos
        </h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/pedido/${o.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-accent rounded-md hover:bg-accent/80 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">Pedido {o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("pt-BR")} · {orderStatusLabel[o.status]}
                  </p>
                </div>
                <span className="text-primary font-semibold text-sm tabular-nums">{brl(o.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
