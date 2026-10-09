import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Loader2 } from "lucide-react";
import type { BuilderProduct, LayoutSize } from "@/data/builderProducts";

interface Keyboard3DProps {
  layout: LayoutSize;
  keycap: BuilderProduct | null;
  caseItem: BuilderProduct | null;
  switchItem?: BuilderProduct | null;
  pcb?: BuilderProduct | null;
  /** cor do case em hex (ex.: "#2a2a2e"). null = cor padrão */
  caseColor: string | null;
  heightClass?: string;
  /** chamado se o WebGL/modelo falhar, para o pai voltar ao preview 2D */
  onFail?: () => void;
}

/* ── Qual modelo .glb usar ─────────────────────────────────── */
interface ModelChoice {
  url: string;
  /** modelo temático (GMK / Botanical): cores fixas, não recebe tinta */
  themed: boolean;
  note?: string;
}

const resolveModel = (layout: LayoutSize, keycapId: string | undefined): ModelChoice => {
  const laser = keycapId === "kc-mx-laser";
  const botanical = keycapId === "kc-mx-botanical";
  switch (layout) {
    case "60%":
      return { url: "/models/teclado-60.glb", themed: false };
    case "65%":
      return laser
        ? { url: "/models/teclado-65-gmk.glb", themed: true }
        : { url: "/models/teclado-65-base.glb", themed: false };
    case "75%":
      if (botanical) return { url: "/models/teclado-75-botanical.glb", themed: true };
      if (laser) return { url: "/models/teclado-75-gmk.glb", themed: true };
      return { url: "/models/teclado-75-base.glb", themed: false };
    case "TKL":
      return { url: "/models/teclado-75-base.glb", themed: false, note: "TKL: usando o modelo 75% como aproximação." };
    case "Full":
    default:
      return { url: "/models/teclado-100.glb", themed: false };
  }
};

/* ── Cores das keycaps para os modelos "base" ──────────────── */
const keycapTheme: Record<string, { base: string; accent: string }> = {
  "kc-mx-laser": { base: "#2d1b69", accent: "#e94560" },
  "kc-mx-botanical": { base: "#2d4a3e", accent: "#8fb996" },
  "kc-mx-retro": { base: "#1a1a2e", accent: "#4a4a4a" },
  "kc-lp-white": { base: "#e8e8e8", accent: "#ffffff" },
  "kc-mx-minimal": { base: "#1a1a1a", accent: "#333333" },
};

// Nos modelos base, o case é a caixa de 22 vértices e as teclas ficam em "Material.009"
const CASE_MATERIALS = new Set(["Material.044", "Material.021"]);
const KEYS_MATERIAL = "Material.009";
const DEFAULT_CASE = "#2a2a2e";
const DEFAULT_KEYS = "#cfcfd6";

// teclas de destaque (Esc, Enter...) vêm em azul (0.3, 0.49, 0.8) nos modelos base
const isAccentMaterial = (m: THREE.MeshStandardMaterial) =>
  Math.abs(m.color.r - 0.3) < 0.03 && Math.abs(m.color.g - 0.49) < 0.03 && Math.abs(m.color.b - 0.8) < 0.03;

/* ── Utilidades Three ──────────────────────────────────────── */
const materialsOf = (mesh: THREE.Mesh): THREE.Material[] =>
  Array.isArray(mesh.material) ? mesh.material : [mesh.material];

const disposeObject = (obj?: THREE.Object3D | null) => {
  obj?.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    materialsOf(mesh).forEach((m) => m?.dispose());
  });
};

interface ThreeCtx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  model: THREE.Object3D | null;
}

const fitCamera = (ctx: ThreeCtx, model: THREE.Object3D) => {
  const { camera, controls } = ctx;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center); // centraliza na origem

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const fov = Math.min(vFov, hFov);
  const dist = (size.x / 2 / Math.tan(fov / 2)) * 1.2 + size.z / 2;

  const dir = new THREE.Vector3(0, 0.6, 0.8).normalize();
  camera.position.copy(dir.multiplyScalar(dist));
  camera.near = dist / 50;
  camera.far = dist * 50;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);

  controls.target.set(0, 0, 0);
  controls.minDistance = dist * 0.4;
  controls.maxDistance = dist * 2.2;
  controls.update();
};

/* ── Componente ────────────────────────────────────────────── */
const Keyboard3D = ({
  layout,
  keycap,
  caseItem,
  switchItem,
  pcb,
  caseColor,
  heightClass = "h-[360px]",
  onFail,
}: Keyboard3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<ThreeCtx | null>(null);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [modelVersion, setModelVersion] = useState(0);

  const choice = useMemo(() => resolveModel(layout, keycap?.id), [layout, keycap?.id]);
  const theme = keycap ? keycapTheme[keycap.id] : undefined;

  // 1) Cena, câmera, luzes e loop de render (uma vez só)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (err) {
      console.error("WebGL indisponível:", err);
      setStatus("error");
      onFailRef.current?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 100);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 8, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-5, 4, -4);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.addEventListener("start", () => {
      controls.autoRotate = false; // para de girar quando o usuário assume o controle
    });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    ctxRef.current = { renderer, scene, camera, controls, model: null };

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeObject(ctxRef.current?.model);
      renderer.dispose();
      ctxRef.current = null;
    };
  }, []);

  // 2) Carrega o modelo .glb sempre que o layout/tema muda
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    new GLTFLoader()
      .loadAsync(choice.url)
      .then((gltf) => {
        const ctx = ctxRef.current;
        if (cancelled || !ctx) {
          disposeObject(gltf.scene);
          return;
        }
        if (ctx.model) {
          ctx.scene.remove(ctx.model);
          disposeObject(ctx.model);
        }
        const model = gltf.scene;
        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          materialsOf(mesh).forEach((m) => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.userData.originalColor = m.color.clone(); // para poder voltar à cor original
              m.roughness = Math.min(m.roughness, 0.6);
            }
          });
        });
        ctx.scene.add(model);
        ctx.model = model;
        fitCamera(ctx, model);
        setModelVersion((v) => v + 1);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Falha ao carregar o modelo 3D:", err);
        setStatus("error");
        onFailRef.current?.();
      });

    return () => {
      cancelled = true;
    };
  }, [choice.url]);

  // 3) Pinta case e keycaps nos modelos "base" (os temáticos têm cores próprias)
  const caseHex = caseColor ?? DEFAULT_CASE;
  const keysHex = theme?.base ?? DEFAULT_KEYS;
  const accentHex = theme?.accent ?? null;

  useEffect(() => {
    const model = ctxRef.current?.model;
    if (!model || choice.themed) return;

    model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      materialsOf(mesh).forEach((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return;
        const original = m.userData.originalColor as THREE.Color | undefined;
        if (original) m.color.copy(original);

        if (CASE_MATERIALS.has(m.name)) {
          m.color.set(caseHex);
        } else if (m.name === KEYS_MATERIAL) {
          m.color.set(keysHex);
        } else if (accentHex && original && isAccentMaterial({ color: original } as THREE.MeshStandardMaterial)) {
          m.color.set(accentHex);
        }
      });
    });
  }, [modelVersion, choice.themed, caseHex, keysHex, accentHex]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Layout</span>
        <span className="text-sm font-bold" style={{ color: "hsl(var(--foreground-strong))" }}>{layout === "Full" ? "100%" : layout}</span>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl`}
      >
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          3D
        </div>
        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/60">
          arraste para girar
        </div>

        <canvas ref={canvasRef} aria-label="Preview 3D do teclado" className="h-full w-full cursor-grab active:cursor-grabbing" />

        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando modelo 3D...
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-white/70">
            Não foi possível exibir o modelo 3D neste navegador.
          </div>
        )}
      </div>

      {(choice.note || choice.themed) && (
        <p className="text-[11px] text-muted-foreground text-center">
          {choice.note ?? "Modelo temático: as cores das peças são fixas."}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2 text-[10px]">
        {switchItem && (
          <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">{switchItem.name}</span>
        )}
        {keycap && (
          <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">{keycap.name}</span>
        )}
        {pcb && (
          <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-border">{pcb.name}</span>
        )}
        {caseItem && (
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">{caseItem.name}</span>
        )}
      </div>
    </div>
  );
};

export default Keyboard3D;
