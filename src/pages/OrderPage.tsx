import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { checkPaymentStatus, isPaidStatus, orderStatusLabel, startPayment, useOrder } from "@/api/checkout";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const OrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [tick, setTick] = useState(0);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const attempts = useRef(0);

  const { data: order, isLoading } = useOrder(user ? id : undefined, tick);

  // Pergunta ao servidor (que consulta o Mercado Pago) se o pagamento foi aprovado
  const refreshStatus = useCallback(async () => {
    if (!id) return;
    setChecking(true);
    try {
      const result = await checkPaymentStatus(id);
      setPaymentStatus(result.paymentStatus);
      setTick((t) => t + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }, [id]);

  // verifica ao abrir e, enquanto pendente, a cada 8 segundos (até ~2 minutos)
  useEffect(() => {
    if (!user || !id) return;
    refreshStatus();
    const timer = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 15) return clearInterval(timer);
      refreshStatus();
    }, 8000);
    return () => clearInterval(timer);
  }, [user, id, refreshStatus]);

  // Pagamento confirmado: esvazia o carrinho uma única vez (quando voltou do Mercado Pago)
  useEffect(() => {
    if (!order || !isPaidStatus(order.status) || !id) return;
    const cameFromPayment = searchParams.has("payment_id") || searchParams.has("collection_id");
    const key = `qwerty-cart-cleared-${id}`;
    if (cameFromPayment && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      clearCart();
    }
  }, [order, id, searchParams, clearCart]);

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    try {
      window.location.href = await startPayment(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível reabrir o pagamento.");
      setRetrying(false);
    }
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-foreground mb-6">Entre na sua conta para ver o pedido.</p>
        <Link to="/login" className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
          Entrar
        </Link>
      </div>
    );
  }
  if (isLoading) return <p className="container mx-auto px-4 py-32 text-center text-foreground">Carregando pedido...</p>;
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-foreground mb-6">Pedido não encontrado.</p>
        <Link to="/dashboard" className="text-primary font-semibold hover:underline">Ir para o painel</Link>
      </div>
    );
  }

  const paid = isPaidStatus(order.status);
  const rejected = order.status === "pending" && paymentStatus === "rejected";
  const addr = order.address;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        {paid ? (
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
        ) : rejected || order.status === "failed" || order.status === "cancelled" ? (
          <XCircle className="h-14 w-14 text-destructive mx-auto mb-3" />
        ) : (
          <Clock className="h-14 w-14 text-primary mx-auto mb-3" />
        )}
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {order.status === "shipped" ? "Pedido enviado!" : order.status === "delivered" ? "Pedido entregue!" : paid ? "Pagamento confirmado!" : rejected ? "Pagamento recusado" : orderStatusLabel[order.status]}
        </h1>
        <p className="text-foreground">
          {paid
            ? "Obrigado pela compra! Seu pedido está sendo preparado."
            : rejected
              ? "O Mercado Pago recusou o pagamento. Você pode tentar novamente."
              : "Assim que o Mercado Pago confirmar, o status muda aqui. Pix e boleto podem levar mais tempo."}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Pedido {order.id.slice(0, 8).toUpperCase()}</p>
      </motion.div>

      <div className="bg-card rounded-lg shadow-card p-6 space-y-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Itens</h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-foreground">
                  {i.quantity}× {i.name}
                </span>
                <span className="tabular-nums shrink-0">{brl(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{brl(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-foreground">
            <span>Frete ({order.shippingMethod}, até {order.shippingDays} dias úteis)</span>
            <span className="tabular-nums">{brl(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-foreground-strong font-semibold text-base">
            <span>Total</span>
            <span className="tabular-nums">{brl(order.total)}</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Entrega</h2>
          <p className="text-foreground-strong">{addr.recipient_name}</p>
          <p className="text-foreground">
            {addr.street}, {addr.number}
            {addr.complement ? ` - ${addr.complement}` : ""} · {addr.neighborhood}
          </p>
          <p className="text-muted-foreground">
            {addr.city}/{addr.state} · CEP {addr.cep}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {order.status === "pending" && (
            <>
              <button
                type="button"
                onClick={refreshStatus}
                disabled={checking}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-foreground-strong text-sm font-semibold rounded-md border border-border disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Atualizar status
              </button>
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button disabled:opacity-50"
              >
                {retrying ? "Abrindo..." : rejected ? "Tentar pagar de novo" : "Ir para o pagamento"}
              </button>
            </>
          )}
          {paid && (
            <Link to={`/pedido/${order.id}/nota`} className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button">
              Ver nota de compra
            </Link>
          )}
          <Link to="/dashboard" className="px-4 py-2.5 bg-accent text-foreground-strong text-sm font-semibold rounded-md border border-border">
            Meus pedidos
          </Link>
          <Link to="/products" className="px-4 py-2.5 bg-accent text-foreground-strong text-sm font-semibold rounded-md border border-border">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
