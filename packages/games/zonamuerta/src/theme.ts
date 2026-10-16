/** Original art direction for Zona Muerta. Presentation only. */
import type { GameTheme } from '@casino/math';
export const TITLE = 'Zona Muerta';
export const SKIN = { [0]: { label: "Barricada" }, [1]: { label: "Radio de emergencia" }, [2]: { label: "Antídoto" }, [3]: { label: "Combustible" }, [4]: { label: "Munición" }, [6]: { label: "Linterna" }, [7]: { label: "Botiquín" }, [8]: { label: "Máscara" } };
export const PALETTE = { bgTop: 0x102723, bgBottom: 0x50e10, frame: 0x254f46, frameLight: 0xc3b77b, reelBg: 0x91b19, reelBgAlt: 0xe2521, text: 0xf1ecd4, textDim: 0xa7b7a8, win: 0xc2ea73, bigWin: 0xffae54, scatter: 0x91efbb, mult: 0xffcd77 };
export const TIMING = { firstReelStop: 700, reelStagger: 190, anticipationExtra: 600, spinSpeed: 4100, anticipationSpeed: 780, bounce: 125, winCycle: 650, countUp: 650, freeSpinGap: 330, wildReveal: 380 };
export function coinColor(v: number): number { return v >= 5000 ? 0xff7e84 : v >= 200 ? 0xe9a5ff : v >= 50 ? 0xd5d8ff : v >= 20 ? 0x9fdfb5 : 0xffebbc; }
const theme: GameTheme = { TITLE, SKIN, PALETTE, TIMING };
void theme;
