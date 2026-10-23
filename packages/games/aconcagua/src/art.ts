/**
 * Dirección de arte de El Aconcagua: amanecer en la alta montaña.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game aconcagua` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a golden mountaineering ice axe with an ornate polished gold head, glowing',
    [SYM.SCATTER]: 'a red and orange summit flag on a metal pole planted in a small mound of snow',
    [SYM.H1]: 'the head of a fierce Andean puma (mountain lion) with tawny fur, facing forward',
    [SYM.H2]: 'the head of a guanaco with fluffy light brown fur and big dark eyes',
    [SYM.H3]: 'a small orange expedition mountain tent with guy lines',
    [SYM.H4]: 'a large blue trekking backpack with straps and a rolled sleeping mat',
    [SYM.L1]: 'a traditional Argentine mate gourd with a silver bombilla straw',
    [SYM.L2]: 'a red leather mountaineering boot with laces',
    [SYM.L3]: 'a yellow climbing helmet',
    [SYM.L4]: 'a blue anodized aluminium carabiner',
    [SYM.L5]: 'a green steel thermos flask',
  },
  scene:
    'the south face of the Aconcagua mountain at dawn: huge snowy rocky peaks on the left and right edges glowing pink and orange in the first sunlight, the sun rising behind the summit at the top, a high mountain base camp valley with scattered rocks and snow at the bottom, cold violet shadows, thin clouds',
};
