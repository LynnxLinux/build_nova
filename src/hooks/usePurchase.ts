import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";
import type { CommunityBuildFull } from "@/api/community";

/**
 * "Adicionar" e "Comprar agora" para produtos e builds.
 * Não existe checkout ainda: "comprar agora" = adicionar ao carrinho e abrir /cart.
 */
export function usePurchase() {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const addProduct = useCallback(
    (p: Product) => {
      addItem({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category });
      toast.success(`${p.name} adicionado ao carrinho`);
    },
    [addItem],
  );

  const buyProduct = useCallback(
    (p: Product) => {
      addItem({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category });
      navigate("/cart");
    },
    [addItem, navigate],
  );

  // A build inteira vira UM item no carrinho (igual ao que o Montador faz)
  const addBuild = useCallback(
    (b: CommunityBuildFull, options?: { goToCart?: boolean }): boolean => {
      if (!b.complete) {
        toast.error("Algumas peças desta build não estão mais disponíveis.");
        return false;
      }
      addItem({
        id: `community-${b.id}`,
        name: `${b.title} (${b.layout})`,
        price: b.price,
        image: b.image,
        category: "Build",
      });
      if (options?.goToCart) navigate("/cart");
      else toast.success(`Build "${b.title}" adicionada ao carrinho`);
      return true;
    },
    [addItem, navigate],
  );

  return { addProduct, buyProduct, addBuild, buyBuild: (b: CommunityBuildFull) => addBuild(b, { goToCart: true }) };
}
