import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, DollarSign, Package, ShoppingBag, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isPaidStatus, orderStatusLabel, type Order, type OrderStatus } from "@/api/checkout";
import {
  useAdminOrders,
  useAdminProducts,
  useIsAdmin,
  useUpdateOrderStatus,
  useUpdateProduct,
  type AdminProduct,
} from "@/api/admin";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const statusStyle: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-500",
  paid: "bg-green-500/15 text-green-500",
  shipped: "bg-blue-500/15 text-blue-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-neutral-500/20 text-neutral-400",
};

// Próximos passos permitidos para cada status (cancelar pedido pago exige estorno no Mercado Pago)
const nextActions: Record<OrderStatus, { label: string; to: OrderStatus }[]> = {
  pending: [{ label: "Cancelar pedido", to: "cancelled" }],
  paid: [{ label: "Marcar como enviado", to: "shipped" }],
  shipped: [{ label: "Marcar como entregue", to: "delivered" }],
  delivered: [],
  failed: [],
  cancelled: [],
};

const inputClass =
  "bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none";

/* ── Pedido (linha expansível) ─────────────────────────────── */
const OrderRowView = ({ order }: { order: Order }) => {
  const [open, setOpen] = useState(false);
  const update = useUpdateOrderStatus();
  const a = order.address;

  const change = (to: OrderStatus) => {
    update.mutate(
      { id: order.id, status: to },
      {
        onSuccess: () => toast.success(`Pedido ${order.id.slice(0, 8).toUpperCase()}: ${orderStatusLabel[to]}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível atualizar."),
      },
    );
  };

  return (
    <div className="bg-accent rounded-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            #{order.id.slice(0, 8).toUpperCase()} · {a.recipient_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {dateTime(order.createdAt)} · {a.city}/{a.state}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status]}`}>
          {orderStatusLabel[order.status]}
        </span>
        <span className="text-primary font-semibold text-sm tabular-nums w-24 text-right">{brl(order.total)}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4 text-sm">
          <ul className="space-y-1">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-foreground">
                  {i.quantity}× {i.name}
                </span>
                <span className="tabular-nums shrink-0">{brl(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 text-muted-foreground pt-1">
              <span>
                Frete ({order.shippingMethod}, até {order.shippingDays} dias úteis)
              </span>
              <span className="tabular-nums">{brl(order.shippingCost)}</span>
            </li>
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Entrega</p>
              <p className="text-foreground-strong">{a.recipient_name}</p>
              <p className="text-foreground">
                {a.street}, {a.number}
                {a.complement ? ` - ${a.complement}` : ""} · {a.neighborhood}
              </p>
              <p className="text-muted-foreground">
                {a.city}/{a.state} · CEP {a.cep} · Tel. {a.phone}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pagamento</p>
              <p className="text-foreground">Mercado Pago</p>
              <p className="text-muted-foreground">
                {order.paymentId ? `ID ${order.paymentId}` : "Sem pagamento confirmado"}
                {order.paidAt ? ` · pago em ${dateTime(order.paidAt)}` : ""}
              </p>
            </div>
          </div>

          {nextActions[order.status].length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextActions[order.status].map((act) => (
                <button
                  key={act.to}
                  type="button"
                  onClick={() => change(act.to)}
                  disabled={update.isPending}
                  className={`px-4 py-2 text-sm font-semibold rounded-md disabled:opacity-50 ${
                    act.to === "cancelled"
                      ? "bg-accent text-destructive border border-border"
                      : "bg-primary text-primary-foreground shadow-button"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Produto (edição de preço, estoque e ativo) ────────────── */
const ProductRowView = ({ product }: { product: AdminProduct }) => {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.active);
  const update = useUpdateProduct();

  const dirty = Number(price) !== product.price || Number(stock) !== product.stock || active !== product.active;

  const save = () => {
    const p = Number(price.replace(",", "."));
    const s = Math.floor(Number(stock));
    if (!Number.isFinite(p) || p < 0) return toast.error("Preço inválido.");
    if (!Number.isFinite(s) || s < 0) return toast.error("Estoque inválido.");
    update.mutate(
      { id: product.id, price: Math.round(p * 100) / 100, stock: s, active },
      {
        onSuccess: () => toast.success(`${product.name} atualizado`),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-accent rounded-md">
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium text-sm">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.id} · {product.category}
        </p>
      </div>
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
        R$
        <input className={`${inputClass} w-24`} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
      </label>
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
        Estoque
        <input className={`${inputClass} w-20`} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
      </label>
      <label className="text-xs text-foreground flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativo
      </label>
      <button
        type="button"
        onClick={save}
        disabled={!dirty || update.isPending}
        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Salvar
      </button>
    </div>
  );
};

/* ── Página ────────────────────────────────────────────────── */
const AdminPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin(user?.id);
  const { data: orders = [], isLoading: loadingOrders } = useAdminOrders(!!isAdmin);
  const { data: products = [], isLoading: loadingProducts } = useAdminProducts(!!isAdmin);

  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  if (authLoading || (user && checkingAdmin)) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Acesso restrito</h1>
        <p className="text-foreground mb-6">Esta área é exclusiva para administradores.</p>
        <Link to="/" className="text-primary font-semibold hover:underline">
          Voltar para o início
        </Link>
      </div>
    );
  }

  const paidOrders = orders.filter((o) => isPaidStatus(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = [
    { icon: ShoppingBag, label: "Pedidos", value: String(orders.length) },
    { icon: Package, label: "Pedidos pagos", value: String(paidOrders.length) },
    { icon: Clock, label: "Aguardando pagamento", value: String(orders.filter((o) => o.status === "pending").length) },
    { icon: DollarSign, label: "Receita", value: brl(revenue) },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Painel do administrador</h1>
        <p className="text-foreground mb-8">Acompanhe os pedidos e gerencie os produtos da loja.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg shadow-card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-foreground">{s.label}</p>
              <p className="text-xl font-bold tabular-nums truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-accent border border-border w-fit mb-6">
        {(["orders", "products"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-foreground hover:text-foreground-strong"
            }`}
          >
            {t === "orders" ? "Pedidos" : "Produtos"}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <section className="bg-card rounded-lg shadow-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-lg">Pedidos</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | OrderStatus)}
              className={inputClass}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              {(Object.keys(orderStatusLabel) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {loadingOrders && <p className="text-sm text-muted-foreground">Carregando pedidos...</p>}
            {!loadingOrders && visible.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
            {visible.map((o) => (
              <OrderRowView key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {tab === "products" && (
        <section className="bg-card rounded-lg shadow-card p-6">
          <h2 className="font-semibold text-lg mb-1">Produtos</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Alterar preço, estoque ou desativar um produto (desativado some da loja).
          </p>
          <div className="space-y-2">
            {loadingProducts && <p className="text-sm text-muted-foreground">Carregando produtos...</p>}
            {products.map((p) => (
              <ProductRowView key={`${p.id}-${p.price}-${p.stock}-${p.active}`} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminPage;
