import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** true enquanto o app ainda está verificando se existe sessão salva */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  /** "signed_in": já entrou · "needs_code": enviamos um código ao e-mail para confirmar · "error" */
  register: (email: string, password: string, name: string) => Promise<"signed_in" | "needs_code" | "error">;
  /** Envia um código de acesso por e-mail (entrar sem senha) */
  sendLoginCode: (email: string) => Promise<boolean>;
  /** Reenvia o código de confirmação do cadastro */
  resendSignupCode: (email: string) => Promise<boolean>;
  /** Confere o código digitado e cria a sessão */
  verifyCode: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (u: SupabaseUser | null | undefined): User | null => {
  if (!u) return null;
  const email = u.email ?? "";
  return {
    id: u.id,
    email,
    name: (u.user_metadata?.name as string | undefined) || email.split("@")[0],
  };
};

const translateError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("only request this after")) return "Aguarde cerca de 1 minuto para pedir outro código.";
  if (m.includes("rate limit")) return "Muitos e-mails enviados. Aguarde um pouco e tente de novo.";
  if (m.includes("token has expired") || m.includes("otp_expired") || (m.includes("token") && m.includes("invalid"))) return "Código inválido ou expirado.";
  if (m.includes("signups not allowed") || m.includes("user not found")) return "Não encontramos uma conta com este e-mail.";
  if (m.includes("error sending") || m.includes("smtp")) return "Não foi possível enviar o e-mail agora. Tente novamente em instantes.";
  return "Ocorreu um erro. Tente novamente.";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recupera a sessão salva (persiste após atualizar a página)
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session?.user));
      setIsLoading(false);
    });

    // Atualiza o estado quando entrar, sair ou renovar a sessão
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(translateError(error.message));
      return false;
    }
    return true;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }, // o trigger do banco copia o nome para a tabela profiles
    });
    if (error) {
      toast.error(translateError(error.message));
      return "error" as const;
    }
    // "Confirm email" ligado no Supabase: sem sessão até o usuário digitar o código enviado por e-mail
    if (!data.session) return "needs_code" as const;
    return "signed_in" as const;
  }, []);

  const sendLoginCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) {
      toast.error(translateError(error.message));
      return false;
    }
    return true;
  }, []);

  const resendSignupCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error(translateError(error.message));
      return false;
    }
    return true;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      toast.error(translateError(error.message));
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, sendLoginCode, resendSignupCode, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
