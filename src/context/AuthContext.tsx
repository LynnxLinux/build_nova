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
  register: (email: string, password: string, name: string) => Promise<boolean>;
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
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
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
      return false;
    }
    if (!data.session) {
      // "Confirm email" ainda ligado no Supabase: o usuário precisa confirmar pelo e-mail
      toast.info("Conta criada! Confirme seu e-mail para entrar.");
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
