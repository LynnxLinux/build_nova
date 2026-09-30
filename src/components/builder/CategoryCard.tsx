import { motion } from "framer-motion";
import { ChevronRight, Box, Cpu, Grid3X3, CircuitBoard, Sparkles } from "lucide-react";
import type { ComponentCategory, CaseColor } from "@/data/builderProducts";
import type { BuilderProduct } from "@/data/builderProducts";

const categoryIcons: Record<ComponentCategory | "extras", React.ElementType> = {
  case: Box,
  switch: Cpu,
  keycap: Grid3X3,
  pcb: CircuitBoard,
  extras: Sparkles,
};

const categoryLabels: Record<ComponentCategory | "extras", string> = {
  case: "Base / Case",
  switch: "Switches",
  keycap: "Keycaps",
  pcb: "PCB",
  extras: "Extras",
};

interface CategoryCardProps {
  category: ComponentCategory | "extras";
  selectedItem: BuilderProduct | null;
  onClick: () => void;
  hasError?: boolean;
  /** For case category: currently selected color */
  selectedColor?: CaseColor | null;
}

const CategoryCard = ({ category, selectedItem, onClick, hasError, selectedColor }: CategoryCardProps) => {
  const Icon = categoryIcons[category];

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-colors ${
        hasError
          ? "bg-destructive/10 border border-destructive/30"
          : selectedItem
            ? "bg-primary/10 border border-primary/20"
            : "bg-card border border-border hover:border-primary/30"
      }`}
    >
      <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${
        selectedItem ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {categoryLabels[category]}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground-strong))" }}>
            {selectedItem ? selectedItem.name : "Selecionar..."}
          </p>
          {/* Color dot for case */}
          {selectedColor && category === "case" && (
            <span
              className="h-4 w-4 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: selectedColor.hex }}
              title={selectedColor.name}
            />
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </motion.button>
  );
};

export default CategoryCard;
