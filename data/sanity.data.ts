/**
 * Datos para la suite de sanity checks cross-site multi-región.
 *
 * allRegions incluye las 5 regiones. DACH tiene searchTerm propio (alemán).
 * Las marcas definen URLs de staging y producción.
 *
 * TARGET_ENV=staging (por defecto) | TARGET_ENV=production
 */

const targetEnv = process.env.TARGET_ENV ?? 'staging';
export { targetEnv };

export const allRegions = [
  { name: 'UK',   path: '/',     searchTerm: null },
  { name: 'AU',   path: '/au/',  searchTerm: null },
  { name: 'EU',   path: '/eu/',  searchTerm: null },
  { name: 'ROW',  path: '/row/', searchTerm: null },
  { name: 'DACH', path: '/de/',  searchTerm: 'Kleid' },
];

export const sanitySiteData = [
  {
    name: 'Hobbs',
    stagingUrl: process.env.HOBBS_BASE_URL ?? 'https://stage.hobbs.com',
    prodUrl: process.env.HOBBS_PROD_URL ?? 'https://www.hobbs.com',
    searchTerm: 'dress',
    categoryPath: '/clothing/',
    expectedTitlePattern: /Hobbs/i,
  },
  {
    name: 'Phase Eight',
    stagingUrl: process.env.PHASE_EIGHT_BASE_URL ?? 'https://stage.phase-eight.com',
    prodUrl: process.env.PHASE_EIGHT_PROD_URL ?? 'https://www.phase-eight.com',
    searchTerm: 'dress',
    categoryPath: '/clothing/',
    expectedTitlePattern: /Phase Eight/i,
  },
  {
    name: 'Inside Story',
    stagingUrl: process.env.INSIDE_STORY_BASE_URL ?? 'https://stage.insidestory.com',
    prodUrl: process.env.INSIDE_STORY_PROD_URL ?? 'https://www.insidestory.com',
    searchTerm: 'dress',
    categoryPath: '/all-products/',
    expectedTitlePattern: /Inside Story/i,
  },
];
