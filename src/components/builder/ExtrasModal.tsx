import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useProducts } from "@/api/catalog";
import type { Product } from "@/data/products";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Categorias da loja que aparecem como "Extras" no montador
const EXTRA_CATEGORIES = ["Cables", "Accessories"];
const categoryLabel: Record<string, string> = { Cables: "Cabo", Accessories: "Acessório" };

interface ExtrasModalProps {
  open: boolean;
  selected: Product[];
  onToggle: (product: Product) => void;
  onClose: () => void;
}

/** Extras: cabos e acessórios (case de transporte, testador...). Pode escolher vários. */
const ExtrasModal = ({ open, selected, onToggle, onClose }: ExtrasModalProps) => {
  const { data: products = [], isLoading, isError } = useProducts();
  const extras = products.filter((p) => EXTRA_CATEGORIES.includes(p.category));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground-strong))" }}>
                  Extras
                </h2>
                <p className="text-xs text-muted-foreground">Cabos e acessórios. Escolha quantos quiser.</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Carregando extras...</p>}
              {isError && <p className="text-sm text-muted-foreground">Não foi possível carregar os extras.</p>}
              {!isLoading && !isError && extras.length === 0 && <p className="text-sm text-muted-foreground">Nenhum extra disponível.</p>}
              {extras.map((p) => {
                const isSelected = selected.some((s) => s.id === p.id);
                const available = p.stock === undefined || p.stock > 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onToggle(p)}
                    disabled={!available}
                    className={`w-full flex items-center gap-3 rounded-xl p-4 text-left transition-colors disabled:opacity-40 ${
                      isSelected ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "hsl(var(--foreground-strong))" }}>
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-accent border border-border text-[10px] text-muted-foreground">
                        {categoryLabel[p.category] ?? p.category}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm tabular-nums">{brl(p.price)}</p>
                      <div
                        className={`mt-2 ml-auto h-5 w-5 rounded-md border flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-button"
              >
                Concluir{selected.length > 0 ? ` (${selected.length})` : ""}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExtrasModal;
