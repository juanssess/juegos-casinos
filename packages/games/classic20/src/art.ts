/**
 * Dirección de arte de Maverick: templo azteca.
 *
 * Qué es cada símbolo y cómo es la escena, en inglés porque es lo que lee el
 * generador de imágenes. `npm run art -- prompts --game classic20` arma con esto
 * los pedidos completos (estilo de la casa, grilla, fondo para recortar).
 * Se escribe a mano; no lo toca ninguna herramienta.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'an ornate carved gold Aztec sun stone disc with turquoise inlays',
    [SYM.SCATTER]: 'a turquoise stepped Mesoamerican pyramid temple with a glowing doorway',
    [SYM.H1]: 'a coiled feathered serpent with jade and red plumes',
    [SYM.H2]: 'a fierce golden jaguar head amulet with emerald eyes',
    [SYM.H3]: 'a polished jade ceremonial mask with gold ear spools',
    [SYM.H4]: 'an obsidian skull carved with gold filigree',
    [SYM.L1]: 'a carved stone letter A with gold leaf edges',
    [SYM.L2]: 'a carved stone letter K with silver edges',
    [SYM.L3]: 'a carved stone letter Q with copper edges',
    [SYM.L4]: 'a carved stone letter J with jade edges',
    [SYM.L5]: 'a carved stone number 10 with blue stone edges',
  },
  scene: 'an ancient overgrown jade-and-gold Mesoamerican temple at twilight, carved stone pillars at the edges, small fire braziers, mist, warm gold light, jungle silhouettes',
};
