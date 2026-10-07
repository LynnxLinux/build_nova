// Mapa: image_key (coluna da tabela products) -> arquivo em src/assets
import gateronOil from "@/assets/produtos/gateron-oil.png";
import gmkLaser from "@/assets/produtos/gmkLaser.png";
import tofu65 from "@/assets/produtos/Tofu65.png";
import caboCoiled from "@/assets/produtos/cabo-coiled.png";
import holyPanda from "@/assets/produtos/mmd_holy_panda.png";
import pbtBotanical from "@/assets/produtos/pbtbotanical.png";
import mt3 from "@/assets/produtos/mt3 susuwari.png";
import bakeneko from "@/assets/produtos/bakeneko.png";
import switchTester from "@/assets/produtos/switchtester.png";
import switchBlue from "@/assets/produtos/switch blue.png";
import caseTransporte from "@/assets/produtos/case1.png";
import caboReto from "@/assets/produtos/cabo.png";

export const productImages: Record<string, string> = {
  "gateron-oil": gateronOil,
  "switch-blue": switchBlue,
  "holy-panda": holyPanda,
  "gmk-laser": gmkLaser,
  "pbt-botanical": pbtBotanical,
  "mt3-susuwatari": mt3,
  "tofu65": tofu65,
  "bakeneko": bakeneko,
  "cabo-coiled": caboCoiled,
  "cabo-reto": caboReto,
  "switch-tester": switchTester,
  "case-transporte": caseTransporte,
};
