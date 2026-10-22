/**
 * Dirección de arte de El Glaciar: el Perito Moreno, Santa Cruz.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game glaciar` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a chunk of deep blue glacier ice, translucent and faceted, glowing cyan inside',
    [SYM.SCATTER]: 'a round coin made of pale blue ice with a thick polished gold rim and a smooth plain center',
    [SYM.H1]: 'the head of an Andean condor with black feathers and its white neck ruff, facing sideways',
    [SYM.H2]: 'the head of a huemul deer with small antlers and brown fur, facing forward',
    [SYM.H3]: 'the head of a Patagonian red fox with orange fur, facing forward',
    [SYM.H4]: 'a Magellanic penguin standing, black and white with a stripe on the chest',
    [SYM.L1]: 'a small branch of dark purple calafate berries with green leaves',
    [SYM.L2]: 'a mountaineering ice axe with a red handle and steel head',
    [SYM.L3]: 'an old brass compass with a blue face',
    [SYM.L4]: 'a vintage red camping lantern glowing warm orange',
    [SYM.L5]: 'a coiled orange climbing rope',
  },
  scene:
    'the Perito Moreno glacier in Patagonia at golden hour: a huge wall of jagged blue ice on the left and right edges rising from a milky turquoise lake, snowy Andes peaks on the top corners, floating icebergs on the dark lake at the bottom, cold blue light with a warm sunset glow in the sky',
};
