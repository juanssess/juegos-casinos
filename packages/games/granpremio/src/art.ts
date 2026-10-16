/**
 * Dirección de arte de El Gran Premio: las carreras de ruta argentinas de
 * los años 50 y 60, por caminos de tierra entre pueblos.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game granpremio` arma los pedidos completos. Se escribe a mano. Sin
 * marcas, logos ni personas reales.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a black and white checkered racing flag waving on a short polished wooden pole, the cloth rippling in the wind',
    [SYM.SCATTER]: 'a round embossed gold medal on a red, white and sky-blue ribbon, showing a tiny vintage race car in relief, no text',
    [SYM.H1]: 'a 1940s rounded vintage racing coupe car painted glossy red with a large white racing number circle on the door, chrome bumpers, dusty tyres, three-quarter front view, no brand logos',
    [SYM.H2]: 'a vintage brown leather racing helmet with round brass-rimmed goggles resting on top',
    [SYM.H3]: 'a vintage four-spoke wooden steering wheel with polished varnished rim and a chrome center hub',
    [SYM.H4]: 'a tall shiny gold trophy cup with two curved handles on a dark wooden base, no text',
    [SYM.L1]: 'a chrome wire-spoke wheel rim seen from the front, many thin spokes',
    [SYM.L2]: 'a single vintage spark plug with white ceramic body and copper tip, standing upright',
    [SYM.L3]: 'a steel four-way cross lug wrench in X shape, slightly worn',
    [SYM.L4]: 'a round vintage brass pressure gauge with a cream dial face and a red needle, no numbers',
    [SYM.L5]: 'a vintage chrome car horn shaped like a trumpet with a black rubber squeeze bulb',
  },
  scene:
    'a dusty dirt country road crossing the Argentine pampa at sunset seen from the driver seat height, a big cloud of golden dust rising along the road in the distance, small crowds of spectators behind wooden fences on the left and right edges, strings of colorful pennant flags overhead in the top corners, a small whitewashed town with a church tower far away, warm orange and purple sky, long shadows',
};
