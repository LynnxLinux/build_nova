import type { BuilderProduct, LayoutSize } from "@/data/builderProducts";

/** Layout hierarchy — a keycap set that covers TKL also covers 60%, 65%, 75%. */
const layoutOrder: LayoutSize[] = ["60%", "65%", "75%", "TKL", "Full"];

function layoutIndex(l: LayoutSize): number {
  return layoutOrder.indexOf(l);
}

/** Returns true when the keycap layout covers the given target layout. */
function layoutCovers(keycapLayout: LayoutSize, targetLayout: LayoutSize): boolean {
  return layoutIndex(keycapLayout) >= layoutIndex(targetLayout);
}

// ─── Pair-wise checks ────────────────────────────────────────────

export function isSwitchCompatibleWithKeycap(sw: BuilderProduct, kc: BuilderProduct): boolean {
  return sw.type === kc.type;
}

export function isPcbCompatibleWithCase(pcb: BuilderProduct, cs: BuilderProduct): boolean {
  return pcb.layout === cs.layout && pcb.type === cs.type;
}

export function isKeycapCompatibleWithPcb(kc: BuilderProduct, pcb: BuilderProduct): boolean {
  if (kc.type !== pcb.type) return false;
  if (!kc.layout || !pcb.layout) return true;
  return layoutCovers(kc.layout, pcb.layout);
}

export function isSwitchCompatibleWithPcb(sw: BuilderProduct, pcb: BuilderProduct): boolean {
  return sw.type === pcb.type;
}

// ─── Product-level compatibility against current selections ──────

export interface BuildSelection {
  switch: BuilderProduct | null;
  keycap: BuilderProduct | null;
  pcb: BuilderProduct | null;
  case: BuilderProduct | null;
}

/** Check if a candidate product is compatible with every already-selected item. */
export function isProductCompatible(product: BuilderProduct, selection: BuildSelection): boolean {
  const { switch: sw, keycap: kc, pcb, case: cs } = selection;

  if (product.category === "switch") {
    if (kc && !isSwitchCompatibleWithKeycap(product, kc)) return false;
    if (pcb && !isSwitchCompatibleWithPcb(product, pcb)) return false;
    return true;
  }

  if (product.category === "keycap") {
    if (sw && !isSwitchCompatibleWithKeycap(sw, product)) return false;
    if (pcb && !isKeycapCompatibleWithPcb(product, pcb)) return false;
    return true;
  }

  if (product.category === "pcb") {
    if (sw && !isSwitchCompatibleWithPcb(sw, product)) return false;
    if (kc && !isKeycapCompatibleWithPcb(kc, product)) return false;
    if (cs && !isPcbCompatibleWithCase(product, cs)) return false;
    return true;
  }

  if (product.category === "case") {
    if (pcb && !isPcbCompatibleWithCase(pcb, product)) return false;
    return true;
  }

  return true;
}

// ─── Full build validation ───────────────────────────────────────

export interface CompatibilityError {
  message: string;
  severity: "error" | "warning";
}

export function validateBuild(selection: BuildSelection): CompatibilityError[] {
  const errors: CompatibilityError[] = [];
  const { switch: sw, keycap: kc, pcb, case: cs } = selection;

  if (sw && kc && !isSwitchCompatibleWithKeycap(sw, kc)) {
    errors.push({
      message: `Switch "${sw.name}" (${sw.type}) é incompatível com keycap "${kc.name}" (${kc.type}).`,
      severity: "error",
    });
  }

  if (sw && pcb && !isSwitchCompatibleWithPcb(sw, pcb)) {
    errors.push({
      message: `Switch "${sw.name}" (${sw.type}) é incompatível com a PCB "${pcb.name}" (${pcb.type}).`,
      severity: "error",
    });
  }

  if (kc && pcb && !isKeycapCompatibleWithPcb(kc, pcb)) {
    errors.push({
      message: `Keycap "${kc.name}" (${kc.type}, ${kc.layout}) não cobre o layout da PCB "${pcb.name}" (${pcb.layout}).`,
      severity: "error",
    });
  }

  if (pcb && cs && !isPcbCompatibleWithCase(pcb, cs)) {
    errors.push({
      message: `PCB "${pcb.name}" (${pcb.layout}) é incompatível com o case "${cs.name}" (${cs.layout}).`,
      severity: "error",
    });
  }

  // Warnings for incomplete builds
  const missing: string[] = [];
  if (!sw) missing.push("switch");
  if (!kc) missing.push("keycap");
  if (!pcb) missing.push("PCB");
  if (!cs) missing.push("case");
  if (missing.length > 0 && missing.length < 4) {
    errors.push({
      message: `Build incompleta — faltam: ${missing.join(", ")}.`,
      severity: "warning",
    });
  }

  return errors;
}
