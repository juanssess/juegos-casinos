/**
 * Dirección de arte de Se Busca: pueblo del oeste.
 *
 * Qué es cada símbolo y cómo es la escena, en inglés porque es lo que lee el
 * generador de imágenes. `npm run art -- prompts --game sebusca` arma con esto
 * los pedidos completos (estilo de la casa, grilla, fondo para recortar).
 * Se escribe a mano; no lo toca ninguna herramienta.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'an old weathered WANTED reward poster nailed to wood, sepia paper, no readable text',
    [SYM.SCATTER]: 'a bundle of red dynamite sticks with a lit sparkling fuse',
    [SYM.H1]: 'a leather cowboy hat with a red bandana',
    [SYM.H2]: 'a bleached longhorn bull skull',
    [SYM.H3]: 'an engraved silver revolver with an ivory grip',
    [SYM.H4]: 'a gold six-pointed sheriff star badge',
    [SYM.L1]: 'an aged ivory playing card showing a large letter A',
    [SYM.L2]: 'an aged ivory playing card showing a large letter K',
    [SYM.L3]: 'an aged ivory playing card showing a large letter Q',
    [SYM.L4]: 'an aged ivory playing card showing a large letter J',
    [SYM.L5]: 'an aged ivory playing card showing a large number 10',
  },
  scene: 'an atmospheric abandoned western main street at sunset, huge smoky amber setting sun, weathered wooden saloon fronts at the edges, dusty turquoise dusk shadows',
};
