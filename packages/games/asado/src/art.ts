/**
 * Dirección de arte de El Asado: un asado de domingo en el patio.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game asado` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a single glowing red-hot charcoal ember with orange cracks and small flames, a smooth round dark area in the center',
    [SYM.SCATTER]: 'a small black cast-iron Argentine grill (parrilla) with glowing embers underneath and a little smoke',
    [SYM.H1]: 'a thick juicy grilled beef steak with dark grill marks',
    [SYM.H2]: 'two grilled Argentine chorizo sausages crossed, glossy and browned',
    [SYM.H3]: 'a round grilled provolone cheese, golden and bubbling, with oregano on top',
    [SYM.H4]: 'a grilled morcilla blood sausage, very dark, slightly split',
    [SYM.L1]: 'a shiny red bell pepper',
    [SYM.L2]: 'a yellow corn cob with some husk leaves',
    [SYM.L3]: 'a baked potato wrapped half in aluminium foil',
    [SYM.L4]: 'a bright yellow lemon',
    [SYM.L5]: 'a long curved green chili pepper',
  },
  scene:
    'an Argentine backyard asado at night: a large brick grill with glowing red embers and rising smoke on the left edge, a wooden table with a red checkered cloth and wine glasses on the right edge, warm string lights across the top, a patio of old terracotta tiles at the bottom, grape vines on the top corners, warm firelight glow',
};
