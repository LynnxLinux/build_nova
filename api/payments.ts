/**
 * Pagamento com Mercado Pago (Checkout Pro) - função serverless da Vercel.
 *
 * Rotas (todas em /api/payments):
 *   POST ?action=create   body {orderId}   -> cria a preferência e devolve a URL de pagamento
 *   GET  ?action=status&orderId=...        -> consulta o pagamento no Mercado Pago e atualiza o pedido
 *   POST ?action=webhook                   -> aviso automático do Mercado Pago
 *   GET  ?action=config                    -> informa se o Pix de demonstração está ligado
 *   POST ?action=pix_confirm body {orderId} -> (só no modo demonstração) simula a confirmação do Pix
 *   POST ?action=pix_create  body {orderId, cpf} -> gera um Pix (QR Code + copia e cola)
 *   GET  ?action=pix_info&orderId=...      -> devolve o Pix já gerado do pedido
 *
 * Variáveis de ambiente (Vercel > Settings > Environment Variables):
 *   MP_ACCESS_TOKEN            token do Mercado Pago (NUNCA com prefixo VITE_)
 *   SUPABASE_SERVICE_ROLE_KEY  chave service_role do Supabase (NUNCA com prefixo VITE_)
 *   VITE_SUPABASE_URL          (já existe)
 *   MP_USE_SANDBOX             opcional: NÃO use (causa erro no checkout de teste)
 *   PIX_DEMO                  "true" liga o Pix de DEMONSTRAÇÃO (simulado, sem dinheiro). NUNCA use em produção real
 *   MP_PIX_TEST                "true" só em TESTE: envia nome APRO para o Pix ser aprovado sozinho
 *   MP_PIX_ACCESS_TOKEN        opcional: token só para o Pix (se não existir, usa o MP_ACCESS_TOKEN)
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
// Pix pode usar outro token (ex.: credenciais de teste); se não existir, usa o mesmo do cartão
const MP_PIX_TOKEN = process.env.MP_PIX_ACCESS_TOKEN || MP_TOKEN;
const MP_API = "https://api.mercadopago.com";
const PIX_DEMO = process.env.PIX_DEMO === "true";

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

async function mpFetch(
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string>; token?: string },
) {
  const r = await fetch(`${MP_API}${path}`, {
    method: init?.method || "GET",
    headers: { Authorization: `Bearer ${init?.token || MP_TOKEN}`, "Content-Type": "application/json", ...(init?.headers || {}) },
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

/**
 * Pix usa a Orders API do Mercado Pago (/v1/orders).
 * Status da order do MP -> status usado pelo nosso front:
 *   created / action_required -> "pending" (aguardando o pagamento)
 *   processed                 -> "approved" (pago)
 *   outros (expired, canceled, failed...) -> repassados (o front trata como expirado)
 */
function pixData(mpOrder: any) {
  const payment = mpOrder?.transactions?.payments?.[0];
  const method = payment?.payment_method;
  const raw = String(mpOrder?.status ?? "");
  const status = raw === "processed" ? "approved" : raw === "action_required" || raw === "created" || raw === "" ? "pending" : raw;
  const created = mpOrder?.created_date ? new Date(mpOrder.created_date).getTime() : NaN;
  return {
    paymentId: String(mpOrder?.id ?? ""),
    status,
    qrCode: (method?.qr_code as string | undefined) || null,
    qrCodeBase64: (method?.qr_code_base64 as string | undefined) || null,
    ticketUrl: (method?.ticket_url as string | undefined) || null,
    expiresAt: Number.isFinite(created) ? new Date(created + 30 * 60_000).toISOString() : null,
  };
}

const pixIsUsable = (mpOrder: any) => {
  const d = pixData(mpOrder);
  if (d.status === "approved") return true;
  if (d.status !== "pending") return false;
  return !d.expiresAt || new Date(d.expiresAt).getTime() > Date.now() + 60_000;
};

/** Marca o pedido como pago se a order de Pix do Mercado Pago estiver "processed" e o valor bater. */
async function markPaidIfOrderProcessed(mpOrder: any): Promise<boolean> {
  if (!mpOrder || mpOrder.status !== "processed") return false;
  const orderId = String(mpOrder.external_reference || "");
  if (!orderId) return false;

  const db = admin();
  const { data: order } = await db.from("orders").select("id, total, status").eq("id", orderId).maybeSingle();
  if (!order || order.status !== "pending") return !!order;

  if (Math.abs(Number(mpOrder.total_amount) - Number(order.total)) > 0.01) {
    console.error("Valor do Pix diferente do pedido", orderId, mpOrder.total_amount, order.total);
    return false;
  }
  const { error } = await db
    .from("orders")
    .update({ status: "paid", payment_id: String(mpOrder.id), paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");
  return !error;
}

/* ── Pix de DEMONSTRAÇÃO: gera um código "copia e cola" de exemplo (não move dinheiro) ── */
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
const tlv = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;

function demoBrCode(orderId: string, amount: number): string {
  // chave ".invalid" nunca existe: se alguém tentar pagar de verdade, o banco recusa
  const account = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", "demo@qwerty.invalid") + tlv("02", "PIX DEMONSTRACAO"));
  const payload =
    tlv("00", "01") +
    tlv("01", "12") +
    account +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", "QWERTY DEMO") +
    tlv("60", "SAO PAULO") +
    tlv("62", tlv("05", orderId.replace(/-/g, "").slice(0, 25))) +
    "6304";
  return payload + crc16(payload);
}

const demoPixData = (orderId: string, total: number) => ({
  paymentId: `DEMO-${orderId.slice(0, 8).toUpperCase()}`,
  status: "pending",
  qrCode: demoBrCode(orderId, total),
  qrCodeBase64: null,
  ticketUrl: null,
  expiresAt: null,
  demo: true,
});

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

    if (action === "config") return res.status(200).json({ pixDemo: PIX_DEMO });

    if (!SUPABASE_URL || !SERVICE_KEY || !MP_TOKEN) {
      return res.status(500).json({ error: "Servidor sem configuração de pagamento (variáveis de ambiente)." });
    }

    /* ── Webhook do Mercado Pago (sem login: confirmamos consultando a API deles) ── */
    if (action === "webhook") {
      const dataId = first(req.query["data.id"]) || req.body?.data?.id;
      const type = first(req.query.type) || req.body?.type;
      if (dataId && type === "order") {
        const o = await mpFetch(`/v1/orders/${dataId}`, { token: MP_PIX_TOKEN });
        if (o.ok) await markPaidIfOrderProcessed(o.json);
      } else if (dataId && (!type || type === "payment")) {
        const p = await mpFetch(`/v1/payments/${dataId}`);
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
      const { data: order } = await db
        .from("orders")
        .select("id, status, payment_provider, payment_id")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

      let status = order.status as string;
      let paymentStatus: string | null = null;

      if (status === "pending" && order.payment_provider === "pix_demo") {
        paymentStatus = "pending"; // Pix de demonstração: só muda pela confirmação simulada
      } else if (status === "pending" && order.payment_provider === "mercadopago_pix" && order.payment_id) {
        const o = await mpFetch(`/v1/orders/${order.payment_id}`, { token: MP_PIX_TOKEN });
        if (o.ok) {
          paymentStatus = pixData(o.json).status;
          if (await markPaidIfOrderProcessed(o.json)) status = "paid";
        }
      } else if (status === "pending") {
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

    /* ── Pix: gerar QR Code (Orders API) ── */
    if (action === "pix_create" && req.method === "POST") {
      const orderId = String(req.body?.orderId || "");
      const { data: order } = await db.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
      if (order.status !== "pending") return res.status(400).json({ error: "Este pedido já foi finalizado." });

      // MODO DEMONSTRAÇÃO: Pix simulado, sem falar com o Mercado Pago
      if (PIX_DEMO) {
        const demo = demoPixData(orderId, Number(order.total));
        await db.from("orders").update({ payment_provider: "pix_demo", payment_id: demo.paymentId }).eq("id", orderId);
        return res.status(200).json(demo);
      }

      // reaproveita o Pix anterior se ainda for válido (evita cobranças duplicadas)
      if (order.payment_provider === "mercadopago_pix" && order.payment_id) {
        const prev = await mpFetch(`/v1/orders/${order.payment_id}`, { token: MP_PIX_TOKEN });
        if (prev.ok && pixIsUsable(prev.json)) {
          await markPaidIfOrderProcessed(prev.json);
          return res.status(200).json(pixData(prev.json));
        }
      }

      const cpf = onlyDigits(req.body?.cpf);
      if (!isValidCpf(cpf)) return res.status(400).json({ error: "CPF inválido." });

      const fullName = String(order.address?.recipient_name || "Cliente").trim().split(/\s+/);
      const firstName = fullName[0] || "Cliente";
      const lastName = fullName.slice(1).join(" ") || firstName;
      const amount = Number(order.total).toFixed(2);

      const body = {
        type: "online",
        processing_mode: "automatic",
        external_reference: orderId,
        total_amount: amount,
        payer: {
          email: user.email,
          // em TESTE o nome "APRO" faz o Mercado Pago aprovar o Pix automaticamente
          first_name: process.env.MP_PIX_TEST === "true" ? "APRO" : firstName,
          last_name: lastName,
          identification: { type: "CPF", number: cpf },
        },
        transactions: {
          payments: [
            {
              amount,
              payment_method: { id: "pix", type: "bank_transfer" },
              expiration_time: "PT30M", // 30 minutos
            },
          ],
        },
      };

      const r = await mpFetch("/v1/orders", {
        method: "POST",
        body,
        token: MP_PIX_TOKEN,
        headers: { "X-Idempotency-Key": randomUUID() },
      });
      if (!r.ok) {
        console.error("Erro Mercado Pago (Pix):", r.status, JSON.stringify(r.json));
        const errs = Array.isArray(r.json?.errors)
          ? r.json.errors.map((e: any) => e?.message || e?.code).filter(Boolean).join("; ")
          : Array.isArray(r.json?.cause)
            ? r.json.cause.map((c: any) => c?.description || c?.code).filter(Boolean).join("; ")
            : "";
        const detail = [r.status, r.json?.message || r.json?.error, errs].filter(Boolean).join(" - ");
        return res.status(502).json({ error: "Não foi possível gerar o Pix.", detail });
      }

      await db.from("orders").update({ payment_provider: "mercadopago_pix", payment_id: String(r.json.id) }).eq("id", orderId);
      return res.status(200).json(pixData(r.json));
    }

    /* ── Pix de demonstração: simular a confirmação do pagamento ── */
    if (action === "pix_confirm" && req.method === "POST") {
      if (!PIX_DEMO) return res.status(403).json({ error: "Modo demonstração desativado." });
      const orderId = String(req.body?.orderId || "");
      const { data: order } = await db.from("orders").select("id, status, payment_provider").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (!order || order.payment_provider !== "pix_demo") return res.status(404).json({ error: "Pedido de demonstração não encontrado." });
      if (order.status !== "pending") return res.status(200).json({ ok: true });
      const { error } = await db
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("status", "pending");
      if (error) return res.status(500).json({ error: "Não foi possível confirmar." });
      return res.status(200).json({ ok: true });
    }

    /* ── Pix: consultar o QR Code já gerado ── */
    if (action === "pix_info" && req.method === "GET") {
      const orderId = String(first(req.query.orderId) || "");
      const { data: order } = await db.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (order?.payment_provider === "pix_demo") return res.status(200).json(demoPixData(order.id, Number(order.total)));
      if (!order || order.payment_provider !== "mercadopago_pix" || !order.payment_id) {
        return res.status(404).json({ error: "Este pedido não tem Pix gerado." });
      }
      const o = await mpFetch(`/v1/orders/${order.payment_id}`, { token: MP_PIX_TOKEN });
      if (!o.ok) return res.status(502).json({ error: "Não foi possível consultar o Pix." });
      await markPaidIfOrderProcessed(o.json);
      return res.status(200).json(pixData(o.json));
    }

    return res.status(400).json({ error: "Ação inválida." });
  } catch (err) {
    console.error("Erro em /api/payments:", err);
    return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
  }
}
