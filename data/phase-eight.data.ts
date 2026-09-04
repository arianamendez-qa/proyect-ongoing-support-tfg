/**
 * Datos de prueba específicos de Phase Eight.
 * Los SECRETOS (emails/passwords) NO van aquí — esos van en el .env.
 */
export const phaseEightData = {
  baseUrl: process.env.PHASE_EIGHT_BASE_URL ?? '',
  searchTerm: 'dress',
  expectedHomeTitle: /Phase Eight/i,
};
