import { motion } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";
import { usePurchase } from "@/hooks/usePurchase";
import type { Product } from "@/data/products";

const categoryLabel: Record<string, string> = {
  Cables: "Cabos",
  Accessories: "Acessórios",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Card de produto com os botões "Adicionar" e "Comprar agora" */
const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const { addProduct, buyProduct } = usePurchase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-lg shadow-card overflow-hidden flex flex-col group"
    >
      <div className="h-36 bg-accent flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {categoryLabel[product.category] ?? product.category}
        </p>
        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
        <p className="text-primary font-bold tabular-nums mb-3">{brl(product.price)}</p>

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={() => buyProduct(product)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-3 w-3" /> Comprar agora
          </button>
          <button
            type="button"
            onClick={() => addProduct(product)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-foreground-strong text-xs font-semibold rounded-md border border-border hover:bg-accent/80 transition-colors"
          >
            <ShoppingCart className="h-3 w-3" /> Adicionar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
