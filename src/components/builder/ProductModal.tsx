import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { builderProducts, type BuilderProduct, type ComponentCategory, type LayoutSize } from "@/data/builderProducts";
import { isProductCompatible, type BuildSelection } from "@/utils/compatibilidade";
import ProductCard from "./ProductCard";
import ColorPicker from "./ColorPicker";

const categoryTitles: Record<ComponentCategory, string> = {
  case: "Escolha o Case",
  switch: "Escolha os Switches",
  keycap: "Escolha as Keycaps",
  pcb: "Escolha a PCB",
};

interface ProductModalProps {
  category: ComponentCategory | null;
  selection: BuildSelection;
  selectedLayout: LayoutSize;
  selectedCaseColor: string | null;
  onSelect: (product: BuilderProduct) => void;
  onCaseColorChange: (colorId: string) => void;
  onClose: () => void;
}

const ProductModal = ({
  category,
  selection,
  selectedLayout,
  selectedCaseColor,
  onSelect,
  onCaseColorChange,
  onClose,
}: ProductModalProps) => {
  if (!category) return null;

  const products = builderProducts.filter((p) => p.category === category);

  return (
    <AnimatePresence>
      {category && (
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
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground-strong))" }}>
                {categoryTitles[category]}
              </h2>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {products.map((product) => {
                let compatible = isProductCompatible(product, selection);

                // Extra layout compatibility for cases, PCBs, keycaps
                if (product.category === "case" && product.supportedLayouts) {
                  if (!product.supportedLayouts.includes(selectedLayout)) {
                    compatible = false;
                  }
                }
                if ((product.category === "pcb" || product.category === "case") && product.layout && product.layout !== selectedLayout) {
                  compatible = false;
                }

                const selected = selection[category as keyof BuildSelection]?.id === product.id;

                return (
                  <div key={product.id} className="space-y-2">
                    <ProductCard
                      product={product}
                      selected={selected}
                      compatible={compatible || selected}
                      onSelect={() => {
                        onSelect(product);
                        // If case, auto-select first color when none selected
                        if (product.category === "case" && product.colors?.length && !selectedCaseColor) {
                          onCaseColorChange(product.colors[0].id);
                        }
                      }}
                    />
                    {/* Show color picker inline when case is selected */}
                    {selected && product.category === "case" && product.colors && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-14 pb-2"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Cor do case</p>
                        <ColorPicker
                          colors={product.colors}
                          selected={selectedCaseColor}
                          onChange={onCaseColorChange}
                        />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
