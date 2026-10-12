/**
 * Pagamento com Mercado Pago (Checkout Pro) - função serverless da Vercel.
 *
 * Rotas (todas em /api/payments):
 *   POST ?action=create   body {orderId}   -> cria a preferência e devolve a URL de pagamento
 *   GET  ?action=status&orderId=...        -> consulta o pagamento no Mercado Pago e atualiza o pedido
 *   POST ?action=webhook                   -> aviso automático do Mercado Pago
 *   POST ?action=pix_create  body {orderId, cpf} -> gera um Pix (QR Code + copia e cola)
 *   GET  ?action=pix_info&orderId=...      -> devolve o Pix já gerado do pedido
 *
 * Variáveis de ambiente (Vercel > Settings > Environment Variables):
 *   MP_ACCESS_TOKEN            token do Mercado Pago (NUNCA com prefixo VITE_)
 *   SUPABASE_SERVICE_ROLE_KEY  chave service_role do Supabase (NUNCA com prefixo VITE_)
 *   VITE_SUPABASE_URL          (já existe)
 *   MP_USE_SANDBOX             opcional: NÃO use (causa erro no checkout de teste)
 *   MP_PIX_TEST                "true" só em TESTE: envia nome APRO para o Pix ser aprovado sozinho
 *   SITE_URL                   opcional: https://seu-site.vercel.app (senão usa o do navegador)
 */
import { randomUUID } from "node:crypto";
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

async function mpFetch(path: string, init?: { method?: string; body?: unknown; headers?: Record<string, string> }) {
  const r = await fetch(`${MP_API}${path}`, {
    method: init?.method || "GET",
    headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json: json as any };
}

const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(cpf[len])) return false;
  }
  return true;
}

/** Dados do Pix que o front precisa para mostrar o QR Code */
function pixData(payment: any) {
  const td = payment?.point_of_interaction?.transaction_data;
  return {
    paymentId: String(payment?.id ?? ""),
    status: String(payment?.status ?? ""),
    qrCode: (td?.qr_code as string | undefined) ?? null,
    qrCodeBase64: (td?.qr_code_base64 as string | undefined) ?? null,
    expiresAt: (payment?.date_of_expiration as string | undefined) ?? null,
  };
}

const pixIsUsable = (payment: any) => {
  if (!payment || !["pending", "in_process", "approved"].includes(payment.status)) return false;
  const exp = payment.date_of_expiration ? new Date(payment.date_of_expiration).getTime() : Infinity;
  return payment.status === "approved" || exp > Date.now() + 60_000;
};

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
        const causes = Array.isArray(r.json?.cause)
          ? r.json.cause.map((c: any) => c?.description || c?.code).filter(Boolean).join("; ")
          : "";
        const detail = [r.status, r.json?.message || r.json?.error, causes].filter(Boolean).join(" - ");
        return res.status(502).json({
          error: "Não foi possível iniciar o pagamento no Mercado Pago.",
          detail, // ajuda a achar o problema (não contém segredos)
        });
      }

      await db.from("orders").update({ preference_id: r.json.id, payment_provider: "mercadopago" }).eq("id", orderId);
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

    /* ── Pix: gerar QR Code ── */
    if (action === "pix_create" && req.method === "POST") {
      const orderId = String(req.body?.orderId || "");
      const { data: order } = await db.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
      if (order.status !== "pending") return res.status(400).json({ error: "Este pedido já foi finalizado." });

      // reaproveita o Pix anterior se ainda for válido (evita cobranças duplicadas)
      if (order.payment_provider === "mercadopago_pix" && order.payment_id) {
        const prev = await mpFetch(`/v1/payments/${order.payment_id}`);
        if (prev.ok && pixIsUsable(prev.json)) return res.status(200).json(pixData(prev.json));
      }

      const cpf = onlyDigits(req.body?.cpf);
      if (!isValidCpf(cpf)) return res.status(400).json({ error: "CPF inválido." });

      const origin = process.env.SITE_URL || first(req.headers.origin) || `https://${first(req.headers.host) || ""}`;
      const fullName = String(order.address?.recipient_name || "Cliente").trim().split(/\s+/);
      const firstName = fullName[0] || "Cliente";
      const lastName = fullName.slice(1).join(" ") || firstName;
      // 30 minutos de validade, no fuso de Brasília (-03:00)
      const expiration = new Date(Date.now() + 30 * 60_000 - 3 * 3_600_000).toISOString().replace("Z", "-03:00");

      const body: Record<string, unknown> = {
        transaction_amount: Number(order.total),
        description: `Pedido Qwerty ${orderId.slice(0, 8).toUpperCase()}`,
        payment_method_id: "pix",
        external_reference: orderId,
        date_of_expiration: expiration,
        payer: {
          email: user.email,
          // em TESTE o nome "APRO" faz o Mercado Pago aprovar o Pix automaticamente
          first_name: process.env.MP_PIX_TEST === "true" ? "APRO" : firstName,
          last_name: lastName,
          identification: { type: "CPF", number: cpf },
        },
      };
      if (origin.startsWith("https://")) body.notification_url = `${origin}/api/payments?action=webhook`;

      const r = await mpFetch("/v1/payments", { method: "POST", body, headers: { "X-Idempotency-Key": randomUUID() } });
      if (!r.ok) {
        console.error("Erro Mercado Pago (Pix):", r.status, JSON.stringify(r.json));
        const causes = Array.isArray(r.json?.cause)
          ? r.json.cause.map((c: any) => c?.description || c?.code).filter(Boolean).join("; ")
          : "";
        const detail = [r.status, r.json?.message || r.json?.error, causes].filter(Boolean).join(" - ");
        return res.status(502).json({ error: "Não foi possível gerar o Pix.", detail });
      }

      await db.from("orders").update({ payment_provider: "mercadopago_pix", payment_id: String(r.json.id) }).eq("id", orderId);
      return res.status(200).json(pixData(r.json));
    }

    /* ── Pix: consultar o QR Code já gerado ── */
    if (action === "pix_info" && req.method === "GET") {
      const orderId = String(first(req.query.orderId) || "");
      const { data: order } = await db.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order || order.payment_provider !== "mercadopago_pix" || !order.payment_id) {
        return res.status(404).json({ error: "Este pedido não tem Pix gerado." });
      }
      const p = await mpFetch(`/v1/payments/${order.payment_id}`);
      if (!p.ok) return res.status(502).json({ error: "Não foi possível consultar o Pix." });
      await markPaidIfApproved(p.json);
      return res.status(200).json(pixData(p.json));
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    console.error("Erro em /api/payments:", err);
    return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
  }
}
