import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { productImages } from "@/data/productImages";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ── localStorage (visitante sem login) ───────────────────────── */
const LOCAL_KEY = "qwerty-cart";

const readLocal = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const saveLocal = (items: CartItem[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    /* sem espaço ou bloqueado: ignora */
  }
};

const clearLocal = () => {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignora */
  }
};

/* ── Supabase (usuário logado) ────────────────────────────────── */
interface CartRow {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string | null;
}

// A URL das imagens muda a cada build (hash do Vite), então no banco guardamos a CHAVE da imagem.
const imageToDb = (image: string): string =>
  Object.entries(productImages).find(([, url]) => url === image)?.[0] ?? image;
const imageFromDb = (value: string): string => productImages[value] ?? value;

const rowToItem = (r: CartRow): CartItem => ({
  id: r.item_id,
  name: r.name,
  price: Number(r.price),
  quantity: r.quantity,
  image: imageFromDb(r.image),
  category: r.category ?? undefined,
});

const itemToRow = (userId: string, i: CartItem) => ({
  user_id: userId,
  item_id: i.id,
  name: i.name,
  price: Math.round(i.price * 100) / 100,
  quantity: i.quantity,
  image: imageToDb(i.image),
  category: i.category ?? null,
});

const syncError = () => toast.error("Não foi possível salvar o carrinho. Verifique sua conexão.");

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(null);

  // Atualiza o estado; sem login, também grava no localStorage
  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    if (!userIdRef.current) saveLocal(next);
  }, []);

  // Carrega o carrinho quando a sessão é verificada ou quando o usuário entra/sai
  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    userIdRef.current = user?.id ?? null;

    if (!user) {
      commit(readLocal());
      return;
    }

    (async () => {
      const { data, error } = await supabase.from("cart_items").select("*").eq("user_id", user.id);
      if (cancelled) return;
      if (error) {
        syncError();
        return;
      }

      const merged: CartItem[] = ((data ?? []) as CartRow[]).map(rowToItem);

      // Junta o carrinho de visitante (localStorage) com o do banco
      const local = readLocal();
      for (const li of local) {
        const existing = merged.find((m) => m.id === li.id);
        if (existing) existing.quantity += li.quantity;
        else merged.push(li);
      }

      if (local.length > 0) {
        const { error: upsertError } = await supabase
          .from("cart_items")
          .upsert(merged.map((i) => itemToRow(user.id, i)), { onConflict: "user_id,item_id" });
        if (upsertError) syncError();
        else clearLocal();
      }

      if (cancelled) return;
      itemsRef.current = merged;
      setItems(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading, commit]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      const prev = itemsRef.current;
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
      commit(next);

      const uid = userIdRef.current;
      if (uid) {
        const changed = next.find((i) => i.id === item.id)!;
        supabase
          .from("cart_items")
          .upsert(itemToRow(uid, changed), { onConflict: "user_id,item_id" })
          .then(({ error }) => error && syncError());
      }
    },
    [commit]
  );

  const removeItem = useCallback(
    (id: string) => {
      commit(itemsRef.current.filter((i) => i.id !== id));

      const uid = userIdRef.current;
      if (uid) {
        supabase
          .from("cart_items")
          .delete()
          .eq("user_id", uid)
          .eq("item_id", id)
          .then(({ error }) => error && syncError());
      }
    },
    [commit]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      commit(itemsRef.current.map((i) => (i.id === id ? { ...i, quantity } : i)));

      const uid = userIdRef.current;
      if (uid) {
        supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", uid)
          .eq("item_id", id)
          .then(({ error }) => error && syncError());
      }
    },
    [commit, removeItem]
  );

  const clearCart = useCallback(() => {
    commit([]);

    const uid = userIdRef.current;
    if (uid) {
      supabase
        .from("cart_items")
        .delete()
        .eq("user_id", uid)
        .then(({ error }) => error && syncError());
    }
  }, [commit]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
