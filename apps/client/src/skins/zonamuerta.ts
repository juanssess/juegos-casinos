/** Own painted assets; the fallback only covers symbols not used by this game. */
import type {ClientSkin} from '../games.ts';
import {SKIN_ART as fallback} from './vendimia.ts';
import {registerStoryScene} from '../scenes/noir-survival.ts';
registerStoryScene('zonamuerta',new URL('../../../../packages/games/zonamuerta/art/actors.png',import.meta.url).href);
export const SKIN_ART:ClientSkin={textures:fallback.textures,backdrop:fallback.backdrop};
