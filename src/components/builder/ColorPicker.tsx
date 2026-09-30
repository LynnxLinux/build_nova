import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { CaseColor } from "@/data/builderProducts";

interface ColorPickerProps {
  colors: CaseColor[];
  selected: string | null;
  onChange: (colorId: string) => void;
}

const ColorPicker = ({ colors, selected, onChange }: ColorPickerProps) => (
  <div className="flex items-center gap-2 flex-wrap">
    {colors.map((c) => {
      const active = selected === c.id;
      return (
        <motion.button
          key={c.id}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(c.id)}
          title={c.name}
          className={`relative h-7 w-7 rounded-full border-2 transition-all ${
            active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
          }`}
          style={{ backgroundColor: c.hex }}
        >
          {active && (
            <Check
              className="absolute inset-0 m-auto h-3.5 w-3.5"
              style={{ color: isLight(c.hex) ? "#333" : "#fff" }}
            />
          )}
        </motion.button>
      );
    })}
  </div>
);

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export default ColorPicker;
