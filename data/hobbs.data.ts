/**
 * Datos de prueba específicos de Hobbs.
 * Mantén aquí términos de búsqueda, SKUs, textos esperados, etc.
 * Los SECRETOS (emails/passwords) NO van aquí — esos van en el .env.
 */
export const hobbsData = {
  baseUrl: process.env.HOBBS_BASE_URL ?? '',
  searchTerm: 'dress',
  expectedHomeTitle: /Hobbs/i,
};
