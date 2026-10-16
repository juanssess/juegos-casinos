/** Original art direction for La Familia. Presentation only. */
import type { GameTheme } from '@casino/math';
export const TITLE = 'La Familia';
export const SKIN = { [0]: { label: "Sello de la familia" }, [1]: { label: "Bolsa del golpe" }, [2]: { label: "Caja fuerte" }, [3]: { label: "Sombrero" }, [4]: { label: "Thompson" }, [5]: { label: "Whisky" }, [6]: { label: "Reloj" }, [7]: { label: "Libro de cuentas" }, [8]: { label: "Auto clásico" }, [9]: { label: "Rosa" }, [10]: { label: "Fichas" } };
export const PALETTE = { bgTop: 0x271018, bgBottom: 0x10080c, frame: 0x5c2630, frameLight: 0xd5ae65, reelBg: 0x180e15, reelBgAlt: 0x23121b, text: 0xffeed1, textDim: 0xba9e88, win: 0xf1d082, bigWin: 0xff9765, scatter: 0xf4ca80, mult: 0xffdb9e };
export const TIMING = { firstReelStop: 700, reelStagger: 190, anticipationExtra: 600, spinSpeed: 4100, anticipationSpeed: 780, bounce: 125, winCycle: 650, countUp: 650, freeSpinGap: 330, wildReveal: 380 };
export function coinColor(v: number): number { return v >= 5000 ? 0xff7e84 : v >= 200 ? 0xe9a5ff : v >= 50 ? 0xd5d8ff : v >= 20 ? 0x9fdfb5 : 0xffebbc; }
const theme: GameTheme = { TITLE, SKIN, PALETTE, TIMING };
void theme;
