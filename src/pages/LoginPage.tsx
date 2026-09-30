import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, register } = useAuth();
  const navigate = useNavigate();

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

    const success = isRegister
      ? await register(form.email, form.password, form.name)
      : await login(form.email, form.password);

    if (success) {
      toast.success(isRegister ? "Conta Criada!" : "Bem vindo de volta!");
      navigate("/dashboard");
    }
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
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none"
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
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none"
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
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none"
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
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background outline-none"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button"
            >
              {isRegister ? "Criar Conta" : "Entrar"}
            </motion.button>
          </form>

          <p className="text-sm text-center mt-6 text-foreground">
            {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button onClick={() => { setIsRegister(!isRegister); setErrors({}); }} className="text-primary font-medium hover:underline">
              {isRegister ? "Entrar" : "Crie aqui!"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
