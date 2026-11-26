import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Name is required").max(100),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

const inputClass =
  "w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none";

type View = "form" | "otpEmail" | "code";

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, register, sendLoginCode, resendSignupCode, verifyCode } = useAuth();
  const navigate = useNavigate();

  // verificação por código enviado ao e-mail
  const [view, setView] = useState<View>("form");
  const [codeFor, setCodeFor] = useState<{ email: string; kind: "signup" | "login" } | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  // contagem regressiva para poder reenviar o código (o Supabase limita a 1 pedido por minuto)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const openCodeStep = (email: string, kind: "signup" | "login") => {
    setCodeFor({ email, kind });
    setCode("");
    setErrors({});
    setCooldown(60);
    setView("code");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const schema = isRegister ? registerSchema : loginSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (isRegister) {
      setBusy(true);
      const status = await register(form.email, form.password, form.name);
      setBusy(false);
      if (status === "needs_code") {
        toast.info("Enviamos um código de segurança para o seu e-mail.");
        openCodeStep(form.email.trim(), "signup");
      } else if (status === "signed_in") {
        toast.success("Conta Criada!");
        navigate("/dashboard");
      }
      return;
    }

    if (await login(form.email, form.password)) {
      toast.success("Bem vindo de volta!");
      navigate("/dashboard");
    }
  };

  const handleSendLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(form.email);
    if (!parsed.success) {
      setErrors({ email: "Informe um e-mail válido." });
      return;
    }
    setBusy(true);
    const ok = await sendLoginCode(parsed.data);
    setBusy(false);
    if (ok) {
      toast.info("Enviamos um código para o seu e-mail.");
      openCodeStep(parsed.data, "login");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeFor) return;
    if (!/^\d{6,8}$/.test(code)) {
      setErrors({ code: "Digite o código de 6 a 8 números que chegou no seu e-mail." });
      return;
    }
    setErrors({});
    setBusy(true);
    const ok = await verifyCode(codeFor.email, code);
    setBusy(false);
    if (ok) {
      toast.success(codeFor.kind === "signup" ? "E-mail confirmado! Conta criada." : "Bem vindo de volta!");
      navigate("/dashboard");
    }
  };

  const handleResend = async () => {
    if (!codeFor || cooldown > 0) return;
    setBusy(true);
    const ok = codeFor.kind === "signup" ? await resendSignupCode(codeFor.email) : await sendLoginCode(codeFor.email);
    setBusy(false);
    if (ok) {
      toast.success("Novo código enviado!");
      setCooldown(60);
    }
  };

  const backToForm = () => {
    setView("form");
    setCodeFor(null);
    setCode("");
    setErrors({});
  };

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-lg shadow-card p-8">
          {/* ── Passo: digitar o código recebido por e-mail ── */}
          {view === "code" && codeFor && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center">
                <MailCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="text-2xl font-bold tracking-tight mb-2">Digite o código</h1>
                <p className="text-sm text-foreground">
                  Enviamos um código de segurança para <strong className="text-foreground-strong">{codeFor.email}</strong>.
                  Ele vale por 1 hora.
                </p>
              </div>

              <div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="000000"
                  aria-label="Código de segurança"
                  className={`${inputClass} text-center text-2xl tracking-[0.4em] font-semibold`}
                />
                {errors.code && <p className="text-destructive text-xs mt-1">{errors.code}</p>}
              </div>

              <motion.button
                type="submit"
                disabled={busy}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button disabled:opacity-50"
              >
                {busy ? "Verificando..." : "Verificar código"}
              </motion.button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={backToForm} className="text-foreground hover:text-primary">
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || busy}
                  className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Reenviar código em ${cooldown}s` : "Reenviar código"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Não chegou? Veja também a caixa de spam.</p>
            </form>
          )}

          {/* ── Passo: pedir um código para entrar sem senha ── */}
          {view === "otpEmail" && (
            <form onSubmit={handleSendLoginCode} className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Entrar com código</h1>
                <p className="text-sm text-foreground">Informe seu e-mail e enviaremos um código de acesso.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-strong block mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass}
                  placeholder="voce@exemplo.com"
                  autoFocus
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button disabled:opacity-50"
              >
                {busy ? "Enviando..." : "Enviar código"}
              </motion.button>
              <button type="button" onClick={backToForm} className="block mx-auto text-sm text-foreground hover:text-primary">
                Voltar para entrar com senha
              </button>
            </form>
          )}

          {/* ── Login / cadastro com senha ── */}
          {view === "form" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
                {isRegister ? "Criar Conta" : "Bem vindo de volta!"}
              </h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="text-sm font-medium text-foreground-strong block mb-1">Nome</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={inputClass}
                      placeholder="Seu nome"
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground-strong block mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass}
                    placeholder="voce@exemplo.com"
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground-strong block mb-1">Senha</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                </div>

                {isRegister && (
                  <div>
                    <label className="text-sm font-medium text-foreground-strong block mb-1">Confirme a Senha</label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={busy}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button disabled:opacity-50"
                >
                  {isRegister ? (busy ? "Criando..." : "Criar Conta") : "Entrar"}
                </motion.button>
              </form>

              {!isRegister && (
                <button
                  type="button"
                  onClick={() => { setErrors({}); setView("otpEmail"); }}
                  className="block mx-auto mt-4 text-sm text-primary font-medium hover:underline"
                >
                  Entrar com código enviado por e-mail
                </button>
              )}

              <p className="text-sm text-center mt-6 text-foreground">
                {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <button onClick={() => { setIsRegister(!isRegister); setErrors({}); }} className="text-primary font-medium hover:underline">
                  {isRegister ? "Entrar" : "Crie aqui!"}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
