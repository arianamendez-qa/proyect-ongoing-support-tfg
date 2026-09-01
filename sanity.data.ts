/**
 * Datos para la Sanity Suite cross-site.
 *
 * TARGET_ENV controla el entorno de ejecución:
 *   TARGET_ENV=staging     → URLs de staging (por defecto, de .env)
 *   TARGET_ENV=production  → URLs de producción reales
 *
 * Variables de entorno necesarias en .env:
 *   Staging:    HOBBS_BASE_URL, PHASE_EIGHT_BASE_URL, INSIDE_STORY_BASE_URL
 *   Production: HOBBS_PROD_URL, PHASE_EIGHT_PROD_URL, INSIDE_STORY_PROD_URL
 */

const targetEnv = process.env.TARGET_ENV ?? 'staging';

const resolveUrl = (stagingEnvVar: string, prodEnvVar: string): string =>
  targetEnv === 'production'
    ? (process.env[prodEnvVar] ?? '')
    : (process.env[stagingEnvVar] ?? '');

export const sanitySiteData = [
  {
    name: 'Hobbs',
    baseUrl: resolveUrl('HOBBS_BASE_URL', 'HOBBS_PROD_URL'),
    // Production: https://www.hobbs.com  |  Staging: see HOBBS_BASE_URL in .env
    categoryPath: '/clothing/',
    searchTerm: 'dress',
    expectedTitlePattern: /Hobbs/i,
  },
  {
    name: 'Phase Eight',
    baseUrl: resolveUrl('PHASE_EIGHT_BASE_URL', 'PHASE_EIGHT_PROD_URL'),
    // Production: https://www.phase-eight.com  |  Staging: see PHASE_EIGHT_BASE_URL in .env
    categoryPath: '/clothing/',
    searchTerm: 'dress',
    expectedTitlePattern: /Phase Eight/i,
  },
  {
    name: 'Inside Story',
    baseUrl: resolveUrl('INSIDE_STORY_BASE_URL', 'INSIDE_STORY_PROD_URL'),
    // Production: https://www.insidestory.com  |  Staging: see INSIDE_STORY_BASE_URL in .env
    categoryPath: '/all-products/',
    searchTerm: 'dress',
    expectedTitlePattern: /Inside Story/i,
  },
];

export { targetEnv };
