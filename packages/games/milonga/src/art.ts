/**
 * Dirección de arte de La Milonga: un salón de tango de San Telmo.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game milonga` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a single deep red long-stemmed rose with dark green leaves',
    [SYM.SCATTER]: 'an old black shellac gramophone record with a shiny gold label without text',
    [SYM.H1]: 'a pair of elegant tango dance shoes, one black and white two-tone mens shoe and one red womens high heel',
    [SYM.H2]: 'a black felt fedora hat with a red ribbon band',
    [SYM.H3]: 'an open red lace hand fan with black wooden ribs',
    [SYM.L1]: 'a round vintage brooch made of creamy pearls set in gold',
    [SYM.L2]: 'a pair of gold cufflinks with black onyx stones',
    [SYM.L3]: 'a black satin bow tie',
  },
  scene:
    'an old Buenos Aires tango dance hall in San Telmo at night, completely empty of people: polished wooden dance floor at the bottom with warm reflections, heavy red velvet curtains on the left and right edges, ornate gold crystal chandeliers at the top corners, small round tables with candles along the sides, smoky warm golden atmosphere',
};
