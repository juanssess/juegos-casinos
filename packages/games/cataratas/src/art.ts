/**
 * Dirección de arte de Las Cataratas: las Cataratas del Iguazú, Misiones.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game cataratas` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a large glossy water droplet made of deep turquoise crystal with rainbow reflections, glowing softly from inside',
    [SYM.SCATTER]: 'a round carved jade and gold medallion showing a roaring waterfall in relief, with small turquoise gems on the rim',
    [SYM.H1]: 'the head of a fierce South American jaguar with golden fur and black rosettes, facing forward',
    [SYM.H2]: 'a toco toucan perched on a short jungle branch, huge orange and black beak',
    [SYM.H3]: 'a blue morpho butterfly with shimmering metallic blue wings spread open',
    [SYM.H4]: 'a pink and purple wild jungle orchid flower with green leaves',
    [SYM.L1]: 'a rough purple amethyst crystal cluster',
    [SYM.L2]: 'a polished banded blue agate stone slice',
    [SYM.L3]: 'a smoky lavender quartz crystal point',
    [SYM.L4]: 'a faceted golden topaz gemstone',
    [SYM.L5]: 'a polished red jasper pebble',
  },
  scene:
    'the Iguazu waterfalls seen from the jungle at dusk: huge curtains of white water falling on the left and right edges, lush misionero rainforest framing the top corners with giant leaves and hanging vines, a faint rainbow in the mist, the river basin with turquoise reflections and wet rocks at the bottom, warm golden light behind the mist',
};
