import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { productImages } from "@/data/productImages";
import type { Product } from "@/data/products";
import type {
  BuilderProduct,
  CaseColor,
  ComponentCategory,
  LayoutSize,
  SwitchType,
} from "@/data/builderProducts";

/* ---------- Produtos da loja (tabela products) ---------- */

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  image_key: string;
  image_size: string | null;
}

const rowToProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  description: r.description,
  category: r.category,
  brand: r.brand,
  price: Number(r.price),
  rating: Number(r.rating),
  image: productImages[r.image_key] ?? "",
  imageSize: r.image_size ?? undefined,
});

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("id");
  if (error) throw error;
  return ((data ?? []) as ProductRow[]).map(rowToProduct);
}

/** Produtos mais vendidos (coluna sales_count) */
export const useBestSellers = (limit = 4) =>
  useQuery({
    queryKey: ["products", "best_sellers", limit],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("sales_count", { ascending: false })
        .order("id")
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as ProductRow[]).map(rowToProduct);
    },
  });

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 5 * 60 * 1000 });

/* ---------- Peças do montador (tabela builder_parts) ---------- */

interface BuilderPartRow {
  id: string;
  name: string;
  category: ComponentCategory;
  type: SwitchType;
  layout: LayoutSize | null;
  price: number;
  image: string;
  description: string;
  supported_layouts: LayoutSize[] | null;
  colors: CaseColor[] | null;
}

export async function fetchBuilderParts(): Promise<BuilderProduct[]> {
  const { data, error } = await supabase
    .from("builder_parts")
    .select("*")
    .eq("active", true)
    .order("id");
  if (error) throw error;

  return ((data ?? []) as BuilderPartRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    layout: r.layout,
    price: Number(r.price),
    image: r.image,
    description: r.description,
    supportedLayouts: r.supported_layouts ?? undefined,
    colors: r.colors ?? undefined,
  }));
}

export const useBuilderParts = () =>
  useQuery({ queryKey: ["builder_parts"], queryFn: fetchBuilderParts, staleTime: 5 * 60 * 1000 });
