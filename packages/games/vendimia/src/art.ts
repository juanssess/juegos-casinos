/**
 * Dirección de arte de La Vendimia: bodega mendocina.
 *
 * Qué es cada símbolo y cómo es la escena, en inglés porque es lo que lee el
 * generador de imágenes. `npm run art -- prompts --game vendimia` arma con esto
 * los pedidos completos (estilo de la casa, grilla, fondo para recortar).
 * Se escribe a mano; no lo toca ninguna herramienta.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a pair of brass pruning shears with worn leather handles',
    [SYM.SCATTER]: 'a small oak wine barrel with iron hoops',
    [SYM.H1]: 'a crystal wine glass two-thirds full of deep red Malbec',
    [SYM.H2]: 'a dark green wine bottle with an aged gold label without text',
    [SYM.H3]: 'a woven wicker harvest basket full of grapes',
    [SYM.L1]: 'a bunch of dark purple Malbec grapes',
    [SYM.L2]: 'a single green vine leaf with veins',
    [SYM.L3]: 'a golden Torrontés grape bunch',
  },
  scene: 'a luxurious historic Mendoza vineyard wine cellar at golden sunset, oak barrels at the edges, vine leaves framing the upper corners, distant purple Andes through a central arch',
};
