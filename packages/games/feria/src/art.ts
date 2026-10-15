/**
 * Dirección de arte de La Feria: feria de antigüedades de San Telmo.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game feria` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'an antique black and mother-of-pearl bandoneon accordion with brass details, bellows slightly open',
    [SYM.SCATTER]: 'a large thick antique gold coin with an embossed sun face and a beaded raised rim, plain center area',
    [SYM.H1]: 'an antique gold pocket watch with an open engraved lid and a short chain',
    [SYM.H2]: 'a vintage blue glass soda siphon bottle with a polished metal head',
    [SYM.H3]: 'an antique wooden folding bellows camera with a brass lens',
    [SYM.H4]: 'an antique gramophone with a large brass flower horn',
    [SYM.L1]: 'a large letter A painted in Buenos Aires fileteado style, red and gold with ornamental scrolls',
    [SYM.L2]: 'a large letter K painted in Buenos Aires fileteado style, blue and gold with ornamental scrolls',
    [SYM.L3]: 'a large letter Q painted in Buenos Aires fileteado style, green and gold with ornamental scrolls',
    [SYM.L4]: 'a large letter J painted in Buenos Aires fileteado style, purple and gold with ornamental scrolls',
    [SYM.L5]: 'a large number 10 painted in Buenos Aires fileteado style, orange and gold with ornamental scrolls',
  },
  scene:
    'the San Telmo antiques fair in Plaza Dorrego, Buenos Aires, at warm golden dusk; on the left edge antique stalls with old clocks, siphons and gramophones under canvas awnings; on the right edge colonial facades with iron balconies and a lit street lamp; old cobblestones at the bottom with warm reflections',
};
