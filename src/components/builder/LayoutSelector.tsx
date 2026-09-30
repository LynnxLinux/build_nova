import { motion } from "framer-motion";
import { Keyboard } from "lucide-react";
import type { LayoutSize } from "@/data/builderProducts";

const layouts: { value: LayoutSize; label: string; keys: number }[] = [
  { value: "60%", label: "60%", keys: 61 },
  { value: "65%", label: "65%", keys: 68 },
  { value: "75%", label: "75%", keys: 84 },
  { value: "TKL", label: "TKL", keys: 87 },
];

interface LayoutSelectorProps {
  selected: LayoutSize;
  onChange: (layout: LayoutSize) => void;
}

const LayoutSelector = ({ selected, onChange }: LayoutSelectorProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-2">
      <Keyboard className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Layout</span>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {layouts.map((l) => {
        const active = selected === l.value;
        return (
          <motion.button
            key={l.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(l.value)}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl py-3 px-2 text-center transition-all ${
              active
                ? "bg-primary/15 border-2 border-primary ring-1 ring-primary/30"
                : "bg-card border border-border hover:border-primary/30"
            }`}
          >
            <span className="text-sm font-bold" style={{ color: "hsl(var(--foreground-strong))" }}>
              {l.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{l.keys} teclas</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default LayoutSelector;
