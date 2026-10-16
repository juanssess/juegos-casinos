/**
 * Dirección de arte de El Carnaval: el Carnaval del País, Gualeguaychú.
 *
 * En inglés porque es lo que lee el generador. `npm run art -- prompts
 * --game carnaval` arma los pedidos completos. Se escribe a mano.
 */

import { SYM, type ArtDirection } from '@casino/math';

export const ART: ArtDirection = {
  symbols: {
    [SYM.WILD]: 'a glowing round glitter orb made of magenta and gold sequins, with a smooth plain central area, sparkling',
    [SYM.SCATTER]: 'an ornate carnival queen crown with tall gold filigree, pink and violet jewels and small feathers',
    [SYM.H1]: 'a tall carnival feather headdress with fuchsia, violet and gold plumes and a jeweled band',
    [SYM.H2]: 'an ornate gold carnival masquerade mask decorated with jewels and a small feather',
    [SYM.H3]: 'a carnival samba drum with a bright red and gold body and tension rods',
    [SYM.H4]: 'a carnival tambourine with a gold rim, jingling discs and colored ribbons',
    [SYM.L1]: 'a heart-cut faceted ruby red gem',
    [SYM.L2]: 'a round brilliant-cut sapphire blue gem',
    [SYM.L3]: 'an emerald-cut faceted green gem',
    [SYM.L4]: 'a teardrop-cut faceted violet amethyst gem',
    [SYM.L5]: 'a square princess-cut faceted yellow citrine gem',
  },
  scene:
    'the Gualeguaychu carnival parade avenue at night after the parade, completely empty of people; on the left edge a huge illuminated comparsa float that is only a giant sculpture of feathers, sequins and gold ornaments with nobody on it; on the right edge empty grandstands with warm string lights; confetti and streamers in the air at the top corners; a glowing parade street at the bottom with fuchsia and gold reflections and scattered confetti',
};
