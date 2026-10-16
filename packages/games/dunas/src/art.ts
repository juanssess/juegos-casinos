/**
 * Dirección de arte de Las Dunas: rally de motos en las dunas de Fiambalá.
 *
 * Qué es cada símbolo y cómo es la escena, en inglés porque es lo que lee el
 * generador de imágenes. `npm run art -- prompts --game dunas` arma con esto
 * los pedidos completos (estilo de la casa, grilla, fondo para recortar).
 * Se escribe a mano; no lo toca ninguna herramienta.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a heroic desert rally motorcycle rider seen from the front, orange and black riding suit, helmet with dusty goggles pushed up, arms crossed, no logos, no text',
    [SYM.SCATTER]: 'a black and white checkered finish flag waving on a short pole, fabric rippling in the wind',
    [SYM.H1]: 'an orange enduro rally motorcycle jumping in the air, side view, sand spraying from the rear wheel, no logos, no numbers',
    [SYM.H2]: 'a white and red off-road rally helmet with a long peak and a tinted visor, three-quarter view, no logos',
    [SYM.H3]: 'a dented red metal fuel jerrycan with a brass cap, a rolled paper road book strapped to its side',
    [SYM.H4]: 'a golden trophy cup with two handles on a dark wooden base, sand dunes engraved on the cup',
    [SYM.L1]: 'an old brass compass with the lid open and a glowing needle',
    [SYM.L2]: 'a pair of motocross goggles with a mirrored blue lens and an elastic strap',
    [SYM.L3]: 'a chrome and white ceramic spark plug standing upright',
    [SYM.L4]: 'a steel motorcycle chain sprocket gear with sharp teeth',
    [SYM.L5]: 'a worn steel combination wrench lying diagonally',
  },
  scene:
    'the giant red sand dunes of Fiambala in Catamarca, Argentina, at dusk: towering dunes on the left and right edges with a lone rally motorcycle raising an orange dust plume on a far crest, deep violet and orange sunset sky, dry Andes mountains faint in the distance, warm low light on the sand ripples, dark shadowed dune valley in the center',
};
