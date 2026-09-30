import { motion } from "framer-motion";
import type { BuilderProduct, LayoutSize } from "@/data/builderProducts";

interface KeyboardPreviewProps {
  selectedLayout: LayoutSize;
  selectedCase: BuilderProduct | null;
  selectedKeycap: BuilderProduct | null;
  selectedSwitch: BuilderProduct | null;
  selectedPcb: BuilderProduct | null;
  caseColor: string; // hex
}

const keycapColorMap: Record<string, { base: string; accent: string }> = {
  "kc-mx-laser": { base: "#2d1b69", accent: "#e94560" },
  "kc-mx-botanical": { base: "#2d4a3e", accent: "#8fb996" },
  "kc-mx-retro": { base: "#1a1a2e", accent: "#4a4a4a" },
  "kc-lp-white": { base: "#e8e8e8", accent: "#ffffff" },
  "kc-mx-minimal": { base: "#1a1a1a", accent: "#333333" },
};

const layoutKeyCount: Record<string, number> = {
  "60%": 61, "65%": 68, "75%": 84, "TKL": 87, "Full": 104,
};



/* ── Key model ────────────────────────────────────────────────
   Each row is a list of keys (label + width in "u" units) or
   spacers (gaps used to separate clusters, like a real board). */
type Key = { k: string; w?: number; h?: number };
type Gap = { gap: number };
type Cell = Key | Gap;
type Row = Cell[];

const isGap = (c: Cell): c is Gap => "gap" in c;

/* Shared alpha rows (ANSI) */
const numRow: Row = [
  { k: "`" }, { k: "1" }, { k: "2" }, { k: "3" }, { k: "4" }, { k: "5" }, { k: "6" },
  { k: "7" }, { k: "8" }, { k: "9" }, { k: "0" }, { k: "-" }, { k: "=" }, { k: "⌫", w: 2 },
];
const tabRow: Row = [
  { k: "Tab", w: 1.5 }, { k: "Q" }, { k: "W" }, { k: "E" }, { k: "R" }, { k: "T" }, { k: "Y" },
  { k: "U" }, { k: "I" }, { k: "O" }, { k: "P" }, { k: "[" }, { k: "]" }, { k: "\\", w: 1.5 },
];
const capsRow: Row = [
  { k: "Caps", w: 1.75 }, { k: "A" }, { k: "S" }, { k: "D" }, { k: "F" }, { k: "G" }, { k: "H" },
  { k: "J" }, { k: "K" }, { k: "L" }, { k: ";" }, { k: "'" }, { k: "Enter", w: 2.25 },
];
const alphaShiftRow = (rightShiftW: number): Row => [
  { k: "Shift", w: 2.25 }, { k: "Z" }, { k: "X" }, { k: "C" }, { k: "V" }, { k: "B" },
  { k: "N" }, { k: "M" }, { k: "," }, { k: "." }, { k: "/" }, { k: "Shift", w: rightShiftW },
];

/* F-rows */
const fRowCompact: Row = [
  { k: "Esc" }, { k: "F1" }, { k: "F2" }, { k: "F3" }, { k: "F4" }, { k: "F5" }, { k: "F6" },
  { k: "F7" }, { k: "F8" }, { k: "F9" }, { k: "F10" }, { k: "F11" }, { k: "F12" },
];
const fRowTkl: Row = [
  { k: "Esc" }, { gap: 1 },
  { k: "F1" }, { k: "F2" }, { k: "F3" }, { k: "F4" }, { gap: 0.5 },
  { k: "F5" }, { k: "F6" }, { k: "F7" }, { k: "F8" }, { gap: 0.5 },
  { k: "F9" }, { k: "F10" }, { k: "F11" }, { k: "F12" },
];

/* ── Layouts ──────────────────────────────────────────────── */
function buildLayout(layout: LayoutSize): { rows: Row[]; numpad: boolean } {
  switch (layout) {
    /* 60% — 61 teclas, sem F-row, sem navegação, sem setas */
    case "60%":
      return {
        numpad: false,
        rows: [
          [{ k: "Esc" }, ...numRow.slice(1)],
          tabRow,
          capsRow,
          alphaShiftRow(2.75),
          [
            { k: "Ctrl", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Alt", w: 1.25 },
            { k: "Space", w: 6.25 },
            { k: "Alt", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Fn", w: 1.25 }, { k: "Ctrl", w: 1.25 },
          ],
        ],
      };

    /* 65% — 68 teclas: 60% + coluna de navegação + setas */
    case "65%":
      return {
        numpad: false,
        rows: [
          [{ k: "Esc" }, ...numRow.slice(1), { gap: 0.25 }, { k: "Del" }],
          [...tabRow, { gap: 0.25 }, { k: "PgUp" }],
          [...capsRow, { gap: 0.25 }, { k: "PgDn" }],
          [...alphaShiftRow(1.75), { gap: 0.25 }, { k: "↑" }],
          [
            { k: "Ctrl", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Alt", w: 1.25 },
            { k: "Space", w: 6.25 },
            { k: "Alt", w: 1.25 }, { k: "Fn", w: 1.25 }, { gap: 0.25 },
            { k: "←" }, { k: "↓" }, { k: "→" },
          ],
        ],
      };

    /* 75% — F-row compacta + coluna lateral de navegação */
    case "75%":
      return {
        numpad: false,
        rows: [
          [...fRowCompact, { gap: 0.25 }, { k: "Del" }],
          [...numRow, { gap: 0.25 }, { k: "Home" }],
          [...tabRow, { gap: 0.25 }, { k: "PgUp" }],
          [...capsRow, { gap: 0.25 }, { k: "PgDn" }],
          [...alphaShiftRow(1.75), { gap: 0.25 }, { k: "↑" }],
          [
            { k: "Ctrl", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Alt", w: 1.25 },
            { k: "Space", w: 6.25 },
            { k: "Alt", w: 1.25 }, { k: "Fn", w: 1.25 }, { gap: 0.25 },
            { k: "←" }, { k: "↓" }, { k: "→" },
          ],
        ],
      };

    /* TKL — 87 teclas com clusters separados */
    case "TKL":
    case "Full":
      return {
        numpad: layout === "Full",
        rows: [
          [...fRowTkl, { gap: 0.5 }, { k: "PrtSc" }, { k: "Scr" }, { k: "Pse" }],
          [...numRow, { gap: 0.5 }, { k: "Ins" }, { k: "Home" }, { k: "PgUp" }],
          [...tabRow, { gap: 0.5 }, { k: "Del" }, { k: "End" }, { k: "PgDn" }],
          [...capsRow],
          [...alphaShiftRow(2.75), { gap: 1.5 }, { k: "↑" }],
          [
            { k: "Ctrl", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Alt", w: 1.25 },
            { k: "Space", w: 6.25 },
            { k: "Alt", w: 1.25 }, { k: "Win", w: 1.25 }, { k: "Menu", w: 1.25 }, { k: "Ctrl", w: 1.25 },
            { gap: 0.5 }, { k: "←" }, { k: "↓" }, { k: "→" },
          ],
        ],
      };
  }
}

/* Numpad (17 teclas) para Full */
const numpadLeft: Row[] = [
  [{ k: "Num" }, { k: "/" }, { k: "*" }],
  [{ k: "7" }, { k: "8" }, { k: "9" }],
  [{ k: "4" }, { k: "5" }, { k: "6" }],
  [{ k: "1" }, { k: "2" }, { k: "3" }],
  [{ k: "0", w: 2 }, { k: "." }],
];
const numpadRight: Key[] = [{ k: "-" }, { k: "+", h: 2 }, { k: "↵", h: 2 }];

const ACCENT_KEYS = new Set(["Esc", "Enter", "Space", "↵"]);

const KeyboardPreview = ({ selectedLayout, selectedCase, selectedKeycap, selectedSwitch, selectedPcb, caseColor }: KeyboardPreviewProps) => {
  const kcColors = selectedKeycap ? keycapColorMap[selectedKeycap.id] : null;
  const keycapBase = kcColors?.base ?? "#3a3a4a";
  const keycapAccent = kcColors?.accent ?? "#555";
  const isDarkLegend = selectedKeycap?.id === "kc-lp-white";

  const { rows, numpad } = buildLayout(selectedLayout);

  const keyCount = layoutKeyCount[selectedLayout] ?? 68;


  const renderKey = (key: Key, id: string) => {
    const w = key.w ?? 1;
    const h = key.h ?? 1;
    const isAccent = ACCENT_KEYS.has(key.k);
    const bg = isAccent ? keycapAccent : keycapBase;
    const showLabel = key.k.length <= 5 || w >= 1.5;
    return (
      <div key={id} style={{ width: `calc(${w} * var(--ku))`, height: `calc(${h} * var(--ku))`, padding: "var(--kgap)" }}>
        <motion.div
          whileHover={{ y: -2, scale: 1.04 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="h-full w-full flex items-center justify-center rounded-[0.25em] font-medium cursor-default select-none border border-white/5 overflow-hidden"
          style={{
            fontSize: "calc(var(--ku) * 0.26)",
            backgroundColor: bg,
            color: isDarkLegend ? "#555" : "#ddd",
            boxShadow: `0 2px 0 1px ${bg}88, 0 4px 8px -2px rgba(0,0,0,0.4)`,
          }}
        >
          {showLabel ? key.k : ""}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Layout label */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Layout</span>
        <span className="text-sm font-bold" style={{ color: "hsl(var(--foreground-strong))" }}>{selectedLayout}</span>
        <span className="text-xs text-muted-foreground">({keyCount} teclas)</span>
      </div>

      {/* Keyboard body */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative max-w-full overflow-x-auto rounded-2xl p-[calc(var(--ku)*0.22)] shadow-2xl"
        style={{
          // responsive key unit: shrinks on smaller screens / bigger layouts
          ["--ku" as string]:
            selectedLayout === "Full"
              ? "clamp(0.75rem, 1.5vw, 1.5rem)"
              : selectedLayout === "TKL"
                ? "clamp(0.85rem, 1.9vw, 1.75rem)"
                : selectedLayout === "75%"
                  ? "clamp(1rem, 2.4vw, 2rem)"
                  : "clamp(1.1rem, 2.8vw, 2.2rem)",
          ["--kgap" as string]: "calc(var(--ku) * 0.05)",
          backgroundColor: caseColor,
          boxShadow: `0 20px 60px -10px ${caseColor}55, 0 0 0 1px hsl(215 28% 17%)`,
        }}
      >
        <div
          className="flex items-start rounded-xl p-[calc(var(--ku)*0.18)]"
          style={{ backgroundColor: `${caseColor}cc`, gap: "calc(var(--ku) * 0.4)" }}
        >
          {/* Main block */}
          <div className="flex flex-col">
            {rows.map((row, ri) => (
              <div key={ri} className="flex">
                {row.map((cell, ci) =>
                  isGap(cell) ? (
                    <div key={`g-${ri}-${ci}`} style={{ width: `calc(${cell.gap} * var(--ku))` }} />
                  ) : (
                    renderKey(cell, `${ri}-${ci}`)
                  ),
                )}
              </div>
            ))}
          </div>

          {/* Numpad (Full) */}
          {numpad && (
            <div className="flex" style={{ marginTop: "calc(var(--ku) * 1)" }}>
              <div className="flex flex-col">
                {numpadLeft.map((row, ri) => (
                  <div key={`npl-${ri}`} className="flex">
                    {row.map((key, ki) => renderKey(key as Key, `npl-${ri}-${ki}`))}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                {numpadRight.map((key, ki) => renderKey(key, `npr-${ki}`))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status pills */}
      <div className="flex flex-wrap justify-center gap-2 text-[10px]">
        {selectedSwitch && (
          <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
            {selectedSwitch.name}
          </span>
        )}
        {selectedKeycap && (
          <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
            {selectedKeycap.name}
          </span>
        )}
        {selectedPcb && (
          <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">
            {selectedPcb.name}
          </span>
        )}
        {selectedCase && (
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {selectedCase.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default KeyboardPreview;
