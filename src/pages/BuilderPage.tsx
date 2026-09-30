import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { AlertTriangle, ShoppingCart, RotateCcw } from "lucide-react";
import type { BuilderProduct, ComponentCategory, LayoutSize } from "@/data/builderProducts";
import { validateBuild, type BuildSelection, type CompatibilityError } from "@/utils/compatibilidade";

import KeyboardPreview from "@/components/builder/KeyboardPreview";
import LayoutSelector from "@/components/builder/LayoutSelector";
import CategoryCard from "@/components/builder/CategoryCard";
import ProductModal from "@/components/builder/ProductModal";
import ColorPicker from "@/components/builder/ColorPicker";

const categoryOrder: (ComponentCategory | "extras")[] = ["case", "switch", "keycap", "pcb", "extras"];

/* ── Alert row ─────────────────────────────────────────────── */
const BuildAlert = ({ error }: { error: CompatibilityError }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
      error.severity === "error"
        ? "bg-destructive/10 border border-destructive/30 text-destructive"
        : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
    }`}
  >
    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
    <span>{error.message}</span>
  </motion.div>
);

/* ── Main page ─────────────────────────────────────────────── */
const BuilderPage = () => {
  const { addItem } = useCart();

  // Layout state (independent)
  const [selectedLayout, setSelectedLayout] = useState<LayoutSize>("65%");

  // Component states
  const [selectedSwitch, setSelectedSwitch] = useState<BuilderProduct | null>(null);
  const [selectedKeycap, setSelectedKeycap] = useState<BuilderProduct | null>(null);
  const [selectedPcb, setSelectedPcb] = useState<BuilderProduct | null>(null);
  const [selectedCase, setSelectedCase] = useState<BuilderProduct | null>(null);

  // Case color state
  const [selectedCaseColorId, setSelectedCaseColorId] = useState<string | null>(null);

  const [openCategory, setOpenCategory] = useState<ComponentCategory | "extras" | null>(null);

  const selection: BuildSelection = useMemo(
    () => ({ switch: selectedSwitch, keycap: selectedKeycap, pcb: selectedPcb, case: selectedCase }),
    [selectedSwitch, selectedKeycap, selectedPcb, selectedCase],
  );

  const errors = useMemo(() => {
    const errs = validateBuild(selection);

    // Additional layout-based validations
    if (selectedCase?.supportedLayouts && !selectedCase.supportedLayouts.includes(selectedLayout)) {
      errs.push({
        message: `O case "${selectedCase.name}" não suporta o layout ${selectedLayout}.`,
        severity: "error",
      });
    }
    if (selectedPcb?.layout && selectedPcb.layout !== selectedLayout) {
      errs.push({
        message: `A PCB "${selectedPcb.name}" (${selectedPcb.layout}) não corresponde ao layout ${selectedLayout}.`,
        severity: "error",
      });
    }

    return errs;
  }, [selection, selectedLayout, selectedCase, selectedPcb]);

  const hasErrors = errors.some((e) => e.severity === "error");

  const totalPrice = useMemo(
    () => [selectedSwitch, selectedKeycap, selectedPcb, selectedCase].filter(Boolean).reduce((s, p) => s + p!.price, 0),
    [selectedSwitch, selectedKeycap, selectedPcb, selectedCase],
  );

  const selectedCount = [selectedSwitch, selectedKeycap, selectedPcb, selectedCase].filter(Boolean).length;

  // Resolve case color hex
  const caseColorHex = useMemo(() => {
    if (selectedCase?.colors && selectedCaseColorId) {
      const found = selectedCase.colors.find((c) => c.id === selectedCaseColorId);
      if (found) return found.hex;
    }
    return selectedCase?.colors?.[0]?.hex ?? "#2a2a2e";
  }, [selectedCase, selectedCaseColorId]);

  const selectedCaseColor = useMemo(() => {
    if (!selectedCase?.colors) return null;
    return selectedCase.colors.find((c) => c.id === selectedCaseColorId) ?? selectedCase.colors[0] ?? null;
  }, [selectedCase, selectedCaseColorId]);

  const getSelectedForCategory = (cat: ComponentCategory | "extras"): BuilderProduct | null => {
    if (cat === "extras") return null;
    return selection[cat as keyof BuildSelection];
  };

  const handleSelect = (product: BuilderProduct) => {
    const setters: Record<ComponentCategory, React.Dispatch<React.SetStateAction<BuilderProduct | null>>> = {
      switch: setSelectedSwitch,
      keycap: setSelectedKeycap,
      pcb: setSelectedPcb,
      case: setSelectedCase,
    };
    const current = selection[product.category as keyof BuildSelection];
    if (current?.id === product.id) {
      setters[product.category](null);
      if (product.category === "case") setSelectedCaseColorId(null);
    } else {
      setters[product.category](product);
      if (product.category === "case" && product.colors?.length) {
        setSelectedCaseColorId(product.colors[0].id);
      }
    }
  };

  const handleLayoutChange = (layout: LayoutSize) => {
    setSelectedLayout(layout);
    // Clear incompatible selections
    if (selectedCase?.layout && selectedCase.layout !== layout) setSelectedCase(null);
    if (selectedPcb?.layout && selectedPcb.layout !== layout) setSelectedPcb(null);
  };

  const handleClearAll = () => {
    setSelectedSwitch(null);
    setSelectedKeycap(null);
    setSelectedPcb(null);
    setSelectedCase(null);
    setSelectedCaseColorId(null);
  };

  const handleAddToCart = () => {
    if (hasErrors) {
      toast.error("Corrija os erros de compatibilidade antes de adicionar ao carrinho.");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Selecione pelo menos um componente.");
      return;
    }
    const parts = [selectedSwitch, selectedKeycap, selectedPcb, selectedCase].filter(Boolean) as BuilderProduct[];
    addItem({
      id: `build-${Date.now()}`,
      name: `Custom Build (${selectedLayout}): ${parts.map((p) => p.name).join(" + ")}`,
      price: totalPrice,
      image: "⌨️",
    });
    toast.success("Build adicionada ao carrinho!");
  };

  const errorCategories = new Set<string>();
  errors.forEach((e) => {
    if (e.severity === "error") {
      if (e.message.toLowerCase().includes("switch")) errorCategories.add("switch");
      if (e.message.toLowerCase().includes("keycap")) errorCategories.add("keycap");
      if (e.message.toLowerCase().includes("pcb")) errorCategories.add("pcb");
      if (e.message.toLowerCase().includes("case")) errorCategories.add("case");
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Keyboard Builder</h1>
        <p className="text-muted-foreground mt-1">Monte seu teclado passo a passo — compatibilidade verificada em tempo real.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* ── Center: keyboard preview ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px]"
        >
          <KeyboardPreview
            selectedLayout={selectedLayout}
            selectedCase={selectedCase}
            selectedKeycap={selectedKeycap}
            selectedSwitch={selectedSwitch}
            selectedPcb={selectedPcb}
            caseColor={caseColorHex}
          />
        </motion.div>

        {/* ── Right sidebar ────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          {/* Layout selector */}
          <LayoutSelector selected={selectedLayout} onChange={handleLayoutChange} />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Category cards */}
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Componentes</h2>

          {categoryOrder.map((cat) => (
            <CategoryCard
              key={cat}
              category={cat}
              selectedItem={getSelectedForCategory(cat)}
              hasError={errorCategories.has(cat)}
              selectedColor={cat === "case" ? selectedCaseColor : undefined}
              onClick={() => setOpenCategory(cat === "extras" ? null : cat)}
            />
          ))}

          {/* Inline case color picker when case is selected */}
          {selectedCase?.colors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-card border border-border p-3 space-y-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor do Case</p>
              <ColorPicker
                colors={selectedCase.colors}
                selected={selectedCaseColorId}
                onChange={setSelectedCaseColorId}
              />
            </motion.div>
          )}

          {/* Price & actions */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total estimado</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "hsl(var(--foreground-strong))" }}>
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
              {selectedCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={hasErrors || selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-button disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <ShoppingCart className="h-4 w-4" />
              Adicionar ao carrinho
            </motion.button>
          </div>

          {/* Errors */}
          <AnimatePresence mode="sync">
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((err, i) => (
                  <BuildAlert key={i} error={err} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.aside>
      </div>

      {/* Product selection modal */}
      <ProductModal
        category={openCategory as ComponentCategory | null}
        selection={selection}
        selectedLayout={selectedLayout}
        selectedCaseColor={selectedCaseColorId}
        onSelect={handleSelect}
        onCaseColorChange={setSelectedCaseColorId}
        onClose={() => setOpenCategory(null)}
      />
    </div>
  );
};

export default BuilderPage;
