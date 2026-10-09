/**
 * Pagamento com Mercado Pago (Checkout Pro) - função serverless da Vercel.
 *
 * Rotas (todas em /api/payments):
 *   POST ?action=create   body {orderId}   -> cria a preferência e devolve a URL de pagamento
 *   GET  ?action=status&orderId=...        -> consulta o pagamento no Mercado Pago e atualiza o pedido
 *   POST ?action=webhook                   -> aviso automático do Mercado Pago
 *
 * Variáveis de ambiente (Vercel > Settings > Environment Variables):
 *   MP_ACCESS_TOKEN            token do Mercado Pago (NUNCA com prefixo VITE_)
 *   SUPABASE_SERVICE_ROLE_KEY  chave service_role do Supabase (NUNCA com prefixo VITE_)
 *   VITE_SUPABASE_URL          (já existe)
 *   MP_USE_SANDBOX             opcional: "true" usa o link de sandbox
 *   SITE_URL                   opcional: https://seu-site.vercel.app (senão usa o do navegador)
 */
import { createClient } from "@supabase/supabase-js";

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: any;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const MP_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_API = "https://api.mercadopago.com";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function getUser(req: Req) {
  const header = first(req.headers.authorization) || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error || !data.user ? null : data.user;
}

async function mpFetch(path: string, init?: { method?: string; body?: unknown }) {
  const r = await fetch(`${MP_API}${path}`, {
    method: init?.method || "GET",
    headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json: json as any };
}

/** Marca o pedido como pago SOMENTE se o Mercado Pago confirmar e o valor bater. */
async function markPaidIfApproved(payment: any): Promise<boolean> {
  if (!payment || payment.status !== "approved") return false;
  const orderId = String(payment.external_reference || "");
  if (!orderId) return false;

  const db = admin();
  const { data: order } = await db.from("orders").select("id, total, status").eq("id", orderId).maybeSingle();
  if (!order || order.status === "paid") return !!order;

  if (Math.abs(Number(payment.transaction_amount) - Number(order.total)) > 0.01) {
    console.error("Valor pago diferente do pedido", orderId, payment.transaction_amount, order.total);
    return false;
  }
  const { error } = await db
    .from("orders")
    .update({ status: "paid", payment_id: String(payment.id), paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");
  return !error;
}

export default async function handler(req: Req, res: Res) {
  try {
    const action = first(req.query.action);

    if (!SUPABASE_URL || !SERVICE_KEY || !MP_TOKEN) {
      return res.status(500).json({ error: "Servidor sem configuração de pagamento (variáveis de ambiente)." });
    }

    /* ── Webhook do Mercado Pago (sem login: confirmamos consultando a API deles) ── */
    if (action === "webhook") {
      const paymentId = first(req.query["data.id"]) || req.body?.data?.id;
      const type = first(req.query.type) || req.body?.type;
      if (paymentId && (!type || type === "payment")) {
        const p = await mpFetch(`/v1/payments/${paymentId}`);
        if (p.ok) await markPaidIfApproved(p.json);
      }
      return res.status(200).json({ ok: true });
    }

    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Faça login para continuar." });
    const db = admin();

    /* ── Criar pagamento ── */
    if (action === "create" && req.method === "POST") {
      const orderId = String(req.body?.orderId || "");
      const { data: order } = await db.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
      if (order.status !== "pending") return res.status(400).json({ error: "Este pedido já foi finalizado." });

      const { data: items } = await db.from("order_items").select("*").eq("order_id", orderId);
      if (!items || items.length === 0) return res.status(400).json({ error: "Pedido sem itens." });

      const origin =
        process.env.SITE_URL || first(req.headers.origin) || `https://${first(req.headers.host) || ""}`;
      const isHttps = origin.startsWith("https://");
      const back = `${origin}/pedido/${orderId}`;

      const mpItems = items.map((i: any) => ({
        id: String(i.item_id).slice(0, 100),
        title: String(i.name).slice(0, 250),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        currency_id: "BRL",
      }));
      if (Number(order.shipping_cost) > 0) {
        mpItems.push({
          id: "frete",
          title: `Frete (${order.shipping_method})`,
          quantity: 1,
          unit_price: Number(order.shipping_cost),
          currency_id: "BRL",
        });
      }

      const preference: Record<string, unknown> = {
        items: mpItems,
        payer: { email: user.email },
        external_reference: orderId,
        back_urls: { success: back, failure: back, pending: back },
        statement_descriptor: "QWERTY",
      };
      if (isHttps) {
        preference.auto_return = "approved"; // exige URL https
        preference.notification_url = `${origin}/api/payments?action=webhook`;
      }

      const r = await mpFetch("/checkout/preferences", { method: "POST", body: preference });
      if (!r.ok) {
        console.error("Erro Mercado Pago:", r.status, JSON.stringify(r.json));
        return res.status(502).json({ error: "Não foi possível iniciar o pagamento no Mercado Pago." });
      }

      await db.from("orders").update({ preference_id: r.json.id }).eq("id", orderId);
      const url = process.env.MP_USE_SANDBOX === "true" ? r.json.sandbox_init_point : r.json.init_point;
      return res.status(200).json({ url: url || r.json.init_point });
    }

    /* ── Consultar status (chamado pela página do pedido) ── */
    if (action === "status" && req.method === "GET") {
      const orderId = String(first(req.query.orderId) || "");
      const { data: order } = await db.from("orders").select("id, status").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

      let status = order.status as string;
      let paymentStatus: string | null = null;

      if (status === "pending") {
        const r = await mpFetch(
          `/v1/payments/search?external_reference=${encodeURIComponent(orderId)}&sort=date_created&criteria=desc`,
        );
        const results: any[] = r.ok && Array.isArray(r.json.results) ? r.json.results : [];
        paymentStatus = results[0]?.status ?? null;
        const approved = results.find((p) => p.status === "approved");
        if (approved && (await markPaidIfApproved(approved))) status = "paid";
      }
      return res.status(200).json({ status, paymentStatus });
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    console.error("Erro em /api/payments:", err);
    return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
  }
}
