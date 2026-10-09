import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/api/checkout";
import { rowToOrder, type OrderRow } from "@/api/checkout";

/** true se o usuário logado é administrador (coluna profiles.is_admin) */
export const useIsAdmin = (userId: string | undefined) =>
  useQuery({
    queryKey: ["is_admin", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId!).maybeSingle();
      if (error) return false; // coluna ainda não existe = não é admin
      return !!data?.is_admin;
    },
  });

/* ── Pedidos (todos) ───────────────────────────────────────── */
export const useAdminOrders = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin_orders"],
    enabled,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as OrderRow[]).map(rowToOrder);
    },
  });

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Sem permissão para alterar este pedido.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_orders"] }),
  });
};

/* ── Produtos (inclui inativos) ────────────────────────────── */
export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export const useAdminProducts = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin_products"],
    enabled,
    queryFn: async (): Promise<AdminProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, price, stock, active")
        .order("id");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id as string,
        name: p.name as string,
        category: p.category as string,
        price: Number(p.price),
        stock: Number(p.stock),
        active: !!p.active,
      }));
    },
  });

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; price: number; stock: number; active: boolean }) => {
      const { data, error } = await supabase
        .from("products")
        .update({ price: p.price, stock: p.stock, active: p.active })
        .eq("id", p.id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Sem permissão para alterar este produto.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // vitrine reflete a mudança
    },
  });
};
