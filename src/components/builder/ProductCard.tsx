import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { BuilderProduct } from "@/data/builderProducts";

interface ProductCardProps {
  product: BuilderProduct;
  selected: boolean;
  compatible: boolean;
  onSelect: () => void;
}

const ProductCard = ({ product, selected, compatible, onSelect }: ProductCardProps) => (
  <motion.button
    whileHover={compatible ? { scale: 1.02 } : undefined}
    whileTap={compatible ? { scale: 0.97 } : undefined}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    disabled={!compatible}
    onClick={onSelect}
    className={`relative flex items-center gap-4 rounded-xl p-4 text-left transition-all w-full ${
      selected
        ? "bg-primary/15 border-2 border-primary ring-1 ring-primary/30"
        : compatible
          ? "bg-card border border-border hover:border-primary/30"
          : "bg-card/40 border border-border opacity-40 cursor-not-allowed"
    }`}
  >
    <span className="text-3xl shrink-0">{product.image}</span>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground-strong))" }}>
        {product.name}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{product.type}</span>
        {product.layout && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{product.layout}</span>
        )}
      </div>
    </div>

    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className="text-sm font-bold tabular-nums" style={{ color: "hsl(var(--foreground-strong))" }}>
        ${product.price.toFixed(2)}
      </span>
      {compatible ? (
        selected ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium">
            <CheckCircle2 className="h-3 w-3" /> Selecionado
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Compatível</span>
        )
      ) : (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-destructive font-medium">
          <XCircle className="h-3 w-3" /> Incompatível
        </span>
      )}
    </div>
  </motion.button>
);

export default ProductCard;
