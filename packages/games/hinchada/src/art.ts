/**
 * Dirección de arte de La Hinchada: la tribuna en noche de clásico.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game hinchada` arma los pedidos completos. Se escribe a mano. Sin
 * escudos, marcas ni colores de clubes reales.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a burning red stadium flare with bright red fire and a puff of red smoke, a round dark smooth area in the middle of the smoke',
    [SYM.SCATTER]: 'a shiny golden football trophy cup with two handles, no text',
    [SYM.H1]: 'a classic brown leather football ball with laces, slightly worn',
    [SYM.H2]: 'a big bass drum (bombo) used by football fans, wooden hoop and cream-colored skin, decorated with blue ribbons',
    [SYM.H3]: 'a pair of black football boots with studs and orange laces',
    [SYM.H4]: 'a silver referee whistle on a black cord',
    [SYM.L1]: 'a knitted red and dark blue striped scarf, folded, no text',
    [SYM.L2]: 'a blue knitted beanie hat with a pompom',
    [SYM.L3]: 'a small waving flag with green and yellow stripes on a stick, no symbols',
    [SYM.L4]: 'a yellow plastic megaphone',
    [SYM.L5]: 'a long plastic stadium horn trumpet, purple',
  },
  scene:
    'a football stadium at night seen from the stands: bright floodlight towers in the top corners, red flare smoke and paper confetti floating, big striped banners hanging over the railing on the left and right edges, the green pitch glowing far below at the bottom, dark night sky, no people visible, no text, no club logos',
};
