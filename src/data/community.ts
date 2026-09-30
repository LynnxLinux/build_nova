import retroTerminal from "@/assets/community-builds/retro-terminal.png";
import botanicGarden from "@/assets/community-builds/botanic-garden.png"
import midnightPurple from "@/assets/community-builds/midnight-purple.png"
import furtiveMode from "@/assets/community-builds/furtive-mode.png"
import neonDreams from "@/assets/community-builds/neon-dreams.png"
import pureWhite from "@/assets/community-builds/pure-white.png"

export interface CommunityBuild {
  id: string;
  user: string;
  title: string;
  description: string;
  likes: number;
  layout: string;
  switches: string;
  keycaps: string;
  image: any;
}

export const communityBuilds: CommunityBuild[] = [
  { id: "b1", user: "LucasTech", title: "Midnight Purple", description: "Build em alumínio anodizado roxo escuro Tofu65 com switches Lavender e keycaps Lavender Lore.", likes: 234, layout: "75%", switches: "Durock Lavender", keycaps: "Lavender Lore", image: midnightPurple },
  { id: "b2", user: "RafaBuilds", title: "Botanical Garden", description: "Build oriental com keycaps artísticos em PBT e case de madeira, inspirada na estética tradicional chinesa.", likes: 189, layout: "65%", switches: "Holy Panda", keycaps: "PBT Botanical", image: botanicGarden },
  { id: "b3", user: "GuiSetup", title: "Vintage Terminal", description: "Build minimalista com keycaps creme e detalhes azulados, em um design retrô e elegante.", likes: 312, layout: "Full Size", switches: "Box Jade", keycaps: "MT3 Susuwatari", image: retroTerminal },
  { id: "b4", user: "CaioMods", title: "Phantom Assassin", description: "Build toda preta e cinza silenciosa com case amortecido e Reaper Switch.", likes: 156, layout: "65%", switches: "LEOBOG Reaper Switch", keycaps: "ePBT Black", image: furtiveMode },
  { id: "b5", user: "FanaticoRGB", title: "Neon Dreams", description: "Build full RGB com case transparente e keycaps de gatinhos.", likes: 278, layout: "Full Size", switches: "Gateron Milky Yellow", keycaps: "Pudding cats", image: neonDreams },
  { id: "b6", user: "PedroFPS", title: "Pure White", description: "Setup minimalista todo branco com switches táteis silenciosos.", likes: 203, layout: "75%", switches: "Boba U4", keycaps: "ePBT White", image: pureWhite },
];