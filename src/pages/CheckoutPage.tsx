import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CreditCard, MapPin, Plus, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  createOrder,
  lookupCep,
  startPayment,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useShippingOptions,
  type NewAddress,
} from "@/api/checkout";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const inputClass =
  "w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring outline-none";

const emptyAddress: NewAddress = {
  recipientName: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const formatCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/* ── Formulário de novo endereço ───────────────────────────── */
const AddressForm = ({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (a: NewAddress) => void;
  onCancel?: () => void;
  saving: boolean;
}) => {
  const [form, setForm] = useState<NewAddress>(emptyAddress);
  const [cepLoading, setCepLoading] = useState(false);

  const set = (field: keyof NewAddress, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleCep = async (value: string) => {
    const masked = formatCep(value);
    set("cep", masked);
    if (masked.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      const result = await lookupCep(masked);
      setCepLoading(false);
      if (result) {
        setForm((f) => ({ ...f, ...result }));
      } else {
        toast.error("CEP não encontrado. Preencha o endereço manualmente.");
      }
    }
  };

  const handleSubmit = () => {
    const cep = form.cep.replace(/\D/g, "");
    const phone = form.phone.replace(/\D/g, "");
    const state = form.state.trim().toUpperCase();
    if (!form.recipientName.trim()) return toast.error("Informe o nome de quem vai receber.");
    if (phone.length < 10) return toast.error("Informe um telefone com DDD.");
    if (cep.length !== 8) return toast.error("Informe um CEP válido.");
    if (!form.street.trim() || !form.number.trim() || !form.neighborhood.trim() || !form.city.trim()) {
      return toast.error("Preencha rua, número, bairro e cidade.");
    }
    if (!/^[A-Z]{2}$/.test(state)) return toast.error("Informe a UF com 2 letras (ex.: SP).");
    onSave({
      ...form,
      recipientName: form.recipientName.trim(),
      phone,
      cep,
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={inputClass} placeholder="Nome de quem recebe" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} maxLength={100} />
        <input className={inputClass} placeholder="Telefone com DDD" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} inputMode="tel" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={inputClass} placeholder="CEP" value={form.cep} onChange={(e) => handleCep(e.target.value)} inputMode="numeric" />
        <input className={`${inputClass} sm:col-span-2`} placeholder={cepLoading ? "Buscando endereço..." : "Rua / Avenida"} value={form.street} onChange={(e) => set("street", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={inputClass} placeholder="Número" value={form.number} onChange={(e) => set("number", e.target.value)} maxLength={10} />
        <input className={`${inputClass} sm:col-span-2`} placeholder="Complemento (opcional)" value={form.complement} onChange={(e) => set("complement", e.target.value)} maxLength={60} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input className={`${inputClass} sm:col-span-2`} placeholder="Bairro" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
        <input className={inputClass} placeholder="Cidade" value={form.city} onChange={(e) => set("city", e.target.value)} />
        <input className={inputClass} placeholder="UF" value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-button disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar endereço"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-accent text-foreground-strong text-sm font-semibold rounded-md border border-border">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Página ────────────────────────────────────────────────── */
const CheckoutPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { items, totalPrice } = useCart();

  const { data: addresses = [], isLoading: loadingAddresses } = useAddresses(user?.id);
  const createAddress = useCreateAddress(user?.id);
  const deleteAddress = useDeleteAddress(user?.id);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const address = useMemo(() => addresses.find((a) => a.id === addressId) ?? null, [addresses, addressId]);
  const { data: shippingOptions = [], isLoading: loadingShipping } = useShippingOptions(address?.state);
  const shipping = shippingOptions.find((o) => o.method === shippingMethod) ?? null;

  // seleciona o primeiro endereço salvo automaticamente
  useEffect(() => {
    if (!addressId && addresses.length > 0) setAddressId(addresses[0].id);
    if (addressId && !addresses.some((a) => a.id === addressId)) setAddressId(addresses[0]?.id ?? null);
  }, [addresses, addressId]);

  // seleciona a opção de frete mais barata quando o endereço muda
  useEffect(() => {
    if (shippingOptions.length > 0 && !shippingOptions.some((o) => o.method === shippingMethod)) {
      setShippingMethod(shippingOptions[0].method);
    }
    if (shippingOptions.length === 0) setShippingMethod(null);
  }, [shippingOptions, shippingMethod]);

  const handleSaveAddress = (a: NewAddress) => {
    createAddress.mutate(a, {
      onSuccess: (saved) => {
        setAddressId(saved.id);
        setShowForm(false);
        toast.success("Endereço salvo!");
      },
      onError: () => toast.error("Não foi possível salvar o endereço."),
    });
  };

  const handlePay = async () => {
    if (!address || !shipping) return;
    setPaying(true);
    try {
      const orderId = await createOrder(address.id, shipping.method);
      const url = await startPayment(orderId);
      window.location.href = url; // vai para o Mercado Pago
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
      setPaying(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Entre para finalizar a compra</h1>
        <p className="text-foreground mb-8">Seu carrinho será mantido depois do login.</p>
        <Link to="/login" className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
          Entrar ou criar conta
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Seu carrinho está vazio</h1>
        <Link to="/products" className="inline-flex mt-6 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
          Ver produtos
        </Link>
      </div>
    );
  }

  const estimatedTotal = totalPrice + (shipping?.price ?? 0);
  const noAddress = !loadingAddresses && addresses.length === 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-8">Finalizar compra</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* 1. Endereço */}
          <section className="bg-card rounded-lg shadow-card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> 1. Endereço de entrega
            </h2>

            {loadingAddresses && <p className="text-sm text-muted-foreground">Carregando endereços...</p>}

            {!noAddress && (
              <div className="space-y-2 mb-4">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      a.id === addressId ? "border-primary bg-primary/10" : "border-border bg-accent"
                    }`}
                  >
                    <input type="radio" name="address" className="mt-1" checked={a.id === addressId} onChange={() => setAddressId(a.id)} />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground-strong">{a.recipientName}</p>
                      <p className="text-foreground">
                        {a.street}, {a.number}
                        {a.complement ? ` - ${a.complement}` : ""} · {a.neighborhood}
                      </p>
                      <p className="text-muted-foreground">
                        {a.city}/{a.state} · CEP {formatCep(a.cep)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteAddress.mutate(a.id, { onError: () => toast.error("Não foi possível remover.") });
                      }}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                      aria-label="Remover endereço"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </label>
                ))}
              </div>
            )}

            {(showForm || noAddress) && (
              <AddressForm
                onSave={handleSaveAddress}
                saving={createAddress.isPending}
                onCancel={noAddress ? undefined : () => setShowForm(false)}
              />
            )}

            {!showForm && !noAddress && (
              <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                <Plus className="h-4 w-4" /> Adicionar outro endereço
              </button>
            )}
          </section>

          {/* 2. Frete */}
          <section className="bg-card rounded-lg shadow-card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> 2. Frete
            </h2>
            {!address && <p className="text-sm text-muted-foreground">Selecione ou cadastre um endereço para ver as opções.</p>}
            {address && loadingShipping && <p className="text-sm text-muted-foreground">Calculando frete...</p>}
            {address && !loadingShipping && shippingOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">Não há opções de frete para a UF {address.state}.</p>
            )}
            <div className="space-y-2">
              {shippingOptions.map((o) => (
                <label
                  key={o.method}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    o.method === shippingMethod ? "border-primary bg-primary/10" : "border-border bg-accent"
                  }`}
                >
                  <input type="radio" name="shipping" checked={o.method === shippingMethod} onChange={() => setShippingMethod(o.method)} />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-foreground-strong">{o.label}</p>
                    <p className="text-muted-foreground">Entrega em até {o.days} dias úteis</p>
                  </div>
                  <span className="font-semibold tabular-nums text-sm">{brl(o.price)}</span>
                </label>
              ))}
            </div>
            {address && shippingOptions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">Valores e prazos simulados por região (projeto acadêmico).</p>
            )}
          </section>
        </div>

        {/* 3. Resumo e pagamento */}
        <aside className="bg-card rounded-lg shadow-card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> 3. Resumo
          </h2>
          <ul className="space-y-2 mb-4 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-foreground truncate">
                  {i.quantity}× {i.name}
                </span>
                <span className="tabular-nums shrink-0">{brl(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{brl(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Frete{shipping ? ` (${shipping.label})` : ""}</span>
              <span className="tabular-nums">{shipping ? brl(shipping.price) : "—"}</span>
            </div>
            <div className="flex justify-between text-foreground-strong font-semibold text-base pt-1">
              <span>Total</span>
              <span className="tabular-nums">{brl(estimatedTotal)}</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePay}
            disabled={!address || !shipping || paying}
            className="w-full mt-5 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {paying ? "Redirecionando..." : "Pagar com Mercado Pago"}
          </motion.button>
          <p className="text-xs text-muted-foreground mt-3">
            Você será levado ao ambiente seguro do Mercado Pago. O valor final é confirmado pelo servidor.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
