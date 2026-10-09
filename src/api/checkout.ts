import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* ── Tipos ─────────────────────────────────────────────────── */
export interface Address {
  id: string;
  recipientName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type NewAddress = Omit<Address, "id">;

export interface ShippingOption {
  method: string;
  label: string;
  price: number;
  days: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "failed" | "cancelled";

/** pedido já pago (inclui enviado e entregue) */
export const isPaidStatus = (s: OrderStatus) => s === "paid" || s === "shipped" || s === "delivered";

export interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  shippingDays: number;
  total: number;
  address: Record<string, string>;
  createdAt: string;
  paidAt: string | null;
  paymentId: string | null;
  items: OrderItem[];
}

/* ── CEP (ViaCEP) ──────────────────────────────────────────── */
export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.erro) return null;
    return { street: d.logradouro ?? "", neighborhood: d.bairro ?? "", city: d.localidade ?? "", state: d.uf ?? "" };
  } catch {
    return null;
  }
}

/* ── Endereços ─────────────────────────────────────────────── */
interface AddressRow {
  id: string;
  recipient_name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

const rowToAddress = (r: AddressRow): Address => ({
  id: r.id,
  recipientName: r.recipient_name,
  phone: r.phone,
  cep: r.cep,
  street: r.street,
  number: r.number,
  complement: r.complement ?? "",
  neighborhood: r.neighborhood,
  city: r.city,
  state: r.state,
});

export const useAddresses = (userId: string | undefined) =>
  useQuery({
    queryKey: ["addresses", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Address[]> => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as AddressRow[]).map(rowToAddress);
    },
  });

export const useCreateAddress = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAddress): Promise<Address> => {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          recipient_name: a.recipientName,
          phone: a.phone,
          cep: a.cep,
          street: a.street,
          number: a.number,
          complement: a.complement || null,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
        })
        .select("*")
        .single();
      if (error) throw error;
      return rowToAddress(data as AddressRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses", userId] }),
  });
};

export const useDeleteAddress = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses", userId] }),
  });
};

/* ── Frete (simulado por região, tabela shipping_rates) ────── */
export const useShippingOptions = (uf: string | undefined) =>
  useQuery({
    queryKey: ["shipping_options", uf],
    enabled: !!uf,
    queryFn: async (): Promise<ShippingOption[]> => {
      const { data, error } = await supabase.rpc("shipping_options", { p_uf: uf });
      if (error) throw error;
      return ((data ?? []) as { method: string; label: string; price: number; days: number }[]).map((r) => ({
        method: r.method,
        label: r.label,
        price: Number(r.price),
        days: r.days,
      }));
    },
  });

/* ── Pedido e pagamento ────────────────────────────────────── */
const friendlyOrderError = (message: string): string => {
  if (message.includes("empty_cart")) return "Seu carrinho está vazio.";
  if (message.includes("invalid_item")) return "Algum item do carrinho não está mais disponível.";
  if (message.includes("invalid_shipping")) return "Opção de frete inválida para este endereço.";
  if (message.includes("address_not_found")) return "Endereço não encontrado.";
  return "Não foi possível criar o pedido.";
};

/** Cria o pedido a partir do carrinho salvo no banco. Os preços são recalculados no servidor. */
export async function createOrder(addressId: string, shippingMethod: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_order", {
    p_address_id: addressId,
    p_shipping_method: shippingMethod,
  });
  if (error) throw new Error(friendlyOrderError(error.message));
  return data as string;
}

async function callPayments(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch(`/api/payments?${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const { error, detail } = json as { error?: string; detail?: string };
    throw new Error((error || "Erro ao falar com o servidor de pagamento.") + (detail ? ` [${detail}]` : ""));
  }
  return json as Record<string, unknown>;
}

/** Pede ao servidor a URL de pagamento do Mercado Pago */
export async function startPayment(orderId: string): Promise<string> {
  const json = await callPayments("action=create", { method: "POST", body: JSON.stringify({ orderId }) });
  return json.url as string;
}

/** Consulta o pagamento no Mercado Pago (via servidor) e devolve o status atual do pedido */
export async function checkPaymentStatus(orderId: string): Promise<{ status: OrderStatus; paymentStatus: string | null }> {
  const json = await callPayments(`action=status&orderId=${encodeURIComponent(orderId)}`);
  return { status: json.status as OrderStatus, paymentStatus: (json.paymentStatus as string | null) ?? null };
}

/* ── Leitura de pedidos ────────────────────────────────────── */
export interface OrderRow {
  id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  shipping_method: string;
  shipping_days: number;
  total: number;
  address: Record<string, string>;
  created_at: string;
  paid_at: string | null;
  payment_id: string | null;
  order_items?: { id: string; name: string; unit_price: number; quantity: number }[];
}

export const rowToOrder = (r: OrderRow): Order => ({
  id: r.id,
  status: r.status,
  subtotal: Number(r.subtotal),
  shippingCost: Number(r.shipping_cost),
  shippingMethod: r.shipping_method,
  shippingDays: r.shipping_days,
  total: Number(r.total),
  address: r.address,
  createdAt: r.created_at,
  paidAt: r.paid_at,
  paymentId: r.payment_id,
  items: (r.order_items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
  })),
});

export const useOrder = (orderId: string | undefined, refreshKey = 0) =>
  useQuery({
    queryKey: ["order", orderId, refreshKey],
    enabled: !!orderId,
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId!)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToOrder(data as OrderRow) : null;
    },
  });

export const useOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as OrderRow[]).map(rowToOrder);
    },
  });

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  failed: "Pagamento recusado",
  cancelled: "Cancelado",
};
