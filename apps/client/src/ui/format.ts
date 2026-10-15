/**
 * Los precios de compra pueden tener decimal —en La Vendimia lo tienen a
 * propósito, ver su tuning.ts— y en castellano el decimal va con coma. Un
 * "56.6x" al lado de un "1.132" se lee como mil quinientos sesenta y seis.
 */
export const equis = (v: number): string =>
  v.toLocaleString('es-AR', { maximumFractionDigits: 1 });
