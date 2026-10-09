import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isPaidStatus, useOrder } from "@/api/checkout";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatCep = (c: string) => (c && c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : c);
const formatPhone = (p: string) => {
  const d = (p ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
};

// Na impressão, só a nota aparece (sem menu, rodapé nem botões)
const printCss = `
@media print {
  body * { visibility: hidden !important; }
  .invoice-sheet, .invoice-sheet * { visibility: visible !important; }
  .invoice-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
  @page { margin: 12mm; }
}
`;

const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { data: order, isLoading } = useOrder(user ? id : undefined);

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-foreground mb-6">Entre na sua conta para ver a nota.</p>
        <Link to="/login" className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
          Entrar
        </Link>
      </div>
    );
  }
  if (isLoading) return <p className="container mx-auto px-4 py-32 text-center text-foreground">Carregando nota...</p>;
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-foreground mb-6">Pedido não encontrado.</p>
        <Link to="/dashboard" className="text-primary font-semibold hover:underline">Ir para o painel</Link>
      </div>
    );
  }
  if (!isPaidStatus(order.status)) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-foreground mb-6">A nota de compra fica disponível depois que o pagamento for confirmado.</p>
        <Link to={`/pedido/${order.id}`} className="text-primary font-semibold hover:underline">Voltar ao pedido</Link>
      </div>
    );
  }

  const a = order.address;
  const number = order.id.slice(0, 8).toUpperCase();
  const issuedAt = order.paidAt ?? order.createdAt;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <style>{printCss}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link to={`/pedido/${order.id}`} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao pedido
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button"
        >
          <Printer className="h-4 w-4" /> Imprimir / Salvar em PDF
        </button>
      </div>

      {/* A nota usa cores fixas (fundo branco) para imprimir bem em qualquer tema */}
      <article className="invoice-sheet bg-white text-neutral-900 rounded-lg shadow-card border border-neutral-200 p-8 text-sm">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-300 pb-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QWERTY</h1>
            <p className="text-neutral-600">Teclados mecânicos personalizados</p>
            <p className="text-xs text-neutral-500 mt-1">Projeto acadêmico (TCC) · CNPJ: não aplicável</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Nota de compra</p>
            <p className="text-xl font-bold">Nº {number}</p>
            <p className="text-neutral-600">Emitida em {dateTime(issuedAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">Cliente</h2>
            <p className="font-medium">{a.recipient_name}</p>
            <p className="text-neutral-600">{user.email}</p>
            {a.phone && <p className="text-neutral-600">{formatPhone(a.phone)}</p>}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">Endereço de entrega</h2>
            <p>
              {a.street}, {a.number}
              {a.complement ? ` - ${a.complement}` : ""}
            </p>
            <p className="text-neutral-600">{a.neighborhood}</p>
            <p className="text-neutral-600">
              {a.city}/{a.state} · CEP {formatCep(a.cep)}
            </p>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Itens</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="py-2 pr-2 font-semibold">Descrição</th>
                <th className="py-2 px-2 font-semibold text-center">Qtd</th>
                <th className="py-2 px-2 font-semibold text-right">Valor unit.</th>
                <th className="py-2 pl-2 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-neutral-200">
                  <td className="py-2 pr-2">{i.name}</td>
                  <td className="py-2 px-2 text-center tabular-nums">{i.quantity}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{brl(i.unitPrice)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{brl(i.unitPrice * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="ml-auto w-full sm:w-72 space-y-1 mb-5">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span className="tabular-nums">{brl(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">
              Frete ({order.shippingMethod}, até {order.shippingDays} dias úteis)
            </span>
            <span className="tabular-nums">{brl(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-bold">
            <span>Total pago</span>
            <span className="tabular-nums">{brl(order.total)}</span>
          </div>
        </section>

        <section className="border-t border-neutral-300 pt-4 mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">Pagamento</h2>
          <p>Mercado Pago · Status: Pago{order.paidAt ? ` em ${dateTime(order.paidAt)}` : ""}</p>
          {order.paymentId && <p className="text-neutral-600">ID do pagamento: {order.paymentId}</p>}
        </section>

        <footer className="border-t border-neutral-300 pt-3 text-xs text-neutral-500">
          Documento gerado pelo sistema Qwerty para fins acadêmicos. <strong>Não possui valor fiscal</strong> e não substitui a
          Nota Fiscal Eletrônica (NF-e). Pagamento realizado em ambiente de testes.
        </footer>
      </article>
    </div>
  );
};

export default InvoicePage;
