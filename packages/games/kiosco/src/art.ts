/**
 * Dirección de arte de El Kiosco: kiosco de barrio.
 *
 * Qué es cada símbolo y cómo es la escena, en inglés porque es lo que lee el
 * generador de imágenes. `npm run art -- prompts --game kiosco` arma con esto
 * los pedidos completos (estilo de la casa, grilla, fondo para recortar).
 * Se escribe a mano; no lo toca ninguna herramienta.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a round candy bomb: a glossy pink and gold striped candy sphere shaped like a bomb with a short twisted fuse lit with a golden spark',
    [SYM.SCATTER]: 'a classic round swirl lollipop with rainbow candy colors on a straight wooden stick',
    [SYM.H1]: 'an Argentine alfajor: a wide low round chocolate-coated sandwich cookie with a small embossed gold seal on top',
    [SYM.H2]: 'a heart-shaped chocolate bonbon wrapped in shiny red metallic foil',
    [SYM.H3]: 'a hard candy in bright orange cellophane twisted into a bow at both ends',
    [SYM.H4]: 'a single glossy sky blue gumball',
    [SYM.L1]: 'a fresh green apple with a short stem and one leaf',
    [SYM.L2]: 'a dark blue-purple plum with soft bloom',
    [SYM.L3]: 'a wedge slice of watermelon with black seeds and a green striped rind',
    [SYM.L4]: 'a compact bunch of magenta-purple grapes',
    [SYM.L5]: 'a single ripe yellow banana',
  },
  scene: 'a quiet Argentine neighborhood street corner at night, petrol-blue haze; on the left edge the warm amber window of a small candy kiosk with jars of candies; on the right edge a rusty half-raised roll-up shutter and a pink neon tube shaped like a lollipop spiral; wet sidewalk tiles at the bottom with a small fruit crate',
};
